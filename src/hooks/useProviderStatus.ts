import { useSettings } from "@/contexts/SettingsContext";
import { useProviderConnection } from "./useProviderConnection";

/**
 * @deprecated Use useSettings and useProviderConnection instead
 */
export function useProviderStatus() {
  const { serverUrl, isConnected } = useSettings();
  const { status } = useProviderConnection(serverUrl, isConnected);

  return { 
    isServerConnected: isConnected, 
    isProviderConnected: status.connected 
  };
}
