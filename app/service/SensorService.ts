
import SettingsService from "./SettingsService.js";
import { normalize, sleep } from "../util.js";
import LogService from "./LogService.js";

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

class SensorService {

    private callbacks: Set<SerialCallbackFn> = new Set();

    private isInitialized: boolean = false;
    private sensorData: Sensors | null = null;

    
 
    // Normalization ranges
    // 0
    private readonly HYDRO_MIN = 0;

    //100
    private readonly HYDRO_MAX = 100;
    // 0
    private readonly ULTRA_MIN = 0;
    // 450
    private readonly ULTRA_MAX = 450;

    constructor() {
        console.log("[SerialPortReader] Initializing...");
        this.initialize();
    }

    async saver() {
        console.log("Saving sensor data")
        if (this.sensorData) {
            LogService.createLog(
                "STATUS_UPDATE",
                null,
                "Saving sensor data",
                JSON.stringify(
                    this.sensorData
                )
            
            )
        }
    }
    private async initialize() {
        if (this.isInitialized) return console.log("Serial Reader - Already init!");

        try {
            // Wait for settings service to be ready
            while (!SettingsService.getSettings()) {
                console.log("[SerialPortReader] Waiting for settings...");
                await sleep(1000);
            }

            this.isInitialized = true;

            if (!SettingsService.getSettings().simulator) {
                console.log("[SerialPortReader] Running in normal mode.");
                this.startPolling();
            } else {
                console.log("[SerialPortReader] Running in simulator mode.");
                this.startSimulator();
            }
    
      
     
        } catch (error) {
            console.error("[SerialPortReader] Initialization error:", error);
     
        }
    }

    // Start data polling from the server
    private startPolling() {
        console.log("[SerialPortReader] Starting data polling...");
        this.fetchSensorData(); // Initial fetch
        this.saver();
         setInterval(() => {
            this.fetchSensorData();
        }, 4000); // Poll every 4 seconds

        setInterval(() => {
            this.saver();
        }, 5 * 60 * 1000) // 5 minutes datagraph
    }

    // Fetch sensor data from the local server
    private async fetchSensorData() {
        try {
            const response = await fetch('http://localhost:1444/sensors');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json() as Sensors;

            // Validate normalized data
            if (Object.values(data.sensors.soilMoisture).some(isNaN) ||
                Object.values(data.sensors.ultrasonic).some(isNaN)) {
                throw new Error("Data from server contains invalid values");
            }
            this.sensorData = data;
            this.notifyCallbacks(data);
        } catch (error) {
            console.error("[SerialPortReader] Error fetching sensor data:", error);
            this.sensorData = null; // Or some error state

        }
    }

    // Starts the simulator with random values
    private startSimulator() {
        console.log("[SerialPortReader] Starting simulator...");
        setInterval(() => {
            const simulatedData: Sensors = {
                sensors: {
                    soilMoisture: {
                        A: this.getRandomInt(this.HYDRO_MIN, this.HYDRO_MAX),
                        B: this.getRandomInt(this.HYDRO_MIN, this.HYDRO_MAX),
                    },
                    ultrasonic: {
                        mainTank: this.getRandomInt(this.ULTRA_MIN, this.ULTRA_MAX),
                        secondTank: this.getRandomInt(this.ULTRA_MIN, this.ULTRA_MAX),
                    },
                },
            };
            this.sensorData = simulatedData;
            this.notifyCallbacks(simulatedData);
        }, 4000);
    }

    // Generate random integer between min and max (inclusive)
    private getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private notifyCallbacks(data: Sensors) {
        this.callbacks.forEach(callback => {
            try {
                callback({
                    sensors: {
                        soilMoisture: {
                            A: normalize(data.sensors.soilMoisture.A, this.HYDRO_MIN, this.HYDRO_MAX),
                            B: normalize(data.sensors.soilMoisture.B, this.HYDRO_MIN, this.HYDRO_MAX),
                        },
                        ultrasonic: {
                            mainTank: normalize(data.sensors.ultrasonic.mainTank, this.ULTRA_MIN, this.ULTRA_MAX),
                            secondTank: normalize(data.sensors.ultrasonic.secondTank, this.ULTRA_MIN, this.ULTRA_MAX),
                        },
                    }
                });
            } catch (error) {
                console.error("[SerialPortReader] Callback error:", error);
            }
        });
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
        // If we have latest data, immediately notify the new callback
        if (this.sensorData) {
            try {
                callback(this.sensorData);
            } catch (error) {
                console.error("[SerialPortReader] Immediate callback error:", error);
            }
        }
    }

    removeCallback(callback: SerialCallbackFn) {
        this.callbacks.delete(callback);
    }


    getSensorData() {
        return this.sensorData;
    }
}

export default new SensorService();