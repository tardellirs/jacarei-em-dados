import type { DashboardData } from '../types'
import { COLOR_MALE, COLOR_FEMALE } from '../utils/constants'
import { fmtInt } from '../utils/formatting'

interface SexDistributionProps {
  data: DashboardData
}

export function SexDistribution({ data }: SexDistributionProps) {
  if (!data.hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sem dados para este setor</p>
      </div>
    )
  }

  const total = data.masculino + data.feminino
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sem população registrada</p>
      </div>
    )
  }

  const mPct = (data.masculino / total) * 100
  const fPct = (data.feminino / total) * 100

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribuição por Sexo</h3>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Total */}
        <div className="flex flex-col p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-0.5">Total</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">{fmtInt(total)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">habitantes</p>
        </div>

        {/* Masculino */}
        <div
          className="flex flex-col p-2 rounded-lg border"
          style={{
            backgroundColor: `${COLOR_MALE}12`,
            borderColor: `${COLOR_MALE}40`,
          }}
        >
          <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: COLOR_MALE }}>Masculino</p>
          <p className="text-base font-bold" style={{ color: COLOR_MALE }}>{fmtInt(data.masculino)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{mPct.toFixed(1)}%</p>
        </div>

        {/* Feminino */}
        <div
          className="flex flex-col p-2 rounded-lg border"
          style={{
            backgroundColor: `${COLOR_FEMALE}12`,
            borderColor: `${COLOR_FEMALE}40`,
          }}
        >
          <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: COLOR_FEMALE }}>Feminino</p>
          <p className="text-base font-bold" style={{ color: COLOR_FEMALE }}>{fmtInt(data.feminino)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{fPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Barra pill */}
      <div className="h-8 rounded-full overflow-hidden flex">
        <div
          className="flex items-center justify-center transition-all"
          style={{ width: `${mPct}%`, backgroundColor: COLOR_MALE }}
        >
          {mPct >= 18 && (
            <span className="text-white text-[11px] font-semibold select-none">
              {mPct.toFixed(1)}%
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-center transition-all"
          style={{ width: `${fPct}%`, backgroundColor: COLOR_FEMALE }}
        >
          {fPct >= 18 && (
            <span className="text-white text-[11px] font-semibold select-none">
              {fPct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
