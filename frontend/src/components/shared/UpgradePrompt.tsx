import { Link } from 'react-router-dom';

interface Props {
  reason: string;        // e.g. "You've used all 5 daily chat queries"
  compact?: boolean;     // smaller inline variant (no border/shadow)
}

export function UpgradePrompt({ reason, compact = false }: Props) {
  if (compact) {
    return (
      <div className="bg-primary/10 border border-primary/20 px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">workspace_premium</span>
          <p className="font-label text-xs font-semibold text-on-surface uppercase tracking-[0.15em]">
            Free Limit Reached
          </p>
        </div>
        <p className="font-body text-xs text-on-surface-variant leading-relaxed">{reason}</p>
        <Link
          to="/profile"
          className="mt-1 inline-flex items-center gap-1.5 bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-widest px-3 py-2 hover:bg-primary-fixed transition-colors self-start"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant p-8 flex flex-col items-center text-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span
          className="material-symbols-outlined text-primary text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          workspace_premium
        </span>
      </div>
      <div>
        <p className="font-headline text-xl text-on-surface mb-2">Upgrade to Pro</p>
        <p className="font-body text-sm text-on-surface-variant max-w-xs leading-relaxed">{reason}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          to="/profile"
          className="px-8 py-3 bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-colors"
        >
          Upgrade — ₹999/mo
        </Link>
        <button
          className="px-8 py-3 border border-outline-variant text-on-surface-variant font-label text-xs uppercase tracking-widest hover:bg-surface-container-high transition-colors"
          onClick={() => window.history.back()}
        >
          Maybe Later
        </button>
      </div>
      <p className="text-[10px] font-label text-on-surface-variant">
        Pro includes unlimited search, chat, and portfolio saves.
      </p>
    </div>
  );
}
