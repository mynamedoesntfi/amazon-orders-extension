import React, { useMemo } from "react";
import "./App.css";
import OrderList, { type OrderData } from "./components/OrderList";
import ExportComponent from "./components/ExportComponent";
import SignOutButton from "./components/SignOutButton";
import { useCartItems } from "./hooks/useCartItems";

const App: React.FC = () => {
  const { items, status, error, loadItems } = useCartItems();

  // Convert items into orders
  // For now, group all items into a single order
  // In the future, this could be enhanced to fetch actual orders or group by criteria
  const orders: OrderData[] = useMemo(() => {
    if (items.length === 0) {
      return [];
    }
    // Single order containing all items
    return [{ id: "current", items, date: new Date().toISOString() }];
  }, [items]);

  return (
    <main className="popup">
      <header className="popup__header">
        <h1>Amazon Orders</h1>
        <SignOutButton />
      </header>
      <section className="popup__actions">
        <ExportComponent items={items} status={status} />
      </section>

      <OrderList
        orders={orders}
        status={status}
        error={error}
        onRefresh={loadItems}
      />
    </main>
  );
};

export default App;
