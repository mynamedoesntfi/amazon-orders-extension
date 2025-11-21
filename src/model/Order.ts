import type { OrderItem } from "./OrderItem";

export type Order = {
  orderNumber?: string;
  items: OrderItem[];
  date?: string;
  orderValue?: string;
};

