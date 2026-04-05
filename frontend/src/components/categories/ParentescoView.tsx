import type { ParentescoData } from '../../types'
import { PieChart } from '../charts'
import { COLOR_MALE, COLOR_FEMALE } from '../../utils/constants'

interface ParentescoViewProps {
  data: ParentescoData
}

const IDADE_COLORS = ['#F59E0B', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899']

export function ParentescoView({ data }: ParentescoViewProps) {
  const sexoSlices = [
    { name: 'Masculino', value: data.porSexo.masculino, color: COLOR_MALE },
    { name: 'Feminino', value: data.porSexo.feminino, color: COLOR_FEMALE },
  ]

  const idadeSlices = data.porFaixaEtaria.map((d, i) => ({
    name: d.label,
    value: d.value,
    color: IDADE_COLORS[i],
  }))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Responsável pelo Domicílio
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PieChart data={sexoSlices} title="Por sexo" height={360} />
        <PieChart data={idadeSlices} title="Por faixa etária" height={360} />
      </div>
    </div>
  )
}
