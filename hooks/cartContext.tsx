/**
 * The number on the Orders tab, shared app-wide.
 *
 * The Orders tab shows a badge, so the count has to survive navigating away
 * from the cart screen and has to update when something is added from the feed
 * or a product page. That makes it app state, not screen state.
 *
 * It counts different things depending on who you are: for a buyer, items in
 * the cart; for a seller, paid orders waiting on them. Same tab, same badge,
 * and in both cases it answers "is there something here for me".
 *
 * The seller side uses a dedicated count endpoint rather than the dashboard
 * stats — a badge is polled far more often than a dashboard and shouldn't pay
 * for a SUM over every item they've ever sold.
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
import { getSellerPendingCount } from "../services/sections/orders";
import { onBadgeChanged } from "../utils/badgeEvents";
import { useUser } from "./userContextProvider";

export interface CartContextType {
  /**
   * What the Orders tab badge shows: cart lines for a buyer, orders awaiting
   * action for a seller. 0 when there's nothing, or signed out.
   */
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
  const isSeller = !!user && profile?.current_role === "seller";

  const refreshCart = useCallback(async () => {
    if (!isBuyer && !isSeller) {
      setItemCount(0);
      return;
    }
    try {
      if (isBuyer) {
        const summary = await getCartSummary();
        setItemCount(summary?.item_count ?? 0);
      } else {
        const res = await getSellerPendingCount();
        setItemCount(res?.needs_action ?? 0);
      }
    } catch {
      // A badge is not worth a toast. Leave the last known count in place
      // rather than flashing 0 on a dropped request.
    }
  }, [isBuyer, isSeller]);

  const bumpCart = useCallback((delta: number) => {
    setItemCount((current) => Math.max(0, current + delta));
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Every cart mutation goes through services/sections/cart.ts, which emits
  // here — so adding from the feed, a product page or a chat all move the
  // badge without those screens knowing it exists.
  useEffect(() => onBadgeChanged(refreshCart), [refreshCart]);

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
