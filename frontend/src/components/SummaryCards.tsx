import type { DashboardData } from '../types'
import { fmtInt, fmtDecimal2, fmtDecimal1 } from '../utils/formatting'

interface CardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function Card({ icon, label, value, color }: CardProps) {
  return (
    <div className={`flex-1 min-w-0 rounded-lg p-3 text-white ${color}`}>
      <div className="flex items-start justify-between">
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-1 text-xl font-bold leading-tight truncate">{value}</div>
      <div className="text-xs opacity-80 mt-0.5 leading-tight">{label}</div>
    </div>
  )
}

interface SummaryCardsProps {
  data: DashboardData
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const show = (v: string) => (data.hasData ? v : '--')

  return (
    <div className="flex gap-2 flex-wrap">
      <Card
        color="bg-[#1a3a5c]"
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        }
        label="População"
        value={show(fmtInt(data.populacao))}
      />
      <Card
        color="bg-[#1e5c8a]"
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        }
        label="Domicílios"
        value={show(fmtInt(data.domicilios))}
      />
      <Card
        color="bg-[#1a5c4a]"
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
          </svg>
        }
        label="Área (km²)"
        value={fmtDecimal2(data.area)}
      />
      <Card
        color="bg-[#5c3a1a]"
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        }
        label="Densidade (hab/km²)"
        value={show(fmtDecimal1(data.densidade))}
      />
    </div>
  )
}
