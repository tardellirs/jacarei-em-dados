interface StatCardProps {
  label: string
  value: number | string
  color?: string
}

export function StatCard({ label, value, color = '#1a3a5c' }: StatCardProps) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-white text-center"
      style={{ backgroundColor: color }}
    >
      <p className="text-xs opacity-80 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
    </div>
  )
}
