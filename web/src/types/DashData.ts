export type DashData = {
  HydrometerA?: number,
  HydrometerB?: number,
  UltrasonicA?: number,
  UltrasonicB?: number,
  ManualMode?: boolean,
  LastStates?: {
    outflowA: number,
    outflowB: number,
    rainwaterToMain: number,
    tapToMain: number
  }
}

