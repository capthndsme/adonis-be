
import { DashData } from "../types/DashData.response.js";
import GpioService, { GPIOMap, GPIOObjects } from "./GpioService.js";
import LCDService from "./LCDService.js";
import SensorService, { Sensors } from "./SensorService.js";
import SettingsService from "./SettingsService.js";
import LogService from "./LogService.js";
import { sleep } from "../util.js";


class TheService {

  booted = false;
  private lastAboveHigh = false;  // for tank control
  private lastAboveHighA = false; // for soil moisture A
  private loggedOutflowAOn: boolean = false;
  private loggedOutflowAOff: boolean = false;
  private loggedOutflowBOn: boolean = false;
  private loggedOutflowBOff: boolean = false;
  private loggedTapOn: boolean = false;
  private loggedTapOff: boolean = false;
  private loggedRainwaterOn: boolean = false;
  private loggedRainwaterOff: boolean = false;
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

    console.log('Starting UP: SensorService StartListen')
    SensorService.startListening()
    await sleep(1000);
    console.log('Starting UP: SensorService RegisterCallback')
    SensorService.registerCallback((data: Sensors) => {
      this.currentData = data;
      LCDService.update({
        ...data,
        ManualMode: GpioService.getManualMode(),
        LastStates: GpioService.getLastStates()
      })
    })
    console.log('Starting UP GPIO')
    GpioService.initialise();
    console.log('GPIO DONE')
    await sleep(1000);
    console.log('Starting UP DataLoop')
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
    if (SettingsService.getSettings().thresholdEnabled) {
      this.soilMoistureChecking(sensors, thresholds);
    } else {
      console.log('Threshold disabled - skipping soil moisture check')
    }

    // allow time
    await sleep(1000);

    // time base
    if (SettingsService.getSettings().timerBaseEnabled) {
      await this.timerBasedCheck();
    } else {
      console.log('Timer base disabled - skipping timer check')
    }


    this.controlWaterTransfer(sensors);
    console.log("Data check completed");
  }

  async timerBasedCheck() {
    // get Time in UTC8
    const now = new Date();

    // scheduler loop - ALLOW for 10 minute clock late execution (for example systme restarted)
    // else - log message

    const waterTimes = SettingsService.getSettings().waterTimes;


    if (!waterTimes) return console.log("No water times set")

    for (const { hours, minutes } of waterTimes) {
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0); // Set target time in UTC+8
      const timeKey = `${hours}:${minutes}`; // Unique key for each scheduled time

      const timeDiff = now.getTime() - targetTime.getTime();
      const tenMinutesInMillis = 10 * 60 * 1000;

      if (timeDiff >= 0 && timeDiff <= tenMinutesInMillis) {
        if (this.shouldExecute(now, timeKey)) {
          console.log(`Executing task for time: ${hours}:${minutes} (late by ${timeDiff / 60000} minutes)`);
          await this.executeTask(hours, minutes);
          this.lastExecutionDates[timeKey] = now;
          LogService.createLog(
            "AUTOMATION_TRIGGER",
            null,
            `Timer-Based: Watering at ${hours}:${minutes}`,
            null
          );

        } else {
          console.log(`Task for ${hours}:${minutes} already executed today`);
        }
      } else if (timeDiff < 0) {
        console.log(`Waiting for time: ${hours}:${minutes}`);
      } else {
        console.log(`Task for ${hours}:${minutes} is more than 10 minutes late, skipping`);
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          "Time-Based: Watering task is more than 10 minutes late. Skipping.",
          null
        );
      }
    }
  }

  private lastExecutionDates: { [key: string]: Date } = {}; // Store last execution date for each time

  private shouldExecute(now: Date, timeKey: string): boolean {
    if (!this.lastExecutionDates[timeKey]) {
      return true; // First time execution for this time
    }

    return !this.isSameDay(now, this.lastExecutionDates[timeKey]);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private async executeTask(hours: number, minutes: number) {
    console.log(`Task for ${hours}:${minutes} executed!`);
  }

  async timerBasedWater() {
    if (this.currentData === null || this.currentData === undefined) return;
    console.log("Performing timer-based watering...")
    const { thresholds } = SettingsService.getSettings();
    if (thresholds.tankLevel.low > this.currentData?.sensors.ultrasonic.mainTank) {
      console.log("Not enough water in the main tank, skipping watering.");
      return;
    }
    // Implement your watering logic here, considering soil moisture levels and other factors
    console.log("Performing timer-based watering...");
    // Example: Turn on outflowA for a specific duration
    GpioService.writeGpio('outflowA', 0); // Turn ON
    await sleep(10000); // Water for 10 seconds
    GpioService.writeGpio('outflowA', 1); // Turn OFF
    console.log("Timer-based watering completed.");

  }
  private soilMoistureChecking(
    sensors: {
      soilMoisture: { A: number; B: number };
      ultrasonic: { mainTank: number; secondTank: number };
    },
    thresholds: { soilMoisture: { low: number; high: number }; tankLevel: { low: number } }
  ) {
    // Soil Moisture A Check
    if (sensors.soilMoisture.A >= thresholds.soilMoisture.high) {
      GpioService.writeGpio("outflowA", 1); // Turn OFF
      this.lastAboveHighA = true;
      if (!this.loggedOutflowAOff) {
        console.log("Turning off Outflow A (above HIGH)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Soil moisture A: Rose above ${thresholds.soilMoisture.high}%, turning off Outflow A.`,
          null
        );
        this.loggedOutflowAOff = true;
        this.loggedOutflowAOn = false;
      }
    } else if (this.lastAboveHighA && sensors.soilMoisture.A >= thresholds.soilMoisture.low) {
      GpioService.writeGpio("outflowA", 1); // Keep OFF until goes below low
      console.log("Keeping Outflow A off (waiting for LOW)");
    } else if (sensors.soilMoisture.A < thresholds.soilMoisture.low) {
      GpioService.writeGpio("outflowA", 0); // Turn ON
      this.lastAboveHighA = false;
      if (!this.loggedOutflowAOn) {
        console.log("Turning on Outflow A (below LOW)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Soil moisture A: Dropped to ${sensors.soilMoisture.A}%, turning on Outflow A.`,
          null
        );
        this.loggedOutflowAOn = true;
        this.loggedOutflowAOff = false;
      }
    }

    // Soil Moisture B Check
    if (sensors.soilMoisture.B >= thresholds.soilMoisture.high) {
      GpioService.writeGpio("outflowB", 1); // Turn OFF
      this.lastAboveHighB = true;
      if (!this.loggedOutflowBOff) {
        console.log("Turning off Outflow B (above HIGH)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Soil moisture B: Rose above ${thresholds.soilMoisture.high}%, turning off Outflow B.`,
          null
        );
        this.loggedOutflowBOff = true;
        this.loggedOutflowBOn = false;
      }
    } else if (this.lastAboveHighB && sensors.soilMoisture.B >= thresholds.soilMoisture.low) {
      GpioService.writeGpio("outflowB", 1); // Keep OFF until goes below low
      console.log("Keeping Outflow B off (waiting for LOW)");
    } else if (sensors.soilMoisture.B < thresholds.soilMoisture.low) {
      GpioService.writeGpio("outflowB", 0); // Turn ON
      this.lastAboveHighB = false;
      if (!this.loggedOutflowBOn) {
        console.log("Turning on Outflow B (below LOW)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Soil moisture B: Dropped to ${sensors.soilMoisture.B}%, turning on Outflow B.`,
          null
        );
        this.loggedOutflowBOn = true;
        this.loggedOutflowBOff = false;
      }
    }
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
      if (!this.loggedTapOn) {
        console.log("Opening tap water to main tank transfer");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Main tank level: Dropped to ${T2}%, opening tap water transfer.`,
          null
        );
        this.loggedTapOn = true;
        this.loggedTapOff = false;
      }
    } else {
      GpioService.writeGpio('tapToMain', 1);  // Close valve (1 = off)
      if (!this.loggedTapOff) {
      console.log("Closing tap water to main tank transfer");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Main tank level: Rose above ${this.LOW_THRESH}%, closing tap water transfer.`,
          null
        );
        this.loggedTapOff = true;
        this.loggedTapOn = false;
      }
    }

    // Control rainwater to main tank transfer
    if (T2 >= this.HIGH_THRESH) {
      // Above HighThresh (80%): Close valve and mark state
      GpioService.writeGpio('rainwaterToMain', 1);  // Close valve
      this.lastAboveHigh = true;
      if (!this.loggedRainwaterOff) {
        console.log("Closing rainwater to main tank transfer (above HIGH_THRESH)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Main tank level: Reached ${T2}%, closing rainwater transfer.`,
          null
        );
        this.loggedRainwaterOff = true;
        this.loggedRainwaterOn = false;
      }
    } else if (this.lastAboveHigh && T2 >= this.REOPEN_THRESH) {
      // Was previously above HighThresh and still above REOPEN_THRESH: Keep closed
      GpioService.writeGpio('rainwaterToMain', 1);  // Keep valve closed
      console.log("Keeping rainwater to main tank transfer closed (waiting for REOPEN_THRESH)");
    } else if (this.lastAboveHigh && T2 < this.REOPEN_THRESH) {
      // Dropped below REOPEN_THRESH: Reset state and open valve
      this.lastAboveHigh = false;
      GpioService.writeGpio('rainwaterToMain', 0);  // Open valve
      if (!this.loggedRainwaterOn) {
      console.log("Opening rainwater to main tank transfer (reached REOPEN_THRESH)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Main tank level: Dropped to ${T2}%, opening rainwater transfer.`,
          null
        );
        this.loggedRainwaterOn = true;
        this.loggedRainwaterOff = false;
      }
    } else if (T2 < this.LOW_THRESH) {
      // Below LowThresh: Open valve
      GpioService.writeGpio('rainwaterToMain', 0);  // Open valve
      if (!this.loggedRainwaterOn) {
      console.log("Opening rainwater to main tank transfer (below LOW_THRESH)");
        LogService.createLog(
          "AUTOMATION_TRIGGER",
          null,
          `Main tank level: Dropped to ${T2}%, opening rainwater transfer.`,
          null
        );
        this.loggedRainwaterOn = true;
        this.loggedRainwaterOff = false;
      }
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
    setInterval(() => this.checkManualSwitches(), 50); // Poll every 100ms
  }

  private enterManualMode() {
    console.log("Entering manual mode, setting GPIOs to OFF (1)");

    // Set all relevant GPIOs to OFF (1)
    GpioService.writeGpio('outflowA', 1);
    GpioService.writeGpio('outflowB', 1);
    GpioService.writeGpio('tapToMain', 1);
    GpioService.writeGpio('rainwaterToMain', 1);

    // Initialize manual states
    Object.keys(this.manualStates).forEach(key => {
      this.manualStates[key] = false;
    });

    // Read and update initial switch states
    this.previousSwitchStates = {
      outflowAManual: GpioService.readGpio('outflowAManual'),
      outflowBManual: GpioService.readGpio('outflowBManual'),
      tapManual: GpioService.readGpio('tapManual'),
      rainwaterManual: GpioService.readGpio('rainwaterManual')
    };

    // ... other initialization code ...
    this.lastAboveHigh = false;
    this.lastAboveHighA = false;
    this.lastAboveHighB = false;

    LogService.createLog(
      "AUTOMATION_TRIGGER",
      null,
      "Manual mode entered",
      null
    );
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