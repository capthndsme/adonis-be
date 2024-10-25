import env from "#start/env";
import { Bcrypt } from "@adonisjs/core/hash/drivers/bcrypt";
import { existsSync, readFileSync, writeFileSync } from "fs";

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
}

class Settings {
  #settings: Setting;
  readonly #configPath = `${env.get('DATAPATH')}/conf.json`;
  readonly #bcrypt = new Bcrypt({})
  constructor() {
    if (existsSync(this.#configPath)) {
      const data = JSON.parse(readFileSync(this.#configPath).toString());
      this.#settings = {
        ...data
      }
    } else {
      /**
       * initialise a default CONF.
       */
      console.log(`No settings - creating default.`)
      this.#settings = {

        thresholds: {
          soilMoisture: {
            low: 30,
            high: 80
          },
          tankLevel: {
            low: 20,
          }, 
          // secondTankLevel
          /** SOLENOID */
        },
        intervals: {
          soilMoistureCheck: 4000,
          tankLevelCheck: 4000
        },
        serialPort: '/dev/ttyUSB0',
        /**
         * jasper (all small no spaces)
         */
        password: '$2a$10$QHbsQveqUbpu84FSol.XzODBrJ0vjxKG7SQDif2VsetHVEa/QR0I6',
        simulator: false
      };
      this.saveSetting();
    }
  }

  getSettings() {
    return this.#settings;
  }

  changeSetting(setting: Setting) {
    this.#settings = {
      ...this.#settings,
      ...setting
    } 
    this.saveSetting();
  }

  saveSetting() {
    const data = JSON.stringify(this.#settings);
    writeFileSync(this.#configPath, data);
  }


  async setPassword(password: string) {
    this.#settings.password = await this.#bcrypt.make(password);
    this.saveSetting();
  }
}


export default new Settings();