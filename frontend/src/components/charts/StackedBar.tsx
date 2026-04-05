import { BarChart, Bar, XAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'

interface StackedBarProps {
  data: { label: string; value: number; color: string }[]
  title?: string
}

export function StackedBar({ data, title }: StackedBarProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex flex-col gap-1">
        {title && <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{title}</p>}
        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center">
          Sem dados
        </div>
      </div>
    )
  }

  const chartData = [
    data.reduce<Record<string, number>>((acc, d) => {
      acc[d.label] = (d.value / total) * 100
      return acc
    }, {}),
  ]

  return (
    <div className="flex flex-col gap-1">
      {title && <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{title}</p>}

      {/* Barra empilhada */}
      <div className="flex h-6 rounded overflow-hidden">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={i}
              title={`${d.label}: ${d.value.toLocaleString('pt-BR')} (${pct.toFixed(1)}%)`}
              style={{ width: `${pct}%`, backgroundColor: d.color }}
              className="flex items-center justify-center"
            >
              {pct >= 12 && (
                <span className="text-white text-[10px] font-bold px-0.5 truncate">
                  {pct.toFixed(1)}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Eixo */}
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
