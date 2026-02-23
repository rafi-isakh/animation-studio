// Video Provider Registry

import type { VideoProvider, ProviderInfo, ProviderConstraints } from "./types";
import { soraProvider } from "./sora";
import { veo3Provider } from "./veo3";
import { grokI2VProvider } from "./grokI2V";

// Provider registry - add new providers here
const providers = new Map<string, VideoProvider>([
  [soraProvider.id, soraProvider as VideoProvider],
  [veo3Provider.id, veo3Provider as VideoProvider],
  [grokI2VProvider.id, grokI2VProvider as VideoProvider],
]);

/**
 * Get a provider by ID
 */
export function getProvider(providerId: string): VideoProvider | undefined {
  return providers.get(providerId);
}

/**
 * Get all available providers
 */
export function getAllProviders(): VideoProvider[] {
  return Array.from(providers.values());
}

/**
 * Get provider options for UI dropdown
 */
export function getProviderOptions(): ProviderInfo[] {
  return getAllProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
    description: provider.description,
    modelName: provider.modelName,
    constraints: provider.getConstraints(),
  }));
}

/**
 * Get the model name for a specific provider
 */
export function getProviderModelName(providerId: string): string | undefined {
  const provider = getProvider(providerId);
  return provider?.modelName;
}

/**
 * Get constraints for a specific provider
 */
export function getProviderConstraints(
  providerId: string
): ProviderConstraints | undefined {
  const provider = getProvider(providerId);
  return provider?.getConstraints();
}

/**
 * Get the default provider ID
 */
export function getDefaultProviderId(): string {
  return soraProvider.id;
}

/**
 * Check if a provider ID is valid
 */
export function isValidProviderId(providerId: string): boolean {
  return providers.has(providerId);
}

// Re-export types
export * from "./types";

// Re-export individual providers for direct access if needed
export { soraProvider } from "./sora";
export { veo3Provider } from "./veo3";
export { grokI2VProvider } from "./grokI2V";