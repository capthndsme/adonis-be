import pigpio from 'pigpio';
import LogService from './LogService.js';

const { Gpio } = pigpio;

class GpioService {
  #manualMode = false;

  #lastStates: Partial<Record<GPIOObjects, number>> = {
    outflowA: 0,
    outflowB: 0,
    rainwaterToMain: 0,
    tapToMain: 0,
  };

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

    console.log("Delay starter");
    setTimeout(() => {
      // Initialize GPIO pins
      this.initPin(GPIOMap.manualMode, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });
      this.initPin(GPIOMap.outflowA, Gpio.OUTPUT);
      this.initPin(GPIOMap.outflowB, Gpio.OUTPUT);
      this.initPin(GPIOMap.rainwaterToMain, Gpio.OUTPUT);
      this.initPin(GPIOMap.tapToMain, Gpio.OUTPUT);

      // manual
      this.initPin(GPIOMap.outflowAManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });
      this.initPin(GPIOMap.outflowBManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });
      this.initPin(GPIOMap.tapManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });
      this.initPin(GPIOMap.rainwaterManual, Gpio.INPUT, { pullUpDown: Gpio.PUD_UP });

      this.loop();
    }, 3000);
  }

  initPin(pin: number, mode: number, options?: { pullUpDown: number }) {
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
    const manualModePin = new Gpio(GPIOMap.manualMode, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });
    const manualModeValue = manualModePin.digitalRead();
    /**
     * Pullup mode => 0 means TRUE
     */
    if (manualModeValue === 0) {
      this.#manualMode = true;
    } else {
      this.#manualMode = false;
    }
  }

  writeGpio(pin: GPIOObjects, state: 0 | 1, auto?: boolean) {
    const gpio = new Gpio(GPIOMap[pin], { mode: Gpio.OUTPUT });
    gpio.digitalWrite(state);

    this.#lastStates[pin] = state;
    if (auto) {
      LogService.createLog(
        "AUTOMATION_TRIGGER",
        null,
        `Automation ${pin} set to ${state ? 'OFF' : 'ON'}`,
        null
      );
    }
  }

  readGpio(pin: GPIOObjects) {
    const gpio = new Gpio(GPIOMap[pin], { mode: Gpio.INPUT });
    return gpio.digitalRead();
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