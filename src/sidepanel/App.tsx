import "./App.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ThemeToggle } from "@/components/Toggle-theme.tsx";
import ChatBotDemo from "./ChatBotDemo";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { isPending, error } = useAuth();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive p-4 text-center">
        Error loading session: {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <ThemeToggle />
      </div>
      <ChatBotDemo />
      <AuthDialog />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tiny-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
