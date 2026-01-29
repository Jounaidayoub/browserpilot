"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface IntegrationStatus {
    connected: boolean;
    status?: "pending" | "completed" | "error";
    error?: string;
}

export function ProvidersDialog() {
    const { session } = useAuth();
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<IntegrationStatus>({ connected: false });
    const [isPolling, setIsPolling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/integrations/openrouter/status", {
                // Ensure cookies are sent (important for auth)
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                return data;
            }
        } catch (error) {
            console.error("Failed to fetch integration status:", error);
        }
        return null;
    };

    useEffect(() => {
        if (open && session) {
            setIsLoading(true);
            fetchStatus().finally(() => setIsLoading(false));
        }
    }, [open, session]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isPolling) {
            const startTime = Date.now();
            // Poll every 1s
            intervalId = setInterval(async () => {
                const data = await fetchStatus();
                // Stop if connected
                if (data?.connected) {
                    setIsPolling(false);
                    toast.success("OpenRouter connected successfully");
                }
                // Stop after 60s timeout
                if (Date.now() - startTime > 60000) {
                    setIsPolling(false);
                    if (!data?.connected) {
                        toast.error("Connection timed out. Please try again.");
                    }
                }
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [isPolling]);

    const handleConnect = async () => {
        try {
            // Open auth tab
            const url = "http://localhost:8080/api/integrations/openrouter/start";
            
            // Use chrome.tabs if available (in extension context)
            if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.create({ url });
            } else {
                window.open(url, "_blank");
            }

            // Start polling
            setIsPolling(true);
            toast.info("Follow the instructions in the new tab to connect OpenRouter");
        } catch (error) {
            console.error("Failed to start connection flow:", error);
            toast.error("Failed to start connection");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start mt-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Providers
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>AI Providers</DialogTitle>
                    <DialogDescription>
                        Connect external AI providers to access their models.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {/* OpenRouter Provider */}
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm">OpenRouter</h4>
                                    {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                    ) : status.connected ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Access various models
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={status.connected ? "outline" : "default"}
                            size="sm"
                            onClick={handleConnect}
                            disabled={isPolling || isLoading}
                        >
                            {isPolling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {status.connected ? "Reconnect" : "Connect"}
                                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Anthropic Provider (Coming Soon) */}
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg border opacity-50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm">Anthropic</h4>
                                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Connect your API key
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            Connect
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
