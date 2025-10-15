import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'

console.log('[CRXJS] Hello world from content script!')

let panel = false;
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    panel = !panel;
    if (!panel){
      console.log("Closing side panel...");
      chrome.runtime.sendMessage({ action: "close-sidepanel" });
      return;
    }
    console.log("Opening side panel...");
    chrome.runtime.sendMessage({ action: "open-sidepanel" });
  }
});

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
