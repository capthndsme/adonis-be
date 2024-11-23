export type Sensors = {
  sensors: {
    soilMoisture: {
      A: number;
      B: number;
    };
    ultrasonic: {
      /** RAIN WATER (UT1)*/
      mainTank: number;
    
      /** MAIN WATER (UT2) */
      secondTank: number;
    };
  };
}
export type SerialCallbackFn = ((data: Sensors) => void)



// Import the SerialPort class from the serialport module
import { SerialPort } from "serialport"
import SettingsService from "./SettingsService.js";
import { normalize } from "../util.js";
 


// Flag to simulate USB port
const SIMULATE_USB = SettingsService.getSettings().simulator;

// Define a LineBreakTransformer class to split the data into lines
 

let port: SerialPort | null = null;
let callbacks: SerialCallbackFn[] = [];
let simulationInterval: NodeJS.Timeout | null = null; // Store interval for clearing

class SerialPortReader { 
   private buffer: string = '';
  constructor() {
    console.log("SerialPortReader.ts create")
    if (!SIMULATE_USB) {
      console.log("Try open port")
      try {
        port = new SerialPort({
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          path: SettingsService.getSettings().serialPort,
          parity: "none",
        });
        console.log("[SerialPortReader.ts] Opened Serial Port.");
      } catch (error) {
        console.error("[SerialPortReader.ts] Error opening Serial Port:", error);
        // Handle the error appropriately, e.g., throw an error or provide fallback behavior
      }
    }
  }

  registerCallback(callback: SerialCallbackFn) {
    callbacks.push(callback);
  }

  removeCallback(callback: SerialCallbackFn) {
    callbacks = callbacks.filter(cb => cb !== callback)
  }
  lastKnownValues = {
    A: 0,
    B: 0,
    mainTank: 0,
    secondTank: 0,
  };

 _INTERNAL_LISTENER(data: Buffer) {
    const textDecoder = new TextDecoder();
    const text = textDecoder.decode(data);
    
    // Append new data to the buffer
    this.buffer += text;

    // Process complete lines
    const lines = this.buffer.split('\n');
    // Keep the last potentially incomplete line in the buffer
    this.buffer = lines.pop() ?? '';

    lines.forEach(line => this.processLine(line.trim()));
  }

  private processLine(line: string) {
    if (line === '') return;

    const numbers = line.split(/\s+/).map(Number);

    if (numbers.length === 4 && numbers.every(n => !isNaN(n))) {
      const [hydroA, hydroB, ultraB, ultraA] = numbers;

      const newValues = {
        A: normalize(hydroA, 0, 100),
        B: normalize(hydroB, 0, 100),
        mainTank: normalize(ultraA, 0, 450),
        secondTank: normalize(ultraB, 0, 450)
      };

      this.lastKnownValues = { ...newValues };

      for (const callback of callbacks) {
        callback({
          sensors: {
            soilMoisture: {
              A: this.lastKnownValues.A,
              B: this.lastKnownValues.B,
            },
            ultrasonic: {
              mainTank: this.lastKnownValues.mainTank,
              secondTank: this.lastKnownValues.secondTank,
            },
          }
        });
      }
    } else {
      console.warn(`[SerialPortReader.ts] Received invalid data: ${line}`);
    }
  }

  startListening() {
    
    if (SIMULATE_USB) {
      console.log("[SerialPortReader.ts] Simulating USB port data.");
      simulationInterval = setInterval(() => {
        // Simulate data from the USB port
        // Ultrasonic range: 0-1023
        const ultraRandom1 = Math.floor(Math.random() * 1024); // 0-1023 inclusive
        const ultraRandom2 = Math.floor(Math.random() * 1024); // 0-1023 inclusive

        // Hydrometer: 200-1023
        const hydroRandom1 = Math.floor(Math.random() * 874) + 150; // 200-1023 inclusive
        const hydroRandom2 = Math.floor(Math.random() * 874) + 150; // 200-1023 inclusive

        const simulatedData = Buffer.from(`${hydroRandom1} ${hydroRandom2} ${ultraRandom1} ${ultraRandom2}\r\n`);
        this._INTERNAL_LISTENER(simulatedData);
      }, 1000);
    } else if (port) {
      port.on("data", this._INTERNAL_LISTENER.bind(this));
    }
  }

  stopListening() {
    if (SIMULATE_USB) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log("[SerialPortReader.ts] Stopped simulating USB port data.");
      }
    } else if (port) {
      port.off("data", this._INTERNAL_LISTENER.bind(this));
    }
  }
}

export default new SerialPortReader();