import type { OrderItem } from "./OrderItem";

export enum OrderStatus {
  Shipped = "Shipped",
  Cancelled = "Cancelled",
}

export type Order = {
  orderNumber?: string;
  items: OrderItem[];
  date?: string;
  orderValue?: string;
  status?: OrderStatus;
};

