import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './index.css'

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e0f7ff',
      100: '#b8e3ff',
      200: '#8eceff',
      300: '#64baff',
      400: '#3aa6ff',
      500: '#1192ff',
      600: '#0074e0',
      700: '#0057ad',
      800: '#003b7a',
      900: '#001e47',
    },
    quantum: {
      primary: '#3182CE',
      secondary: '#805AD5',
      accent: '#00B5D8',
      background: '#F7FAFC',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
})

if (import.meta.env.DEV) {
  ;(window as any).__quantumflow_store__ = store
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>,
)
