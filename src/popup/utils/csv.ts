import type { CartItem } from "../../content";

export function escapeCsvField(field: string): string {
  if (!field) return "";
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function convertToCsv(items: CartItem[]): string {
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
    // TODO: wtf is this item.total || item.price? where is item.total calculated?
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

