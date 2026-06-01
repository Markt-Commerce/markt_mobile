import React from "react";
import { Redirect } from "expo-router";

/** Legacy /niches entry — discover lives at /discoverNiches */
export default function NichesIndexRedirect() {
  return <Redirect href="/discoverNiches" />;
}
