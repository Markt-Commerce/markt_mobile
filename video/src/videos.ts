// The videos, as data. Every number is an edit decision; change and re-render.
//
// Music: "Allada" (Kevin MacLeod, CC BY 4.0) for all of them -- one sound for
// the brand -- but each ends on a different phrase of the track (it thins out
// at 48.4s, 115.5s and 192.0s), so back-to-back posts don't sound identical.

import type { VideoSpec } from "./timeline";

export const MARKETPLACE: VideoSpec = {
  id: "Marketplace",
  intro: "Your market, in your pocket.",
  outro: { headline: "Shop local.", sub: "Nearby sellers · Real conversations · Easy local delivery" },
  musicDrop: 48.4,
  beats: [
    {
      id: "feed",
      caption: { lead: "Shops", accent: "near you." },
      segments: [{ clip: "marketplace/01-feed", from: 0, to: 3.0, holdBefore: 1.4 }],
    },
    {
      id: "product",
      caption: { lead: "Real shops.", accent: "Real prices." },
      segments: [{ clip: "marketplace/02-product", from: 0.3, to: 5.6 }],
    },
    {
      id: "chat",
      caption: { lead: "Talk to the", accent: "seller first." },
      segments: [
        { clip: "marketplace/03-chat", from: 0.4, to: 2.6 }, // Message Seller -> the thread
        { clip: "marketplace/03-chat", from: 3.2, to: 7.6 }, // Temi replies
      ],
    },
    {
      id: "checkout",
      caption: { lead: "Delivery fee upfront.", accent: "Pay in seconds." },
      segments: [
        { clip: "marketplace/04-checkout", from: 0.6, to: 1.8 }, // add to cart
        { clip: "marketplace/04-checkout", from: 4.0, to: 7.0 }, // address -> real quote
        { clip: "marketplace/04-checkout", from: 8.5, to: 10.8 }, // wallet -> Proceed
        { clip: "marketplace/04-checkout", from: 11.4, to: 13.2 }, // Payment successful
      ],
      focus: { at: 3.4, scale: 1.1, originY: 0.42 },
    },
    {
      id: "tracking",
      caption: { lead: "Track it", accent: "to your door." },
      segments: [{ clip: "marketplace/05-tracking", from: 0.6, to: 6.6 }],
      focus: { at: 5.2, scale: 1.12, originY: 0.8 },
    },
  ],
};

// The feature stories are single takes (joining, paying etc. change state),
// cut into beats here -- see VIDEO_PIPELINE.md.
export const COMMUNITIES: VideoSpec = {
  id: "Communities",
  intro: "Find your people.",
  outro: { headline: "Shop with your community.", sub: "Communities · Nearby sellers · Real conversations" },
  musicDrop: 115.5,
  beats: [
    {
      id: "find",
      caption: { lead: "Find your", accent: "people." },
      segments: [{ clip: "communities/01-story", from: 0, to: 4.6 }],
    },
    {
      id: "join",
      caption: { lead: "Join in", accent: "one tap." },
      segments: [{ clip: "communities/01-story", from: 5.8, to: 9.6 }],
    },
    {
      id: "feed",
      caption: { lead: "Their posts,", accent: "in your feed." },
      segments: [
        { clip: "communities/01-story", from: 10.0, to: 12.6 }, // the community's posts
        { clip: "communities/01-story", from: 15.8, to: 20.5 }, // its chip on Home
      ],
    },
  ],
};

export const SHOPS_NEAR_YOU: VideoSpec = {
  id: "ShopsNearYou",
  intro: "Every shop around you.",
  outro: { headline: "Shop local.", sub: "Verified sellers · Sorted by distance · Easy local delivery" },
  musicDrop: 192.0,
  beats: [
    {
      id: "nearby",
      caption: { lead: "Shops near you,", accent: "by distance." },
      segments: [{ clip: "shops-near-you/01-story", from: 0, to: 4.4 }],
    },
    {
      id: "area",
      caption: { lead: "Somewhere else?", accent: "Switch area." },
      segments: [{ clip: "shops-near-you/01-story", from: 6.6, to: 12.4 }],
    },
    {
      id: "shop",
      caption: { lead: "Real shops.", accent: "Verified sellers." },
      segments: [{ clip: "shops-near-you/01-story", from: 12.6, to: 17.5 }],
    },
  ],
};

export const BUY_AND_SELL: VideoSpec = {
  id: "BuyAndSell",
  intro: "Buy. Sell. One account.",
  outro: { headline: "Your shop, in your pocket.", sub: "Switch roles in a tap · Accept orders on the go" },
  musicDrop: 48.4,
  beats: [
    {
      id: "switch",
      caption: { lead: "Shopping today?", accent: "Selling too." },
      segments: [{ clip: "buy-and-sell/01-story", from: 0, to: 5.2 }],
    },
    {
      id: "orders",
      caption: { lead: "New order?", accent: "It's right here." },
      segments: [{ clip: "buy-and-sell/01-story", from: 11.6, to: 15.2 }],
    },
    {
      id: "accept",
      caption: { lead: "Accept.", accent: "Start packing." },
      segments: [{ clip: "buy-and-sell/01-story", from: 15.2, to: 19.6 }],
      focus: { at: 1.6, scale: 1.14, originY: 0.18 },
    },
  ],
};

export const BETTER_PRICE: VideoSpec = {
  id: "BetterPrice",
  intro: "Ask for a better price.",
  outro: { headline: "Real conversations.", sub: "Chat with sellers · Offers that come off at checkout" },
  musicDrop: 115.5,
  beats: [
    {
      id: "offer",
      caption: { lead: "Sellers can", accent: "make you an offer." },
      segments: [{ clip: "better-price/01-story", from: 1.0, to: 3.9 }],
      focus: { at: 2.2, scale: 1.12, originY: 0.62 },
    },
    {
      id: "accept",
      caption: { lead: "Accept it", accent: "right in the chat." },
      segments: [{ clip: "better-price/01-story", from: 3.9, to: 6.0 }],
    },
    {
      id: "checkout",
      caption: { lead: "It comes off", accent: "at checkout." },
      segments: [
        { clip: "better-price/01-story", from: 19.6, to: 23.8 }, // discount applied in the cart
        { clip: "better-price/01-story", from: 26.0, to: 28.8 }, // wallet -> Payment successful
      ],
      focus: { at: 3.4, scale: 1.12, originY: 0.55 },
    },
  ],
};

export const SHARE_THE_RIDE: VideoSpec = {
  id: "ShareTheRide",
  intro: "Going the same way?",
  outro: { headline: "Easy local delivery.", sub: "Share the rider · Pay less · Never more" },
  musicDrop: 192.0,
  beats: [
    {
      id: "share",
      caption: { lead: "Same direction?", accent: "Share the rider." },
      segments: [
        { clip: "share-the-ride/01-optin", from: 8.0, to: 9.5 }, // Mama Bisi's shop
        { clip: "share-the-ride/01-optin", from: 27.0, to: 30.8 }, // "Share this delivery" on
      ],
      focus: { at: 4.4, scale: 1.12, originY: 0.68 },
    },
    {
      id: "pay",
      caption: { lead: "Pay the solo price.", accent: "Never more." },
      segments: [
        { clip: "share-the-ride/01-optin", from: 33.4, to: 36.4 }, // pay from the wallet
        { clip: "share-the-ride/01-optin", from: 38.6, to: 40.9 }, // "N500.00*" and its footnote
      ],
      focus: { at: 4.6, scale: 1.14, originY: 0.82 },
    },
    {
      id: "settled",
      caption: { lead: "Trip shared?", accent: "Money back." },
      segments: [
        { clip: "share-the-ride/02-settled", from: 3.6, to: 6.6 }, // delivery now N333.33
        { clip: "share-the-ride/02-settled", from: 12.4, to: 14.1 }, // +N167 in the wallet
      ],
      focus: { at: 4.4, scale: 1.12, originY: 0.3 },
    },
  ],
};

export const VIDEOS: VideoSpec[] = [
  MARKETPLACE,
  COMMUNITIES,
  SHOPS_NEAR_YOU,
  BUY_AND_SELL,
  BETTER_PRICE,
  SHARE_THE_RIDE,
];
