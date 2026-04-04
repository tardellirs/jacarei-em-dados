import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { RendaData } from '../../types'
import { SALARIO_MINIMO_2026 } from '../../utils/constants'

interface RendaViewProps {
  data: RendaData
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

const BAR_COLORS = ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1a3a5c']

export function RendaView({ data }: RendaViewProps) {
  const { rendaMediaCorrigida, totalResponsaveis, sectorCount, distribuicaoSetores } = data
  const temDados = rendaMediaCorrigida > 0 && totalResponsaveis > 0
  const salarios = temDados ? (rendaMediaCorrigida / SALARIO_MINIMO_2026).toFixed(1) : null
  const mostrarDistribuicao = sectorCount > 1

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-700 mb-4">Renda do Responsável</h3>

      {!temDados ? (
        <p className="text-sm text-slate-400 italic text-center py-6">Sem dados disponíveis</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Renda média destaque */}
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-100 py-6 px-4 gap-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Rendimento médio mensal
            </p>
            <p className="text-4xl font-bold text-[#1a3a5c] leading-tight">
              {formatCurrency(rendaMediaCorrigida)}
            </p>
            {salarios && (
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">{salarios}×</span> o salário mínimo de 2026
                <span className="text-slate-400"> (R$ {SALARIO_MINIMO_2026.toLocaleString('pt-BR')})</span>
              </p>
            )}
          </div>

          {/* Distribuição dos setores por faixa de renda */}
          {mostrarDistribuicao && (
            <div>
              <p className="text-sm font-semibold text-slate-700 text-center mb-3">
                Distribuição de domicílios por faixa de renda
              </p>
              <div className="w-full">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={distribuicaoSetores}
                    margin={{ top: 18, right: 16, left: 0, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value) + ` domicílio${value !== 1 ? 's' : ''}`,
                        'Total',
                      ]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Bar dataKey="domicilios" radius={[4, 4, 0, 0]} animationDuration={400}>
                      {distribuicaoSetores.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                      <LabelList
                        dataKey="domicilios"
                        position="top"
                        style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        formatter={(v: number) => (v > 0 ? v.toLocaleString('pt-BR') : '')}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Faixas em múltiplos do salário mínimo 2026 (R$ {SALARIO_MINIMO_2026.toLocaleString('pt-BR')})
              </p>
            </div>
          )}

          {/* Responsáveis com renda declarada */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-600">Responsáveis com renda declarada</p>
            <p className="text-sm font-bold text-slate-800">{formatNumber(totalResponsaveis)}</p>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Fonte: Censo Demográfico IBGE 2022 · V06004 – Rendimento nominal médio mensal do responsável.
            Valores corrigidos pelo IPCA acumulado de agosto/2022 a fevereiro/2026 (+16,65%).
            Seleção múltipla: média ponderada pelo número de responsáveis.
            Valores "X" (sigilo estatístico) descartados do cálculo.
          </p>
        </div>
      )}
    </div>
  )
}
