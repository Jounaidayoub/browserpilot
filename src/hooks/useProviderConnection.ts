import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface IntegrationStatus {
    connected: boolean;
    status?: "pending" | "completed" | "error";
    error?: string;
}

export function useProviderConnection(serverUrl: string, isServerConnected: boolean) {
    const [status, setStatus] = useState<IntegrationStatus>({ connected: false });
    const [isPolling, setIsPolling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStatus = useCallback(async () => {
        if (!isServerConnected || !serverUrl) return null;
        try {
            const res = await fetch(`${serverUrl}/api/integrations/openrouter/status`, { 
                credentials: "include" 
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                return data;
            }
        } catch (error) {
            console.error("Failed to fetch integration status:", error);
        }
        setStatus({ connected: false });
        return null;
    }, [serverUrl, isServerConnected]);

    useEffect(() => {
        setIsLoading(true);
        fetchStatus().finally(() => setIsLoading(false));
    }, [fetchStatus]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        
        if (isPolling) {
            const startTime = Date.now();
            intervalId = setInterval(async () => {
                const data = await fetchStatus();
                if (data?.connected) {
                    setIsPolling(false);
                    toast.success("Provider connected successfully");
                }
                if (Date.now() - startTime > 60000) {
                    setIsPolling(false);
                    if (!data?.connected) {
                        toast.error("Connection timed out. Please try again.");
                    }
                }
            }, 1000);
        }
        
        return () => clearInterval(intervalId);
    }, [isPolling, fetchStatus]);

    const connect = useCallback(async () => {
        if (!serverUrl) return;
        try {
            const connectUrl = `${serverUrl}/api/integrations/openrouter/start`;
            if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.create({ url: connectUrl });
            } else {
                window.open(connectUrl, "_blank");
            }
            setIsPolling(true);
            toast.info("Follow the instructions in the new tab to connect");
        } catch (error) {
            console.error("Failed to start connection flow:", error);
            toast.error("Failed to start connection");
        }
    }, [serverUrl]);

    return { status, isPolling, isLoading, connect, checkStatus: fetchStatus };
}
