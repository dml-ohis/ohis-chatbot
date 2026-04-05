import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatWidget from './components/ChatWidget'

function mountWidget() {
  const containerId = 'pm-chatbot-widget-root'

  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.zIndex = '99999'
    container.style.bottom = '0'
    container.style.right = '0'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)
  }

  // Allow pointer events on children
  container.style.width = '0'
  container.style.height = '0'

  createRoot(container).render(
    <StrictMode>
      <ChatWidget />
    </StrictMode>
  )
}

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountWidget)
} else {
  mountWidget()
}
