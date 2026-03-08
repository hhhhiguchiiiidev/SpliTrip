import '@testing-library/jest-dom'

// Reactのコンソールエラーと警告を抑制（テスト中の冗長な出力を防ぐ）
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Error: Uncaught') ||
       args[0].includes('The above error occurred'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router Future Flag Warning') ||
       args[0].includes('v7_startTransition') ||
       args[0].includes('v7_relativeSplatPath'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

