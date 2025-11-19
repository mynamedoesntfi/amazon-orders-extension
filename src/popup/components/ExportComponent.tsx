import React, { useState, useCallback } from "react";
import type { CartItem } from "../../content";
import "./ExportComponent.css";

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

function escapeCsvField(field: string): string {
  if (!field) return "";
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function convertToCsv(items: CartItem[]): string {
  if (items.length === 0) {
    return "";
  }

  // CSV header
  const headers = [
    "Title",
    "Price",
    "Quantity",
    "Total",
    "Product URL",
    "Image URL",
  ];

  // CSV rows
  const rows = items.map((item) => [
    escapeCsvField(item.title),
    escapeCsvField(item.price),
    item.quantity.toString(),
    escapeCsvField(item.total || item.price),
    escapeCsvField(item.productUrl),
    escapeCsvField(item.imageUrl),
  ]);

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ExportComponent: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const items = await requestCartItems();

      if (items.length === 0) {
        setError("No items to export. Please load your cart first.");
        setIsExporting(false);
        return;
      }

      const csvContent = convertToCsv(items);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `amazon-cart-${timestamp}.csv`;

      downloadCsv(csvContent, filename);
      setIsExporting(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export cart data to CSV."
      );
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="export-component">
      <button
        type="button"
        className="export-component__btn"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? "Exporting..." : "Export Data to CSV"}
      </button>
      {error && (
        <p className="export-component__error">{error}</p>
      )}
    </div>
  );
};

export default ExportComponent;

