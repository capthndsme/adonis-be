import { Axios, AxiosResponse } from "axios";
import { baseApi } from "./baseApi";


export type Clock = {
  hours: number;
  minutes: number;
}
export interface Setting {

  thresholds: {
    soilMoisture: {
      low: number;
      high: number;
    };
    tankLevel: {
      low: number;
    };
  };
  waterTimes?: Clock[]
  thresholdEnabled?: boolean;
  timerBaseEnabled?: boolean;
  intervals: {
    soilMoistureCheck: number;
    tankLevelCheck: number;
  };
  password: string,
  serialPort: string,
  simulator?: boolean;
  activePreset?: number;
}

export type AuditType =
  "AUTOMATION_TRIGGER" |
  "SETTINGS_CHANGE" |
  "LOGIN" |
  "LOGOUT" |
  "TIME_AUTOMATION_TRIGGER" |
  "MANUAL_MODE" |
  "STATUS_UPDATE"
export class Audit {

  declare id: number


  declare createdAt: string


  declare updatedAt: string

  declare responsibleUser: number | null;


  declare action: AuditType;


  declare actionDescription: string | null;


  declare optVal: string | null;



}


export const AuditText: Record<AuditType, string> = {
  AUTOMATION_TRIGGER: "Automation Trigger",
  SETTINGS_CHANGE: "Settings Change",
  LOGIN: "Login",
  LOGOUT: "Logout",
  TIME_AUTOMATION_TRIGGER: "Time Automation Trigger",
  MANUAL_MODE: "Manual Mode",
  STATUS_UPDATE: "Status Update (Should not be seen)"
}
export const settingStrings: Record<string, string> = {
  'password': 'Password',
  'mixing_tank_refill_threshold': 'Mixing Tank Refill Threshold',
  'watering_duration_seconds': 'Watering Duration',
  'soilmoisture_trigger_open': 'Soil Moisture Trigger Open',
  'soilmoisture_trigger_close': 'Soil Moisture Trigger Close',
  'rainwater_trigger_open': 'Rainwater Trigger Open',
  'rainwater_trigger_close': 'Rainwater Trigger Close',
}


export const getAllSettings = () =>
  baseApi.get("/settings/get") as Promise<AxiosResponse<Setting>>;

export const getSetting = (key: keyof Setting) =>
  baseApi.get(`/settings/${key}`) as Promise<AxiosResponse<{ [key: string]: any }>>;

export const updateSetting = (key: keyof Setting, value: any) =>
  baseApi.post("/settings/set", { key, value }) as Promise<AxiosResponse<any>>;


export const getPreset = () => baseApi.get("/settings/presets") as Promise<AxiosResponse<Setting[]>>;

export const getAudits = (date?: string) => baseApi.get(`/audit?date=${date}`,) as Promise<AxiosResponse<Audit[]>>;
