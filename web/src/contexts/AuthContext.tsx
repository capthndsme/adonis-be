import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Auth, AuthReturn } from "../types/Auth.type";

export const AuthContext = createContext<Auth>({
   hash: null,
   setHash: () => {},
});

AuthContext.displayName = "Auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
   const [hash, setHash] = useState<AuthReturn | null | undefined>(() => {
      const preload = localStorage.getItem("_MOANA_SSN_HASH");
      const userId = localStorage.getItem("_MOANA_USER_ID");
      console.log("get", preload, userId)
      if (typeof preload === "string" && typeof userId === "string") return {
         token: preload,
         userId: parseInt(userId)
      }
      return null;
   }); // Add useState hook

   useEffect(() => {
      if (hash === null || hash === undefined) return;
      console.log("set", hash)
      localStorage.setItem("_MOANA_SSN_HASH", hash?.token ?? "");
      localStorage.setItem("_MOANA_USER_ID", hash?.userId?.toString() ?? "")
   }, [hash?.token, hash?.userId]);
   const value = useMemo<Auth>(() => {
      return {
         hash,
         setHash,
      };
   }, [hash?.token, hash?.userId]);

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuth = () => {
   const auth = useContext(AuthContext);
   return auth;
};
