import type { Request, Response } from 'express';
import { getDailyUsage, incrementDailyUsage } from '../../config/redis';
import { fail } from '../../utils/response';

const FREE_CHAT_LIMIT = 5;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';

export async function handleChat(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  // Freemium check
  if (user.subscriptionTier === 'free') {
    const used = await getDailyUsage(user.userId, 'chat');
    if (used >= FREE_CHAT_LIMIT) {
      fail(
        res,
        `Free tier limit: ${FREE_CHAT_LIMIT} chat queries/day. Upgrade to Premium for unlimited.`,
        429,
      );
      return;
    }
    await incrementDailyUsage(user.userId, 'chat');
  }

  const { message, conversation_history } = req.body as {
    message?: string;
    conversation_history?: Array<{ role: string; content: string }>;
  };

  if (!message?.trim()) {
    fail(res, 'message is required');
    return;
  }

  // Set SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const aiBody = JSON.stringify({
    message,
    user_id: user.userId,
    conversation_history: conversation_history ?? [],
  });

  const callAi = () =>
    fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: aiBody,
    });

  try {
    let aiRes = await callAi();

    // Render free-tier returns 429 while waking a sleeping service (~15-30 s).
    // Wait 15 s then retry once — enough time for the service to come back up.
    if (aiRes.status === 429) {
      console.warn('[Chat] AI service returned 429 — retrying in 15 s');
      await new Promise((r) => setTimeout(r, 15_000));
      aiRes = await callAi();
    }

    if (!aiRes.ok || !aiRes.body) {
      const status = aiRes.status;
      const isHtml = aiRes.headers.get('content-type')?.includes('text/html');
      const detail = isHtml
        ? `HTTP ${status} (AI service unavailable)`
        : await aiRes.text().catch(() => `HTTP ${status}`);
      console.error(`[Chat] AI service error — ${detail}`);
      res.write(`data: ${JSON.stringify({ error: status === 429 ? 'AI service is waking up — please try again in a moment' : `AI service unavailable (${status})` })}\n\n`);
      res.end();
      return;
    }

    // Pipe SSE stream from AI service to client
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (streamErr) {
      console.error('[Chat] Stream read error:', (streamErr as Error).message);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted — please try again' })}\n\n`);
    } finally {
      // Always release the reader, even on error
      reader.cancel().catch(() => {});
      res.end();
    }
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    const isNetwork = msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed');
    console.error('[Chat] Unexpected error:', msg);
    res.write(`data: ${JSON.stringify({ error: isNetwork ? 'Could not reach AI service — it may be starting up, try again in 30s' : 'Chat service error' })}\n\n`);
    res.end();
  }
}

export async function handleChatUsage(req: Request, res: Response): Promise<void> {
  const used = await getDailyUsage(req.user!.userId, 'chat');
  res.json({
    success: true,
    data: {
      used,
      limit: req.user!.subscriptionTier === 'premium' ? null : FREE_CHAT_LIMIT,
      is_premium: req.user!.subscriptionTier === 'premium',
    },
  });
}
