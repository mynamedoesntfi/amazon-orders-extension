import React, { useState, useCallback, useMemo } from "react";
import type { Order } from "../model/Order";
import { generateCsvExport } from "../utils/csv";
import { exportToGoogleDrive } from "../utils/googleDrive";
import "./ExportComponent.css";

type Status = "idle" | "loading" | "ready" | "error";

interface ExportComponentProps {
  orders: Order[];
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

const ExportComponent: React.FC<ExportComponentProps> = ({ orders, status }) => {
  const [isExportingToPC, setIsExportingToPC] = useState(false);
  const [isExportingToGoogleDrive, setIsExportingToGoogleDrive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Count total items across all orders
  const totalItems = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.items.length, 0);
  }, [orders]);

  const handleExportToPC = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setIsExportingToPC(true);

    if (orders.length === 0 || totalItems === 0) {
      setError("No orders to export. Please load your orders first.");
      setIsExportingToPC(false);
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(orders);

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
  }, [orders, totalItems]);

  const handleExportToGoogleDrive = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setIsExportingToGoogleDrive(true);

    if (orders.length === 0 || totalItems === 0) {
      setError("No orders to export. Please load your orders first.");
      setIsExportingToGoogleDrive(false);
      return;
    }

    try {
      const { csvContent, filename } = generateCsvExport(orders);

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
  }, [orders, totalItems]);

  // Only disable if loading or no orders/items
  const isDisabledPC = status === "loading" || orders.length === 0 || totalItems === 0;
  // Keep Google Drive disabled for now
  const isDisabledGoogleDrive = true;

  return (
    <div className="export-component">
      <div className="export-component__buttons">
        <button
          type="button"
          className={`export-component__btn export-component__btn--google-drive ${
            isExportingToGoogleDrive ? "export-component__btn--exporting" : ""
          }`}
          onClick={handleExportToGoogleDrive}
          disabled={isDisabledGoogleDrive || isExportingToGoogleDrive}
        >
          Export CSV to Google Drive
        </button>
        <button
          type="button"
          className={`export-component__btn export-component__btn--pc ${
            isExportingToPC ? "export-component__btn--exporting" : ""
          }`}
          onClick={handleExportToPC}
          disabled={isDisabledPC || isExportingToPC}
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

