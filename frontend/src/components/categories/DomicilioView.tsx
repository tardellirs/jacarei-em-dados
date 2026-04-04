import type { DomicilioData } from '../../types'
import { PieChart } from '../charts'
import { DOMICILIO_MORADORES_LABELS } from '../../utils/constants'

interface DomicilioViewProps {
  data: DomicilioData
}

const MORADORES_COLORS = [
  '#3B82F6', '#1D4ED8', '#6366F1', '#8B5CF6', '#A78BFA',
  '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#10B981',
]

const TIPO_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#F43F5E']

export function DomicilioView({ data }: DomicilioViewProps) {
  const moradoresSlices = data.porMoradores.map((value, i) => ({
    name: `${DOMICILIO_MORADORES_LABELS[i]} morador${i === 0 ? '' : 'es'}`,
    value,
    color: MORADORES_COLORS[i],
  }))

  const tipoSlices = data.porTipo.map((d, i) => ({
    name: d.label,
    value: d.value,
    color: TIPO_COLORS[i],
  }))

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Domicílios</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PieChart data={moradoresSlices} title="Por quantidade de moradores" height={300} />
        <PieChart data={tipoSlices} title="Por tipo de domicílio" height={300} />
      </div>
    </div>
  )
}
