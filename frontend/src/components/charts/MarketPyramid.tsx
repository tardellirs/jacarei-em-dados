import type { MarketBracket } from '../../types'

interface MarketPyramidProps {
  brackets: MarketBracket[]
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

export function MarketPyramid({ brackets }: MarketPyramidProps) {
  if (brackets.length === 0) return null

  // Maior valor absoluto para normalizar as barras
  const maxVal = Math.max(...brackets.flatMap((b) => [b.demand, b.supply]), 1)

  // Exibir do maior preço para o menor (Super Luxo no topo, Econômico na base)
  const rows = [...brackets].reverse()

  return (
    <div className="w-full">
      {/* Cabeçalho de colunas */}
      <div className="flex items-center mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        <div className="flex-1 text-right pr-2">Demanda</div>
        <div className="w-28 text-center text-slate-400 dark:text-slate-500 shrink-0">Padrão</div>
        <div className="flex-1 text-left pl-2">Oferta</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((b) => {
          const demandPct = (b.demand / maxVal) * 100
          const supplyPct = (b.supply / maxVal) * 100
          const isOpportunity = b.gap > 0

          return (
            <div key={b.label} className="flex items-center gap-0 text-[11px]">
              {/* Lado Demanda (cresce à esquerda) */}
              <div className="flex-1 flex items-center justify-end gap-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                  {b.demand > 0 ? fmtNum(b.demand) : ''}
                </span>
                <div className="relative h-5 flex-1 flex justify-end">
                  <div
                    className="h-full rounded-l-sm"
                    style={{
                      width: `${demandPct}%`,
                      backgroundColor: '#059669',
                      opacity: b.demand > 0 ? 0.85 : 0,
                    }}
                  />
                </div>
              </div>

              {/* Label central */}
              <div
                className={[
                  'w-28 text-center px-1 py-0.5 text-[10px] font-semibold shrink-0 rounded-sm mx-0.5',
                  isOpportunity
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300',
                ].join(' ')}
                title={`Saldo: ${isOpportunity ? '+' : ''}${fmtNum(b.gap)}`}
              >
                {b.label}
              </div>

              {/* Lado Oferta (cresce à direita) */}
              <div className="flex-1 flex items-center gap-1">
                <div className="relative h-5 flex-1 flex justify-start">
                  <div
                    className="h-full rounded-r-sm"
                    style={{
                      width: `${supplyPct}%`,
                      backgroundColor: '#EA580C',
                      opacity: b.supply > 0 ? 0.85 : 0,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                  {b.supply > 0 ? fmtNum(b.supply) : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#059669' }} />
          Demanda (domicílios / 4)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#EA580C' }} />
          Oferta (anúncios VivaReal)
        </span>
      </div>
    </div>
  )
}
