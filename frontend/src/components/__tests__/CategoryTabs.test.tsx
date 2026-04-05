import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryTabs } from '../CategoryTabs'
import type { DashboardCategory } from '../../types'

describe('CategoryTabs', () => {
  const categories: DashboardCategory[] = [
    'demografia', 'cor_ou_raca', 'alfabetizacao', 'domicilio',
    'parentesco', 'indigenas_quilombolas', 'renda', 'mercado_imobiliario',
  ]

  it('renders all 8 tab labels', () => {
    render(<CategoryTabs active="demografia" onChange={() => {}} />)
    expect(screen.getByText('Demografia')).toBeInTheDocument()
    expect(screen.getByText('Cor ou Raça')).toBeInTheDocument()
    expect(screen.getByText('Alfabetização')).toBeInTheDocument()
    expect(screen.getByText('Domicílio')).toBeInTheDocument()
    expect(screen.getByText('Parentesco')).toBeInTheDocument()
    expect(screen.getByText('Indígenas/Quilombolas')).toBeInTheDocument()
    expect(screen.getByText('Renda')).toBeInTheDocument()
    expect(screen.getByText('Imobiliário')).toBeInTheDocument()
  })

  it('marks the active tab with aria-selected=true', () => {
    render(<CategoryTabs active="cor_ou_raca" onChange={() => {}} />)
    const activeTab = screen.getByRole('tab', { name: /Cor ou Raça/ })
    expect(activeTab).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onChange with the correct category when a tab is clicked', () => {
    const onChange = vi.fn()
    render(<CategoryTabs active="demografia" onChange={onChange} />)
    fireEvent.click(screen.getByText('Alfabetização'))
    expect(onChange).toHaveBeenCalledWith('alfabetizacao')
  })

  it('all tabs have role="tab"', () => {
    render(<CategoryTabs active="demografia" onChange={() => {}} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(8)
  })

  it('inactive tabs have aria-selected=false', () => {
    render(<CategoryTabs active="demografia" onChange={() => {}} />)
    const inactiveTabs = screen.getAllByRole('tab').filter(
      t => t.getAttribute('aria-selected') === 'false'
    )
    expect(inactiveTabs).toHaveLength(7)
  })
})
