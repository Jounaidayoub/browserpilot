// a lightweight element inspector script
//like the inspector tool in devtools
//it will highlight elements on hover and send the outerHTML of the selected element back to side panel(via content script)
export default function Inspector() {
  console.log("Element inspector script injected");

  (function () {
    console.log("Element inspector script started");
    let overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.pointerEvents = "none";
    overlay.style.border = "2px dashed rgba(0,0,0,0.6)";
    overlay.style.background = "rgba(120,180,255,0.08)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "none";
    document.body.appendChild(overlay);

    let lastEl:any = null;
    // Improve overlay appearance and add smooth morph transition
    overlay.style.transition = "all 0.18s ease";
    overlay.style.borderRadius = "8px";
    overlay.style.boxShadow = "0 2px 12px 2px rgba(60,120,255,0.13)";

    function onMove(e:any) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === overlay) return;
      if (el === lastEl) return;
      lastEl = el;
      const r = el.getBoundingClientRect();
      overlay.style.left = r.left + window.scrollX + "px";
      overlay.style.top = r.top + window.scrollY + "px";
      overlay.style.width = r.width + "px";
      overlay.style.height = r.height + "px";
      overlay.style.display = "block";
    }

    function onLeave() {
      overlay.style.display = "none";
      lastEl = null;
    }

    function onClick(e:any) {
      e.preventDefault();
      e.stopPropagation();
      const picked = document.elementFromPoint(e.clientX, e.clientY);

      if (picked && picked !== overlay) {
        // Get the outer HTML of the selected element
        const elementHTML = picked.outerHTML;
        console.log("Element selected:", elementHTML);
        console.log("sending message via window.postMessage");

        // Use window.postMessage to communicate with content script
        window.postMessage({
          type: "ELEMENT_INSPECTOR_SELECTED",
          elementHTML: elementHTML,
          tagName: picked.tagName,
          className: picked.className,  
          id: picked.id,
        }, "*");
      }

      toggleOff();
    }

    function toggleOn() {
      document.addEventListener("mousemove", onMove, { capture: true });
      document.addEventListener("mouseleave", onLeave);
      document.addEventListener("click", onClick, { capture: true });
      overlay.style.display = "none";
    }

    function toggleOff() {
      document.removeEventListener("mousemove", onMove, { capture: true });
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick, { capture: true });
      overlay.style.display = "none";
      if (overlay.parentNode) {
        overlay.remove();
      }
    }

    // Start inspector immediately
    toggleOn();
  })();
}
