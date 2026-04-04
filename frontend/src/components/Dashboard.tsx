import { useState } from 'react'
import type { DashboardData, SectorFeature, DashboardCategory } from '../types'
import { SummaryCards } from './SummaryCards'
import { NoDataMessage } from './NoDataMessage'
import { CategoryTabs } from './CategoryTabs'
import {
  DemografiaView,
  CorRacaView,
  AlfabetizacaoView,
  DomicilioView,
  ParentescoView,
  IndigenasQuilombolasView,
} from './categories'
import { ibgeSectorPdfUrl, hasSectorPdf } from '../utils/constants'

interface DashboardProps {
  data: DashboardData
  selectedSector: SectorFeature | null   // seleção por clique simples
  selectedFeatures: SectorFeature[]      // seleção por polígono (multi)
  visibleCount: number
  totalCount: number
}

function renderCategory(category: DashboardCategory, data: DashboardData) {
  switch (category) {
    case 'demografia':
      return <DemografiaView data={data} />
    case 'cor_ou_raca':
      return <CorRacaView data={data.corRaca} />
    case 'alfabetizacao':
      return <AlfabetizacaoView data={data.alfabetizacao} />
    case 'domicilio':
      return <DomicilioView data={data.domicilio} />
    case 'parentesco':
      return <ParentescoView data={data.parentesco} />
    case 'indigenas_quilombolas':
      return <IndigenasQuilombolasView data={data.indigenasQuilombolas} />
  }
}

export function Dashboard({ data, selectedSector, selectedFeatures, visibleCount, totalCount }: DashboardProps) {
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>('demografia')

  const polyCount = selectedFeatures.length

  // Determina o setor a exibir no título/PDF:
  // clique simples usa selectedSector; polígono com 1 setor também mostra o setor
  const displaySector = polyCount === 0 ? selectedSector : polyCount === 1 ? selectedFeatures[0] : null

  const title =
    polyCount > 1
      ? `${polyCount} setores selecionados`
      : displaySector
      ? `Setor ${displaySector.properties.CD_SETOR}`
      : 'Município de Jacareí – SP'

  const subtitle =
    polyCount > 1
      ? `${polyCount.toLocaleString('pt-BR')} setores · clique para adicionar ou remover`
      : displaySector
      ? displaySector.properties.NM_DIST ?? ''
      : visibleCount < totalCount
      ? `${visibleCount.toLocaleString('pt-BR')} setor(es) filtrado(s) de ${totalCount.toLocaleString('pt-BR')}`
      : `${totalCount.toLocaleString('pt-BR')} setores censitários`

  const situacao = displaySector?.properties.SITUACAO ?? null
  const pdfAvailable = displaySector ? hasSectorPdf(situacao) : false
  const pdfUrl = pdfAvailable
    ? ibgeSectorPdfUrl(displaySector!.properties.CD_SETOR, situacao)
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
          {displaySector && (
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
        {displaySector && !data.hasData ? (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <NoDataMessage cdSetor={displaySector.properties.CD_SETOR} />
          </div>
        ) : (
          <>
            <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
            {renderCategory(activeCategory, data)}
          </>
        )}
      </div>
    </div>
  )
}
