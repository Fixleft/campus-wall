import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {UserProvider} from '@/data/UserContext.tsx'

import { HomePage } from '@/pages/HomePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <HomePage />
    </UserProvider>
  </StrictMode>,
)
