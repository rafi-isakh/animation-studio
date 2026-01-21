"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnUI/Select";
import { getProviderOptions } from "./providers";
import type { ProviderInfo } from "./providers/types";

interface ProviderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ProviderSelector({
  value,
  onChange,
  disabled = false,
}: ProviderSelectorProps) {
  const providers: ProviderInfo[] = getProviderOptions();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
        {providers.map((provider) => (
          <SelectItem
            key={provider.id}
            value={provider.id}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {provider.name}
                {provider.modelName && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({provider.modelName})
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {provider.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}