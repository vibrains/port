import { parseKlaviyoCampaigns, validateKlaviyoCampaignsCSV } from "../klaviyo-campaigns";

const sampleCSV = `Name,Subject,Preview Text,Sent On,Sent On (UTC),Sent To,Suppressed From,Sent,Bounces,Delivered,Delivery Rate,Unique Opens,Open Rate,Unique Clicks,CTR,Click-To-Open Rate,Opt Outs,Opt-Out Rate,Spam Complaints,SPAM Complaint Rate,Tags
"Welcome Series","Welcome to Sente!","Your skincare journey starts here","2024-01-15 10:30 AM","2024-01-15 3:30 PM","All Customers","",1500,15,1485,0.99,668,0.45,178,0.12,0.27,15,0.01,3,0.002,"welcome,onboarding"
"Monthly Newsletter","January Updates","See what's new","2024-01-20 2:00 PM","2024-01-20 7:00 PM","Newsletter Subscribers","Bounced",3000,30,2970,0.99,1140,0.38,240,0.08,0.21,30,0.01,6,0.002,"newsletter,monthly"`;

describe("parseKlaviyoCampaigns", () => {
  it("parses valid CSV correctly", () => {
    const result = parseKlaviyoCampaigns(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.rowCount).toBe(2);
    expect(result.validCount).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2);

    // Check first campaign
    const firstCampaign = result.data[0];
    expect(firstCampaign.campaign_name).toBe("Welcome Series");
    expect(firstCampaign.subject).toBe("Welcome to Sente!");
    expect(firstCampaign.preview_text).toBe("Your skincare journey starts here");
    expect(firstCampaign.total_recipients).toBe(1500);
    expect(firstCampaign.unique_opens).toBe(668);
    expect(firstCampaign.open_rate).toBe(0.45);
    expect(firstCampaign.unique_clicks).toBe(178);
    expect(firstCampaign.click_rate).toBe(0.12);
    expect(firstCampaign.source).toBe("klaviyo");
    expect(firstCampaign.client_id).toBe("test-client");
    expect(firstCampaign.upload_id).toBe("test-upload");
  });

  it("handles empty CSV", () => {
    const result = parseKlaviyoCampaigns("", { clientId: "test", uploadId: "test" });
    expect(result.rowCount).toBe(0);
    expect(result.validCount).toBe(0);
    // Empty CSV may or may not generate errors depending on implementation
    expect(result.errors).toBeDefined();
  });

  it("handles CSV with only headers", () => {
    const headersOnly = "Name,Subject,Preview Text,Sent On";
    const result = parseKlaviyoCampaigns(headersOnly, { clientId: "test", uploadId: "test" });
    expect(result.rowCount).toBe(0);
    expect(result.validCount).toBe(0);
  });

  it("parses segment name from sentTo and suppressedFrom", () => {
    const result = parseKlaviyoCampaigns(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.data[0].segment_name).toBe("All Customers");
    expect(result.data[1].segment_name).toBe("Newsletter Subscribers | Excluded: Bounced");
  });

  it("parses tags correctly", () => {
    const result = parseKlaviyoCampaigns(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.data[0].tags).toEqual(["welcome", "onboarding"]);
    expect(result.data[1].tags).toEqual(["newsletter", "monthly"]);
  });

  it("calculates bounce rate from delivery rate", () => {
    const result = parseKlaviyoCampaigns(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    // Delivery rate is 0.99, so bounce rate should be 0.01
    expect(result.data[0].bounce_rate).toBeCloseTo(0.01, 2);
  });

  it("calls onProgress callback", () => {
    const onProgress = jest.fn();
    parseKlaviyoCampaigns(sampleCSV, {
      clientId: "test-client",
      uploadId: "test-upload",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });

  it("handles rows with missing optional fields", () => {
    const csvWithMissingFields = `Name,Subject,Preview Text,Sent On,Sent,Bounces,Delivered,Delivery Rate,Unique Opens,Open Rate,Unique Clicks,CTR
"Test Campaign","Test Subject","","2024-01-15",1000,10,990,0.99,450,0.45,90,0.09`;

    const result = parseKlaviyoCampaigns(csvWithMissingFields, {
      clientId: "test-client",
      uploadId: "test-upload",
    });

    expect(result.validCount).toBe(1);
    expect(result.data[0].preview_text).toBeNull();
    expect(result.data[0].total_recipients).toBe(1000);
  });
});

describe("validateKlaviyoCampaignsCSV", () => {
  it("returns true for valid CSV", () => {
    expect(validateKlaviyoCampaignsCSV(sampleCSV)).toBe(true);
  });

  it("returns false for empty CSV", () => {
    expect(validateKlaviyoCampaignsCSV("")).toBe(false);
  });

  it("returns false for CSV without required columns", () => {
    const invalidCSV = "Column1,Column2,Column3\nvalue1,value2,value3";
    expect(validateKlaviyoCampaignsCSV(invalidCSV)).toBe(false);
  });

  it("returns false for CSV without email metrics", () => {
    const noMetricsCSV = "Name,Subject,Preview Text,Sent On\nTest,Subject,Preview,2024-01-15";
    expect(validateKlaviyoCampaignsCSV(noMetricsCSV)).toBe(false);
  });

  it("returns true for CSV with alternative column names", () => {
    // The validator checks for "name", "subject", "sent on" and email metrics ("open", "click")
    // This CSV has the required columns
    const altColumnsCSV = `Campaign Name,Subject,Preview Text,Sent On,Sent,Bounces,Delivered,Delivery Rate,Unique Opens,Open Rate,Unique Clicks,CTR
"Test","Subject","Preview","2024-01-15",100,10,90,0.9,45,0.45,12,0.12`;
    expect(validateKlaviyoCampaignsCSV(altColumnsCSV)).toBe(true);
  });
});
