#!/usr/bin/env node
/**
 * WhatsApp Bot — Standalone mode
 *
 * Receives WhatsApp messages via Baileys.
 * For each message, calls `claude --print` and sends the response back.
 * No MCP channel flags needed — just run this script directly.
 *
 * Run:
 *   node --import tsx/esm server.ts
 */

import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import P from 'pino';

// ── Config ────────────────────────────────────────────────────────────────────

const GROUP_ID_RAW = process.env.WHATSAPP_GROUP_ID ?? '';
const GROUP_JID    = `${GROUP_ID_RAW}@g.us`;
const ALLOWED_RAW  = process.env.ALLOWED_SENDERS ?? '';
const ALLOWED      = new Set(ALLOWED_RAW.split(',').map((s) => s.trim()).filter(Boolean));
const AUTH_DIR     = join(dirname(fileURLToPath(import.meta.url)), 'auth');
const ALLOW_ALL    = ALLOWED.has('*');

// Directory where `claude --print` should run (your Propellex project)
const CLAUDE_DIR = process.env.CLAUDE_PROJECT_DIR ??
  'C:\\Users\\Haneel Teja\\Cursor Applications\\Propellex\\Propellex';

// Git bash path required by Claude Code on Windows
const GIT_BASH = process.env.CLAUDE_CODE_GIT_BASH_PATH ??
  'C:\\Users\\Haneel Teja\\AppData\\Local\\Programs\\Git\\bin\\bash.exe';

// Call claude CLI via node.exe directly — avoids cmd.exe and PATH issues on Windows
const NODE_EXE  = 'C:\\Program Files\\nodejs\\node.exe';
const CLAUDE_CLI = 'C:\\Users\\Haneel Teja\\AppData\\Roaming\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js';

if (!GROUP_ID_RAW) {
  console.error('[Bot] WHATSAPP_GROUP_ID is not set'); process.exit(1);
}
if (ALLOWED.size === 0) {
  console.error('[Bot] ALLOWED_SENDERS is not set'); process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jidToPhone(jid: string): string {
  return jid.split('@')[0] ?? '';
}

function isSenderAllowed(jid: string): boolean {
  if (ALLOW_ALL) return true;
  return ALLOWED.has(jidToPhone(jid));
}

/**
 * Call `claude --print` with the user's message piped via stdin.
 * Returns Claude's plain-text response.
 */
async function askClaude(userText: string, from: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Full context is passed as the prompt via stdin
    const prompt = [
      'You are the Propellex AI assistant — an expert on the Propellex real estate platform codebase.',
      'Propellex is an AI-powered real estate discovery and investment intelligence platform for HNIs in Hyderabad, India.',
      'You have full access to the project codebase (React frontend, Node/Express backend, FastAPI AI service, PostgreSQL DB).',
      'Only answer questions related to Propellex: its code, architecture, features, bugs, deployment, or real estate domain.',
      'If asked something completely unrelated to Propellex or real estate, politely decline and redirect to Propellex topics.',
      'Reply in plain text only — no markdown (it renders literally in WhatsApp).',
      'Be concise.',
      '',
      `Message from ${from}:`,
      userText,
    ].join('\n');

    console.error(`[Bot] → claude --print (from ${from}: "${userText.slice(0, 50)}")`);

    // Invoke claude CLI directly via node.exe — no cmd.exe, no PATH issues
    const proc = spawn(NODE_EXE, [CLAUDE_CLI, '--print'], {
      cwd: CLAUDE_DIR,
      env: {
        ...process.env,
        CLAUDE_CODE_GIT_BASH_PATH: GIT_BASH,
        // Ensure home dir is explicit so claude finds ~/.claude.json auth
        HOME: 'C:\\Users\\Haneel Teja',
        USERPROFILE: 'C:\\Users\\Haneel Teja',
      },
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Pass prompt via stdin (claude --print reads from stdin when no arg given)
    proc.stdin!.write(prompt + '\n');
    proc.stdin!.end();

    let out = '';
    let errOut = '';
    proc.stdout!.on('data', (d: Buffer) => { out += d.toString(); });
    proc.stderr!.on('data', (d: Buffer) => { errOut += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && out.trim()) {
        resolve(out.trim());
      } else {
        console.error(`[Bot] claude exited ${code}`);
        console.error(`[Bot] stdout: ${out.slice(0, 300) || '(empty)'}`);
        console.error(`[Bot] stderr: ${errOut.slice(0, 300) || '(empty)'}`);
        reject(new Error(`claude exited ${code}`));
      }
    });

    proc.on('error', (err) => {
      console.error(`[Bot] Failed to spawn claude: ${err.message}`);
      reject(err);
    });

    // Safety timeout — 2 minutes per message
    setTimeout(() => {
      proc.kill();
      reject(new Error('claude --print timed out after 2 minutes'));
    }, 120_000);
  });
}

// ── Message queue (serialise Claude calls) ────────────────────────────────────

let queue: Promise<void> = Promise.resolve();

// ── Baileys connection ────────────────────────────────────────────────────────

async function start(): Promise<void> {
  mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const txt = await QRCode.toString(qr, { type: 'terminal', small: true });
      process.stderr.write('\n=== Scan QR to connect WhatsApp ===\n' + txt + '\n');
      const png = join(AUTH_DIR, 'qr.png');
      await QRCode.toFile(png, qr, { type: 'png', width: 400 });
      process.stderr.write(`QR image saved: ${png}\nOpen it and scan quickly (expires ~20s)\n`);
    }

    if (connection === 'close') {
      const code     = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.error(`[Bot] Disconnected (code ${code}) — ${loggedOut ? 'logged out, delete ./auth/ and restart' : 'reconnecting in 5s'}`);
      if (!loggedOut) setTimeout(start, 5_000);
    }

    if (connection === 'open') {
      console.error('[Bot] ✓ Connected to WhatsApp');
      console.error(`[Bot] Monitoring group: ${GROUP_JID}`);
      console.error(`[Bot] Allowed senders: ${ALLOW_ALL ? '* (everyone)' : [...ALLOWED].join(', ')}`);
      console.error('[Bot] Ready — waiting for messages...');
    }
  });

  // ── Incoming messages ───────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Discovery logging for all non-self messages
      if (msg.key.remoteJid && !msg.key.fromMe) {
        const line = `[DISCOVER] remoteJid=${msg.key.remoteJid} participant=${msg.key.participant ?? 'n/a'}\n`;
        process.stderr.write(line);
        writeFileSync(join(AUTH_DIR, 'discover.log'), line, { flag: 'a' });
      }

      if (msg.key.remoteJid !== GROUP_JID) continue;
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const text = (
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        msg.message.imageMessage?.caption ??
        msg.message.videoMessage?.caption ??
        ''
      ).trim();

      if (!text) continue;

      const senderJid   = msg.key.participant ?? msg.key.remoteJid ?? '';
      const senderPhone = jidToPhone(senderJid);

      if (!isSenderAllowed(senderJid)) {
        console.error(`[Bot] Dropped message from ${senderPhone} (not in allowlist)`);
        continue;
      }

      console.error(`[Bot] Received from ${senderPhone}: "${text.slice(0, 80)}"`);

      // Enqueue — one Claude call at a time
      queue = queue.then(async () => {
        try {
          const reply = await askClaude(text, senderPhone);
          console.error(`[Bot] Replying: "${reply.slice(0, 80)}"`);
          await sock.sendMessage(GROUP_JID, { text: reply });
        } catch (err) {
          const errMsg = (err as Error).message;
          console.error(`[Bot] Error processing message: ${errMsg}`);
          try {
            await sock.sendMessage(GROUP_JID, {
              text: 'Sorry, I ran into an issue. Please try again in a moment.',
            });
          } catch { /* ignore send errors */ }
        }
      });
    }
  });
}

start().catch((err) => {
  console.error('[Bot] Fatal startup error:', (err as Error).message);
  process.exit(1);
});
