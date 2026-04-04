import '@testing-library/jest-dom'

// recharts usa ResizeObserver internamente — jsdom não o implementa
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
