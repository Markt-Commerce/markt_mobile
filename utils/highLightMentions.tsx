import React from "react";
import { Text } from "react-native";
import { Link } from "expo-router";

/**
 * Converts mentions (starting with @) in text into clickable Links.
 * @param {string} text - The input string to parse.
 * @returns {React.ReactNode[]} - Array of Text/Link elements.
 */
export function highlightMentions(text: string): React.ReactNode[] {
  // Regex to find words starting with @ (alphanumeric and underscores allowed)
  // Do NOT use the global 'g' flag when using .split and .test across iterations.
  const mentionRegex = /(@[a-zA-Z0-9_]+)/;

  // Split text by mentions (keeping the mentions in the result)
  const parts = text.split(mentionRegex);

  const highlightedParts = parts.map((part, index) => {
    // The split keeps mentions as separate parts; detect mentions deterministically
    if (part.startsWith("@")) {
      const username = part.slice(1); // remove '@'
      return (
        <Link key={index} href={`/shopDetails/${username}`} style={{ color: "#007AFF", fontWeight: "bold" }}>
          {part}
        </Link>
      );
    } else {
      return (
        <Text key={index} style={{ color: "#000" }}>
          {part}
        </Text>
      );
    }
  });
  
  return highlightedParts;
}
