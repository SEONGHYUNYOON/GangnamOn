import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

// PWA: 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Create a client
const queryClient = new QueryClient({
     defaultOptions: {
          queries: {
               staleTime: 1000 * 60, // 1 minute
               retry: 1,
               refetchOnWindowFocus: false,
          },
     },
})

ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
          <ErrorBoundary>
               <QueryClientProvider client={queryClient}>
                    <App />
               </QueryClientProvider>
          </ErrorBoundary>
     </React.StrictMode>,
)
