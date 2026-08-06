import pako from "pako";
import { Effect } from "effect";
import { DecompressionError } from "../errors";

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decompressUint8Array = <T>(compressedData: Uint8Array): T => {
  const decompressedData = pako.ungzip(compressedData, { to: "string" });
  const jsonObj = JSON.parse(decompressedData) as T;
  return jsonObj;
};

export const decompress = <T>(data: string): T => {
  const compressed = base64ToUint8Array(data);
  const obj = decompressUint8Array<T>(compressed);
  return obj;
};

// Effect-wrapped decompression
export const decompressEffect = <T>(
  data: string
): Effect.Effect<T, DecompressionError> =>
  Effect.try({
    try: () => decompress<T>(data),
    catch: (error) =>
      new DecompressionError({
        message: "Failed to decompress data",
        cause: error,
      }),
  });
