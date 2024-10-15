import { AxiosResponse } from "axios";
import { baseApi } from "./baseApi";
 
export type ISettings = {
  password: string,
  mixing_tank_refill_threshold:number, // Example: Refill when Tank 2 is below 20%
  watering_duration_seconds: number,   
  soilmoisture_trigger_open: number,
  soilmoisture_trigger_close: number,
  rainwater_trigger_open: number,
  rainwater_trigger_close: number,
  // Example: Water for 30 seconds
}

export const settingStrings: Record<keyof ISettings, string> = {
  'password': 'Password',
  'mixing_tank_refill_threshold': 'Mixing Tank Refill Threshold',
  'watering_duration_seconds': 'Watering Duration',
  'soilmoisture_trigger_open': 'Soil Moisture Trigger Open',
  'soilmoisture_trigger_close': 'Soil Moisture Trigger Close',
  'rainwater_trigger_open': 'Rainwater Trigger Open',
  'rainwater_trigger_close': 'Rainwater Trigger Close',
}


export const getAllSettings = () => 
  baseApi.get("/settings") as Promise<AxiosResponse<ISettings>>;

export const getSetting = (key: keyof ISettings) => 
  baseApi.get(`/settings/${key}`) as Promise<AxiosResponse<{ [key: string]: any }>>;

export const updateSetting = (key: keyof ISettings, value: any) => 
  baseApi.post("/settings", { key, value }) as Promise<AxiosResponse<any>>; 