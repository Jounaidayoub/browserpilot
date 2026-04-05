import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsDialog } from "@/components/SettingsDialog";

export function ServerStatus() {
  const { isConnected, urlHostname } = useSettings();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <div className="group transition-transform duration-300 ease-out transform -translate-y-[calc(100%-14px)] hover:translate-y-0">
          <div className="bg-background/95 backdrop-blur-md border border-t-0 border-border shadow-md rounded-b-2xl flex flex-col items-center min-w-[140px]">
            <div className="px-5 pt-4 pb-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isConnected ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"}`} />
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold leading-none mb-1 text-foreground">{urlHostname}</span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {isConnected ? "Server Connected" : "Server Unreachable"}
                </span>
              </div>
            </div>
            {/* Peek Handle */}
            <div className="h-3.5 w-full flex justify-center items-start pt-1">
              <div className={`w-12 h-1 rounded-full transition-colors ${isConnected ? 'bg-green-500/50 group-hover:bg-green-500/20' : 'bg-red-500/50 group-hover:bg-red-500/20'}`} />
            </div>
          </div>
        </div>
      </div>
      <SettingsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
