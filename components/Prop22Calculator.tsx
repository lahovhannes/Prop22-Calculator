'use client'
import React, { useMemo, useState } from 'react'

function currency(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-sm text-slate-600 dark:text-slate-400">{children}</span>
)
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
    <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">{title}</h2>
    {children}
  </div>
)
const NumberInput: React.FC<{
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
  placeholder?: string
}> = ({ value, onChange, min = 0, step = 1, placeholder }) => (
  <input
    type="number"
    inputMode="decimal"
    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={Number.isNaN(value) ? '' : value}
    min={min}
    step={step}
    placeholder={placeholder}
    onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
  />
)

export default function Prop22Calculator() {
  // Inputs
  const [w1h, setW1h] = useState(0)
  const [w1m, setW1m] = useState(0)
  const [w2h, setW2h] = useState(0)
  const [w2m, setW2m] = useState(0)
  const [miles, setMiles] = useState(0)
  const [baseEarn, setBaseEarn] = useState(0) // exclude tips/promos
  const [alreadyPaidTopUp, setAlreadyPaidTopUp] = useState(0)

  // Rates (Aug 2025)
  const CITY_WAGES: { label: string; value: number }[] = [
    { label: '— Select city (or enter manually) —', value: 0 },
    { label: 'California (Statewide)', value: 16.50 },
    { label: 'Alameda', value: 17.46 },
    { label: 'Belmont', value: 18.30 },
    { label: 'Berkeley', value: 19.18 },
    { label: 'Cupertino', value: 18.20 },
    { label: 'Daly City', value: 17.07 },
    { label: 'Emeryville', value: 19.90 },
    { label: 'Los Angeles (City)', value: 17.87 },
    { label: 'Mountain View', value: 19.20 },
    { label: 'Pasadena', value: 18.04 },
    { label: 'San Francisco', value: 19.18 },
    { label: 'San Jose', value: 17.95 },
    { label: 'San Mateo County', value: 17.46 },
    { label: 'Sunnyvale', value: 19.00 },
    { label: 'West Hollywood', value: 19.65 },
  ]
  const [cityIndex, setCityIndex] = useState(0)
  const [minWage, setMinWage] = useState(16.5) // defaults to 2025 CA state rate
  const [perMile, setPerMile] = useState(0.36) // 2025 per‑mile assumption

  const engagedHours = useMemo(() => {
    const wk1 = w1h + Math.max(0, Math.min(59, w1m)) / 60
    const wk2 = w2h + Math.max(0, Math.min(59, w2m)) / 60
    return Math.max(0, wk1 + wk2)
  }, [w1h, w1m, w2h, w2m])

  const guaranteed = useMemo(() => {
    return 1.2 * minWage * engagedHours + perMile * miles
  }, [minWage, engagedHours, perMile, miles])

  const topUpOwed = useMemo(() => {
    return Math.max(0, guaranteed - baseEarn)
  }, [guaranteed, baseEarn])

  const differenceVsPaid = useMemo(() => {
    return topUpOwed - alreadyPaidTopUp
  }, [topUpOwed, alreadyPaidTopUp])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Prop 22 Earnings Top‑Up Calculator
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Estimate the guaranteed earnings adjustment over a two‑week pay period (14 days) under California Prop 22.
          Enter engaged time (only time from accept → drop‑off), engaged miles, and base earnings (excluding tips/promos).
        </p>
      </header>

      <Card title="Controls (rates for your area)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label>City (Aug 2025 minimum wage)</Label>
            <select
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={cityIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10)
                setCityIndex(idx)
                const v = CITY_WAGES[idx]?.value || 0
                if (v > 0) setMinWage(v)
              }}
            >
              {CITY_WAGES.map((c, i) => (
                <option key={i} value={i}>
                  {c.label}{c.value ? ` — $${c.value.toFixed(2)}/hr` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Pick a city to auto‑fill local minimum wage (Aug 2025). You can still edit the value below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Local minimum wage ($/hour)</Label>
            <NumberInput value={minWage} onChange={setMinWage} step={0.01} />
            <p className="mt-1 text-xs text-slate-500">Prop 22 guarantee uses 120% of this rate.</p>
          </div>
          <div>
            <Label>Prop 22 per‑mile ($/mile)</Label>
            <NumberInput value={perMile} onChange={setPerMile} step={0.01} />
            <p className="mt-1 text-xs text-slate-500">Default reflects a 2025 per‑mile assumption ($0.36).</p>
          </div>
          <div>
            <Label>Prop 22 payment already received ($)</Label>
            <NumberInput value={alreadyPaidTopUp} onChange={setAlreadyPaidTopUp} step={0.01} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-6">
        <Card title="1. Enter engaged time (two‑week period)">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Week 1 hours</Label>
              <NumberInput value={w1h} onChange={setW1h} />
            </div>
            <div>
              <Label>Week 1 minutes (0–59)</Label>
              <NumberInput value={w1m} onChange={setW1m} />
            </div>
            <div>
              <Label>Week 2 hours</Label>
              <NumberInput value={w2h} onChange={setW2h} />
            </div>
            <div>
              <Label>Week 2 minutes (0–59)</Label>
              <NumberInput value={w2m} onChange={setW2m} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            Total engaged time: <span className="font-semibold">{engagedHours.toFixed(2)}</span> hours
          </div>
        </Card>

        <Card title="2. Enter engaged miles">
          <div>
            <Label>Total engaged miles (two weeks)</Label>
            <NumberInput value={miles} onChange={setMiles} step={0.1} />
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Only miles driven after accepting a job until drop‑off count under Prop 22.
          </p>
        </Card>
      </div>

      <Card title="3. Enter base earnings (two‑week period)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Base earnings received (exclude tips, tolls, promos)</Label>
            <NumberInput value={baseEarn} onChange={setBaseEarn} step={0.01} />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <div>Guaranteed (floor): <span className="font-semibold">{currency(guaranteed)}</span></div>
              <div>Top‑up owed: <span className="font-semibold">{currency(topUpOwed)}</span></div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <div className="text-sm text-slate-500">120% of MW × hours</div>
            <div className="text-xl font-semibold">{currency(1.2 * minWage * engagedHours)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Per‑mile × miles</div>
            <div className="text-xl font-semibold">{currency(perMile * miles)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Guaranteed floor</div>
            <div className="text-xl font-semibold">{currency(guaranteed)}</div>
          </div>
        </div>
        <hr className="my-4 border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <div className="text-sm text-slate-500">Base earnings (excl. tips)</div>
            <div className="text-xl font-semibold">{currency(baseEarn)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Top‑up owed</div>
            <div className="text-xl font-semibold">{currency(topUpOwed)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Difference vs. paid</div>
            <div className={`text-xl font-semibold ${differenceVsPaid > 0 ? 'text-emerald-600' : differenceVsPaid < 0 ? 'text-rose-600' : ''}`}>
              {currency(differenceVsPaid)}
            </div>
            <div className="text-xs text-slate-500">(Top‑up owed − already paid)</div>
          </div>
        </div>
      </Card>

      <footer className="mt-6 text-xs text-slate-500">
        <p>
          For education use only. Not financial or legal advice. Prop 22 applies to engaged time and engaged miles only and is averaged over a pay period not exceeding 14 days. Company rules on what counts as base earnings can vary.
        </p>
      </footer>
    </div>
  )
}
