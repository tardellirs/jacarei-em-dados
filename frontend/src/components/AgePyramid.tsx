import type { DashboardData } from '../types'
import { AGE_LABELS, COLOR_MALE, COLOR_FEMALE } from '../utils/constants'

interface AgePyramidProps {
  data: DashboardData
}

export function AgePyramid({ data }: AgePyramidProps) {
  if (!data.hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">Pirâmide Etária</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Sem dados para este setor</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.masculinoPorFaixa, ...data.femininoPorFaixa, 1)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">Pirâmide Etária</h3>

      <div className="flex flex-col gap-[3px]">
        {/* Barras de cima para baixo (70+ até 0-4) — ordem reversa para pirâmide clássica */}
        {[...AGE_LABELS].reverse().map((label, idx) => {
          const i = AGE_LABELS.length - 1 - idx
          const maleVal = data.masculinoPorFaixa[i] ?? 0
          const femaleVal = data.femininoPorFaixa[i] ?? 0
          const malePct = (maleVal / maxVal) * 100
          const femalePct = (femaleVal / maxVal) * 100

          return (
            <div key={label} className="flex items-center gap-1">
              {/* Lado masculino: barra cresce da direita para a esquerda */}
              <div className="flex-1 flex justify-end h-[14px]">
                <div
                  title={`${label}: ${maleVal.toLocaleString('pt-BR')} homens`}
                  className="h-full rounded-l-[2px] transition-all duration-200"
                  style={{ width: `${malePct}%`, backgroundColor: COLOR_MALE }}
                />
              </div>

              {/* Label central */}
              <div className="w-10 shrink-0 text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {label}
              </div>

              {/* Lado feminino: barra cresce da esquerda para a direita */}
              <div className="flex-1 flex justify-start h-[14px]">
                <div
                  title={`${label}: ${femaleVal.toLocaleString('pt-BR')} mulheres`}
                  className="h-full rounded-r-[2px] transition-all duration-200"
                  style={{ width: `${femalePct}%`, backgroundColor: COLOR_FEMALE }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex gap-4 justify-center mt-3">
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
