const ptBR = new Intl.NumberFormat('pt-BR')
const ptBRDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const ptBRDecimal2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function fmtInt(n: number): string {
  return ptBR.format(Math.round(n))
}

export function fmtDecimal1(n: number): string {
  return ptBRDecimal.format(n)
}

export function fmtDecimal2(n: number): string {
  return ptBRDecimal2.format(n)
}

export function fmtPercent(n: number): string {
  return ptBRDecimal.format(n) + '%'
}
