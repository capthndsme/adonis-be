import { AxiosResponse } from "axios";
import { baseApi } from "./baseApi";

export const validateToken = () => 
  baseApi.post("/auth/check")

export const login = async (password: string): Promise<AxiosResponse<string>> =>
  baseApi.post("/auth/login", {
    password
  });

export const logout = () =>
  baseApi.post("/auth/logout");


export default {
  validateToken,
  login,
  logout
}