/**
 * Format a rupee amount using Indian numbering system (en-IN).
 * Input: number in rupees.
 * Output: e.g. "₹1,20,00,000" or "₹85,00,000"
 */
export function formatRupees(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format rupees in crore shorthand for display.
 * e.g. 15000000 → "₹1.5 Cr", 8500000 → "₹85 L"
 */
export function formatRupeesCr(rupees: number): string {
  if (rupees >= 1_00_00_000) {
    return `₹${(rupees / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (rupees >= 1_00_000) {
    return `₹${(rupees / 1_00_000).toFixed(0)} L`;
  }
  return formatRupees(rupees);
}

/**
 * Format a date string to "DD MMM YYYY" format.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert a risk score (0–100) to a label.
 */
export function riskLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score < 40) return 'Low';
  if (score < 70) return 'Medium';
  return 'High';
}

/**
 * Build a CSS class string from multiple parts (simple alternative to clsx).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
