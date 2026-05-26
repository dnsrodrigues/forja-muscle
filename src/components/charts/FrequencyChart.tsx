import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import type { WeekFrequency } from '../../types'

interface Props {
  data: WeekFrequency[]
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border-md)',
      borderLeft: '2px solid var(--accent)',
      padding: '8px 12px',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
        semana de {label ? formatWeek(label) : ''}
      </div>
      <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>
        {count} treino{count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export function FrequencyChart({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
        />
        <XAxis
          dataKey="week"
          tickFormatter={formatWeek}
          tick={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 7,
            fill: 'rgba(240,237,230,0.35)',
          }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            fill: 'rgba(240,237,230,0.35)',
          }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108, 142, 247,0.05)' }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count === maxCount && entry.count > 0
                ? '#6c8ef7'
                : `rgba(108, 142, 247,${entry.count > 0 ? 0.4 : 0.1})`
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
