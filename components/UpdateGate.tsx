/**
 * Prompts for a store update when Remote Config says this build is behind.
 * Renders nothing otherwise. See services/appUpdate.ts for the parameters.
 *
 *  - Below the minimum version: a full-screen block with only "Update". There
 *    is no way past it, and hardware back does nothing -- an old build that
 *    talks to a changed API is the thing this exists to stop.
 *  - Below the latest version: a dismissible card, shown once per version.
 *
 * Checks on launch and whenever the app returns to the foreground (at most
 * hourly), so someone who leaves the app open for days still gets told.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Modal, Text, View } from "react-native";

import Button from "./button";
import { useTokens } from "../theme/useTokens";
import {
  UpdateStatus,
  dismiss,
  evaluate,
  fetchEntries,
  openStore,
  readCachedEntries,
  wasDismissed,
} from "../services/appUpdate";

const RECHECK_MS = 60 * 60 * 1000;

export default function UpdateGate() {
  const t = useTokens();
  const [status, setStatus] = useState<UpdateStatus>({ kind: "none" });
  const lastFetch = useRef(0);

  const apply = useCallback(async (next: UpdateStatus) => {
    if (next.kind === "optional" && (await wasDismissed(next.latest))) {
      setStatus({ kind: "none" });
      return;
    }
    setStatus(next);
  }, []);

  const check = useCallback(async () => {
    lastFetch.current = Date.now();
    const entries = await fetchEntries();
    // null = fetch failed: keep whatever the cache already decided.
    if (entries) await apply(evaluate(entries));
  }, [apply]);

  useEffect(() => {
    // Cache first, so a required update blocks immediately and offline --
    // then the network, in that order, so a slow cache read can never land
    // on top of the fresh answer.
    (async () => {
      await apply(evaluate(await readCachedEntries()));
      await check();
    })();

    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && Date.now() - lastFetch.current > RECHECK_MS) check();
    });
    return () => sub.remove();
  }, [apply, check]);

  if (status.kind === "none") return null;

  const required = status.kind === "required";
  const onLater = async () => {
    if (status.kind === "optional") await dismiss(status.latest);
    setStatus({ kind: "none" });
  };

  return (
    <Modal
      visible
      transparent={!required}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={required ? () => {} : onLater}
    >
      <View
        className={
          required
            ? "flex-1 items-center justify-center px-6 bg-surface-page"
            : "flex-1 items-center justify-center px-6"
        }
        style={required ? undefined : { backgroundColor: t.scrim }}
      >
        <View className="w-full max-w-[400px] rounded p-6 bg-surface-raised">
          <Text className="text-xl font-bold text-text-primary">
            {required ? "Update required" : "Update available"}
          </Text>
          <Text className="mt-2 text-base text-text-secondary">
            {status.message ??
              (required
                ? "This version of Markt is no longer supported. Update to keep using the app."
                : "A new version of Markt is available with the latest improvements.")}
          </Text>
          <View className="mt-6 gap-3">
            <Button text="Update" onPress={() => openStore(status.storeUrl)} />
            {!required && (
              <Button text="Not now" variant="secondary" onPress={onLater} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
