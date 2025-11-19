import React from "react";
import "./App.css";
import CartList from "./components/CartList";
import ExportComponent from "./components/ExportComponent";

const App: React.FC = () => {
  return (
    <main className="popup">
      <header>
        <h1>CART</h1>
        <p>Amazon cart exporter scaffold.</p>
      </header>
      <section className="popup__actions">
        <ExportComponent />
      </section>

      <CartList />
    </main>
  );
};

export default App;
