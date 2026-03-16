import type { FilterState, FilterOptions } from '../types'

interface FilterBarProps {
  filters: FilterState
  options: FilterOptions
  onFilterChange: (key: keyof FilterState, value: string) => void
  onClear: () => void
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer min-w-[160px]"
      >
        <option value="">Selecione {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterBar({ filters, options, onFilterChange, onClear }: FilterBarProps) {
  const hasFilters = !!(filters.distrito || filters.situacao || filters.favela)

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtros</span>
      <div className="w-px h-4 bg-slate-300" />

      <Select
        label="Distrito"
        value={filters.distrito}
        options={options.distritos}
        onChange={(v) => onFilterChange('distrito', v)}
      />

      <Select
        label="Urbana/Rural"
        value={filters.situacao}
        options={options.situacoes}
        onChange={(v) => onFilterChange('situacao', v)}
      />

      <Select
        label="Favelas e Comunidades"
        value={filters.favela}
        options={options.favelas}
        onChange={(v) => onFilterChange('favela', v)}
      />

      <button
        onClick={onClear}
        className={`text-xs rounded px-3 py-1 transition-colors cursor-pointer ${
          hasFilters
            ? 'bg-slate-600 text-white hover:bg-slate-700'
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
        }`}
      >
        Limpar seleções
      </button>
    </div>
  )
}
