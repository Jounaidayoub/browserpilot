export const DEFAULT_SERVER_URL = "http://localhost:8080";
export const STORAGE_KEY = "serverUrl";

export function getServerUrl(): string {
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER_URL;
}

export function setServerUrl(url: string): void {
  window.localStorage.setItem(STORAGE_KEY, url);
}

export async function checkServerHealth(url?: string): Promise<boolean> {
  const serverUrl = url || getServerUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${serverUrl}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
