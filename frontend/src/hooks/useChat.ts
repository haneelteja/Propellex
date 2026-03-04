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

      const userMsg = {
        role: 'user' as const,
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);

      const assistantMsg = {
        role: 'assistant' as const,
        content: '',
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMsg);
      setStreaming(true);
      incrementCount();

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

        if (!res.ok || !res.body) throw new Error('Stream failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { text?: string };
              if (parsed.text) appendToLast(parsed.text);
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        appendToLast('\n\n[Error: could not connect to AI service]');
        console.error('[Chat] Stream error:', err);
      } finally {
        setStreaming(false);
      }
    },
    [messages, isStreaming, isAtLimit, token, addMessage, appendToLast, setStreaming, incrementCount],
  );

  return {
    messages,
    isStreaming,
    dailyCount,
    isAtLimit,
    freeLimit: FREE_LIMIT,
    sendMessage,
  };
}
