// components/UserProviderServer.tsx
"use client";

import { UserProvider } from "@/contexts/UserContext";

export default function UserProviderServer({ user, children }: { user: any, children: React.ReactNode }) {
  return (
    <UserProvider userFromServer={user}>
      {children}
    </UserProvider>
  );
}