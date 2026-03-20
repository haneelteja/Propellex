import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { useAuthStore } from '@/store/authStore';

const PROMPT_SUGGESTIONS = [
  'Show 3BHK flats under ₹2 Cr in Gachibowli',
  'Best ROI localities in Hyderabad?',
  'Compare Kokapet vs Madhapur',
] as const;

export function ChatWidget() {
  const { isOpen, toggle, close } = useChatStore();
  const { messages, isStreaming, dailyCount, isAtLimit, freeLimit, sendMessage } = useChat();
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isFree = user?.subscription_tier === 'free';

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-10 right-10 z-[60] flex items-center gap-4 bg-background border border-primary/30 p-2 shadow-[0_32px_64px_rgba(0,0,0,0.6)] group">
        {/* Hover label — only shown when chat is closed */}
        {!isOpen && (
          <div className="pl-4 pr-2 py-2 hidden group-hover:block">
            <p className="font-body text-xs text-white/80 whitespace-nowrap">
              Ask Propellex AI about this property
            </p>
          </div>
        )}

        {/* Free tier remaining count pip */}
        {isFree && !isOpen && (
          <span className="absolute -top-2 -left-2 bg-primary text-on-primary text-[10px] font-label font-bold w-5 h-5 flex items-center justify-center">
            {freeLimit - dailyCount}
          </span>
        )}

        <button
          onClick={toggle}
          className="w-14 h-14 bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
        >
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isOpen ? 'close' : 'psychology'}
          </span>
        </button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-[6.5rem] right-10 z-[60] w-[400px] max-w-[calc(100vw-2.5rem)] bg-surface-container-low border border-outline-variant flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-fade-in"
          style={{ maxHeight: 'calc(100vh - 9rem)' }}
        >
          {/* Header */}
          <div className="bg-surface-container-low border-b border-outline-variant px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-headline italic text-primary text-base leading-tight">
                Propellex AI
              </h3>
              <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mt-0.5">
                Real estate intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isFree && (
                <span className="text-on-surface-variant font-label text-xs">
                  {dailyCount}/{freeLimit}
                </span>
              )}
              <button
                onClick={close}
                className="text-on-surface-variant hover:text-primary transition-colors duration-200"
                aria-label="Close chat"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="py-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-primary text-[28px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    psychology
                  </span>
                </div>
                <p className="text-on-surface font-body text-sm font-medium">
                  Hello! I&apos;m your Propellex AI.
                </p>
                <p className="text-on-surface-variant font-body text-xs mt-1">
                  Ask me about properties, localities, or investment insights.
                </p>
                <div className="mt-4 w-full space-y-2">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void sendMessage(s)}
                      className="block w-full text-left text-xs font-body bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface px-4 py-2.5 border border-outline-variant/50 transition-colors duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-outline-variant p-3 shrink-0 bg-surface-container-low">
            {isAtLimit ? (
              <div className="text-center py-3 space-y-1">
                <p className="text-on-surface-variant font-body text-xs">
                  Daily limit reached ({freeLimit} queries).
                </p>
                <p className="text-primary font-label text-xs font-semibold">
                  Upgrade to Pro for unlimited access.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about properties..."
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 resize-none bg-surface-container border border-outline-variant px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors duration-200"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all duration-200 shrink-0"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
