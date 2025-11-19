import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem } from "../../content";
import CartListItem from "./CartListItem";
import { formatCurrency, parseCurrency } from "../utils/currency";
import "./CartList.css";

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

const CartList: React.FC = () => {
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

  const heading = useMemo(() => {
    if (status === "loading") {
      return "Loading cart…";
    }
    if (status === "ready") {
      return `Cart items (${items.length})`;
    }
    return "Cart items";
  }, [status, items.length]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const priceText = item.total || item.price;
      const price = parseCurrency(priceText);
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 1;
      return sum + price * quantity;
    }, 0);
  }, [items]);

  const showSubtotal = status === "ready" && items.length > 0;
  const formattedSubtotal = formatCurrency(subtotal);

  return (
    <section className="cart-list">
      <header className="cart-list__header">
        <h2>{heading}</h2>
        <button
          type="button"
          className="cart-list__refresh"
          onClick={() => void loadItems()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {showSubtotal ? (
        <p className="cart-list__subtotal cart-list__subtotal--top">
          Subtotal ({items.length} item{items.length > 1 ? "s" : ""}):{" "}
          <span>{formattedSubtotal}</span>
        </p>
      ) : null}

      {error ? (
        <p className="cart-list__message cart-list__message--error">{error}</p>
      ) : null}

      {!error && status === "ready" && items.length === 0 ? (
        <p className="cart-list__message">
          No items found. Open your Amazon cart page and try again.
        </p>
      ) : null}

      <ul className="cart-list__items">
        {items.map((item) => {
          const key = item.productUrl || `${item.title}-${item.quantity}`;
          return <CartListItem key={key} item={item} />;
        })}
      </ul>

      {showSubtotal ? (
        <p className="cart-list__subtotal cart-list__subtotal--bottom">
          Subtotal ({items.length} item{items.length > 1 ? "s" : ""}):{" "}
          <span>{formattedSubtotal}</span>
        </p>
      ) : null}
    </section>
  );
};

export default CartList;


