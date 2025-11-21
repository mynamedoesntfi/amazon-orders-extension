import { useState, useCallback, useEffect } from "react";
import type { Order } from "../model/Order";

type Status = "idle" | "loading" | "ready" | "error";

type ScrapeResponse =
  | {
      orders: Order[];
      error?: undefined;
    }
  | {
      orders?: undefined;
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
          new Error("Open your Amazon orders tab and try again.")
        );
        return;
      }
      resolve(tab.id);
    });
  });
}

async function requestOrders(): Promise<Order[]> {
  const tabId = await getActiveTabId();
  return new Promise<Order[]>((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "SCRAPE_ORDERS" },
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
        resolve(response.orders ?? []);
      }
    );
  });
}

export function useOrders() {
  const [status, setStatus] = useState<Status>("idle");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const orderData = await requestOrders();
      setOrders(orderData);
      setStatus("ready");
    } catch (err) {
      setOrders([]);
      setError(
        err instanceof Error ? err.message : "Unable to load orders."
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return {
    orders,
    status,
    error,
    loadOrders,
  };
}

