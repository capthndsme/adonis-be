
 
import { DashData } from "../types/DashData.response.js";
import GpioService, { GPIOMap, GPIOObjects } from "./GpioService.js";
import LCDService from "./LCDService.js";
import SensorService, { Sensors } from "./SensorService.js";
import SettingsService from "./SettingsService.js";


class TheService {

  booted = false;
  private manualStates: Record<string, boolean> = {
    outflowA: false,
    outflowB: false,
    tap: false,
    rainwater: false
  };
  private previousSwitchStates: Record<string, number> = {
    outflowAManual: 1,
    outflowBManual: 1,
    tapManual: 1,
    rainwaterManual: 1
  };
  currentData: Sensors | null = null;
  boot() {
    if (this.booted) return console.log("[THESERVICE] ALREADY BOOTED");
    this.booted = true;
    console.log(`THE SERVICE HAS BOOT`)
    // start segment.
    this.startup();
  }

  async startup() {
    const settings = SettingsService;
    console.log('SettingsService', settings)

    SensorService.startListening()
    SensorService.registerCallback((data: Sensors) => {
      this.currentData = data;
      LCDService.update({
        ...data,
        ManualMode: GpioService.getManualMode(),
        LastStates: GpioService.getLastStates()
      })
    })
    GpioService.initialise();
    await this.dataLoop();
    this.setupManualSwitchPolling();
  }

  async dataLoop() {
    try {
      await this.dataCheck();
    } catch (e) {
      console.error("ERROR data loop", e)
    }
    setTimeout(() => this.dataLoop(), 5000)
  }

  async dataCheck() {
    if (!this.currentData) return console.log(`No data yet, skipping.`);
    // manual mode skip
    if (GpioService.getManualMode()) return;
    const { thresholds } = SettingsService.getSettings();

    const { sensors } = this.currentData;

    // Check soil moisture A
    if (sensors.soilMoisture.A < thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowA', 0);
      console.log("Turning on Outflow A");
    } else if (sensors.soilMoisture.A >= thresholds.soilMoisture.high) {
      GpioService.writeGpio('outflowA', 1);
      console.log("Turning off Outflow A");
    }

    // Check soil moisture B
    if (sensors.soilMoisture.B < thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowB', 0);
      console.log("Turning on Outflow B");
    } else if (sensors.soilMoisture.B >= thresholds.soilMoisture.high) {
      GpioService.writeGpio('outflowB', 1);
      console.log("Turning off Outflow B");
    }

    this.controlWaterTransfer(sensors)

    console.log("Data check completed");
  }

  /**
   * Manual control
   */

  private setupManualSwitchPolling() {
    setInterval(() => this.checkManualSwitches(), 100); // Poll every 100ms
  }

  private checkManualSwitches() {
    if (!GpioService.getManualMode()) return;

    const manualSwitches: Array<{ pin: GPIOObjects, relay: GPIOObjects }> = [
      { pin: 'outflowAManual', relay: 'outflowA' },
      { pin: 'outflowBManual', relay: 'outflowB' },
      { pin: 'tapManual', relay: 'tapToMain' },
      { pin: 'rainwaterManual', relay: 'rainwaterToMain' }
    ];

    manualSwitches.forEach(({ pin, relay }) => {
      const currentState = GpioService.readGpio(pin);
      if (currentState === 0 && this.previousSwitchStates[pin] === 1) {
        // Switch was just pressed
        this.toggleRelay(relay);
      }
      this.previousSwitchStates[pin] = currentState;
    });
  }

  private toggleRelay(relay: string) {
    const relayKey = relay.replace('ToMain', '');
    this.manualStates[relayKey] = !this.manualStates[relayKey];
    GpioService.writeGpio(relay as keyof typeof GPIOMap, this.manualStates[relayKey] ? 1 : 0);

    console.log(`Manual switch toggled: ${relay} is now ${this.manualStates[relayKey] ? 'ON' : 'OFF'}`);
  }


  // Assume this function is called every 3 seconds
  controlWaterTransfer(sensors: {
    soilMoisture: { A: number; B: number };
    ultrasonic: {
      mainTank: number;  // T2
      secondTank: number;  // T1
    };
  }) {
    const T2 = sensors.ultrasonic.mainTank;
    const T1 = sensors.ultrasonic.secondTank;

    // Control rainwater to main tank transfer
    if (T2 < 30) {
      GpioService.writeGpio('rainwaterToMain', 0);  // Open valve
      console.log("Opening rainwater to main tank transfer");
    } else if (T2 >= 80) {
      GpioService.writeGpio('rainwaterToMain', 1);  // Close valve
      console.log("Closing rainwater to main tank transfer");
    }

    // Control tap water to main tank transfer
    if (T2 < 20) {
      GpioService.writeGpio('tapToMain', 0);  // Open valve
      console.log("Opening tap water to main tank transfer");
    } else if (T2 >= 20) {
      GpioService.writeGpio('tapToMain', 1);  // Close valve
      console.log("Closing tap water to main tank transfer");
    }

    // Log current levels
    console.log(`Current levels - Main Tank (T2): ${T2}%, Second Tank (T1): ${T1}%`);
  }
  getDashData(): DashData {

    return {
      HydrometerA: this.currentData?.sensors.soilMoisture.A,
      HydrometerB: this.currentData?.sensors.soilMoisture.B,
      UltrasonicA: this.currentData?.sensors.ultrasonic.mainTank,
      UltrasonicB: this.currentData?.sensors.ultrasonic.secondTank,
      ManualMode: GpioService.getManualMode(),
      LastStates: GpioService.getLastStates()
    }
  }


}

export default new TheService();