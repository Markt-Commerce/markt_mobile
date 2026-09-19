/**
 * Making sure the account actually has the role the person chose.
 *
 * Onboarding used to *update* the buyer or seller profile at this point,
 * which works only if the row already exists. Password signup creates it
 * during registration, so it did. Signing in with Google or Apple does not:
 * the provider proves the address and nothing else, so the account arrives
 * here with no buyer row and no seller row, and the update failed.
 *
 * The failure was swallowed and logged, the screen carried on, and the
 * person landed in the app with an account belonging to neither side of the
 * marketplace. Nothing worked, because there was nothing to work as -- and
 * signing out made it permanent, since login refused an account with no
 * role at all.
 *
 * So: create when it is missing, update when it is there. The server is the
 * one that knows which, and it says so in the profile it already returns --
 * `onboarding.next_step === "choose_role"` when neither role exists.
 */

import { createBuyer, createSeller } from './auth';
import { updateBuyerProfile, updateSellerProfile } from './profile';
import type { UserProfile } from '../../models/profile';

/** Create-if-missing is decided from the profile, not attempted blindly:
 *  create-buyer is a 400 when the row is already there, and update is a 400
 *  when it is not, so guessing costs a wasted round trip either way. */
export function hasBuyerRole(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile?.buyer_account);
}

export function hasSellerRole(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile?.seller_account);
}

export interface BuyerDetails {
  buyername?: string;
}

export interface SellerDetails {
  shop_name?: string;
  description?: string;
  shop_latitude?: number;
  shop_longitude?: number;
}

/**
 * Give the account a buyer side, whether or not it has one yet.
 *
 * Throws. Callers decide what a failure means, and for the onboarding
 * screens it means "do not pretend this worked" -- the person cannot use
 * the app without it, so it is not the best-effort write the old code
 * treated it as.
 */
export async function ensureBuyerRole(
  profile: UserProfile | null | undefined,
  details: BuyerDetails
): Promise<void> {
  const buyername = details.buyername?.trim();

  if (hasBuyerRole(profile)) {
    if (buyername) await updateBuyerProfile({ buyername });
    return;
  }

  // buyername is required by the create schema, so there has to be
  // something. A blank one would 422 and leave the account roleless, which
  // is the state this whole module exists to avoid.
  await createBuyer({ buyername: buyername || 'Buyer' });
  if (buyername) return;
}

/** The same, for the selling side. */
export async function ensureSellerRole(
  profile: UserProfile | null | undefined,
  details: SellerDetails
): Promise<void> {
  const shopName = details.shop_name?.trim();
  const location =
    details.shop_latitude != null && details.shop_longitude != null
      ? {
          shop_latitude: details.shop_latitude,
          shop_longitude: details.shop_longitude,
        }
      : {};

  if (hasSellerRole(profile)) {
    if (shopName || Object.keys(location).length) {
      await updateSellerProfile({
        ...(shopName ? { shop_name: shopName } : {}),
        ...location,
      });
    }
    return;
  }

  // shop_name, description and category_ids are all required by the create
  // schema. Categories are chosen later in the dashboard, so an empty list
  // is the honest value rather than a guess.
  await createSeller({
    shop_name: shopName || 'My shop',
    description: details.description?.trim() || 'Tell buyers what you sell.',
    category_ids: [],
  });

  if (Object.keys(location).length) {
    await updateSellerProfile(location);
  }
}
