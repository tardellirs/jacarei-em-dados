import '@testing-library/jest-dom'

// recharts usa ResizeObserver internamente — jsdom não o implementa
;(globalThis as Record<string, unknown>).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
