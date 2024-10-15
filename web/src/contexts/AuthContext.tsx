import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Auth } from "../types/Auth.type";

export const AuthContext = createContext<Auth>({
   hash: null,
   setHash: () => {},
});

AuthContext.displayName = "Auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
   const [hash, setHash] = useState<string | null | undefined>(() => {
      const preload = localStorage.getItem("_MOANA_SSN_HASH");
      if (typeof preload === "string") return preload;
      return null;
   }); // Add useState hook

   useEffect(() => {
      localStorage.setItem("_MOANA_SSN_HASH", hash ?? "");
   }, [hash]);
   const value = useMemo<Auth>(() => {
      return {
         hash,
         setHash,
      };
   }, [hash]);

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuth = () => {
   const auth = useContext(AuthContext);
   return auth;
};
