"use client";

import { createContext, useContext } from "react";
import type { MenuAccount } from "@/components/MenuBar";

// Everything the desktop's windows need to know about the signed-in user.
// Rendered on the server and refreshed after every Server Action.
export type DesktopAccount = MenuAccount & {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null; // uploaded avatar only
  googlePhoto: string | null;
  memberSince: string;
  hasPassword: boolean;
  loginMethods: string;
};

const AccountContext = createContext<DesktopAccount | null>(null);

export const AccountProvider = AccountContext.Provider;

export function useAccount() {
  return useContext(AccountContext);
}
