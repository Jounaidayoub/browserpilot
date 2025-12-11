import { useState, useEffect } from "react";

export type Tab = {
  id: number;
  title: string;
  url: string;
};

export const useTabs = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const chromeTabs = await chrome.tabs.query({});
        const formattedTabs = chromeTabs.map((tab) => ({
          id: tab.id!,
          title: tab.title || "",
          url: tab.url || "",
        }));
        setTabs(formattedTabs);
      } catch (error) {
        console.error("Error fetching tabs:", error);
      }
    };

    fetchTabs();
  }, []);

  return { tabs };
};
