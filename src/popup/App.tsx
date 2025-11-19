import React from "react";
import "./App.css";
import CartList from "./components/CartList";
import ExportComponent from "./components/ExportComponent";
import { useCartItems } from "./hooks/useCartItems";

const App: React.FC = () => {
  const { items, status, error, loadItems } = useCartItems();

  return (
    <main className="popup">
      <header>
        <h1>CART</h1>
      </header>
      <section className="popup__actions">
        <ExportComponent items={items} status={status} />
      </section>

      <CartList
        items={items}
        status={status}
        error={error}
        onRefresh={loadItems}
      />
    </main>
  );
};

export default App;
