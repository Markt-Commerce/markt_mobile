/**
 * Cart item count, shared app-wide.
 *
 * The Orders tab shows a badge, so the count has to survive navigating away
 * from the cart screen and has to update when something is added from the feed
 * or a product page. That makes it app state, not screen state.
 *
 * Only buyers have a cart, so for anyone else this stays at 0 and the badge
 * never renders.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getCartSummary } from "../services/sections/cart";
import { onCartChanged } from "../utils/cartEvents";
import { useUser } from "./userContextProvider";

export interface CartContextType {
  /** Number of line items in the cart. 0 when empty, signed out, or selling. */
  itemCount: number;
  /** Re-read the count from the server. Call after adding or removing. */
  refreshCart: () => Promise<void>;
  /**
   * Move the badge immediately, before the server round-trip. Pass a delta so
   * two quick taps can't race each other back to a stale absolute value.
   */
  bumpCart: (delta: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useUser();
  const [itemCount, setItemCount] = useState(0);

  const isBuyer = !!user && profile?.current_role === "buyer";

  const refreshCart = useCallback(async () => {
    if (!isBuyer) {
      setItemCount(0);
      return;
    }
    try {
      const summary = await getCartSummary();
      setItemCount(summary?.item_count ?? 0);
    } catch {
      // A badge is not worth a toast. Leave the last known count in place
      // rather than flashing 0 on a dropped request.
    }
  }, [isBuyer]);

  const bumpCart = useCallback((delta: number) => {
    setItemCount((current) => Math.max(0, current + delta));
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Every cart mutation goes through services/sections/cart.ts, which emits
  // here — so adding from the feed, a product page or a chat all move the
  // badge without those screens knowing it exists.
  useEffect(() => onCartChanged(refreshCart), [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart, bumpCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
