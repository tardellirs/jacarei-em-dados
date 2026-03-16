import type { DashboardData, SectorFeature } from '../types'
import { SummaryCards } from './SummaryCards'
import { SexDistribution } from './SexDistribution'
import { AgePyramid } from './AgePyramid'
import { NoDataMessage } from './NoDataMessage'
import { ibgeSectorPdfUrl } from '../utils/constants'

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

  const pdfUrl = selectedSector
    ? ibgeSectorPdfUrl(selectedSector.properties.CD_SETOR)
    : null

  return (
    <div className="flex flex-col h-full bg-slate-50 dashboard-scroll overflow-y-auto">
      {/* Título da seleção */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 truncate">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Baixar mapa do setor (IBGE)"
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-white bg-[#1a3a5c] hover:bg-[#1e5c8a] transition-colors rounded px-2.5 py-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
              </svg>
              Mapa PDF
            </a>
          )}
        </div>
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
