import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, CheckCircle, AlertCircle, Globe, Copy } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsContext";
import { useProviderConnection } from "@/hooks/useProviderConnection";
import { DEFAULT_SERVER_URL } from "@/lib/serverConfig";

export function SettingsDialog({ 
    open, 
    onOpenChange 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
}) {
    const { serverUrl, isConnected, setServerUrl } = useSettings();
    const { status, isPolling, isLoading, connect } = useProviderConnection(serverUrl, isConnected);
    const [localUrl, setLocalUrl] = useState(serverUrl);

    useEffect(() => {
        if (!open) {
            setLocalUrl(serverUrl);
        }
    }, [open, serverUrl]);

    const handleSave = () => {
        const nextUrl = (localUrl || serverUrl).trim();
        if (!nextUrl) {
            toast.error("Server URL cannot be empty");
            return;
        }
        setServerUrl(nextUrl);
        localStorage.setItem("serverUrl", nextUrl);
        toast.success("Server URL saved");
    };

    const handleCopyCommand = async (command: string) => {
        try {
            await navigator.clipboard.writeText(command);
            toast.success("Command copied");
        } catch {
            toast.error("Could not copy command");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure your server connection and AI providers.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Server URL Configuration */}
                    <div className="space-y-2">
                        <Label htmlFor="server-url" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Server URL
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="server-url"
                                value={localUrl || serverUrl}
                                onChange={(e) => setLocalUrl(e.target.value)}
                                placeholder={DEFAULT_SERVER_URL}
                                className="flex-1"
                            />
                            <Button variant="secondary" size="sm" onClick={handleSave}>
                                Save
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span>{isConnected ? "Server connected" : "Server unreachable"}</span>
                        </div>
                        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Reminder: run the BrowserPilot server locally before connecting this UI.
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1.5">
                                    <code className="text-[11px]">npm install -g @ayoubj/browserpilot</code>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopyCommand("npm install -g @ayoubj/browserpilot")}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1.5">
                                    <code className="text-[11px]">browserpilot</code>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopyCommand("browserpilot")}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1.5">
                                    <code className="text-[11px]">npx @ayoubj/browserpilot</code>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopyCommand("npx @ayoubj/browserpilot")}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t" />

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
                            className="min-w-[100px]"
                            onClick={connect}
                            disabled={isPolling || isLoading || !isConnected}
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
