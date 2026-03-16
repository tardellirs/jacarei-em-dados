import { useMemo } from 'react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { MapView } from './components/Map'
import { Dashboard } from './components/Dashboard'
import { useGeoData } from './hooks/useGeoData'
import { useFilters } from './hooks/useFilters'
import { useDashboard } from './hooks/useDashboard'

export function App() {
  const { features, filterOptions, loading, error } = useGeoData()
  const { filters, selectedSector, setFilter, setSelectedSector, clearAll, applyFilters } =
    useFilters()

  const visibleFeatures = useMemo(
    () => applyFilters(features),
    [applyFilters, features]
  )

  const dashboardData = useDashboard(visibleFeatures, selectedSector)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Carregando dados do Censo 2022…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg border border-red-200 shadow">
          <p className="text-red-600 font-medium">Erro ao carregar dados</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      <Header />
      <FilterBar
        filters={filters}
        options={filterOptions}
        onFilterChange={setFilter}
        onClear={clearAll}
      />

      {/* Layout principal: mapa (esq) + dashboard (dir) */}
      <div className="flex flex-1 min-h-0 lg:flex-row flex-col">
        {/* Mapa */}
        <div className="flex-[55] min-h-0 lg:h-full h-[50vh]">
          <MapView
            features={visibleFeatures}
            selectedSector={selectedSector}
            onSectorClick={setSelectedSector}
          />
        </div>

        {/* Dashboard */}
        <div className="flex-[45] min-h-0 lg:h-full h-[50vh] border-l border-slate-200">
          <Dashboard
            data={dashboardData}
            selectedSector={selectedSector}
            visibleCount={visibleFeatures.length}
            totalCount={features.length}
          />
        </div>
      </div>
    </div>
  )
}
