import React from "react";
import type { CartItem } from "../../content";
import "./OrderItem.css";

interface OrderItemProps {
  item: CartItem;
}

const OrderItem: React.FC<OrderItemProps> = ({ item }) => {
  return (
    <li className="order-item">
      <div className="order-item__image-container">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="order-item__image"
          />
        ) : (
          <div className="order-item__image-placeholder">No image</div>
        )}
      </div>
      <div className="order-item__details">
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="order-item__title"
          title={item.title}
        >
          {item.title}
        </a>
        <div className="order-item__meta">
          <span className="order-item__price">Price: {item.price}</span>
          <span className="order-item__quantity">
            Quantity: {item.quantity}
          </span>
        </div>
      </div>
    </li>
  );
};

export default OrderItem;

