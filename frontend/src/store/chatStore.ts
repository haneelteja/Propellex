import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '@/types';

interface ChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  dailyCount: number;
  lastCountDate: string;
  isStreaming: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  appendToLast: (text: string) => void;
  setStreaming: (val: boolean) => void;
  incrementCount: () => void;
  clearMessages: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      dailyCount: 0,
      lastCountDate: today(),
      isStreaming: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addMessage: (message) =>
        set((s) => ({ messages: [...s.messages, message] })),

      appendToLast: (text) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: last.content + text };
          }
          return { messages: msgs };
        }),

      setStreaming: (val) => set({ isStreaming: val }),

      incrementCount: () => {
        const { dailyCount, lastCountDate } = get();
        const todayStr = today();
        if (lastCountDate !== todayStr) {
          set({ dailyCount: 1, lastCountDate: todayStr });
        } else {
          set({ dailyCount: dailyCount + 1 });
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'propellex_chat',
      partialize: (s) => ({
        dailyCount: s.dailyCount,
        lastCountDate: s.lastCountDate,
      }),
    },
  ),
);
