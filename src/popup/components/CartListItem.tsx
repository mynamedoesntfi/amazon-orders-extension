import React from "react";
import type { CartItem } from "../../content";
import "./CartListItem.css";

interface CartListItemProps {
  item: CartItem;
}

const CartListItem: React.FC<CartListItemProps> = ({ item }) => {
  return (
    <li className="cart-list-item">
      <div className="cart-list-item__image-container">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="cart-list-item__image"
          />
        ) : (
          <div className="cart-list-item__image-placeholder">No image</div>
        )}
      </div>
      <div className="cart-list-item__details">
        <h3 className="cart-list-item__title" title={item.title}>
          {item.title}
        </h3>
        <div className="cart-list-item__meta">
          <span className="cart-list-item__price">Price: {item.price}</span>
          <span className="cart-list-item__quantity">
            Quantity: {item.quantity}
          </span>
        </div>
      </div>
    </li>
  );
};

export default CartListItem;

