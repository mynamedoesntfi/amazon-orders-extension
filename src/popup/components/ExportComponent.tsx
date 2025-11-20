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
  const [isExportingToPC, setIsExportingToPC] = useState(false);
  const [isExportingToGoogleDrive, setIsExportingToGoogleDrive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExportToPC = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setIsExportingToPC(true);

    if (items.length === 0) {
      setError("No items to export. Please load your cart first.");
      setIsExportingToPC(false);
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(items);

      // Small delay to show green state
      await new Promise(resolve => setTimeout(resolve, 100));
      downloadCsvToPC(csvContent, filename);
      
      // Show success message
      setSuccessMessage("Export was successful");
      
      // Reset after a brief moment
      setTimeout(() => setIsExportingToPC(false), 500);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setIsExportingToPC(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export cart data to CSV."
      );
    }
  }, [items]);

  const handleExportToGoogleDrive = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setIsExportingToGoogleDrive(true);

    if (items.length === 0) {
      setError("No items to export. Please load your cart first.");
      setIsExportingToGoogleDrive(false);
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(items);

      await exportToGoogleDrive(csvContent, filename);
      
      // Success - reset exporting state and show success message
      setIsExportingToGoogleDrive(false);
      setSuccessMessage("Export was successful");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setIsExportingToGoogleDrive(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export to Google Drive."
      );
    }
  }, [items]);

  const isDisabled = status === "loading" || items.length === 0;

  return (
    <div className="export-component">
      <div className="export-component__buttons">
        <button
          type="button"
          className={`export-component__btn export-component__btn--google-drive ${
            isExportingToGoogleDrive ? "export-component__btn--exporting" : ""
          }`}
          onClick={handleExportToGoogleDrive}
          disabled={isDisabled || isExportingToGoogleDrive}
        >
          Export CSV to Google Drive
        </button>
        <button
          type="button"
          className={`export-component__btn export-component__btn--pc ${
            isExportingToPC ? "export-component__btn--exporting" : ""
          }`}
          onClick={handleExportToPC}
          disabled={isDisabled || isExportingToPC}
        >
          Export CSV to PC
        </button>
      </div>
      {successMessage && (
        <p className="export-component__success">{successMessage}</p>
      )}
      {error && (
        <p className="export-component__error">{error}</p>
      )}
    </div>
  );
};

export default ExportComponent;

