"use client";

import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { getUrlHostname } from "@/lib/utils";
import { DEFAULT_SERVER_URL, STORAGE_KEY, checkServerHealth } from "@/lib/serverConfig";

interface Settings {
  serverUrl: string;
  isConnected: boolean;
}

interface SettingsContextValue extends Settings {
  setServerUrl: (url: string) => void;
  setIsConnected: (connected: boolean) => void;
  urlHostname: string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getInitialUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SERVER_URL;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER_URL;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [serverUrl, setServerUrlState] = useState(getInitialUrl);
  const [isConnected, setIsConnected] = useState(false);

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
  }, []);

  const urlHostname = useMemo(() => getUrlHostname(serverUrl), [serverUrl]);

  useEffect(() => {
    checkServerHealth(serverUrl).then(setIsConnected);
  }, [serverUrl]);

  return (
    <SettingsContext.Provider
      value={{
        serverUrl,
        isConnected,
        setServerUrl,
        setIsConnected,
        urlHostname,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}