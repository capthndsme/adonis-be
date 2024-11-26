import { AxiosResponse } from "axios";
import { baseApi } from "./baseApi";

export const validateToken = () => 
  baseApi.post("/auth/check")

export const login = async ( username: string, password: string): Promise<AxiosResponse<{
  token: string,
  userId: number
}>> =>
  baseApi.post("/auth/login", {
    username,
    password
  });

export const logout = () =>
  baseApi.post("/auth/logout");


export default {
  validateToken,
  login,
  logout
}