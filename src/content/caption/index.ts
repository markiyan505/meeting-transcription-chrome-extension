/**
 * Main module for working with captions
 * Exports all necessary classes and types
 */

export * from "./types";
export { AdapterFactory } from "./AdapterFactory";

import { AdapterFactory } from "./AdapterFactory";

export { TranscriptonicAdapter } from "./adapters/TranscriptonicAdapter";
export { LiveCaptionsAdapter } from "./adapters/LiveCaptionsAdapter";
export { logCaptionEvent, handleCaptionError } from "./utils";

/**
 * Quick access to creating caption adapter
 */
export async function createCaptionAdapterForCurrentPlatform(config?: any) {
  const factory = AdapterFactory.getInstance();
  const adapter = factory.createAdapterForCurrentPlatform(config);

  if (!adapter) {
    throw new Error("No adapter available for current platform");
  }

  const initResult = await adapter.initialize();
  if (!initResult.success) {
    throw new Error(`Failed to initialize adapter: ${initResult.error}`);
  }

  return adapter;
}

/**
 * Checks if current platform is supported
 */
export function isCurrentPlatformSupported(): boolean {
  const factory = AdapterFactory.getInstance();
  const platform = factory.detectPlatform();
  return factory.isPlatformSupported(platform);
}

/**
 * Gets information about current platform
 */
export function getCurrentPlatformInfo() {
  const factory = AdapterFactory.getInstance();
  const platform = factory.detectPlatform();
  return factory.getPlatformInfo(platform);
}
