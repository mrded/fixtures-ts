import { describe, expect, it } from "bun:test";
import { createFixtures, defineFixture, type FixtureRegistry } from ".";
import { AirQualityMonitor } from "./air-quality";

type Deps = { monitor: AirQualityMonitor };

const registry: FixtureRegistry<Deps> = {
  monitor: defineFixture([], async () => ({
    value: new AirQualityMonitor(),
    cleanup: async () => {},
  })),
};

describe("AirQualityMonitor", () => {
  it("should show graph when air quality gets bad", async () => {
    // Arrange
    const fixtures = createFixtures(registry, ["monitor"]);
    await fixtures.setup();
    const { monitor } = fixtures.get();

    // Act
    monitor.addReading({ timestamp: new Date(), aqi: 151 });
    const graph = monitor.getGraph();

    // Assert
    expect(graph).not.toBeNull();
    expect(graph?.visible).toBe(true);
    expect(graph?.position).toBe("top-right-under-status");

    await fixtures.teardown();
  });

  it("should not show graph when air quality is good", async () => {
    // Arrange
    const fixtures = createFixtures(registry, ["monitor"]);
    await fixtures.setup();
    const { monitor } = fixtures.get();

    // Act
    monitor.addReading({ timestamp: new Date(), aqi: 30 });
    const graph = monitor.getGraph();

    // Assert
    expect(graph).toBeNull();

    await fixtures.teardown();
  });

  it("should not show graph when air quality is moderate", async () => {
    // Arrange
    const fixtures = createFixtures(registry, ["monitor"]);
    await fixtures.setup();
    const { monitor } = fixtures.get();

    // Act
    monitor.addReading({ timestamp: new Date(), aqi: 80 });
    const graph = monitor.getGraph();

    // Assert
    expect(graph).toBeNull();

    await fixtures.teardown();
  });

  it("should include only last hour of readings in graph", async () => {
    // Arrange
    const fixtures = createFixtures(registry, ["monitor"]);
    await fixtures.setup();
    const { monitor } = fixtures.get();

    const oldReading = {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      aqi: 120,
    };
    const recentReading1 = {
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      aqi: 140,
    };
    const recentReading2 = { timestamp: new Date(), aqi: 160 };

    // Act
    monitor.addReading(oldReading);
    monitor.addReading(recentReading1);
    monitor.addReading(recentReading2);
    const graph = monitor.getGraph();

    // Assert
    expect(graph).not.toBeNull();
    expect(graph?.readings).toHaveLength(2);
    expect(graph?.readings).not.toContain(oldReading);
    expect(graph?.readings).toContain(recentReading1);
    expect(graph?.readings).toContain(recentReading2);

    await fixtures.teardown();
  });

  it("should not show graph when there are no readings", async () => {
    // Arrange
    const fixtures = createFixtures(registry, ["monitor"]);
    await fixtures.setup();
    const { monitor } = fixtures.get();

    // Act
    const graph = monitor.getGraph();

    // Assert
    expect(graph).toBeNull();

    await fixtures.teardown();
  });
});
