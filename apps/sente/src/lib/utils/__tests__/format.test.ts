import {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatCompactNumber,
  formatRate,
  formatWithSign,
  formatChange,
} from "../format";

describe("format utilities", () => {
  describe("formatNumber", () => {
    it("formats numbers with commas", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("handles decimals", () => {
      expect(formatNumber(1234.56, { decimals: 2 })).toBe("1,234.56");
    });

    it("returns dash for invalid numbers", () => {
      expect(formatNumber(NaN)).toBe("—");
      expect(formatNumber(Infinity)).toBe("—");
      expect(formatNumber(-Infinity)).toBe("—");
    });

    it("handles zero correctly", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("handles negative numbers", () => {
      expect(formatNumber(-1234567)).toBe("-1,234,567");
    });

    it("respects useGrouping option", () => {
      expect(formatNumber(1234567, { useGrouping: false })).toBe("1234567");
    });
  });

  describe("formatPercent", () => {
    it("formats as percentage", () => {
      expect(formatPercent(0.1567)).toBe("15.7%");
    });

    it("handles custom decimals", () => {
      expect(formatPercent(0.1567, 2)).toBe("15.67%");
    });

    it("handles zero", () => {
      expect(formatPercent(0)).toBe("0.0%");
    });

    it("handles invalid numbers", () => {
      expect(formatPercent(NaN)).toBe("—");
    });

    it("handles values greater than 1", () => {
      expect(formatPercent(1.5)).toBe("150.0%");
    });
  });

  describe("formatCurrency", () => {
    it("formats as USD", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("handles negative values", () => {
      expect(formatCurrency(-1234.56)).toBe("-$1,234.56");
    });

    it("handles invalid numbers", () => {
      expect(formatCurrency(NaN)).toBe("—");
    });

    it("formats large amounts", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("formatCompactNumber", () => {
    it("formats thousands as K", () => {
      expect(formatCompactNumber(1500)).toBe("1.5K");
    });

    it("formats millions as M", () => {
      expect(formatCompactNumber(1500000)).toBe("1.5M");
    });

    it("formats billions as B", () => {
      expect(formatCompactNumber(1500000000)).toBe("1.5B");
    });

    it("returns original for numbers under 1000", () => {
      expect(formatCompactNumber(500)).toBe("500");
    });

    it("handles zero", () => {
      expect(formatCompactNumber(0)).toBe("0");
    });

    it("handles invalid numbers", () => {
      expect(formatCompactNumber(NaN)).toBe("—");
    });

    it("respects custom decimals", () => {
      // formatCompactNumber removes trailing zeros, so 1.50K becomes 1.5K
      expect(formatCompactNumber(1500, 2)).toBe("1.5K");
    });
  });

  describe("formatRate", () => {
    it("formats decimal as percentage", () => {
      expect(formatRate(0.2567)).toBe("25.67%");
    });

    it("handles already-percentage values", () => {
      expect(formatRate(25.67, false)).toBe("25.67%");
    });

    it("handles custom decimals", () => {
      expect(formatRate(0.2567, true, 1)).toBe("25.7%");
    });

    it("handles invalid numbers", () => {
      expect(formatRate(NaN)).toBe("—");
    });
  });

  describe("formatWithSign", () => {
    it("adds plus sign for positive numbers", () => {
      // formatWithSign uses formatNumber with default decimals=0
      expect(formatWithSign(25.5)).toBe("+26");
    });

    it("adds minus sign for negative numbers", () => {
      expect(formatWithSign(-25.5)).toBe("-26");
    });

    it("handles zero", () => {
      expect(formatWithSign(0)).toBe("0");
    });

    it("handles invalid numbers", () => {
      expect(formatWithSign(NaN)).toBe("—");
    });

    it("respects decimal options", () => {
      expect(formatWithSign(25.567, { decimals: 1 })).toBe("+25.6");
    });
  });

  describe("formatChange", () => {
    it("formats positive change", () => {
      const result = formatChange(0.15);
      expect(result.formatted).toBe("+15.0%");
      expect(result.trend).toBe("up");
    });

    it("formats negative change", () => {
      const result = formatChange(-0.08);
      expect(result.formatted).toBe("-8.0%");
      expect(result.trend).toBe("down");
    });

    it("formats zero change", () => {
      const result = formatChange(0);
      expect(result.formatted).toBe("0.0%");
      expect(result.trend).toBe("neutral");
    });

    it("handles invalid numbers", () => {
      const result = formatChange(NaN);
      expect(result.formatted).toBe("—");
      expect(result.trend).toBe("neutral");
    });

    it("respects custom decimals", () => {
      const result = formatChange(0.1567, 2);
      expect(result.formatted).toBe("+15.67%");
    });
  });
});
