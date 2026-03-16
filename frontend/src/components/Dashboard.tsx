import type { DashboardData, SectorFeature } from '../types'
import { SummaryCards } from './SummaryCards'
import { SexDistribution } from './SexDistribution'
import { AgePyramid } from './AgePyramid'
import { NoDataMessage } from './NoDataMessage'
import { ibgeSectorPdfUrl, hasSectorPdf } from '../utils/constants'

interface DashboardProps {
  data: DashboardData
  selectedFeatures: SectorFeature[]
  visibleCount: number
  totalCount: number
}

export function Dashboard({ data, selectedFeatures, visibleCount, totalCount }: DashboardProps) {
  const count = selectedFeatures.length
  const singleSector = count === 1 ? selectedFeatures[0] : null

  const title =
    count === 1
      ? `Setor ${singleSector!.properties.CD_SETOR}`
      : count > 1
      ? `${count} setores selecionados`
      : 'Município de Jacareí – SP'

  const subtitle =
    count === 1
      ? singleSector!.properties.NM_DIST ?? ''
      : count > 1
      ? `${count.toLocaleString('pt-BR')} setores · clique para adicionar ou remover`
      : visibleCount < totalCount
      ? `${visibleCount.toLocaleString('pt-BR')} setor(es) filtrado(s) de ${totalCount.toLocaleString('pt-BR')}`
      : `${totalCount.toLocaleString('pt-BR')} setores censitários`

  const situacao = singleSector?.properties.SITUACAO ?? null
  const pdfAvailable = singleSector ? hasSectorPdf(situacao) : false
  const pdfUrl = pdfAvailable
    ? ibgeSectorPdfUrl(singleSector!.properties.CD_SETOR, situacao)
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
          {singleSector && (
            pdfUrl ? (
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
            ) : (
              <span className="shrink-0 text-[11px] text-slate-400 italic">
                Sem mapa disponível no IBGE
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Cards de resumo sempre visíveis */}
        <SummaryCards data={data} />

        {/* Conteúdo condicional */}
        {singleSector && !data.hasData ? (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <NoDataMessage cdSetor={singleSector.properties.CD_SETOR} />
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
