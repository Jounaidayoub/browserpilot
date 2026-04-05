import { useState, useEffect } from "react";

export function useProviderStatus() {
  const [isconnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/integrations/openrouter/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
            setIsConnected(true);
        }
      })
      .catch((err) => console.error("Failed to check provider status", err));
  }, []);

  return { isconnected };
}
