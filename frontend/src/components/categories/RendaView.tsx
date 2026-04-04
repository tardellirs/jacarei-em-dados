import type { RendaData } from '../../types'

// Salário mínimo em vigor durante o Censo 2022 (referência agosto/2022)
const SALARIO_MINIMO_2022 = 1212

interface RendaViewProps {
  data: RendaData
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function RendaView({ data }: RendaViewProps) {
  const { rendaMedia, totalResponsaveis } = data
  const temDados = rendaMedia > 0 && totalResponsaveis > 0
  const salarios = temDados ? (rendaMedia / SALARIO_MINIMO_2022).toFixed(1) : null

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
              {formatCurrency(rendaMedia)}
            </p>
            {salarios && (
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold text-slate-700">{salarios}×</span> o salário mínimo de 2022
                <span className="text-slate-400"> (R$ {SALARIO_MINIMO_2022.toLocaleString('pt-BR')})</span>
              </p>
            )}
          </div>

          {/* Responsáveis com renda declarada */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-600">Responsáveis com renda declarada</p>
            <p className="text-sm font-bold text-slate-800">{formatNumber(totalResponsaveis)}</p>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Fonte: Censo Demográfico IBGE 2022 · V06004 – Rendimento nominal médio mensal do responsável pelo domicílio.
            Quando múltiplos setores estão selecionados, a média é ponderada pelo número de responsáveis.
            Valores "X" (sigilo estatístico) são descartados do cálculo.
          </p>
        </div>
      )}
    </div>
  )
}
