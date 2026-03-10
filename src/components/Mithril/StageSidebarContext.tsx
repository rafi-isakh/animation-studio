"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface StageSidebarContextValue {
  /** Register the DOM node that acts as the sidebar slot */
  setSidebarNode: (node: HTMLDivElement | null) => void;
  /** The DOM node (null until mounted) */
  sidebarNode: HTMLDivElement | null;
}

const StageSidebarContext = createContext<StageSidebarContextValue>({
  setSidebarNode: () => {},
  sidebarNode: null,
});

export function StageSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarNode, setSidebarNodeState] = useState<HTMLDivElement | null>(null);
  const setSidebarNode = useCallback((node: HTMLDivElement | null) => {
    setSidebarNodeState(node);
  }, []);

  return (
    <StageSidebarContext.Provider value={{ sidebarNode, setSidebarNode }}>
      {children}
    </StageSidebarContext.Provider>
  );
}

export function useStageSidebar() {
  return useContext(StageSidebarContext);
}

/**
 * Renders children into the pipeline's sidebar slot via a portal.
 * Use inside any stage component to inject controls into the left panel.
 */
export function StageSidebarPortal({ children }: { children: ReactNode }) {
  const { sidebarNode } = useStageSidebar();
  if (!sidebarNode) return null;
  return createPortal(children, sidebarNode);
}
