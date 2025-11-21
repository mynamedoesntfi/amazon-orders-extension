import React from "react";
import "./App.css";
import OrderList from "../components/OrderList";
import ExportComponent from "../components/ExportComponent";
import SignOutButton from "../components/SignOutButton";
import { useOrders } from "../hooks/useOrders";

const App: React.FC = () => {
  const { orders, status, error, loadOrders } = useOrders();

  return (
    <main className="popup">
      <header className="popup__header">
        <h1>Amazon Orders</h1>
        <SignOutButton />
      </header>
      <section className="popup__actions">
        <ExportComponent orders={orders} status={status} />
      </section>

      <OrderList
        orders={orders}
        status={status}
        error={error}
        onRefresh={loadOrders}
      />
    </main>
  );
};

export default App;
