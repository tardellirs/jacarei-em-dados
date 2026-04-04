import type { IndigenasQuilombolasData, PopulacaoEspecialData } from '../../types'
import { PieChart } from '../charts/PieChart'
import { StackedBar } from '../charts/StackedBar'
import { COLOR_MALE, COLOR_FEMALE, INDIGENAS_FAIXA_LABELS } from '../../utils/constants'

interface PanelProps {
  title: string
  data: PopulacaoEspecialData
  faixaLabels: string[]
}

const FAIXA_COLORS = ['#3B82F6', '#10B981', '#F97316', '#F43F5E']

function PopPanel({ title, data, faixaLabels }: PanelProps) {
  const sexoSlices = [
    { name: 'Masculino', value: data.masculino, color: COLOR_MALE },
    { name: 'Feminino', value: data.feminino, color: COLOR_FEMALE },
  ]

  const faixaData = faixaLabels.map((label, i) => ({
    label,
    value: data.porFaixaEtaria[i] ?? 0,
    color: FAIXA_COLORS[i],
  }))

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex flex-col gap-3">
      {/* Card de total */}
      <div className="rounded-lg px-4 py-3 text-white text-center bg-[#4B5563]">
        <p className="text-xs opacity-80 font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold">{data.total.toLocaleString('pt-BR')}</p>
      </div>

      {data.total === 0 ? (
        <p className="text-xs text-slate-400 text-center italic py-2">
          Nenhuma pessoa nesta seleção
        </p>
      ) : (
        <>
          {/* Distribuição por sexo */}
          <div>
            <p className="text-xs font-semibold text-slate-600 text-center mb-1">
              {title} por sexo
            </p>
            <PieChart data={sexoSlices} height={160} innerRadius={40} />
          </div>

          {/* Distribuição por grupo etário */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {title} por grupo etário
            </p>
            <StackedBar data={faixaData} />
          </div>
        </>
      )}
    </div>
  )
}

interface IndigenasQuilombolasViewProps {
  data: IndigenasQuilombolasData
}

export function IndigenasQuilombolasView({ data }: IndigenasQuilombolasViewProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Populações Indígenas e Quilombolas
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PopPanel
          title="População indígena"
          data={data.indigenas}
          faixaLabels={INDIGENAS_FAIXA_LABELS}
        />
        <PopPanel
          title="População quilombola"
          data={data.quilombolas}
          faixaLabels={INDIGENAS_FAIXA_LABELS}
        />
      </div>
    </div>
  )
}
