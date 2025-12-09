import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {UserProvider} from '@/context/UserContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { HomePage } from '@/pages/HomePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>
    </UserProvider>
  </StrictMode>,
)
