import { Badge } from '@/components/shared/Badge';
import type { ReraStatus } from '@/types';

interface RERABadgeProps {
  status: ReraStatus;
}

const config: Record<ReraStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  verified:        { variant: 'success', label: '✓ RERA Verified' },
  pending:         { variant: 'warning', label: '⏳ RERA Pending' },
  flagged:         { variant: 'danger',  label: '⚠ RERA Flagged' },
  not_registered:  { variant: 'danger',  label: '✕ Not Registered' },
  unknown:         { variant: 'neutral', label: '? Unverified' },
};

export function RERABadge({ status }: RERABadgeProps) {
  const { variant, label } = config[status] ?? config.unknown;
  return <Badge variant={variant}>{label}</Badge>;
}
