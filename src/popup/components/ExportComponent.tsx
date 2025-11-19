import React, { useState, useCallback } from "react";
import type { CartItem } from "../../content";
import { generateCsvExport } from "../utils/csv";
import { exportToGoogleDrive } from "../utils/googleDrive";
import "./ExportComponent.css";

type Status = "idle" | "loading" | "ready" | "error";

interface ExportComponentProps {
  items: CartItem[];
  status: Status;
}

function downloadCsvToPC(csvContent: string, filename: string): void {
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
  const [isGoogleDriveActive, setIsGoogleDriveActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportToPC = useCallback(() => {
    setError(null);

    if (items.length === 0) {
      setError("No items to export. Please load your cart first.");
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(items);

      downloadCsvToPC(csvContent, filename);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export cart data to CSV."
      );
    }
  }, [items]);

  const handleExportToGoogleDrive = useCallback(async () => {
    setError(null);
    setIsGoogleDriveActive(true);

    if (items.length === 0) {
      setError("No items to export. Please load your cart first.");
      setIsGoogleDriveActive(false);
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(items);

      await exportToGoogleDrive(csvContent, filename);
      
      // Success - button stays red to indicate success
      // You could also show a success message or reset after a delay
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export to Google Drive."
      );
      setIsGoogleDriveActive(false);
    }
  }, [items]);

  const isDisabled = status === "loading" || items.length === 0;

  return (
    <div className="export-component">
      <div className="export-component__buttons">
        <button
          type="button"
          className={`export-component__btn export-component__btn--google-drive ${
            isGoogleDriveActive ? "export-component__btn--active" : ""
          }`}
          onClick={handleExportToGoogleDrive}
          disabled={isDisabled}
        >
          Export CSV to Google Drive
        </button>
        <button
          type="button"
          className="export-component__btn export-component__btn--pc"
          onClick={handleExportToPC}
          disabled={isDisabled}
        >
          Export CSV to PC
        </button>
      </div>
      {error && (
        <p className="export-component__error">{error}</p>
      )}
    </div>
  );
};

export default ExportComponent;

