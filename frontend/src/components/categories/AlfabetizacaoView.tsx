import type { AlfabetizacaoData } from '../../types'
import { PieChart } from '../charts'

interface AlfabetizacaoViewProps {
  data: AlfabetizacaoData
}

export function AlfabetizacaoView({ data }: AlfabetizacaoViewProps) {
  const total15 = data.alfabetizadas + data.naoAlfabetizadas
  const taxa15 = total15 > 0 ? ((data.alfabetizadas / total15) * 100).toFixed(1) : null

  const total60 = data.alfabetizadas60plus + data.naoAlfabetizadas60plus
  const taxa60 = total60 > 0 ? ((data.alfabetizadas60plus / total60) * 100).toFixed(1) : null

  const slices15 = [
    { name: 'Alfabetizadas', value: data.alfabetizadas, color: '#3B82F6' },
    { name: 'Não Alfabetizadas', value: data.naoAlfabetizadas, color: '#F87171' },
  ]

  const slices60 = [
    { name: 'Alfabetizadas', value: data.alfabetizadas60plus, color: '#3B82F6' },
    { name: 'Não Alfabetizadas', value: data.naoAlfabetizadas60plus, color: '#F87171' },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Alfabetização</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 15+ anos */}
        <div>
          <p className="text-xs font-semibold text-slate-600 text-center mb-1">15 anos ou mais</p>
          {taxa15 && (
            <p className="text-xs text-slate-500 text-center mb-2">
              Taxa: <span className="font-bold text-[#1D4ED8]">{taxa15}%</span>
            </p>
          )}
          <PieChart data={slices15} height={300} />
        </div>

        {/* 60+ anos */}
        <div>
          <p className="text-xs font-semibold text-slate-600 text-center mb-1">60 anos ou mais</p>
          {taxa60 && (
            <p className="text-xs text-slate-500 text-center mb-2">
              Taxa: <span className="font-bold text-[#1D4ED8]">{taxa60}%</span>
            </p>
          )}
          <PieChart data={slices60} height={300} />
        </div>
      </div>
    </div>
  )
}
