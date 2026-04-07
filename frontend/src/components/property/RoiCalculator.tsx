import { useState } from 'react';
import { formatRupeesCr } from '@/lib/utils';

interface Props {
  price: number;           // rupees
  roiEstimate3yr: string;  // e.g. "12.5"
  riskScore: number;       // 0–100
}

export function RoiCalculator({ price, roiEstimate3yr, riskScore }: Props) {
  const baseRoi = parseFloat(roiEstimate3yr) || 10;

  const [horizon, setHorizon]     = useState(3);   // years
  const [rentYield, setRentYield] = useState(3.5); // % per year
  const [appreciation, setAppreciation] = useState(baseRoi / 3); // % per year (default from 3yr estimate)

  // Total return = capital appreciation + cumulative rental income
  const appreciatedValue = price * Math.pow(1 + appreciation / 100, horizon);
  const capitalGain      = appreciatedValue - price;
  const rentalIncome     = price * (rentYield / 100) * horizon;
  const totalReturn      = capitalGain + rentalIncome;
  const totalReturnPct   = (totalReturn / price) * 100;
  const annualisedPct    = (Math.pow(1 + totalReturn / price, 1 / horizon) - 1) * 100;

  const riskAdj = riskScore < 40 ? 'Low Risk' : riskScore < 70 ? 'Medium Risk' : 'High Risk';
  const riskColor = riskScore < 40 ? 'text-secondary' : riskScore < 70 ? 'text-primary' : 'text-error';

  return (
    <section className="bg-surface-container-low border-t border-outline-variant">
      <div className="px-8 pt-10 pb-6 border-b border-outline-variant">
        <span className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-2 block">
          Investment Tools
        </span>
        <h2 className="font-headline text-3xl font-light text-on-surface">
          ROI Calculator
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-outline-variant">

        {/* Inputs */}
        <div className="px-8 py-8 space-y-6">
          <p className="text-on-surface-variant font-body text-sm">
            Adjust parameters to model your investment return.
          </p>

          {/* Holding period */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-[0.15em]">
                Holding Period
              </label>
              <span className="font-headline text-lg text-on-surface">{horizon} yr</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-label mt-1">
              <span>1 yr</span><span>10 yr</span>
            </div>
          </div>

          {/* Annual appreciation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-[0.15em]">
                Annual Appreciation
              </label>
              <span className="font-headline text-lg text-on-surface">{appreciation.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={appreciation}
              onChange={(e) => setAppreciation(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-label mt-1">
              <span>0%</span><span>25%</span>
            </div>
          </div>

          {/* Rental yield */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-[0.15em]">
                Annual Rental Yield
              </label>
              <span className="font-headline text-lg text-on-surface">{rentYield.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={rentYield}
              onChange={(e) => setRentYield(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-label mt-1">
              <span>0%</span><span>10%</span>
            </div>
          </div>

          <p className="text-[10px] text-on-surface-variant font-label">
            * Estimates are illustrative. Past performance does not guarantee future returns.
          </p>
        </div>

        {/* Results */}
        <div className="px-8 py-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-px border border-outline-variant">
              {[
                { label: 'Purchase Price',    value: formatRupeesCr(price),               sub: '' },
                { label: 'Projected Value',   value: formatRupeesCr(appreciatedValue),     sub: `after ${horizon} yr` },
                { label: 'Capital Gain',      value: formatRupeesCr(capitalGain),          sub: '' },
                { label: 'Rental Income',     value: formatRupeesCr(rentalIncome),         sub: `over ${horizon} yr` },
              ].map((r) => (
                <div key={r.label} className="bg-surface-container p-4">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-1">
                    {r.label}
                  </p>
                  <p className="font-headline text-lg text-on-surface leading-tight">{r.value}</p>
                  {r.sub && <p className="font-label text-[10px] text-on-surface-variant mt-0.5">{r.sub}</p>}
                </div>
              ))}
            </div>

            {/* Total return highlight */}
            <div className="bg-primary p-6 flex items-center justify-between">
              <div>
                <p className="font-label text-[10px] text-on-primary/60 uppercase tracking-[0.15em] mb-1">
                  Total Return
                </p>
                <p className="font-headline text-3xl text-on-primary">
                  {formatRupeesCr(totalReturn)}
                </p>
                <p className="font-label text-xs text-on-primary/70 mt-0.5">
                  +{totalReturnPct.toFixed(1)}% over {horizon} yr
                </p>
              </div>
              <div className="text-right">
                <p className="font-label text-[10px] text-on-primary/60 uppercase tracking-[0.15em] mb-1">
                  Annualised
                </p>
                <p className="font-headline text-3xl text-on-primary">
                  {annualisedPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Risk indicator */}
          <div className="flex items-center gap-3 border border-outline-variant px-4 py-3">
            <span className="material-symbols-outlined text-base text-on-surface-variant">
              shield
            </span>
            <div>
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">
                Risk Assessment
              </p>
              <p className={`font-label text-sm font-semibold ${riskColor}`}>
                {riskAdj} ({riskScore}/100)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
