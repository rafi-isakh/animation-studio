// Video Provider Registry

import type { VideoProvider, ProviderInfo, ProviderConstraints } from "./types";
import { soraProvider } from "./sora";

// Provider registry - add new providers here
const providers: Map<string, VideoProvider> = new Map([
  [soraProvider.id, soraProvider],
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