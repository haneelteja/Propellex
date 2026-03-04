import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { useAuthStore } from '@/store/authStore';

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
      {/* Floating button */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-navy rounded-full shadow-lg flex items-center justify-center hover:bg-navy-light transition-colors group"
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z" />
            </svg>
            {isFree && (
              <span className="absolute -top-1 -right-1 bg-gold text-navy text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {freeLimit - dailyCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          {/* Header */}
          <div className="bg-navy px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">Propellex AI</h3>
              <p className="text-white/60 text-xs">Real estate intelligence assistant</p>
            </div>
            <div className="flex items-center gap-2">
              {isFree && (
                <span className="text-white/70 text-xs">
                  {dailyCount}/{freeLimit} queries
                </span>
              )}
              <button onClick={close} className="text-white/70 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-navy font-bold text-lg">P</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Hello! I'm your Propellex AI.</p>
                <p className="text-xs text-gray-400 mt-1">Ask me about properties, localities, or investment insights.</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    'Show 3BHK flats under ₹2 Cr in Gachibowli',
                    'Best ROI localities in Hyderabad?',
                    'Compare Kokapet vs Madhapur',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => void sendMessage(s)}
                      className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg px-3 py-2 transition-colors"
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

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            {isAtLimit ? (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500">Daily limit reached ({freeLimit} queries).</p>
                <p className="text-xs text-brand">Upgrade to Pro for unlimited access.</p>
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
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-navy-light transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
