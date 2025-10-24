import type { Session } from './types';

// Helper to convert a string to a Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper to convert a Uint8Array to a string
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

// Helper for URL-safe Base64 encoding
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper for URL-safe Base64 decoding
function base64UrlDecode(encoded: string): Uint8Array {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Compresses and encodes the essential parts of a session into a URL-safe string.
export async function encodeSessionToUrl(session: Session): Promise<string> {
  // Create a slimmer object for sharing to keep the URL length manageable.
  // We exclude the large originalContent and other non-essential data.
  const shareableData = {
    title: session.title,
    summary: session.summary,
    messages: session.messages,
    sources: session.sources,
    outputFormat: session.outputFormat,
    timestamp: session.timestamp,
    suggestedQuestions: session.suggestedQuestions,
    flashcards: session.flashcards,
    quiz: session.quiz,
  };

  const jsonString = JSON.stringify(shareableData);
  const dataArray = stringToUint8Array(jsonString);

  // Compress the data using the browser's built-in CompressionStream API
  const stream = new Blob([dataArray]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressedData = await new Response(stream).arrayBuffer();
  const compressedArray = new Uint8Array(compressedData);

  // Encode the compressed data into a URL-safe Base64 string
  const encodedData = base64UrlEncode(compressedArray);

  // Build the final URL with the payload in the hash
  const url = new URL(window.location.href);
  url.hash = `s=${encodedData}`;
  return url.toString();
}

// Decodes and decompresses session data from the URL hash.
export async function decodeSessionFromUrl(): Promise<Partial<Session> | null> {
  if (!window.location.hash || !window.location.hash.startsWith('#s=')) {
    return null;
  }

  const encodedData = window.location.hash.substring(3);

  try {
    const compressedArray = base64UrlDecode(encodedData);

    // Decompress the data using the DecompressionStream API
    const stream = new Blob([compressedArray]).stream().pipeThrough(new DecompressionStream('gzip'));
    const decompressedData = await new Response(stream).arrayBuffer();
    const jsonString = uint8ArrayToString(new Uint8Array(decompressedData));

    const sessionData = JSON.parse(jsonString);
    return sessionData as Partial<Session>;
  } catch (error) {
    console.error("Failed to decode or decompress session data:", error);
    throw new Error("Invalid or corrupted share link.");
  }
}