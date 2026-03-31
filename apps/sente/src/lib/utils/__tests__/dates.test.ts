import {
  formatDate,
  getDateRange,
  isWithinRange,
  getDateRangePresets,
  formatDateRange,
  getDayOfWeek,
  parseDate,
  normalizeDate,
  getMonthDateRange,
  getPreviousMonth,
  parseRollupDateParams,
} from "../dates";

describe("date utilities", () => {
  describe("formatDate", () => {
    it("formats dates with short format", () => {
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      expect(formatDate(date, "short")).toBe("Jan 15");
    });

    it("formats dates with medium format (default)", () => {
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      expect(formatDate(date)).toBe("Jan 15, 2024");
    });

    it("formats dates with long format", () => {
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      expect(formatDate(date, "long")).toBe("January 15, 2024");
    });

    it("formats dates with ISO format", () => {
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      expect(formatDate(date, "iso")).toBe("2024-01-15");
    });

    it("handles ISO string input", () => {
      expect(formatDate("2024-01-15", "short")).toBe("Jan 15");
    });

    it("returns dash for invalid dates", () => {
      expect(formatDate("invalid")).toBe("—");
    });

    it("returns dash for null input", () => {
      expect(formatDate(null as unknown as Date)).toBe("—");
    });
  });

  describe("getDateRange", () => {
    it("returns correct range for last7days", () => {
      const range = getDateRange("last7days");
      expect(range).toHaveProperty("start");
      expect(range).toHaveProperty("end");
      expect(range).toHaveProperty("label", "Last 7 Days");
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
    });

    it("returns correct range for last30days", () => {
      const range = getDateRange("last30days");
      expect(range.label).toBe("Last 30 Days");
    });

    it("returns correct range for lastMonth", () => {
      const range = getDateRange("lastMonth");
      expect(range.label).toMatch(/\w+ \d{4}/); // e.g., "December 2024"
    });

    it("returns correct range for last3months", () => {
      const range = getDateRange("last3months");
      expect(range.label).toBe("Last 3 Months");
    });

    it("returns correct range for lastYear", () => {
      const range = getDateRange("lastYear");
      expect(range.label).toBe("Last Year");
    });

    it("end date is after start date", () => {
      const range = getDateRange("last7days");
      expect(range.end.getTime()).toBeGreaterThanOrEqual(range.start.getTime());
    });
  });

  describe("isWithinRange", () => {
    it("returns true for date within range", () => {
      const date = new Date("2024-01-15");
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it("returns false for date outside range", () => {
      const date = new Date("2024-02-15");
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      expect(isWithinRange(date, start, end)).toBe(false);
    });

    it("returns true for date on range boundaries", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      expect(isWithinRange(start, start, end)).toBe(true);
      expect(isWithinRange(end, start, end)).toBe(true);
    });

    it("handles ISO string inputs", () => {
      expect(isWithinRange("2024-01-15", "2024-01-01", "2024-01-31")).toBe(true);
    });

    it("returns false for invalid dates", () => {
      expect(isWithinRange("invalid", "2024-01-01", "2024-01-31")).toBe(false);
    });
  });

  describe("getDateRangePresets", () => {
    it("returns array of presets", () => {
      const presets = getDateRangePresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it("each preset has value and label", () => {
      const presets = getDateRangePresets();
      presets.forEach((preset) => {
        expect(preset).toHaveProperty("value");
        expect(preset).toHaveProperty("label");
      });
    });

    it("includes expected presets", () => {
      const presets = getDateRangePresets();
      const values = presets.map((p) => p.value);
      expect(values).toContain("last7days");
      expect(values).toContain("last30days");
      expect(values).toContain("lastMonth");
      expect(values).toContain("last3months");
      expect(values).toContain("lastYear");
    });
  });

  describe("formatDateRange", () => {
    it("formats range within same year", () => {
      const start = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
      const end = new Date(Date.UTC(2024, 0, 31, 12, 0, 0));
      expect(formatDateRange(start, end)).toBe("Jan 1 - Jan 31, 2024");
    });

    it("formats range across different years", () => {
      const start = new Date(Date.UTC(2024, 11, 1, 12, 0, 0));
      const end = new Date(Date.UTC(2025, 0, 31, 12, 0, 0));
      expect(formatDateRange(start, end)).toBe("Dec 1, 2024 - Jan 31, 2025");
    });

    it("handles ISO string inputs", () => {
      expect(formatDateRange("2024-01-01", "2024-01-31")).toBe("Jan 1 - Jan 31, 2024");
    });

    it("returns dash for invalid dates", () => {
      expect(formatDateRange("invalid", "2024-01-31")).toBe("—");
    });
  });

  describe("getDayOfWeek", () => {
    it("returns day name for date", () => {
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0)); // Monday
      expect(getDayOfWeek(date)).toBe("Monday");
    });

    it("handles ISO string input", () => {
      expect(getDayOfWeek("2024-01-15")).toBe("Monday");
    });

    it("returns dash for invalid date", () => {
      expect(getDayOfWeek("invalid")).toBe("—");
    });
  });

  describe("parseDate", () => {
    it("parses ISO date string", () => {
      const result = parseDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString().startsWith("2024-01-15")).toBe(true);
    });

    it("returns null for invalid string", () => {
      expect(parseDate("invalid")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseDate("")).toBeNull();
    });
  });

  describe("normalizeDate", () => {
    it("returns Date object for Date input", () => {
      const date = new Date("2024-01-15");
      expect(normalizeDate(date)).toEqual(date);
    });

    it("parses ISO string to Date", () => {
      const result = normalizeDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("converts timestamp to Date", () => {
      const timestamp = new Date("2024-01-15").getTime();
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
    });

    it("returns null for invalid input", () => {
      expect(normalizeDate("invalid")).toBeNull();
    });

    it("returns null for null input", () => {
      expect(normalizeDate(null as unknown as Date)).toBeNull();
    });
  });

  describe("rollup month helpers", () => {
    it("parses month keys into UTC month boundaries", () => {
      const range = getMonthDateRange("2026-01");
      expect(range?.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
      expect(range?.end.toISOString()).toBe("2026-01-31T23:59:59.999Z");
    });

    it("returns undefined for invalid month keys", () => {
      expect(getMonthDateRange("2026-13")).toBeUndefined();
      expect(getMonthDateRange("bad")).toBeUndefined();
    });

    it("computes previous month keys", () => {
      expect(getPreviousMonth("2026-01")).toBe("2025-12");
    });

    it("parses rollup params from month key", () => {
      const parsed = parseRollupDateParams({ month: "2026-01", compare: "true" });
      expect(parsed.isMonthMode).toBe(true);
      expect(parsed.month).toBe("2026-01");
      expect(parsed.compare).toBe(true);
      expect(parsed.dateRange?.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    });

    it("falls back to from/to date params when month is absent", () => {
      const parsed = parseRollupDateParams({
        from: "2026-01-01",
        to: "2026-01-31",
        compare: "false",
      });
      expect(parsed.isMonthMode).toBe(false);
      expect(parsed.month).toBeUndefined();
      expect(parsed.dateRange?.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
      expect(parsed.dateRange?.end.toISOString()).toBe("2026-01-31T23:59:59.999Z");
    });
  });
});
