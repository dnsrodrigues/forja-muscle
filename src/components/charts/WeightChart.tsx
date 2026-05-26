import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { UserWeight } from '../../types'

interface Props {
  data: UserWeight[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border-md)',
      borderLeft: '2px solid var(--accent)',
      padding: '8px 12px',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
        {label ? formatDate(label) : ''}
      </div>
      <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>
        {payload[0].value} kg
      </div>
    </div>
  )
}

export function WeightChart({ data }: Props) {
  // Recharts precisa de data ordenada do mais antigo ao mais recente
  const sorted = [...data]
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((w) => ({ date: w.measured_at, weight: Number(w.weight_kg) }))

  if (sorted.length === 0) return null

  const weights = sorted.map((d) => d.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const padding = Math.max((maxW - minW) * 0.2, 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={sorted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6c8ef7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6c8ef7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            fill: 'rgba(240,237,230,0.35)',
          }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            fill: 'rgba(240,237,230,0.35)',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}kg`}
          domain={[minW - padding, maxW + padding]}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#6c8ef7"
          strokeWidth={2}
          fill="url(#weightGradient)"
          dot={{ fill: '#6c8ef7', r: 3, strokeWidth: 0 }}
          activeDot={{ fill: '#6c8ef7', r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
