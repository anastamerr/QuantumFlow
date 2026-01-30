import { ChakraProvider } from '@chakra-ui/react'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(
    <Provider store={store}>
      <ChakraProvider>{ui}</ChakraProvider>
    </Provider>,
    options,
  )
}
