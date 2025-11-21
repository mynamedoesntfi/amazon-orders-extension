import React, { useMemo } from "react";
import type { CartItem } from "../../content";
import OrderItem from "./OrderItem";
import { formatCurrency, parseCurrency } from "../utils/currency";
import "./Order.css";

interface OrderProps {
  items: CartItem[];
}

const Order: React.FC<OrderProps> = ({ items }) => {
  const heading = useMemo(() => {
    return `Order items (${items.length})`;
  }, [items.length]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const priceText = item.total || item.price;
      const price = parseCurrency(priceText);
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 1;
      return sum + price * quantity;
    }, 0);
  }, [items]);

  const showSubtotal = items.length > 0;
  const formattedSubtotal = formatCurrency(subtotal);

  return (
    <section className="order">
      <header className="order__header">
        <h2>{heading}</h2>
      </header>

      {showSubtotal ? (
        <p className="order__subtotal order__subtotal--top">
          Subtotal ({items.length} item{items.length > 1 ? "s" : ""}):{" "}
          <span>{formattedSubtotal}</span>
        </p>
      ) : null}

      <ul className="order__items">
        {items.map((item) => {
          const key = item.productUrl || `${item.title}-${item.quantity}`;
          return <OrderItem key={key} item={item} />;
        })}
      </ul>

      {showSubtotal ? (
        <p className="order__subtotal order__subtotal--bottom">
          Subtotal ({items.length} item{items.length > 1 ? "s" : ""}):{" "}
          <span>{formattedSubtotal}</span>
        </p>
      ) : null}
    </section>
  );
};

export default Order;

