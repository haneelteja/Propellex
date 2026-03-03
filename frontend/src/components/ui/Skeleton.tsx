import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

const baseStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease infinite',
  borderRadius: 6,
};

export function Skeleton({ width = '100%', height = '1rem', className, style }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{ ...baseStyle, width, height, ...style }}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height="2rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Skeleton height="1.5rem" width="60%" />
      <div style={{ marginTop: 12 }}>
        <Skeleton height="1rem" />
        <Skeleton height="1rem" width="80%" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}
