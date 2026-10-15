import { useCallback, useState } from "react";
import { addToCart } from "../services/sections/cart";
import { useToast } from "../components/ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { promptSignUp } from "../utils/authNavigation";
import { useUser } from "./userContextProvider";

/**
 * Adding a product to the cart from a tile.
 *
 * Extracted because three screens rendered an Add button and passed no
 * handler at all -- the component's onAdd is optional, so the button looked
 * live and did nothing on tap. A shared hook means the next screen that
 * renders a tile has a working handler one line away rather than a plausible
 * omission.
 */
export function useAddToCart() {
  const { show } = useToast();
  const { user } = useUser();
  const [addingId, setAddingId] = useState<string | null>(null);

  const add = useCallback(
    async (product: { id: string; name?: string }) => {
      // Browse-first guests see the same tiles; a cart needs an account.
      if (!user) {
        promptSignUp();
        return;
      }
      if (addingId) return;
      setAddingId(product.id);
      try {
        await addToCart({ product_id: product.id, variant_id: 0, quantity: 1 });
        show({
          variant: "success",
          title: "Added to cart",
          message: `${product.name ?? "Item"} has been added to your cart.`,
        });
      } catch (error) {
        show({
          variant: "error",
          title: "Could not add to cart",
          message: friendlyErrorMessage(error, "Please try again in a moment."),
        });
      } finally {
        setAddingId(null);
      }
    },
    [addingId, show, user]
  );

  return { add, addingId };
}
