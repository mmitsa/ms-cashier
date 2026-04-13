"use client";

import { createContext, useContext, type ReactNode } from "react";

type StoreContextValue = {
  subdomain: string;
};

const StoreContext = createContext<StoreContextValue>({ subdomain: "" });

export function StoreProvider({
  subdomain,
  children,
}: {
  subdomain: string;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={{ subdomain }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
