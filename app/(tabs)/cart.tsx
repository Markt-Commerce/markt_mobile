import React from "react";
import { Redirect } from "expo-router";

/**
 * There is one cart, so there is one cart screen.
 *
 * This route used to be a second, near-identical implementation reached from
 * the cart icon on a product page, while the Orders tab had its own. They had
 * drifted into using *different checkout flows* -- this one posted to
 * /payments/checkout/initialize, the Orders tab to /cart/checkout -- so which
 * code path a buyer went down, and for a while which delivery fee they were
 * charged, depended on where they happened to tap. A fix applied to one was
 * simply absent from the other.
 *
 * The Orders tab's version is the one kept: it is the reachable one (this
 * route is hidden from the tab bar) and its payment screen supports wallet
 * as well as card, which the payment-first flow does not.
 *
 * What that gives up is the stock reservation the payment-first flow took at
 * initialize. Worth revisiting -- the honest end state is one flow that both
 * reserves stock and accepts every payment method -- but not worth carrying
 * two carts for in the meantime.
 */
export default function CartRedirect() {
  return <Redirect href="/(tabs)/orders" />;
}
