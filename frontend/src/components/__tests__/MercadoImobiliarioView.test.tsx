import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MercadoImobiliarioView } from '../categories/MercadoImobiliarioView'
import type { MercadoImobiliarioData } from '../../types'

const mockBrackets = [
  { label: 'Econômico',  min: 0,       max: 150_000, max_label: 'R$ 150.000', demand: 3000, supply: 100, gap: 2900 },
  { label: 'Standard',   min: 150_000, max: 250_000, max_label: 'R$ 250.000', demand: 5000, supply: 800, gap: 4200 },
  { label: 'Médio',      min: 350_000, max: 500_000, max_label: 'R$ 500.000', demand: 1000, supply: 3000, gap: -2000 },
]

const mockSummary = {
  total_sale: 15_000, median_sale_price: 500_000,
  total_demand: 9000, total_supply: 15_000,
  total_rental: 2000, median_rental_price: 3000,
  median_rental_pm2: 35, median_sale_pm2: 6000,
}

function makeData(overrides: Partial<MercadoImobiliarioData> = {}): MercadoImobiliarioData {
  return {
    countSale: 100,
    countRental: 20,
    medianSalePrice: 500_000,
    medianRentalPrice: 3_000,
    medianPriceM2Sale: 6_000,
    medianPriceM2Rental: 35,
    brackets: mockBrackets,
    summary: mockSummary,
    ...overrides,
  }
}

describe('MercadoImobiliarioView', () => {
  it('renderiza sem crash com dados completos', () => {
    render(<MercadoImobiliarioView data={makeData()} />)
    expect(screen.getByText(/Mercado Imobiliário/i)).toBeInTheDocument()
  })

  it('exibe mensagem quando sem dados', () => {
    render(<MercadoImobiliarioView data={makeData({
      countSale: 0, countRental: 0, brackets: [], summary: null
    })} />)
    expect(screen.getByText(/não disponíveis/i)).toBeInTheDocument()
  })

  it('mostra seções de venda e aluguel', () => {
    render(<MercadoImobiliarioView data={makeData()} />)
    expect(screen.getByText('Venda')).toBeInTheDocument()
    expect(screen.getByText('Aluguel')).toBeInTheDocument()
  })

  it('mostra labels das faixas na pirâmide', () => {
    render(<MercadoImobiliarioView data={makeData()} />)
    expect(screen.getAllByText('Econômico').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Standard').length).toBeGreaterThan(0)
  })

  it('mostra tabela de oportunidades', () => {
    render(<MercadoImobiliarioView data={makeData()} />)
    expect(screen.getByText('Tabela de Oportunidades')).toBeInTheDocument()
  })

  it('distingue faixas com saldo positivo (oportunidade) e negativo (saturado)', () => {
    render(<MercadoImobiliarioView data={makeData()} />)
    // gap positivo → valor com +
    expect(screen.getAllByText(/^\+/).length).toBeGreaterThan(0)
    // gap negativo → valor sem +
    expect(screen.getAllByText(/-2\.000|-2000|2\.000/).length).toBeGreaterThan(0)
  })

  it('exibe nota metodológica com fonte dos dados', () => {
    const { container } = render(<MercadoImobiliarioView data={makeData()} />)
    expect(container.textContent).toContain('VivaReal')
    expect(container.textContent).toContain('IBGE 2022')
  })
})
