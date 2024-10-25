
import { DashData } from "../types/DashData.response.js";
import GpioService, { GPIOMap, GPIOObjects } from "./GpioService.js";
import LCDService from "./LCDService.js";
import SensorService, { Sensors } from "./SensorService.js";
import SettingsService from "./SettingsService.js";
import LogService from "./LogService.js";


class TheService {

  booted = false;
  private lastAboveHigh = false;  // for tank control
  private lastAboveHighA = false; // for soil moisture A
  private isInManualMode = false;
  private lastAboveHighB = false; // for soil moisture B // Track if we were previously above HighThresh
  private readonly LOW_THRESH = 20;
  private readonly HIGH_THRESH = 80;
  private readonly REOPEN_THRESH = this.LOW_THRESH + 10;  // 30%

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





  /**
   * DATA CHECK 
   */



  async dataCheck() {
    if (!this.currentData) return console.log(`No data yet, skipping.`);
    if (GpioService.getManualMode()) return;

    const { thresholds } = SettingsService.getSettings();
    const { sensors } = this.currentData;

    // Check soil moisture A with hysteresis
    if (sensors.soilMoisture.A >= thresholds.soilMoisture.high) {
      GpioService.writeGpio('outflowA', 1);  // Turn OFF
      this.lastAboveHighA = true;
      console.log("Turning off Outflow A (above HIGH)");
    } else if (this.lastAboveHighA && sensors.soilMoisture.A >= thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowA', 1);  // Keep OFF until goes below low
      console.log("Keeping Outflow A off (waiting for LOW)");
    } else if (sensors.soilMoisture.A < thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowA', 0);  // Turn ON
      this.lastAboveHighA = false;
      console.log("Turning on Outflow A (below LOW)");
    }

    // Check soil moisture B with hysteresis
    if (sensors.soilMoisture.B >= thresholds.soilMoisture.high) {
      GpioService.writeGpio('outflowB', 1);  // Turn OFF
      this.lastAboveHighB = true;
      console.log("Turning off Outflow B (above HIGH)");
    } else if (this.lastAboveHighB && sensors.soilMoisture.B >= thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowB', 1);  // Keep OFF until goes below low
      console.log("Keeping Outflow B off (waiting for LOW)");
    } else if (sensors.soilMoisture.B < thresholds.soilMoisture.low) {
      GpioService.writeGpio('outflowB', 0);  // Turn ON
      this.lastAboveHighB = false;
      console.log("Turning on Outflow B (below LOW)");
    }

    this.controlWaterTransfer(sensors);
    console.log("Data check completed");
  }

  controlWaterTransfer(sensors: {
    soilMoisture: { A: number; B: number };
    ultrasonic: {
      mainTank: number;  // T2
      secondTank: number;  // T1
    };
  }) {
    const T2 = sensors.ultrasonic.mainTank;
    const T1 = sensors.ultrasonic.secondTank;

    // Control tap water to main tank transfer
    if (T2 < this.LOW_THRESH) {
      GpioService.writeGpio('tapToMain', 0);  // Open valve (0 = on)
      console.log("Opening tap water to main tank transfer");
    } else {
      GpioService.writeGpio('tapToMain', 1);  // Close valve (1 = off)
      console.log("Closing tap water to main tank transfer");
    }

    // Control rainwater to main tank transfer
    if (T2 >= this.HIGH_THRESH) {
      // Above HighThresh (80%): Close valve and mark state
      GpioService.writeGpio('rainwaterToMain', 1);  // Close valve
      this.lastAboveHigh = true;
      console.log("Closing rainwater to main tank transfer (above HIGH_THRESH)");
    } else if (this.lastAboveHigh && T2 >= this.REOPEN_THRESH) {
      // Was previously above HighThresh and still above REOPEN_THRESH: Keep closed
      GpioService.writeGpio('rainwaterToMain', 1);  // Keep valve closed
      console.log("Keeping rainwater to main tank transfer closed (waiting for REOPEN_THRESH)");
    } else if (this.lastAboveHigh && T2 < this.REOPEN_THRESH) {
      // Dropped below REOPEN_THRESH: Reset state and open valve
      this.lastAboveHigh = false;
      GpioService.writeGpio('rainwaterToMain', 0);  // Open valve
      console.log("Opening rainwater to main tank transfer (reached REOPEN_THRESH)");
    } else if (T2 < this.LOW_THRESH) {
      // Below LowThresh: Open valve
      GpioService.writeGpio('rainwaterToMain', 0);  // Open valve
      console.log("Opening rainwater to main tank transfer (below LOW_THRESH)");
    } else {
      // Between LowThresh and HighThresh (normal operation)
      GpioService.writeGpio('rainwaterToMain', 0);  // Keep valve open
      console.log("Keeping rainwater to main tank transfer open (normal operation)");
    }

    // Log current levels
    console.log(`Current levels - Main Tank (T2): ${T2}%, Second Tank (T1): ${T1}%`);
  }


  /**
   * DATA CHECK END
   */

  /**
   * Manual control
   */

  private setupManualSwitchPolling() {
    setInterval(() => this.checkManualSwitches(), 24); // Poll every 100ms
  }

  private enterManualMode() {
    // Custom code to be executed when entering manual mode
    console.log("Entering manual mode, setting GPIOs to OFF (1)");

    // Set all relevant GPIOs to OFF (1)
    GpioService.writeGpio('outflowA', 1);
    GpioService.writeGpio('outflowB', 1);
    GpioService.writeGpio('tapToMain', 1);
    GpioService.writeGpio('rainwaterToMain', 1);

    // Additional initialization code for manual mode can go here
    this.lastAboveHigh = false;
    this.lastAboveHighA = false;
    this.lastAboveHighB = false;

    Object.keys(this.manualStates).forEach(key => {
      this.manualStates[key] = false;
    })

    LogService.createLog(
      "AUTOMATION_TRIGGER",
      null,
      "Manual mode entered",
      null
    )
 
    
  }

  private checkManualSwitches() {
    const manualMode = GpioService.getManualMode();

    // Check if we are entering manual mode
    if (manualMode && !this.isInManualMode) {
      this.isInManualMode = true;
      this.enterManualMode();
    } else if (!manualMode && this.isInManualMode) {
      // Exiting manual mode
      this.isInManualMode = false;
    }

    if (!manualMode) return;

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