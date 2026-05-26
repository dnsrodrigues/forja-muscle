import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { LoadPoint } from '../../types'

interface Props {
  data: LoadPoint[]
  exerciseName: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
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
      fontFamily: "'DM Mono', monospace",
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

export function LoadProgressChart({ data, exerciseName: _ }: Props) {
  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            fill: 'rgba(240,237,230,0.35)',
            letterSpacing: '0.06em',
          }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            fill: 'rgba(240,237,230,0.35)',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}kg`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="maxLoad"
          stroke="#c8f04a"
          strokeWidth={2}
          dot={{ fill: '#c8f04a', r: 3, strokeWidth: 0 }}
          activeDot={{ fill: '#c8f04a', r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
