import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-on-primary text-xs font-bold">P</span>
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-on-primary'
            : 'bg-surface-container-high text-on-surface',
        )}
      >
        {message.content}
        {isStreaming && !isUser && (
          <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}
