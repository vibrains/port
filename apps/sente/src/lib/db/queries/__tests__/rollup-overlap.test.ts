import { query } from "@/lib/db";
import { getKlaviyoFlowsSummary } from "../email";
import { getWebSummary, getAcquisitionSummary } from "../web";

jest.mock("@/lib/db", () => ({
  query: jest.fn(),
}));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe("rollup overlap filtering", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it("uses overlap filter for klaviyo flow summary", async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          total_flows: "0",
          total_recipients: "0",
          total_revenue: "0",
          avg_open_rate: "0",
          avg_click_rate: "0",
        },
      ],
    } as never);

    await getKlaviyoFlowsSummary("client-1", {
      start: new Date("2026-01-01T00:00:00.000Z"),
      end: new Date("2026-01-31T23:59:59.999Z"),
    });

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain("period_start <= $2 AND period_end >= $3");
    expect(params).toEqual(["client-1", "2026-01-31", "2026-01-01"]);
  });

  it("uses overlap filter for web summary", async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          total_views: "0",
          total_users: "0",
          avg_engagement_time: "0",
          total_key_events: "0",
          total_revenue: "0",
        },
      ],
    } as never);

    await getWebSummary("client-1", {
      start: new Date("2026-01-01T00:00:00.000Z"),
      end: new Date("2026-01-31T23:59:59.999Z"),
    });

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain("period_start <= $2 AND period_end >= $3");
    expect(params).toEqual(["client-1", "2026-01-31", "2026-01-01"]);
  });

  it("uses overlap filter for acquisition summary", async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          total_sessions: "0",
          total_new_users: "0",
          avg_engagement_rate: "0",
        },
      ],
    } as never);

    await getAcquisitionSummary("client-1", {
      start: new Date("2026-01-01T00:00:00.000Z"),
      end: new Date("2026-01-31T23:59:59.999Z"),
    });

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain("period_start <= $2 AND period_end >= $3");
    expect(params).toEqual(["client-1", "2026-01-31", "2026-01-01"]);
  });
});
