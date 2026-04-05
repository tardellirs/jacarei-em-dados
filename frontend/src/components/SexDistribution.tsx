import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Legend,
  Tooltip,
} from 'recharts'
import type { DashboardData } from '../types'
import { COLOR_MALE, COLOR_FEMALE } from '../utils/constants'
import { fmtInt } from '../utils/formatting'

interface SexDistributionProps {
  data: DashboardData
}

export function SexDistribution({ data }: SexDistributionProps) {
  if (!data.hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sem dados para este setor</p>
      </div>
    )
  }

  const total = data.masculino + data.feminino
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sem população registrada</p>
      </div>
    )
  }

  const mPct = (data.masculino / total) * 100
  const fPct = (data.feminino / total) * 100

  const chartData = [
    {
      name: ' ',
      masculino: parseFloat(mPct.toFixed(1)),
      feminino: parseFloat(fPct.toFixed(1)),
      masculinoAbs: data.masculino,
      femininoAbs: data.feminino,
    },
  ]

  const renderCustomLabel = (props: {
    x?: number; y?: number; width?: number; height?: number; value?: number
  }, absValue: number) => {
    const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
    if (width < 40) return null
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
      >
        {value.toFixed(1)}% ({fmtInt(absValue)})
      </text>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart
          data={chartData}
          layout="vertical"
          barSize={32}
          margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-text)',
              fontSize: 12,
              borderRadius: 6,
            }}
            formatter={(value: number, name: string) => {
              const abs = name === 'masculino' ? data.masculino : data.feminino
              return [`${value.toFixed(1)}% (${fmtInt(abs)})`, name === 'masculino' ? 'Masculino' : 'Feminino']
            }}
          />
          <Bar dataKey="masculino" stackId="a" fill={COLOR_MALE} isAnimationActive={false}>
            <LabelList
              dataKey="masculino"
              content={(props) => renderCustomLabel(props as Parameters<typeof renderCustomLabel>[0], data.masculino)}
            />
          </Bar>
          <Bar dataKey="feminino" stackId="a" fill={COLOR_FEMALE} isAnimationActive={false}>
            <LabelList
              dataKey="feminino"
              content={(props) => renderCustomLabel(props as Parameters<typeof renderCustomLabel>[0], data.feminino)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_MALE }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">Masculino</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_FEMALE }} />
          <span className="text-xs text-slate-600 dark:text-slate-400">Feminino</span>
        </div>
      </div>
    </div>
  )
}
