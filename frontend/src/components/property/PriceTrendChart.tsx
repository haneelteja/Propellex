import { formatRupees } from '@/lib/utils';

interface Props {
  pricePerSqft: number;   // current ₹/sqft (rupees, not paise)
  roiEstimate3yr: string; // e.g. "12.5"
  locality: string;
}

// Generate 6 months of mocked ₹/sqft data ending at the current price.
// We work backwards from the current value using the annualised growth rate.
function generateTrend(currentPsf: number, roi3yr: number): { month: string; psf: number }[] {
  const annualGrowth = roi3yr / 3 / 100; // rough monthly driver
  const monthlyGrowth = annualGrowth / 12;

  const now = new Date();
  const months: { month: string; psf: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    // Add slight noise (±1.5%) to make it look realistic
    const noise = 1 + (Math.sin(i * 2.3 + 1) * 0.015);
    const psf = Math.round(currentPsf / Math.pow(1 + monthlyGrowth, i) * noise);
    months.push({ month: label, psf });
  }

  return months;
}

export function PriceTrendChart({ pricePerSqft, roiEstimate3yr, locality }: Props) {
  const roi = parseFloat(roiEstimate3yr) || 10;
  const trend = generateTrend(pricePerSqft, roi);

  const values = trend.map((t) => t.psf);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padded = { min: minV - range * 0.1, max: maxV + range * 0.1 };
  const paddedRange = padded.max - padded.min;

  const WIDTH  = 400;
  const HEIGHT = 120;
  const LEFT   = 0;
  const BOTTOM = HEIGHT;

  const toX = (i: number) => LEFT + (i / (trend.length - 1)) * WIDTH;
  const toY = (v: number) => BOTTOM - ((v - padded.min) / paddedRange) * HEIGHT;

  const polyPoints = trend.map((t, i) => `${toX(i)},${toY(t.psf)}`).join(' ');
  const areaPath   = `M ${toX(0)},${BOTTOM} L ${trend.map((t, i) => `${toX(i)},${toY(t.psf)}`).join(' L ')} L ${toX(trend.length - 1)},${BOTTOM} Z`;

  const first = trend[0]!.psf;
  const last  = trend[trend.length - 1]!.psf;
  const changePct = ((last - first) / first) * 100;
  const isUp = changePct >= 0;

  return (
    <section className="bg-surface-container-low border-t border-outline-variant">
      <div className="px-8 pt-10 pb-6 border-b border-outline-variant flex items-start justify-between gap-4">
        <div>
          <span className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-2 block">
            Market Trends
          </span>
          <h2 className="font-headline text-3xl font-light text-on-surface">
            Price Trend — {locality}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
            6-Month Change
          </p>
          <p className={`font-headline text-2xl ${isUp ? 'text-secondary' : 'text-error'}`}>
            {isUp ? '+' : ''}{changePct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            style={{ height: '160px' }}
            preserveAspectRatio="none"
            aria-label="Price per sqft trend over 6 months"
          >
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f2ca50" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={areaPath} fill="url(#trendGrad)" />
            {/* Line */}
            <polyline
              points={polyPoints}
              fill="none"
              stroke="#f2ca50"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Data point dots */}
            {trend.map((t, i) => (
              <circle
                key={i}
                cx={toX(i)}
                cy={toY(t.psf)}
                r="3"
                fill="#f2ca50"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2">
            {trend.map((t) => (
              <span key={t.month} className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.05em]">
                {t.month}
              </span>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-px border border-outline-variant mt-6">
          {[
            { label: 'Starting Price/sqft', value: formatRupees(first) },
            { label: 'Current Price/sqft',  value: formatRupees(last)  },
            { label: '3-Year ROI Est.',     value: `+${roiEstimate3yr}%` },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container p-4">
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
                {s.label}
              </p>
              <p className="font-headline text-base text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-on-surface-variant font-label mt-4">
          * Price trend is indicative and based on estimated growth rates. Actual prices may vary.
        </p>
      </div>
    </section>
  );
}
