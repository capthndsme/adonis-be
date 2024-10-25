import rpio from 'rpio'
import LogService from './LogService.js';
class GpioService {
  #manualMode = false;

  #lastStates: Partial<Record<GPIOObjects, number>> = {
    outflowA: 0,
    outflowB: 0,
    rainwaterToMain: 0,
    tapToMain: 0,
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
    console.log(`ManualMode: init`)
    rpio.init({
      gpiomem: false,
      mapping: 'gpio'
    })
    console.log("Delay starter")
    setTimeout(() => {
      rpio.open(GPIOMap.manualMode, rpio.INPUT, rpio.PULL_UP)
      rpio.open(GPIOMap.outflowA, rpio.OUTPUT, 0)
      rpio.open(GPIOMap.outflowB, rpio.OUTPUT, 0)
      rpio.open(GPIOMap.rainwaterToMain, rpio.OUTPUT, 0)
      rpio.open(GPIOMap.tapToMain, rpio.OUTPUT, 0)


      // manual

      rpio.open(GPIOMap.outflowAManual, rpio.INPUT, rpio.PULL_UP)
      rpio.open(GPIOMap.outflowBManual, rpio.INPUT, rpio.PULL_UP)
      rpio.open(GPIOMap.tapManual, rpio.INPUT, rpio.PULL_UP)
      rpio.open(GPIOMap.rainwaterManual, rpio.INPUT, rpio.PULL_UP)
  
      this.loop();
    }, 3000)
  }

  async loop() {
    try {
      await this.checkManualMode();
 
    } catch(e) {
      console.error(`error while looping gpio`)
      console.error(e)
    }
    setTimeout(() => this.loop(), 1000)
  }

  async checkManualMode() {
    const manualModeValue = rpio.read(GPIOMap.manualMode);
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
    rpio.write(GPIOMap[pin], state);

    this.#lastStates[pin] = state;
    if (auto) {
      LogService.createLog(
        "AUTOMATION_TRIGGER",
        null,
        `Automation ${pin} set to ${state ? 'OFF' : 'ON'}`,
        null
      )
    }
  }

  readGpio(pin: GPIOObjects) {
    return rpio.read(GPIOMap[pin]);
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
  rainwaterManual: 6
}

export type GPIOObjects = keyof typeof GPIOMap