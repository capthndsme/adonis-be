import rpio from 'rpio'
class GpioService {
  #manualMode = false;

  getManualMode() {
    return this.#manualMode;
  }


  initialise() {
    console.log(`ManualMode: init`)
    rpio.init({
      gpiomem: false,
      mapping: 'gpio'
    })

    rpio.open(GPIOMap.manualMode, rpio.INPUT, rpio.PULL_UP)
    rpio.open(GPIOMap.outflowA, rpio.OUTPUT, 0)
    rpio.open(GPIOMap.outflowB, rpio.OUTPUT, 0)
    rpio.open(GPIOMap.rainwaterToMain, rpio.OUTPUT, 0)
    rpio.open(GPIOMap.tapToMain, rpio.OUTPUT, 0)

    this.loop();
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

  writeGpio(pin: GPIOObjects, state: 0 | 1) {
    rpio.write(GPIOMap[pin], state);
  }

  readGpio(pin: GPIOObjects) {
    return rpio.read(GPIOMap[pin]);
  }
}


export default new GpioService();

 

export const GPIOMap = {
  outflowA: 4,
  outflowB: 17,
  rainwaterToMain: 27,
  tapToMain: 22,
  manualMode: 23,
  outflowAManual: 24,
  outflowBManual: 25,
  tapManual: 5,
  rainwaterManual: 6
}

export type GPIOObjects = keyof typeof GPIOMap