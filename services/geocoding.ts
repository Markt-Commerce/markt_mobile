import * as Location from "expo-location";
import logger from "../utils/logger";

export interface GeocodeHit {
  formatted_address: string;
  /** City/state, shown under the name so a buyer can see at a glance that a
   * result is nowhere near them. */
  context: string | null;
  /** Kept separately as well as in `context`, because an order's shipping
   * address still requires them as fields. */
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Address search, on OpenStreetMap rather than Google.
 *
 * Photon is komoot's OSM-backed geocoder, built for type-ahead specifically —
 * which is the thing the phone's own geocoder is bad at. It needs no API key,
 * no billing account and no Google project, so address search costs nothing
 * and stays unaffected by whatever the Maps key decision turns out to be.
 *
 * Two things had to be handled before it was usable here:
 *
 * Fuzzy matching crosses borders. "Under G Ogbo" returned *Unter den Linden,
 * Berlin* unbounded — a confident, completely wrong answer. Every query is
 * bounded to Nigeria, and biased to the buyer when we know where they are.
 *
 * Even bounded it will reach. The same query then returned a clinic in
 * Bauchi, 800km from the buyer. So results are filtered to a radius around
 * the bias point, and each row shows its city — a wrong answer should be
 * obviously wrong rather than quietly plausible.
 */

const PHOTON = "https://photon.komoot.io/api/";
//: Nigeria, west/south/east/north.
const NIGERIA_BBOX = "2.6,4.2,14.7,13.9";
//: Markt delivers in four cities; a result further than this from the buyer
//: is noise whatever the geocoder thinks.
const MAX_DISTANCE_KM = 150;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLng = r(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export async function searchAddresses(
  query: string,
  bias?: { latitude: number; longitude: number } | null
): Promise<GeocodeHit[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "8",
    bbox: NIGERIA_BBOX,
    lang: "en",
  });
  if (bias) {
    params.set("lat", String(bias.latitude));
    params.set("lon", String(bias.longitude));
  }

  try {
    const res = await fetch(`${PHOTON}?${params.toString()}`);
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const body = await res.json();

    const hits: GeocodeHit[] = (body.features ?? []).map((f: any) => {
      const p = f.properties ?? {};
      const [lng, lat] = f.geometry?.coordinates ?? [];
      const name = [p.name, p.street].filter(Boolean).join(", ");
      return {
        formatted_address: name || p.city || query,
        context: [p.city, p.state].filter(Boolean).join(", ") || null,
        city: p.city ?? null,
        state: p.state ?? null,
        latitude: lat,
        longitude: lng,
      };
    });

    const usable = hits.filter(
      (h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude)
    );
    if (!bias) return usable.slice(0, 5);

    return usable
      .filter(
        (h) =>
          distanceKm(bias.latitude, bias.longitude, h.latitude, h.longitude) <=
          MAX_DISTANCE_KM
      )
      .slice(0, 5);
  } catch (error) {
    logger.error("Photon search failed, falling back to the OS geocoder:", error);
    // The phone's own geocoder. Worse at partial queries, but it works
    // offline-ish and without a third party being up, so a search box that
    // has stopped working entirely is never the outcome.
    try {
      const found = await Location.geocodeAsync(query);
      return found.slice(0, 5).map((r) => ({
        formatted_address: query,
        context: null,
        city: null,
        state: null,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    } catch {
      return [];
    }
  }
}
