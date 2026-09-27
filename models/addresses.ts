/** The buyer's address book. Backend: markt_python app/users/addresses.py */

export type BuildingType =
  | "house"
  | "apartment"
  | "office"
  | "shop"
  | "hostel"
  | "school"
  | "hospital"
  | "other";

export interface SavedAddress {
  id: number;
  /** What the buyer calls it — "Home", "Mum's place". Optional on purpose:
   * forcing a name on a one-off delivery address is friction for no gain. */
  label: string | null;
  /** The line shown in lists, as the geocoder returned it. */
  formatted_address: string;
  latitude: number;
  longitude: number;
  /** As the geocoder reported them. Not used to find the place — the
   * coordinate does that — but an order's shipping address still requires
   * them as fields. */
  city: string | null;
  state: string | null;
  building_type: BuildingType;
  /** Gate code, or whatever gets someone past the door. */
  entry_code: string | null;
  /** "Blue gate opposite the mosque" — the thing that actually finds it. */
  directions: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_default: boolean;
  last_used_at: string | null;
  /** label, falling back to the formatted address. */
  display_label: string;
}

export interface SavedAddressInput {
  label?: string | null;
  formatted_address: string;
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
  building_type?: BuildingType;
  entry_code?: string | null;
  directions?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  is_default?: boolean;
}

/** The icons on the address form, in the order Chowdeck shows them. */
export const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "hostel", label: "Hostel" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "other", label: "Other" },
];
