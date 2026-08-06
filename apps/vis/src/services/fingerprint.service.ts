/**
 * Browser Fingerprint Service
 *
 * Generates a unique, stable identifier for the browser using FingerprintJS.
 * Used for development authentication bypass.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

class FingerprintServiceClass {
  private cachedFingerprint: string | null = null;
  private fpPromise: Promise<any> | null = null;

  /**
   * Get the browser fingerprint
   * Cached after first generation for performance
   */
  public async getFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    if (!this.fpPromise) {
      this.fpPromise = FingerprintJS.load();
    }

    const fp = await this.fpPromise;
    const result = await fp.get();
    this.cachedFingerprint = result.visitorId;

    console.log('[FINGERPRINT] Generated fingerprint:', this.cachedFingerprint);

    return this.cachedFingerprint as string;
  }

  /**
   * Get the cached fingerprint synchronously (for headers)
   * Returns null if fingerprint hasn't been generated yet
   */
  public getCachedFingerprint(): string | null {
    return this.cachedFingerprint;
  }

  /**
   * Clear the cached fingerprint (for testing)
   */
  public clearCache(): void {
    this.cachedFingerprint = null;
    this.fpPromise = null;
  }
}

export const FingerprintService = new FingerprintServiceClass();
