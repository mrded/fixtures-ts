/**
 * Air quality reading from a sensor
 */
export type AirQualityReading = {
  timestamp: Date;
  /** Air Quality Index (AQI) value */
  aqi: number;
};

/**
 * Air quality status based on AQI value
 * - good: AQI 0-50
 * - moderate: AQI 51-100
 * - bad: AQI > 100
 */
export type AirQualityStatus = "good" | "moderate" | "bad";

/**
 * Graph data shown at the top right corner under the status text
 * when air quality gets bad
 */
export type AirQualityGraph = {
  /** Readings from the last hour */
  readings: AirQualityReading[];
  /** Whether the graph should be visible */
  visible: boolean;
  /** Position of the graph (top right corner, under the status text) */
  position: "top-right-under-status";
};

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Monitors air quality and exposes a graph when quality becomes bad
 */
export class AirQualityMonitor {
  private readings: AirQualityReading[] = [];

  addReading(reading: AirQualityReading): void {
    this.readings.push(reading);
  }

  getStatus(): AirQualityStatus {
    const latest = this.readings[this.readings.length - 1];
    if (!latest) return "good";
    if (latest.aqi <= 50) return "good";
    if (latest.aqi <= 100) return "moderate";
    return "bad";
  }

  /**
   * Returns graph data for the last hour when air quality is bad,
   * or null when quality is acceptable.
   */
  getGraph(): AirQualityGraph | null {
    if (this.getStatus() !== "bad") return null;

    const cutoff = new Date(Date.now() - ONE_HOUR_MS);
    const hourlyReadings = this.readings.filter((r) => r.timestamp >= cutoff);

    return {
      readings: hourlyReadings,
      visible: true,
      position: "top-right-under-status",
    };
  }
}
