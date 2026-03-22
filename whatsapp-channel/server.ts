#!/usr/bin/env node
/**
 * WhatsApp ↔ Claude Code channel via 360Messenger
 *
 * How it works:
 *  1. Polls GET /v2/message/receivedMessages every POLL_INTERVAL_MS
 *  2. Filters to the configured WHATSAPP_GROUP_ID and ALLOWED_SENDERS
 *  3. Pushes new messages into Claude Code via notifications/claude/channel
 *  4. Exposes a `reply` tool so Claude can send messages back via POST /v2/sendGroup
 *
 * Required env vars (copy .env.example → .env):
 *   MESSENGER_API_KEY   — your 360Messenger Bearer token
 *   WHATSAPP_GROUP_ID   — the group ID WITHOUT @g.us, e.g. "120363344915882"
 *   ALLOWED_SENDERS     — comma-separated phone numbers allowed to trigger Claude
 *                         e.g. "919876543210,447488888888"  (no + prefix)
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ── Config ──────────────────────────────────────────────────────────────────

const API_KEY       = process.env.MESSENGER_API_KEY ?? '';
const GROUP_ID_RAW  = process.env.WHATSAPP_GROUP_ID ?? '';   // without @g.us
const GROUP_ID_FULL = `${GROUP_ID_RAW}@g.us`;                // with @g.us suffix
const ALLOWED_RAW   = process.env.ALLOWED_SENDERS ?? '';
const ALLOWED       = new Set(ALLOWED_RAW.split(',').map((s) => s.trim()).filter(Boolean));
const POLL_MS       = parseInt(process.env.POLL_INTERVAL_MS ?? '5000', 10);
const BASE_URL      = 'https://api.360messenger.com';
const SEEN_FILE     = new URL('./seen-ids.json', import.meta.url).pathname;

if (!API_KEY)      { console.error('[WhatsApp] MESSENGER_API_KEY is not set'); process.exit(1); }
if (!GROUP_ID_RAW) { console.error('[WhatsApp] WHATSAPP_GROUP_ID is not set'); process.exit(1); }
if (ALLOWED.size === 0) {
  console.error('[WhatsApp] ALLOWED_SENDERS is not set — refusing to run without a sender allowlist (security)');
  process.exit(1);
}

// ── Seen-ID persistence (survives restarts) ──────────────────────────────────

function loadSeen(): Set<string> {
  try {
    if (existsSync(SEEN_FILE)) {
      const ids: string[] = JSON.parse(readFileSync(SEEN_FILE, 'utf8'));
      return new Set(ids);
    }
  } catch { /* ignore parse errors */ }
  return new Set();
}

function saveSeen(seen: Set<string>): void {
  // Keep only the last 500 IDs to prevent the file growing forever
  const ids = [...seen].slice(-500);
  try { writeFileSync(SEEN_FILE, JSON.stringify(ids)); } catch { /* non-fatal */ }
}

const seen = loadSeen();

// ── 360Messenger API helpers ─────────────────────────────────────────────────

const headers = {
  Authorization: `Bearer ${API_KEY}`,
};

interface ReceivedMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  createdAt: string;
  chat: string;
  groupId?: string;
  url?: string | null;
}

interface ReceivedResponse {
  success: boolean;
  data?: {
    data: ReceivedMessage[];
  };
}

async function fetchNewMessages(): Promise<ReceivedMessage[]> {
  const res = await fetch(`${BASE_URL}/v2/message/receivedMessages?page=1`, { headers });
  if (!res.ok) {
    console.error(`[WhatsApp] Poll failed: HTTP ${res.status}`);
    return [];
  }
  const body: ReceivedResponse = await res.json();
  if (!body.success || !body.data?.data) return [];

  return body.data.data.filter((m) => {
    // Must belong to our group
    if ((m.groupId ?? '') !== GROUP_ID_RAW && (m.groupId ?? '') !== GROUP_ID_FULL) return false;
    // Must not have been seen before
    if (seen.has(m.id)) return false;
    // Must be from an allowed sender
    if (!ALLOWED.has(m.from)) {
      console.warn(`[WhatsApp] Dropping message from ungated sender: ${m.from}`);
      return false;
    }
    return true;
  });
}

async function sendGroupMessage(text: string): Promise<boolean> {
  const form = new FormData();
  form.append('groupId', GROUP_ID_FULL);
  form.append('text', text);

  const res = await fetch(`${BASE_URL}/v2/sendGroup`, {
    method: 'POST',
    headers,   // multipart boundary is set automatically by fetch
    body: form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '(no body)');
    console.error(`[WhatsApp] Send failed: HTTP ${res.status} — ${err.slice(0, 200)}`);
    return false;
  }
  return true;
}

// ── MCP server ───────────────────────────────────────────────────────────────

const mcp = new Server(
  { name: 'whatsapp', version: '1.0.0' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },  // registers the channel listener
      tools: {},                                 // exposes the reply tool
    },
    instructions: `
You are receiving WhatsApp group messages forwarded from a group via 360Messenger.
Each message arrives as:
  <channel source="whatsapp" from="<phone>" createdAt="<timestamp>" type="<chat|file>">
    <message text>
  </channel>

When you want to respond to the group, call the \`whatsapp_reply\` tool with the reply text.
Do NOT include greetings, sign-offs, or markdown — plain text only, as it will appear
directly in the WhatsApp group. Keep replies concise.

Only act on messages from senders who are on the allowlist. You are already gated — any
message that reaches you has already passed the sender check.
`.trim(),
  },
);

// Reply tool — lets Claude send a message back to the group
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'whatsapp_reply',
      description: 'Send a text message back to the configured WhatsApp group',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The plain-text message to send. No markdown — WhatsApp renders it as-is.',
          },
        },
        required: ['text'],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'whatsapp_reply') {
    const { text } = req.params.arguments as { text: string };
    const ok = await sendGroupMessage(text);
    return {
      content: [
        {
          type: 'text',
          text: ok ? `Sent to group ${GROUP_ID_FULL}` : 'Send failed — check server logs',
        },
      ],
    };
  }
  throw new Error(`Unknown tool: ${req.params.name}`);
});

// ── Connect & start polling ───────────────────────────────────────────────────

await mcp.connect(new StdioServerTransport());
console.error(`[WhatsApp] Channel connected. Polling group ${GROUP_ID_FULL} every ${POLL_MS}ms`);
console.error(`[WhatsApp] Allowed senders: ${[...ALLOWED].join(', ')}`);

async function poll() {
  try {
    const newMessages = await fetchNewMessages();

    for (const msg of newMessages) {
      // Mark seen immediately to avoid double-sending if notification is slow
      seen.add(msg.id);

      const content = msg.type === 'file' && msg.url
        ? `[File attached] ${msg.chat ?? ''}\n${msg.url}`
        : (msg.chat ?? '(empty message)');

      await mcp.notification({
        method: 'notifications/claude/channel',
        params: {
          content,
          meta: {
            from: msg.from,
            createdAt: msg.createdAt,
            type: msg.type,
            message_id: msg.id,
          },
        },
      });

      console.error(`[WhatsApp] Forwarded message ${msg.id} from ${msg.from}`);
    }

    if (newMessages.length > 0) saveSeen(seen);
  } catch (err) {
    console.error('[WhatsApp] Poll error:', (err as Error).message);
  }
}

// Initial poll, then repeat
await poll();
setInterval(poll, POLL_MS);
