#!/usr/bin/env node
/**
 * WhatsApp ↔ Claude Code channel
 *
 * Receive + Reply  : Baileys (free, WhatsApp Web protocol)
 * Notifications    : 360Messenger Basic Plan sendGroup API
 *
 * First run:
 *   A QR code is printed to the terminal → scan with WhatsApp → session saved to ./auth/
 *   Subsequent starts reconnect automatically (no QR needed).
 *
 * ⚠️  WARNING: Baileys and 360Messenger cannot share the same WhatsApp number.
 *     Baileys will take over the WhatsApp Web session, which may disconnect
 *     360Messenger. Use a dedicated WhatsApp number for this bot, or accept
 *     that 360Messenger will be used only for notifications (it can still send
 *     via API even if the Web session is owned by Baileys).
 *
 * Required env vars:
 *   MESSENGER_API_KEY   — 360Messenger key (for notifications only)
 *   WHATSAPP_GROUP_ID   — group ID without @g.us  e.g. "120363344915882"
 *   ALLOWED_SENDERS     — comma-separated phone numbers (full intl format, no +)
 *                         e.g. "919876543210,919642917777"
 */

import 'dotenv/config';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import P from 'pino';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── Config ────────────────────────────────────────────────────────────────────

const MESSENGER_API_KEY = process.env.MESSENGER_API_KEY ?? '';
const GROUP_ID_RAW      = process.env.WHATSAPP_GROUP_ID ?? '';
const GROUP_JID         = `${GROUP_ID_RAW}@g.us`;
const ALLOWED_RAW       = process.env.ALLOWED_SENDERS ?? '';
const ALLOWED           = new Set(ALLOWED_RAW.split(',').map((s) => s.trim()).filter(Boolean));
const AUTH_DIR          = join(dirname(fileURLToPath(import.meta.url)), 'auth');
const BASE_URL          = 'https://api.360messenger.com';

if (!GROUP_ID_RAW) {
  console.error('[WhatsApp] WHATSAPP_GROUP_ID is not set in .env'); process.exit(1);
}
if (ALLOWED.size === 0) {
  console.error('[WhatsApp] ALLOWED_SENDERS is not set — refusing to run without a sender allowlist'); process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "919876543210@s.whatsapp.net" → "919876543210" */
function jidToPhone(jid: string): string {
  return jid.split('@')[0] ?? '';
}

function isSenderAllowed(participantJid: string): boolean {
  return ALLOWED.has(jidToPhone(participantJid));
}

/** Send a notification via 360Messenger Basic Plan (outbound only) */
async function send360Notification(text: string): Promise<{ ok: boolean; error?: string }> {
  if (!MESSENGER_API_KEY) return { ok: false, error: 'MESSENGER_API_KEY not set' };
  try {
    const form = new FormData();
    form.append('groupId', GROUP_JID);
    form.append('text', text);
    const res = await fetch(`${BASE_URL}/v2/sendGroup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${MESSENGER_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 100)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── MCP server ────────────────────────────────────────────────────────────────

const mcp = new Server(
  { name: 'whatsapp', version: '2.0.0' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},
    },
    instructions: `
You are bridged to a WhatsApp group. Messages from the group arrive as:
  <channel source="whatsapp" from="<phone>" type="<message type>">
    <message text>
  </channel>

You have two tools:
- whatsapp_reply   → sends a chat reply back into the group (via Baileys, real-time)
- whatsapp_notify  → sends a notification/alert to the group (via 360Messenger)

Use whatsapp_reply for conversational responses.
Use whatsapp_notify for proactive alerts, summaries, or status updates.

Rules:
- Plain text only — no markdown formatting (renders literally in WhatsApp)
- Keep replies concise
- Only respond to messages from senders already on the allowlist
`.trim(),
  },
);

// ── Tools ─────────────────────────────────────────────────────────────────────

let waSocket: WASocket | null = null;

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'whatsapp_reply',
      description: 'Send a plain-text reply to the WhatsApp group (real-time, via Baileys)',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Plain text message — no markdown' },
        },
        required: ['text'],
      },
    },
    {
      name: 'whatsapp_notify',
      description: 'Push a notification or alert to the WhatsApp group (via 360Messenger API)',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Notification text to push to the group' },
        },
        required: ['text'],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  // ── whatsapp_reply ──────────────────────────────────────────────────────────
  if (req.params.name === 'whatsapp_reply') {
    const { text } = req.params.arguments as { text: string };
    if (!waSocket) {
      return { content: [{ type: 'text', text: 'WhatsApp not connected — please scan the QR code first' }] };
    }
    await waSocket.sendMessage(GROUP_JID, { text });
    console.error(`[WhatsApp] Replied to group: ${text.slice(0, 60)}...`);
    return { content: [{ type: 'text', text: 'Message sent to WhatsApp group' }] };
  }

  // ── whatsapp_notify ─────────────────────────────────────────────────────────
  if (req.params.name === 'whatsapp_notify') {
    const { text } = req.params.arguments as { text: string };
    const result = await send360Notification(text);
    console.error(`[WhatsApp] Notification via 360Messenger: ${result.ok ? 'sent' : result.error}`);
    return {
      content: [{
        type: 'text',
        text: result.ok
          ? 'Notification pushed via 360Messenger'
          : `Notification failed: ${result.error}`,
      }],
    };
  }

  throw new Error(`Unknown tool: ${req.params.name}`);
});

// ── Baileys connection ────────────────────────────────────────────────────────

async function startBaileys(): Promise<void> {
  mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    // Silence Baileys logs — all Baileys output goes through pino to stdout
    // which would corrupt the MCP stdio protocol. Must be silent.
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,   // we handle QR display manually via stderr
    syncFullHistory: false,     // only new messages — don't replay history
    markOnlineOnConnect: false, // don't set online status
    generateHighQualityLinkPreview: false,
  });

  waSocket = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // QR code — display on stderr (not stdout, which is reserved for MCP protocol)
    if (qr) {
      const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
      process.stderr.write('\n╔══════════════════════════════════════╗\n');
      process.stderr.write('║  WhatsApp — Scan QR to connect         ║\n');
      process.stderr.write('╚══════════════════════════════════════╝\n');
      process.stderr.write(qrString + '\n');
      process.stderr.write('Open WhatsApp → Linked Devices → Link a Device\n\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut  = statusCode === DisconnectReason.loggedOut;
      console.error(`[WhatsApp] Disconnected (code ${statusCode}) — ${loggedOut ? 'logged out, delete ./auth/ and restart' : 'reconnecting in 5s'}`);
      if (!loggedOut) setTimeout(startBaileys, 5_000);
    }

    if (connection === 'open') {
      console.error(`[WhatsApp] ✓ Connected to WhatsApp`);
      console.error(`[WhatsApp] Monitoring group: ${GROUP_JID}`);
      console.error(`[WhatsApp] Allowed senders: ${[...ALLOWED].join(', ')}`);
    }
  });

  // ── Incoming messages ───────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // 'notify' = new real-time messages; ignore 'append' (history sync)
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Must be from our configured group
      if (msg.key.remoteJid !== GROUP_JID) continue;
      // Skip messages we sent
      if (msg.key.fromMe) continue;
      // Must have content
      if (!msg.message) continue;

      // Extract text (handles plain text, quoted replies, image captions)
      const text = (
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        msg.message.imageMessage?.caption ??
        msg.message.videoMessage?.caption ??
        ''
      ).trim();

      if (!text) continue;

      // Sender gating — drop messages from anyone not on the allowlist
      const senderJid   = msg.key.participant ?? msg.key.remoteJid ?? '';
      const senderPhone = jidToPhone(senderJid);

      if (!isSenderAllowed(senderJid)) {
        console.error(`[WhatsApp] Dropped message from ungated sender: ${senderPhone}`);
        continue;
      }

      // Forward to Claude Code via MCP notification
      await mcp.notification({
        method: 'notifications/claude/channel',
        params: {
          content: text,
          meta: {
            from: senderPhone,
            timestamp: String(msg.messageTimestamp ?? Math.floor(Date.now() / 1000)),
            type: Object.keys(msg.message)[0] ?? 'text',
          },
        },
      });

      console.error(`[WhatsApp] → Claude: "${text.slice(0, 60)}" from ${senderPhone}`);
    }
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

// Connect MCP server first (immediately available to Claude Code)
await mcp.connect(new StdioServerTransport());
console.error('[WhatsApp] MCP channel server connected');

// Then start Baileys (async — QR code may appear)
startBaileys().catch((err) => {
  console.error('[WhatsApp] Baileys startup failed:', (err as Error).message);
});
