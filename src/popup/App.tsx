import React from "react";
import "./App.css";
import CartList from "./components/CartList";
import ExportComponent from "./components/ExportComponent";
import SignOutButton from "./components/SignOutButton";
import { useCartItems } from "./hooks/useCartItems";

const App: React.FC = () => {
  const { items, status, error, loadItems } = useCartItems();

  return (
    <main className="popup">
      <header className="popup__header">
        <h1>CART</h1>
        <SignOutButton />
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
