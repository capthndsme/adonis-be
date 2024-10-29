import { existsSync } from "fs";
import { type Sensors } from "./SensorService.js";

import LCD from 'raspberrypi-liquid-crystal'
class LCDService {

  readonly #lcd: LCD;
  readonly #RPI = existsSync('/dev/i2c-1');

  constructor() {

    this.#lcd = new LCD(1, 0x26, 16, 2);
    if (this.#RPI)
      this.#lcd.beginSync();
    else
      console.log("LCD not initialised")
  }


  update(data: Sensors & {
    ManualMode: boolean,
    LastStates?: {
      outflowA?: number,
      outflowB?: number,
      rainwaterToMain?: number,
      tapToMain?: number
    }
  }) {
    if (!this.#RPI) return console.warn('LCD not available')
    const {

      sensors: {
        soilMoisture,
        ultrasonic,
      },
      ManualMode,

    } = data;

    if (ManualMode) {
      const outflowAIndicator = data.LastStates?.outflowA === 0 ? 'R1 ON' : 'R1 OFF';
      const outflowBIndicator = data.LastStates?.outflowB === 0 ? 'R2 ON' : 'R2 OFF';
      const tapIndicator = data.LastStates?.tapToMain === 0 ? 'T1 ON' : 'T1 OFF';
      const rainwaterIndicator = data.LastStates?.rainwaterToMain === 0 ? 'T2 ON' : 'T2 OFF';
      this.#lcd.setCursorSync(0, 0)
      this.#lcd.printSync(`MN ${outflowAIndicator} ${outflowBIndicator}              `)
      this.#lcd.setCursorSync(0, 1)
      this.#lcd.printSync(`${tapIndicator} ${rainwaterIndicator}                  `)
    } else {
      this.#lcd.setCursorSync(0, 0)
      this.#lcd.printSync(`AT R1:${soilMoisture.A?.toFixed(0)} R2:${soilMoisture.B?.toFixed(0)}   `)

      this.#lcd.setCursorSync(0, 1)
      this.#lcd.printSync(
        `T1: ${this.convertPercToLitre(ultrasonic.secondTank ?? 0).toFixed(0)}L T2: ${this.convertPercToLitre(ultrasonic.mainTank ?? 0).toFixed(0)}L     `
      )
    }
  }

  convertPercToLitre(d: number) {
    // our tank capacity in litre
    const TANK_CAPACITY = 40;

    // map 0-100% to 0-40L
    return (d / 100) * TANK_CAPACITY;


  }
}


export default new LCDService();