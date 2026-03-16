import type { DashboardData, SectorFeature } from '../types'
import { SummaryCards } from './SummaryCards'
import { SexDistribution } from './SexDistribution'
import { AgePyramid } from './AgePyramid'
import { NoDataMessage } from './NoDataMessage'

interface DashboardProps {
  data: DashboardData
  selectedSector: SectorFeature | null
  visibleCount: number
  totalCount: number
}

export function Dashboard({ data, selectedSector, visibleCount, totalCount }: DashboardProps) {
  const title = selectedSector
    ? `Setor ${selectedSector.properties.CD_SETOR}`
    : 'Município de Jacareí – SP'

  const subtitle = selectedSector
    ? selectedSector.properties.NM_DIST ?? ''
    : visibleCount < totalCount
    ? `${visibleCount.toLocaleString('pt-BR')} setor(es) filtrado(s) de ${totalCount.toLocaleString('pt-BR')}`
    : `${totalCount.toLocaleString('pt-BR')} setores censitários`

  return (
    <div className="flex flex-col h-full bg-slate-50 dashboard-scroll overflow-y-auto">
      {/* Título da seleção */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-sm font-bold text-slate-800 truncate">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Cards de resumo sempre visíveis */}
        <SummaryCards data={data} />

        {/* Conteúdo condicional */}
        {selectedSector && !data.hasData ? (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <NoDataMessage cdSetor={selectedSector.properties.CD_SETOR} />
          </div>
        ) : (
          <>
            <SexDistribution data={data} />
            <AgePyramid data={data} />
          </>
        )}
      </div>
    </div>
  )
}
