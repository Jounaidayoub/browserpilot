import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function useProviderStatus() {
  const { session } = useAuth();
  const [isconnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session) {
        setIsConnected(false);
      return;
    }

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
  }, [session]);

  return { isconnected };
}
