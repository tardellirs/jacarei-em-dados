import { useMemo, useState, useCallback } from 'react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { MapView } from './components/Map'
import { Dashboard } from './components/Dashboard'
import { useGeoData } from './hooks/useGeoData'
import { useFilters } from './hooks/useFilters'
import { useDashboard } from './hooks/useDashboard'
import { useSelection } from './hooks/useSelection'
import { findSectorsInPolygon } from './utils/polygonSelection'

export function App() {
  const { features, filterOptions, initialBounds, loading, error } = useGeoData()
  const { filters, selectedSector, setFilter, setSelectedSector, clearAll, applyFilters } = useFilters()
  const [resetZoomSignal, setResetZoomSignal] = useState(0)
  const [showIncomeOverlay, setShowIncomeOverlay] = useState(false)
  const toggleIncomeOverlay = useCallback(() => setShowIncomeOverlay((v) => !v), [])

  const visibleFeatures = useMemo(
    () => applyFilters(features),
    [applyFilters, features]
  )

  const {
    mode,
    selectedCds,
    selectedFeatures,
    startDrawing,
    completePolygon,
    toggleSector,
    clearSelection,
  } = useSelection(visibleFeatures)

  const handleClear = useCallback(() => {
    clearAll()        // limpa filtros + selectedSector
    clearSelection()  // limpa seleção por polígono
    setResetZoomSignal((s) => s + 1)
  }, [clearAll, clearSelection])

  const handlePolygonComplete = useCallback(
    (coords: [number, number][]) => {
      const cds = findSectorsInPolygon(coords, visibleFeatures)
      completePolygon(cds)
    },
    [visibleFeatures, completePolygon]
  )

  const handleSectorClick = useCallback(
    (f: import('./types').SectorFeature) => {
      if (mode === 'selected') {
        // Modo polígono: toggle do setor na seleção múltipla
        toggleSector(f.properties.CD_SETOR)
      } else {
        // Modo normal: seleciona apenas esse setor (substitui o anterior)
        setSelectedSector(f)
      }
    },
    [mode, toggleSector, setSelectedSector]
  )

  // Ao iniciar desenho, limpa a seleção simples
  const handleStartDrawing = useCallback(() => {
    setSelectedSector(null)
    startDrawing()
  }, [setSelectedSector, startDrawing])

  const dashboardData = useDashboard(visibleFeatures, selectedFeatures, selectedSector)

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
        onClear={handleClear}
      />

      {/* Layout principal: mapa (esq) + dashboard (dir) */}
      <div className="flex flex-1 min-h-0 lg:flex-row flex-col">
        {/* Mapa */}
        <div className="flex-[55] min-h-0 lg:h-full h-[50vh]">
          <MapView
            features={visibleFeatures}
            selectedSector={selectedSector}
            selectedCds={selectedCds}
            selectionMode={mode}
            onSectorClick={handleSectorClick}
            onSectorToggle={toggleSector}
            onPolygonComplete={handlePolygonComplete}
            onStartDrawing={handleStartDrawing}
            onClearSelection={clearSelection}
            initialBounds={initialBounds}
            resetZoomSignal={resetZoomSignal}
            showIncomeOverlay={showIncomeOverlay}
            onToggleIncomeOverlay={toggleIncomeOverlay}
          />
        </div>

        {/* Dashboard */}
        <div className="flex-[45] min-h-0 lg:h-full h-[50vh] border-l border-slate-200">
          <Dashboard
            data={dashboardData}
            selectedSector={selectedSector}
            selectedFeatures={selectedFeatures}
            visibleCount={visibleFeatures.length}
            totalCount={features.length}
          />
        </div>
      </div>
    </div>
  )
}
