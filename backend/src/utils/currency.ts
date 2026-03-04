/** Convert paise (integer) to rupees (number with 2 decimal places) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Convert rupees to paise for DB storage */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Format paise as Indian rupee string: ₹1,20,00,000 */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/**
 * Serialize a DB row, converting all *_paise fields to rupees.
 * Accepts either an object or an array of objects.
 */
export function serializeMoney<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const [key, value] of Object.entries(out)) {
    if ((key === 'price' || key === 'price_per_sqft') && typeof value === 'number') {
      out[key] = paiseToRupees(value);
    }
  }
  return out as T;
}
