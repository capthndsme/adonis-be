import { DashData } from "../types/DashData"

export const ThingToText: Partial<Record<keyof DashData, string>> = {
  "HydrometerA": "Soil hydration% - Zone 1",
  "HydrometerB": "Soil hydration% - Zone 2",
  "UltrasonicA": "Rain/Tap water tank level%",
  "UltrasonicB": "Mixing tank level%"
}