import { useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

const AI_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function useChat() {
  const {
    messages,
    isStreaming,
    dailyCount,
    addMessage,
    appendToLast,
    setStreaming,
    incrementCount,
  } = useChatStore();

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const FREE_LIMIT = 5;
  const isAtLimit = user?.subscription_tier === 'free' && dailyCount >= FREE_LIMIT;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || isAtLimit) return;

      addMessage({ role: 'user', content: text.trim(), timestamp: new Date().toISOString() });
      addMessage({ role: 'assistant', content: '', timestamp: new Date().toISOString() });
      setStreaming(true);
      incrementCount();

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const res = await fetch(`${AI_BASE}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text.trim(),
            conversation_history: messages.slice(-10),
          }),
        });

        if (!res.ok || !res.body) {
          const status = res.status;
          const errMsg =
            status === 429 ? 'Daily chat limit reached — upgrade to Premium for unlimited' :
            status === 401 ? 'Session expired — please log in again' :
            status >= 500 ? 'AI service is starting up — please try again in 30s' :
            `Request failed (${status})`;
          appendToLast(`\n\n[${errMsg}]`);
          return;
        }

        reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.error) {
                appendToLast(`\n\n[${parsed.error}]`);
              } else if (parsed.text) {
                appendToLast(parsed.text);
              }
            } catch {
              // Skip malformed SSE lines silently
            }
          }
        }
      } catch (err) {
        const msg = (err as Error).message ?? String(err);
        const isNetwork = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED');
        console.error('[Chat] Stream error:', msg);
        appendToLast(`\n\n[${isNetwork ? 'No connection — check your internet and try again' : 'Unexpected error — please try again'}]`);
      } finally {
        if (reader) reader.cancel().catch(() => {});
        setStreaming(false);
      }
    },
    [messages, isStreaming, isAtLimit, token, addMessage, appendToLast, setStreaming, incrementCount],
  );

  return { messages, isStreaming, dailyCount, isAtLimit, freeLimit: FREE_LIMIT, sendMessage };
}
