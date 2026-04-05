import "./App.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ThemeToggle } from "@/components/Toggle-theme.tsx";
import ChatView from "@/features/chat/ChatView";
import { ChatAgentProvider } from "@/features/chat/context/ChatAgentContext";
import { Toaster } from "@/components/ui/sonner";
import { ServerStatus } from "@/components/ServerStatus";
import { SettingsProvider } from "@/contexts/SettingsContext";

function AppContent() {
  return (
    <>
      <ServerStatus />
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <ThemeToggle />
      </div>
      <ChatAgentProvider>
        <ChatView />
      </ChatAgentProvider>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tiny-ui-theme">
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}
