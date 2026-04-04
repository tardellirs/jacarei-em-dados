import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface PieSlice {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieSlice[]
  title?: string
  height?: number
  innerRadius?: number
}

const RADIAN = Math.PI / 180

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

export function PieChart({ data, title, height = 200, innerRadius = 0 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        {title && <p className="text-xs font-semibold text-slate-600 text-center">{title}</p>}
        <p className="text-xs text-slate-400 italic">Sem dados disponíveis</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {title && <p className="text-xs font-semibold text-slate-600 text-center mb-1">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius ? '65%' : '70%'}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={400}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString('pt-BR')} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
          />
          <Legend
            iconType="square"
            iconSize={10}
            formatter={(value) => <span style={{ fontSize: 11, color: '#475569' }}>{value}</span>}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
