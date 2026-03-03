interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#b91c1c',
  },
  message: { flex: 1, fontSize: 14 },
  button: {
    padding: '6px 14px',
    background: '#b91c1c',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div style={styles.container} role="alert">
      <span style={styles.message}>Error: {message}</span>
      {onRetry && (
        <button style={styles.button} onClick={onRetry} type="button">
          Retry
        </button>
      )}
    </div>
  );
}
