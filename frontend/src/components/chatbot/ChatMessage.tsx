import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// ── Inline: **bold** ──────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part,
  );
}

// ── Block markdown renderer ───────────────────────────────────────────────────
function renderMarkdown(raw: string): React.ReactNode {
  // Strip code fences (JSON filter blocks etc. — not used by the UI)
  const text = raw.replace(/```[\s\S]*?```/g, '').trim();

  const blocks: React.ReactNode[] = [];
  const paragraphs = text.split(/\n{2,}/);

  paragraphs.forEach((para, pi) => {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const isBullet   = lines.every((l) => /^[-*]\s/.test(l));
    const isNumbered = lines.every((l) => /^\d+\.\s/.test(l));

    if (isBullet) {
      blocks.push(
        <ul key={pi} className="list-disc list-outside pl-4 space-y-1 my-1">
          {lines.map((line, li) => (
            <li key={li}>{renderInline(line.replace(/^[-*]\s/, ''))}</li>
          ))}
        </ul>,
      );
    } else if (isNumbered) {
      blocks.push(
        <ol key={pi} className="list-decimal list-outside pl-4 space-y-1 my-1">
          {lines.map((line, li) => (
            <li key={li}>{renderInline(line.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
          {renderInline(lines.join(' '))}
        </p>,
      );
    }
  });

  return blocks;
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
        {isUser
          ? message.content
          : renderMarkdown(message.content)}
        {isStreaming && !isUser && (
          <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}
