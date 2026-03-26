import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig, staffMsalInstance } from './auth/msalConfig.js'
import App from './App.jsx'

const msalInstance = new PublicClientApplication(msalConfig)

Promise.all([msalInstance.initialize(), staffMsalInstance.initialize()]).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
})
