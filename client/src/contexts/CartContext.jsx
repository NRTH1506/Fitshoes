import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

function loadCart() {
  try { return JSON.parse(localStorage.getItem('fs_cart') || '[]'); } catch { return []; }
}

function persistCart(cart) {
  localStorage.setItem('fs_cart', JSON.stringify(cart));
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  const save = useCallback((next) => {
    setCart(next);
    persistCart(next);
  }, []);

  const addToCart = useCallback((product, qty = 1, size = null) => {
    setCart((prev) => {
      const id = product._id || product.id;
      const existing = prev.find((i) => i.id === id && i.size === size);
      let next;
      if (existing) {
        next = prev.map((i) =>
          i.id === id && i.size === size ? { ...i, qty: i.qty + qty } : i
        );
      } else {
        next = [
          ...prev,
          {
            id,
            qty,
            size,
            title: product.title_vi || product.title || product.name,
            price: product.price,
            currency: product.currency || 'VND',
          },
        ];
      }
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persistCart(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) => {
      const next = prev.map((i) => {
        if (i.id === id) {
          const newQty = Math.max(1, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      });
      persistCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => save([]), [save]);

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 500000 ? 0 : 50000;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeItem, updateQty, clearCart, cartCount, subtotal, shipping, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
