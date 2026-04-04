import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PieChart } from '../charts/PieChart'

const slices = [
  { name: 'Branca', value: 300, color: '#3B82F6' },
  { name: 'Parda', value: 200, color: '#6B7280' },
]

describe('PieChart', () => {
  it('usa w-full no wrapper (evita colapso de largura no ResponsiveContainer)', () => {
    const { container } = render(<PieChart data={slices} height={300} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('w-full')
    expect(wrapper.className).not.toContain('items-center')
  })

  it('exibe o título quando fornecido', () => {
    render(<PieChart data={slices} title="Cor ou Raça" height={300} />)
    expect(screen.getByText('Cor ou Raça')).toBeInTheDocument()
  })

  it('exibe mensagem quando todos os valores são zero', () => {
    const emptySlices = slices.map(s => ({ ...s, value: 0 }))
    render(<PieChart data={emptySlices} height={300} />)
    expect(screen.getByText('Sem dados disponíveis')).toBeInTheDocument()
  })

  it('não exibe mensagem de sem dados quando há valores', () => {
    render(<PieChart data={slices} height={300} />)
    expect(screen.queryByText('Sem dados disponíveis')).not.toBeInTheDocument()
  })
})
