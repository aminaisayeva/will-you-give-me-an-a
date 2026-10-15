"use client";

import { createContext, useContext } from "react";
import type { MyCookedAccount } from "@/app/actions/cooked-account";

export type AuthMode = "signup" | "login" | "profile" | "edit";

export type CookedAccountState = {
  me: MyCookedAccount | null; // null while loading
  openAuth: (mode: AuthMode) => void;
};

const Ctx = createContext<CookedAccountState>({ me: null, openAuth: () => {} });

export const CookedAccountProvider = Ctx.Provider;

export function useCookedAccount() {
  return useContext(Ctx);
}
