export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));


export const normalize = (value: number, min: number, max: number) => {
  if (isNaN(value) || value < min || value > max) {
    return NaN; // Return NaN if the value is invalid
  }
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};