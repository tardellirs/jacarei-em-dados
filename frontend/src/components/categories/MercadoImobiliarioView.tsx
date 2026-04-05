import type { MercadoImobiliarioData } from '../../types'
import { MarketPyramid } from '../charts/MarketPyramid'

interface Props {
  data: MercadoImobiliarioData
}

function fmtCurrency(n: number | null): string {
  if (n == null) return '–'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000)     return `R$ ${Math.round(n / 1_000).toLocaleString('pt-BR')}k`
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtNum(n: number): string {
  return n.toLocaleString('pt-BR')
}

function OpportunityBadge({ gap }: { gap: number }) {
  const positive = gap > 0
  return (
    <span
      className={[
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
        positive
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      ].join(' ')}
    >
      {positive ? `+${Math.round(gap).toLocaleString('pt-BR')}` : Math.round(gap).toLocaleString('pt-BR')}
    </span>
  )
}

function SummaryCard({
  label, value, sub, highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={[
      'flex flex-col p-3 rounded-lg border',
      highlight
        ? 'bg-[#1a3a5c]/5 dark:bg-blue-900/20 border-[#1a3a5c]/20 dark:border-blue-700/40'
        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700',
    ].join(' ')}>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={[
        'text-lg font-bold leading-tight',
        highlight ? 'text-[#1a3a5c] dark:text-blue-300' : 'text-slate-800 dark:text-slate-100',
      ].join(' ')}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function MercadoImobiliarioView({ data }: Props) {
  const {
    countSale, countRental,
    medianSalePrice, medianRentalPrice,
    medianPriceM2Sale, medianPriceM2Rental,
    brackets, summary,
  } = data

  const hasData = countSale > 0 || countRental > 0 || brackets.length > 0

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-6">
          Dados de mercado imobiliário não disponíveis para este setor.
        </p>
      </div>
    )
  }

  const totalDemand = summary?.total_demand ?? brackets.reduce((s, b) => s + b.demand, 0)
  const totalSupply = summary?.total_supply ?? brackets.reduce((s, b) => s + b.supply, 0)
  const balance = totalDemand - totalSupply

  return (
    <div className="flex flex-col gap-4">
      {/* ── Cards Resumo ── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Mercado Imobiliário · Jacareí
        </h3>

        {/* Cards de venda */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Venda</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <SummaryCard
            label="Anúncios"
            value={fmtNum(countSale)}
            sub="imóveis residenciais"
          />
          <SummaryCard
            label="Preço mediano"
            value={fmtCurrency(medianSalePrice)}
            sub="valor de venda"
            highlight
          />
          <SummaryCard
            label="Preço / m²"
            value={fmtCurrency(medianPriceM2Sale)}
            sub="mediano"
          />
        </div>

        {/* Cards de aluguel */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Aluguel</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <SummaryCard
            label="Anúncios"
            value={fmtNum(countRental)}
            sub="imóveis residenciais"
          />
          <SummaryCard
            label="Aluguel mediano"
            value={fmtCurrency(medianRentalPrice)}
            sub="por mês"
            highlight
          />
          <SummaryCard
            label="Aluguel / m²"
            value={fmtCurrency(medianPriceM2Rental)}
            sub="por mês"
          />
        </div>

        {/* Saldo geral */}
        {brackets.length > 0 && (
          <div className={[
            'flex items-center justify-between px-3 py-2.5 rounded-lg border',
            balance > 0
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
          ].join(' ')}>
            <div>
              <p className={[
                'text-xs font-semibold uppercase tracking-wide',
                balance > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
              ].join(' ')}>
                {balance > 0 ? 'Demanda > Oferta — oportunidade de mercado' : 'Oferta > Demanda — mercado saturado'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Demanda estimada: {fmtNum(Math.round(totalDemand))} domicílios ·
                Oferta: {fmtNum(totalSupply)} anúncios
              </p>
            </div>
            <span className={[
              'text-2xl font-bold',
              balance > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
            ].join(' ')}>
              {balance > 0 ? '+' : ''}{fmtNum(Math.round(balance))}
            </span>
          </div>
        )}
      </div>

      {/* ── Pirâmide Demanda × Oferta ── */}
      {brackets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Potencial por Padrão{' '}
            <span className="font-normal text-slate-400 dark:text-slate-500">| Demanda × Oferta</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
            Demanda = domicílios com renda domiciliar compatível / 4 · Oferta = anúncios VivaReal (mar/2026)
          </p>
          <MarketPyramid brackets={brackets} />
        </div>
      )}

      {/* ── Tabela de Oportunidades ── */}
      {brackets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Tabela de Oportunidades</h3>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">Padrão</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">Valor máx.</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">Demanda</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">Oferta</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b) => (
                  <tr key={b.label} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-1.5 px-2 font-medium text-slate-700 dark:text-slate-200">{b.label}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500 dark:text-slate-400">
                      {b.max != null
                        ? `R$ ${b.max.toLocaleString('pt-BR')}`
                        : 'Acima'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-emerald-700 dark:text-emerald-400 font-semibold">
                      {fmtNum(Math.round(b.demand))}
                    </td>
                    <td className="py-1.5 px-2 text-right text-orange-700 dark:text-orange-400 font-semibold">
                      {fmtNum(b.supply)}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <OpportunityBadge gap={b.gap} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota metodológica */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic px-1">
        Fonte: VivaReal (março 2026) · Censo Demográfico IBGE 2022. Demanda estimada: responsáveis
        com renda domiciliar compatível / 4 (fator de absorção). Renda domiciliar = renda do responsável × 1,5.
        Valor máximo do imóvel = renda domiciliar × 42 (taxa ~10% a.a., 360 meses, 30% entrada).
        Renda corrigida pelo IPCA ago/2022→fev/2026 (+16,65%). Apenas imóveis residenciais.
      </p>
    </div>
  )
}
