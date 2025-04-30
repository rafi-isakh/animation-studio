// components/UserProviderServer.tsx
"use client";

import { Webnovel } from "@/components/Types";
import { WebnovelsProvider } from "@/contexts/WebnovelsContext";
export default function WebnovelsProviderServer({ webnovelsMetadata, children }: { webnovelsMetadata: Webnovel[], children: React.ReactNode }) {
  return (
    <WebnovelsProvider webnovelsMetadata={webnovelsMetadata}>
      {children}
    </WebnovelsProvider>
  );
}