import { Badge } from '@/components/shared/Badge';
import type { ReraStatus } from '@/types';

interface RERABadgeProps {
  status: ReraStatus;
}

const config = {
  verified: { variant: 'success' as const, label: '✓ RERA Verified' },
  pending: { variant: 'warning' as const, label: '⏳ RERA Pending' },
  flagged: { variant: 'danger' as const, label: '⚠ RERA Flagged' },
};

export function RERABadge({ status }: RERABadgeProps) {
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
