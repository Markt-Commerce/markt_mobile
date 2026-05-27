/** True when the logged-in user is the seller who owns this listing. */
export function isOwnProductListing(
  currentUserId: string | undefined,
  sellerUserId: string | number | undefined
): boolean {
  if (!currentUserId || sellerUserId == null || sellerUserId === "") return false;
  return String(currentUserId) === String(sellerUserId);
}
