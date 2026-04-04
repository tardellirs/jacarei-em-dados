import type { CorRacaData } from '../../types'
import { PieChart } from '../charts'

interface CorRacaViewProps {
  data: CorRacaData
}

const COR_RACA_COLORS = ['#3B82F6', '#1D4ED8', '#F59E0B', '#6B7280', '#10B981']

export function CorRacaView({ data }: CorRacaViewProps) {
  const slices = [
    { name: 'Branca', value: data.branca, color: COR_RACA_COLORS[0] },
    { name: 'Preta', value: data.preta, color: COR_RACA_COLORS[1] },
    { name: 'Amarela', value: data.amarela, color: COR_RACA_COLORS[2] },
    { name: 'Parda', value: data.parda, color: COR_RACA_COLORS[3] },
    { name: 'Indígena', value: data.indigena, color: COR_RACA_COLORS[4] },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Cor ou Raça</h3>
      <PieChart data={slices} height={320} />
    </div>
  )
}
