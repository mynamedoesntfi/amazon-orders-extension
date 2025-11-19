import { useState, useCallback, useEffect } from "react";
import type { CartItem } from "../../content";

type Status = "idle" | "loading" | "ready" | "error";

type ScrapeResponse =
  | {
      items: CartItem[];
      error?: undefined;
    }
  | {
      items?: undefined;
      error: string;
    };

async function getActiveTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const [tab] = tabs;
      if (!tab?.id) {
        reject(
          new Error("Open your Amazon cart tab and try again.")
        );
        return;
      }
      resolve(tab.id);
    });
  });
}

async function requestCartItems(): Promise<CartItem[]> {
  const tabId = await getActiveTabId();
  return new Promise<CartItem[]>((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "SCRAPE_CART" },
      (response: ScrapeResponse | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error("No response from content script."));
          return;
        }
        if ("error" in response && response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.items ?? []);
      }
    );
  });
}

export function useCartItems() {
  const [status, setStatus] = useState<Status>("idle");
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const cartItems = await requestCartItems();
      setItems(cartItems);
      setStatus("ready");
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error ? err.message : "Unable to load cart items."
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return {
    items,
    status,
    error,
    loadItems,
  };
}

