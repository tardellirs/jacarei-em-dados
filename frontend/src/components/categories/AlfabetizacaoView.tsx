import type { AlfabetizacaoData } from '../../types'
import { PieChart } from '../charts'

interface AlfabetizacaoViewProps {
  data: AlfabetizacaoData
}

export function AlfabetizacaoView({ data }: AlfabetizacaoViewProps) {
  const total = data.alfabetizadas + data.naoAlfabetizadas
  const taxa = total > 0 ? ((data.alfabetizadas / total) * 100).toFixed(1) : null

  const slices = [
    { name: 'Alfabetizadas', value: data.alfabetizadas, color: '#3B82F6' },
    { name: 'Não Alfabetizadas', value: data.naoAlfabetizadas, color: '#F87171' },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Alfabetização (15+ anos)</h3>
      {taxa && (
        <p className="text-xs text-slate-500 mb-3">
          Taxa de alfabetização: <span className="font-bold text-[#1D4ED8]">{taxa}%</span>
        </p>
      )}
      <PieChart data={slices} height={200} />
    </div>
  )
}
