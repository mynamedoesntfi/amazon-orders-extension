import type { OrderItem } from "./OrderItem";

export type OrderData = {
  orderNumber?: string;
  items: OrderItem[];
  date?: string;
  orderValue?: string;
};

