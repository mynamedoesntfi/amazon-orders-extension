import React, { useState, useCallback } from "react";
import type { CartItem } from "../../content";
import "./ExportComponent.css";

type Status = "idle" | "loading" | "ready" | "error";

interface ExportComponentProps {
  items: CartItem[];
  status: Status;
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

const ExportComponent: React.FC<ExportComponentProps> = ({ items, status }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setError(null);

    try {
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
  }, [items]);

  const isDisabled = isExporting || status === "loading" || items.length === 0;

  return (
    <div className="export-component">
      <button
        type="button"
        className="export-component__btn"
        onClick={handleExport}
        disabled={isDisabled}
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

