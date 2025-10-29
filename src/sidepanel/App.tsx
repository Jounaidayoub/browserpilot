import crxLogo from "@/assets/crx.svg";
import reactLogo from "@/assets/react.svg";
import viteLogo from "@/assets/vite.svg";
import HelloWorld from "@/components/HelloWorld";
import "./App.css";
import { Button } from "@/components/ui/button";
import { ThemeProvider  } from "@/components/theme-provider.tsx";
import { ThemeToggle } from "@/components/Toggle-theme.tsx";


import ChatBotDemo from "./ChatBotDemo";
export default function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="tiny-ui-theme">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <ThemeToggle />
        </div>
        <ChatBotDemo />
      </ThemeProvider>
    </>
  );
}
