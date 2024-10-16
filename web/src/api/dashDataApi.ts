import { AxiosResponse } from "axios";
import { baseApi } from "./baseApi";
import { DashData } from "../types/DashData";



export const getData = () => baseApi.get("/dash/data") as Promise<AxiosResponse<DashData>>;


export const getPercentileData = async () => {
  const res = (await getData()).data;
  const HYDROMETER_MAX = 100; // Hydrometer is 0-100
  const ULTRASONIC_MAX = 450; // Ultrasonic is 0-450

  console.log("Res", res)
  return {
    HydrometerA: res.HydrometerA ? (res.HydrometerA / HYDROMETER_MAX * 100) : 0,
    HydrometerB: res.HydrometerB ? (res.HydrometerB / HYDROMETER_MAX * 100) : 0,
    UltrasonicA: res.UltrasonicA ? (res.UltrasonicA / ULTRASONIC_MAX * 100) : 0,
    UltrasonicB: res.UltrasonicB ? (res.UltrasonicB / ULTRASONIC_MAX * 100) : 0,
    ManualMode: res.ManualMode
  } as const as DashData;
};