import type { OrderData } from "../../content";

export function escapeCsvField(field: string): string {
  if (!field) return "";
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function convertOrdersToCsv(orders: OrderData[]): string {
  if (orders.length === 0) {
    return "";
  }

  // CSV header - includes order info and item info
  const headers = [
    "Order #",
    "Order Date",
    "Order Value",
    "Item Title",
    "Item Price",
    "Item Quantity",
    "Product URL",
    "Image URL",
  ];

  // Flatten orders into rows - each row is an item with its order info
  const rows: string[][] = [];
  
  orders.forEach((order) => {
    // Format order number - remove "Order #" prefix if present
    const orderNumber = order.orderNumber ? order.orderNumber.replace(/Order\s*#\s*/i, "").trim() : "";
    const orderDate = order.date || "";
    const orderTotal = order.orderValue || "";

    // Create a row for each item in the order
    order.items.forEach((item) => {
      rows.push([
        escapeCsvField(orderNumber),
        escapeCsvField(orderDate),
        escapeCsvField(orderTotal),
        escapeCsvField(item.title),
        escapeCsvField(item.price),
        item.quantity.toString(),
        escapeCsvField(item.productUrl),
        escapeCsvField(item.imageUrl),
      ]);
    });
  });

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export function generateCsvExport(orders: OrderData[]): {
  csvContent: string;
  filename: string;
} {
  const csvContent = convertOrdersToCsv(orders);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `amazon-orders-${timestamp}.csv`;

  return { csvContent, filename };
}

