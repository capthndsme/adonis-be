import { type GPIOObjects } from "../service/GpioService.js"

export type DashData = {
  HydrometerA?: number,
  HydrometerB?: number,
  UltrasonicA?: number,
  UltrasonicB?: number,
  ManualMode?: boolean,
  LastStates?: Partial<Record<GPIOObjects, number>>
}

 