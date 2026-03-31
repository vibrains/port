import { parseKlaviyoFlows, validateKlaviyoFlowsCSV } from "../klaviyo-flows";

const sampleCSV = `Flow ID,Flow Name,Date,Message Channel,Status,Total Recipients,Open Rate,Click Rate,Unsubscribe Rate,Bounce Rate,Spam Complaints Rate,SMS Failed Delivery Rate,Total Placed Order,Tags
"FLOW001","Welcome Flow","January 2024","Email","Active",5000,0.55,0.15,0.005,0.01,0.001,0,250,"welcome,email"
"FLOW002","Abandoned Cart","January 2024","Email","Active",3000,0.45,0.25,0.003,0.008,0.0005,0,450,"cart,recovery"
"FLOW003","Post-Purchase","January 2024","SMS","Active",1500,0.0,0.0,0.002,0.0,0.0,0.01,180,"sms,post-purchase"`;

const sampleCSVWithPeriodRange = `Flow ID,Flow Name,Date,Message Channel,Status,Total Recipients,Open Rate,Click Rate
"FLOW001","Welcome Flow","Jan 1 - Jan 31, 2024","Email","Active",5000,0.55,0.15`;

describe("parseKlaviyoFlows", () => {
  it("parses valid CSV correctly", () => {
    const result = parseKlaviyoFlows(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.rowCount).toBe(3);
    expect(result.validCount).toBe(3);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(3);

    // Check first flow
    const firstFlow = result.data[0];
    expect(firstFlow.flow_id).toBe("FLOW001");
    expect(firstFlow.flow_name).toBe("Welcome Flow");
    expect(firstFlow.period).toBe("January 2024");
    expect(firstFlow.period_start?.startsWith("2024-01-01")).toBe(true);
    expect(firstFlow.period_end?.startsWith("2024-01-31")).toBe(true);
    expect(firstFlow.channel).toBe("Email");
    expect(firstFlow.status).toBe("Active");
    expect(firstFlow.total_recipients).toBe(5000);
    expect(firstFlow.open_rate).toBe(0.55);
    expect(firstFlow.click_rate).toBe(0.15);
    expect(firstFlow.unsubscribe_rate).toBe(0.005);
    expect(firstFlow.bounce_rate).toBe(0.01);
    expect(firstFlow.spam_rate).toBe(0.001);
    expect(firstFlow.total_placed_order).toBe(250);
  });

  it("handles empty CSV", () => {
    const result = parseKlaviyoFlows("", { clientId: "test", uploadId: "test" });
    expect(result.rowCount).toBe(0);
    expect(result.validCount).toBe(0);
    // Empty CSV may or may not generate errors depending on implementation
    expect(result.errors).toBeDefined();
  });

  it("parses tags correctly", () => {
    const result = parseKlaviyoFlows(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.data[0].tags).toEqual(["welcome", "email"]);
    expect(result.data[1].tags).toEqual(["cart", "recovery"]);
    expect(result.data[2].tags).toEqual(["sms", "post-purchase"]);
  });

  it("handles N/A tags", () => {
    const csvWithNATags = `Flow ID,Flow Name,Date,Message Channel,Status,Total Recipients,Open Rate,Click Rate,Tags
"FLOW001","Welcome Flow","January 2024","Email","Active",5000,0.55,0.15,"N/A"`;

    const result = parseKlaviyoFlows(csvWithNATags, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.data[0].tags).toBeNull();
  });

  it("parses period range from date column", () => {
    const result = parseKlaviyoFlows(sampleCSVWithPeriodRange, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.data[0].period).toBe("Jan 1 - Jan 31, 2024");
    expect(result.data[0].period_start?.startsWith("2024-01-01")).toBe(true);
    expect(result.data[0].period_end?.startsWith("2024-01-31")).toBe(true);
  });

  it("handles SMS flows with different metrics", () => {
    const result = parseKlaviyoFlows(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    const smsFlow = result.data[2];
    expect(smsFlow.channel).toBe("SMS");
    expect(smsFlow.sms_failed_rate).toBe(0.01);
    expect(smsFlow.open_rate).toBe(0); // SMS has no open rate
  });

  it("calls onProgress callback", () => {
    const onProgress = jest.fn();
    parseKlaviyoFlows(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });

  it("handles rows with missing optional fields", () => {
    const csvWithMissingFields = `Flow ID,Flow Name,Date,Message Channel,Status,Total Recipients
"FLOW001","Welcome Flow","January 2024","Email","Active",5000`;

    const result = parseKlaviyoFlows(csvWithMissingFields, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.validCount).toBe(1);
    expect(result.data[0].total_recipients).toBe(5000);
    expect(result.data[0].open_rate).toBeNull();
  });

  it("sets placed_order_rate and revenue to null", () => {
    const result = parseKlaviyoFlows(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    // These fields are not in the CSV, so they should be null
    expect(result.data[0].placed_order_rate).toBeNull();
    expect(result.data[0].revenue).toBeNull();
  });
});

describe("validateKlaviyoFlowsCSV", () => {
  it("returns true for valid CSV", () => {
    expect(validateKlaviyoFlowsCSV(sampleCSV)).toBe(true);
  });

  it("returns false for empty CSV", () => {
    expect(validateKlaviyoFlowsCSV("")).toBe(false);
  });

  it("returns false for CSV without required columns", () => {
    const invalidCSV = "Column1,Column2,Column3\nvalue1,value2,value3";
    expect(validateKlaviyoFlowsCSV(invalidCSV)).toBe(false);
  });

  it("returns false for CSV without flow metrics", () => {
    const noMetricsCSV = "Flow ID,Flow Name\nFLOW001,Welcome Flow";
    expect(validateKlaviyoFlowsCSV(noMetricsCSV)).toBe(false);
  });

  it("returns true for CSV with alternative column names", () => {
    const altColumnsCSV = `Flow ID,Flow Name,Recipients,Channel
"FLOW001","Welcome Flow",5000,"Email"`;
    expect(validateKlaviyoFlowsCSV(altColumnsCSV)).toBe(true);
  });
});
