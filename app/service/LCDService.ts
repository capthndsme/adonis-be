import { existsSync } from "fs";
import { type Sensors } from "./SensorService.js";

import LCD from 'raspberrypi-liquid-crystal'
class LCDService {

  readonly #lcd: LCD;
  readonly #RPI = existsSync('/dev/i2c-1')

  constructor() {
    this.#lcd = new LCD( 1, 0x26, 16, 2 );
    if (this.#RPI)
      this.#lcd.beginSync();
    else 
      console.log("LCD not initialised")
  }


  update(data: Sensors & {
    ManualMode: boolean
  }) {
    if (!this.#RPI) return console.warn('LCD not available')
    const {
      
      sensors: {
        soilMoisture,
        ultrasonic,
      },
      ManualMode,
      
    } = data;
    this.#lcd.clearSync();
    if (ManualMode) {
      this.#lcd.setCursorSync(0,1)
      this.#lcd.printSync("Manual")
    } else {
      this.#lcd.setCursorSync(0,1)
      this.#lcd.printSync("Auto")

      this.#lcd.setCursorSync(0,2)
      this.#lcd.printSync(
        ` H1: ${soilMoisture.A} H2: ${soilMoisture.B} U1: ${ultrasonic.mainTank} U2: ${ultrasonic.secondTank}`
      )
    }
  }
}


export default new LCDService();