

(function () {
  const CHANNEL = "__EXT_RUNNER_V1__";
  // signal ready
  window.postMessage({ channel: CHANNEL, type: "runner-ready" }, "*");

  window.addEventListener("message", (event) => {
    const msg = event?.data;
    if (!msg || msg.channel !== CHANNEL) return;
    if (msg.type === "run-code") {
      try {
        // Execute in page context
        const fn = new Function(msg.code || "");
        const result = fn();
        window.postMessage({ channel: CHANNEL, type: "run-success" , result}, "*");
      } catch (err) {
        window.postMessage({ channel: CHANNEL, type: "run-error", error: String(err) }, "*");
      }
    }
  }, false);
})();
