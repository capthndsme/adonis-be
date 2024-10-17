export type Sensors = {
  sensors: {
    soilMoisture: {
      A: number;
      B: number;
    };
    ultrasonic: {
      mainTank: number;
      secondTank: number;
    };
  };
}
export type SerialCallbackFn = ((data: Sensors) => void)



// Import the SerialPort class from the serialport module
import { SerialPort } from "serialport"
import SettingsService from "./SettingsService.js";
import { normalize } from "../util.js";
import { read } from "fs";



// Flag to simulate USB port
const SIMULATE_USB = SettingsService.getSettings().simulator;

// Define a LineBreakTransformer class to split the data into lines
class LineBreakTransformer {
  private chunks: string;

  constructor() {
    this.chunks = "";
  }

  transform(chunk: string, controller: TransformStreamDefaultController) {
    this.chunks += chunk;
    const lines = this.chunks.split("\r\n");
    this.chunks = lines.pop() ?? "";
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller: TransformStreamDefaultController) {
    controller.enqueue(this.chunks);
  }
}

let port: SerialPort | null = null;
let callbacks: SerialCallbackFn[] = [];
let simulationInterval: NodeJS.Timeout | null = null; // Store interval for clearing

class SerialPortReader {
  constructor() {
    if (!SIMULATE_USB) {
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

    const lineBreakTransformer = new LineBreakTransformer();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(text);
        controller.close();
      },
    });
    const reader = readableStream
      .pipeThrough(new TransformStream(lineBreakTransformer))
      .getReader();

reader.read().then(({ value, done }) => {
  if (!done && value) {
    const numbers = value.split(" ").map(Number);

    const newValues = {
      A: normalize(numbers[0], 0, 100),         // Moisture sensor A
      B: normalize(numbers[1], 0, 100),         // Moisture sensor B
      mainTank: normalize(numbers[2], 0, 450),  // Ultrasonic mainTank
      secondTank: normalize(numbers[3], 0, 450) // Ultrasonic secondTank
    };

    // Use last known good value if the new one is NaN
    this.lastKnownValues = {
      A: isNaN(newValues.A) ? this.lastKnownValues.A : newValues.A,
      B: isNaN(newValues.B) ? this.lastKnownValues.B : newValues.B,
      mainTank: isNaN(newValues.mainTank) ? this.lastKnownValues.mainTank : newValues.mainTank,
      secondTank: isNaN(newValues.secondTank) ? this.lastKnownValues.secondTank : newValues.secondTank,
    };

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
  }
});
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
      port.on("data", this._INTERNAL_LISTENER);
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
      port.off("data", this._INTERNAL_LISTENER);
    }
  }
}

export default new SerialPortReader();