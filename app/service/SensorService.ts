import { SerialPort } from "serialport";
import SettingsService from "./SettingsService.js";
import { normalize } from "../util.js";

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
  
  // Message parsing constants
  private readonly START_MARKER = '<';
  private readonly END_MARKER = '>';
  private readonly DELIMITER = ',';
  
  constructor() {
    if (!SettingsService.getSettings().simulator) {
      // Initial connection delay to allow Arduino to reset
      setTimeout(() => this.initializePort(), 5000);
    }
  }

  private initializePort() {
    try {
      this.port = new SerialPort({
        path: SettingsService.getSettings().serialPort,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        // Add hardware flow control
        rtscts: true,
      });

      this.port.on('open', () => {
        console.log("[SerialPortReader] Port opened successfully");
        this.isConnected = true;
        // Flush any pending data
        this.port?.flush();
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
      this.buffer = ''; // Clear buffer on error
    }
  }

  private processBuffer() {
    while (true) {
      const startIdx = this.buffer.indexOf(this.START_MARKER);
      const endIdx = this.buffer.indexOf(this.END_MARKER);
      
      if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        // Incomplete or invalid message, keep only the last potential partial message
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
      
      const sensorData: Sensors = {
        sensors: {
          soilMoisture: {
            A: hydroA,
            B: hydroB,
          },
          ultrasonic: {
            mainTank: ultraA,
            secondTank: ultraB,
          },
        },
      };
      
      this.notifyCallbacks(sensorData);
      
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
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.initializePort();
      }, 5000);
    }
  }

  // Public methods
  registerCallback(callback: SerialCallbackFn) {
    this.callbacks.add(callback);
  }

  removeCallback(callback: SerialCallbackFn) {
    this.callbacks.delete(callback);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
  }
}

export default new SerialPortReader();