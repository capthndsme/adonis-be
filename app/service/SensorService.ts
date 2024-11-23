import { SerialPort } from "serialport";
import SettingsService from "./SettingsService.js";
import { normalize, sleep } from "../util.js";

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
};

export type SerialCallbackFn = (data: Sensors) => void;

class SerialPortReader {
  private port: SerialPort | null = null;
  private callbacks: Set<SerialCallbackFn> = new Set();
  private buffer: string = '';
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  
  private readonly START_MARKER = '<';
  private readonly END_MARKER = '>';
  private readonly DELIMITER = ',';
  
  // Normalization ranges
  // 0
  private readonly HYDRO_MIN = 0x00;

  //100
  private readonly HYDRO_MAX = 0x64;
  // 0
  private readonly ULTRA_MIN = 0x00;
  // 450
  private readonly ULTRA_MAX = 0x1c2;
  
  constructor() {
    console.log("[SerialPortReader] Initializing...");
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Wait for settings service to be ready
      while (!SettingsService.getSettings()) {
        console.log("[SerialPortReader] Waiting for settings...");
        await sleep(1000);
      }
      
      this.isInitialized = true;
      
      if (!SettingsService.getSettings().simulator) {
        console.log("[SerialPortReader] Waiting 5s before connecting to port...");
        await sleep(5000);
        await this.initializePort();
      }
    } catch (error) {
      console.error("[SerialPortReader] Initialization error:", error);
      this.scheduleReconnect();
    }
  }

  private async initializePort() {
    try {
      if (this.port) {
        console.log("[SerialPortReader] Cleaning up existing port...");
        this.cleanup();
      }

      this.port = new SerialPort({
        path: SettingsService.getSettings().serialPort,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        rtscts: true,
      });

      // Wait for port to open
      await new Promise<void>((resolve, reject) => {
        this.port?.once('open', () => {
          console.log("[SerialPortReader] Port opened successfully");
          this.isConnected = true;
          this.port?.flush();
          resolve();
        });
        this.port?.once('error', reject);
      });

      this.port.on('error', this.handleError.bind(this));
      this.port.on('close', this.handleDisconnect.bind(this));
      this.port.on('data', this.handleData.bind(this));

    } catch (error) {
      console.error("[SerialPortReader] Failed to open port:", error);
      this.scheduleReconnect();
    }
  }

  private handleData(data: Buffer) {
    try {
      const text = new TextDecoder().decode(data);
      this.buffer += text;
      
      this.processBuffer();
    } catch (error) {
      console.error("[SerialPortReader] Data processing error:", error);
      this.buffer = '';
    }
  }

  private processBuffer() {
    while (true) {
      const startIdx = this.buffer.indexOf(this.START_MARKER);
      const endIdx = this.buffer.indexOf(this.END_MARKER);
      
      if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        const lastStart = this.buffer.lastIndexOf(this.START_MARKER);
        this.buffer = lastStart !== -1 ? this.buffer.slice(lastStart) : '';
        break;
      }
      
      const message = this.buffer.slice(startIdx + 1, endIdx);
      this.buffer = this.buffer.slice(endIdx + 1);
      
      this.processMessage(message);
    }
  }

  private processMessage(message: string) {
    try {
      const [data, checksumStr] = message.split('|');
      const values = data.split(this.DELIMITER).map(Number);
      const checksum = parseInt(checksumStr, 10);
      
      if (values.length !== 4 || isNaN(checksum)) {
        throw new Error("Invalid message format");
      }
      
      // Verify checksum
      const calculatedChecksum = (values.reduce((a, b) => a + b, 0)) & 0xFF;
      if (calculatedChecksum !== checksum) {
        throw new Error("Checksum mismatch");
      }
      
      const [hydroA, hydroB, ultraA, ultraB] = values;

      // Normalize values
      const normalizedData: Sensors = {
        sensors: {
          soilMoisture: {
            A: normalize(hydroA, this.HYDRO_MIN, this.HYDRO_MAX),
            B: normalize(hydroB, this.HYDRO_MIN, this.HYDRO_MAX),
          },
          ultrasonic: {
            mainTank: normalize(ultraA, this.ULTRA_MIN, this.ULTRA_MAX),
            secondTank: normalize(ultraB, this.ULTRA_MIN, this.ULTRA_MAX),
          },
        },
      };

      // Validate normalized data
      if (Object.values(normalizedData.sensors.soilMoisture).some(isNaN) ||
          Object.values(normalizedData.sensors.ultrasonic).some(isNaN)) {
        throw new Error("Normalization produced invalid values");
      }
      
      this.notifyCallbacks(normalizedData);
      
    } catch (error) {
      console.error("[SerialPortReader] Message processing error:", error);
    }
  }

  private notifyCallbacks(data: Sensors) {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error("[SerialPortReader] Callback error:", error);
      }
    });
  }

  private handleError(error: Error) {
    console.error("[SerialPortReader] Port error:", error);
    this.handleDisconnect();
  }

  private handleDisconnect() {
    if (this.isConnected) {
      console.log("[SerialPortReader] Port disconnected");
      this.cleanup();
      this.scheduleReconnect();
    }
  }

  private cleanup() {
    this.isConnected = false;
    this.buffer = '';
    
    if (this.port) {
      this.port.removeAllListeners();
      try {
        this.port.close();
      } catch (error) {
        console.error("[SerialPortReader] Error closing port:", error);
      }
      this.port = null;
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(async () => {
        this.reconnectTimer = null;
        await this.initializePort();
      }, 5000);
    }
  }

  async startListening() {
    console.log("[SerialPortReader] Start listening called");
    if (!this.isInitialized) {
      console.log("[SerialPortReader] Waiting for initialization...");
      await this.initialize();
    }
  }

  registerCallback(callback: SerialCallbackFn) {
    console.log("[SerialPortReader] Registering new callback");
    this.callbacks.add(callback);
  }

  removeCallback(callback: SerialCallbackFn) {
    this.callbacks.delete(callback);
  }

  disconnect() {
    console.log("[SerialPortReader] Disconnecting...");
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
  }
}

export default new SerialPortReader();