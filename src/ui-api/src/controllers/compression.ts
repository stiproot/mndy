import pako from 'pako';

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const decompressUint8Array = (compressedData: Uint8Array): any => {
  const decompressedData = pako.ungzip(compressedData, { to: 'string' });
  const jsonObj = JSON.parse(decompressedData);
  return jsonObj;
}

export const decompress = (data: string): any => {
  const compressed = base64ToUint8Array(data);
  const obj = decompressUint8Array(compressed);
  return obj;
}