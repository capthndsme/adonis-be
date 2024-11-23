import pigpio from 'pigpio';
import LogService from './LogService.js';
import { sleep } from '../util.js';
import { existsSync } from 'fs';

const { Gpio } = pigpio;

class GpioService {
    #manualMode = false;
    readonly #isPi = existsSync("/dev/i2c-1");
    #lastStates: Partial<Record<GPIOObjects, number>> = {
        outflowA: 0,
        outflowB: 0,
        rainwaterToMain: 0,
        tapToMain: 0,
    };
    #noopMode = false; // Add NOOP mode flag  

    constructor() {
        console.log("GPIO attempt init")
        this.#noopMode = !this.#isPi; // Activate NOOP mode if not on a Pi
        if (this.#noopMode) {
            console.warn("Raspberry Pi not detected, operating in NOOP (simulation) mode.");
        }
    }

    getManualMode() {
        return this.#manualMode;
    }

    getLastState(pin: GPIOObjects) {
        return this.#lastStates[pin];
    }

    getLastStates() {
        return this.#lastStates;
    }

    initialise() {
        console.log(`ManualMode: init`);
        if (this.#noopMode) {
          console.log("Running in NOOP mode, skipping GPIO initialization.");
          setTimeout(() => {
            this.loop();
          }, 3000);
          return;
        }

        console.log("Delay starter");
        setTimeout(async () => {
            console.log("Manual Mode pin init")
            this.initPin(GPIOMap.manualMode, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });
            await sleep(200)
            console.log("Outflow pin A init")
            this.initPin(GPIOMap.outflowA, Gpio.OUTPUT);
            await sleep(200)
            console.log("Outflow pin B init")
            this.initPin(GPIOMap.outflowB, Gpio.OUTPUT);

            await sleep(200)
            console.log("RainwaterToMain pin init")
            this.initPin(GPIOMap.rainwaterToMain, Gpio.OUTPUT);

            await sleep(200)
            console.log("Taptomain pin init")
            this.initPin(GPIOMap.tapToMain, Gpio.OUTPUT);

            await sleep(200)
            console.log("Manual Outflow A pin init")
            this.initPin(GPIOMap.outflowAManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });

            await sleep(200)
            console.log("Manual Outflow B pin init")
            this.initPin(GPIOMap.outflowBManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });

            await sleep(200)
            console.log("Manual Tap pin init")
            this.initPin(GPIOMap.tapManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });

            await sleep(200)
            console.log("Manual Rainwater pin init")
            this.initPin(GPIOMap.rainwaterManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });

            this.loop();
        }, 3000);
    }

    initPin(pin: number, mode: number, options?: { pullUpDown: number }) {
      if(this.#noopMode){
        return null; // return null in NOOP mode
      }
        const gpio = new Gpio(pin, { mode, ...options });
        return gpio;
    }

    async loop() {
        try {
            await this.checkManualMode();
        } catch (e) {
            console.error(`error while looping gpio`);
            console.error(e);
        }
        setTimeout(() => this.loop(), 1000);
    }

    async checkManualMode() {
        if(this.#noopMode){
            return
        }
        const manualModePin = new Gpio(GPIOMap.manualMode, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });
        const manualModeValue = manualModePin.digitalRead();
        this.#manualMode = manualModeValue === 0;
    }

    writeGpio(pin: GPIOObjects, state: 0 | 1, auto?: boolean) {
        this.#lastStates[pin] = state;

        if (this.#noopMode) {
            console.log(`NOOP MODE: Would write ${state} to pin ${pin} (${GPIOMap[pin]})`);
        } else {
            const gpio = new Gpio(GPIOMap[pin], { mode: Gpio.OUTPUT });
            gpio.digitalWrite(state);
        }

        if (auto) {
            LogService.createLog(
                "AUTOMATION_TRIGGER",
                null,
                `Automation ${pin} set to ${state ? 'OFF' : 'ON'}`,
                null
            );
        }
    }

    readGpio(pin: GPIOObjects): number {
        if (this.#noopMode) {
            console.log(`NOOP MODE: Would read from pin ${pin} (${GPIOMap[pin]}), simulating 0.`);
            return 0; // Simulate a default value, you can change this if needed
        } else {
            const gpio = new Gpio(GPIOMap[pin], { mode: Gpio.INPUT });
            return gpio.digitalRead();
        }
    }
}

export default new GpioService();

export const GPIOMap = {
    outflowA: 4,
    outflowB: 17,
    rainwaterToMain: 26,
    tapToMain: 22,
    manualMode: 23,
    outflowAManual: 24,
    outflowBManual: 25,
    tapManual: 5,
    rainwaterManual: 6,
};

export type GPIOObjects = keyof typeof GPIOMap;