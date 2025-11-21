import React, { useMemo } from "react";
import Order from "./Order";
import type { OrderData } from "../../content";
import "./OrderList.css";

type Status = "idle" | "loading" | "ready" | "error";

export type { OrderData };

interface OrderListProps {
  orders: OrderData[];
  status: Status;
  error: string | null;
  onRefresh: () => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  status,
  error,
  onRefresh,
}) => {

  const heading = useMemo(() => {
    if (status === "loading") {
      return "Loading orders…";
    }
    if (status === "ready") {
      return `Orders (${orders.length})`;
    }
    return "Orders";
  }, [status, orders.length]);

  return (
    <section className="order-list">
      <header className="order-list__header">
        <h2>{heading}</h2>
        <button
          type="button"
          className="order-list__refresh"
          onClick={() => void onRefresh()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error ? (
        <p className="order-list__message order-list__message--error">{error}</p>
      ) : null}

      {!error && status === "ready" && orders.length === 0 ? (
        <p className="order-list__message">
          No orders found. Open your Amazon orders page and try again.
        </p>
      ) : null}

      <div className="order-list__orders">
        {orders.map((order, index) => (
          <Order key={order.orderNumber || `order-${index}`} order={order} orderNumber={index + 1} />
        ))}
      </div>
    </section>
  );
};

export default OrderList;

