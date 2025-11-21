import React, { useMemo } from "react";
import type { OrderData } from "../model/OrderData";
import OrderItem from "./OrderItem";
import "./Order.css";

interface OrderProps {
  order: OrderData;
  orderNumber?: number;
}

const Order: React.FC<OrderProps> = ({ order, orderNumber: displayNumber }) => {
  const { items, orderNumber, date, orderValue } = order;

  const heading = useMemo(() => {
    const prefix = displayNumber ? `${displayNumber}. ` : "";
    return `${prefix}Order items (${items.length})`;
  }, [items.length, displayNumber]);

  // Format order number - remove "Order #" prefix if present
  const formattedOrderNumber = useMemo(() => {
    if (!orderNumber) return "";
    // Remove "Order #" and any leading/trailing whitespace
    return orderNumber.replace(/Order\s*#\s*/i, "").trim();
  }, [orderNumber]);

  return (
    <section className="order">
      <header className="order__header">
        <h2>{heading}</h2>
      </header>

      {(formattedOrderNumber || date || orderValue) && (
        <div className="order__info">
          {formattedOrderNumber && (
            <p className="order__info-item">
              <span className="order__info-label">Order #:</span>{" "}
              <span className="order__info-value">{formattedOrderNumber}</span>
            </p>
          )}
          {date && (
            <p className="order__info-item">
              <span className="order__info-label">Order placed date:</span>{" "}
              <span className="order__info-value">{date}</span>
            </p>
          )}
          <p className="order__info-item order__info-item--total">
            <span className="order__info-label">Order value:</span>{" "}
            <span className="order__info-value">{orderValue || "N/A"}</span>
          </p>
        </div>
      )}

      <ul className="order__items">
        {items.map((item) => {
          const key = item.productUrl || `${item.title}-${item.quantity}`;
          return <OrderItem key={key} item={item} />;
        })}
      </ul>
    </section>
  );
};

export default Order;

