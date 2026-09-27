import { File } from "expo-file-system";

/**
 * Append a local file (file:// URI) to FormData in a way Expo's WinterCG
 * fetch can serialize.
 *
 * The classic React Native `{ uri, name, type }` part throws
 * "Unsupported FormDataPart implementation" under Expo SDK's global fetch —
 * its converter only understands strings, Blobs, or objects exposing
 * `bytes()`. expo-file-system's File wraps the local file and implements the
 * Blob interface (including `bytes()`, `name`, and a `type` derived from the
 * extension), which the converter streams correctly.
 */
export function appendLocalFile(
  formData: FormData,
  field: string,
  uri: string,
  filename?: string,
) {
  const file = new File(uri);
  formData.append(field, file as unknown as Blob, filename ?? file.name);
}
