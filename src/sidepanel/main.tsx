import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
console.log("this here is the side panel");
// sidepanel.js
chrome.runtime.onMessage.addListener(message => {
  // Might not be as easy if there are multiple side panels open
  console.log("Message received in side panel:", message);
  if (message.action === 'close-sidepanel') {
    console.log("Closing side panel...");
    window.close();
  }
})




createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
