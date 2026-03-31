import { render, screen } from "@testing-library/react";
import { KPICard } from "../kpi-card";
import { Users } from "lucide-react";

describe("KPICard", () => {
  it("renders title and value", () => {
    render(<KPICard title="Test Metric" value="1,234" />);
    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders with numeric value", () => {
    render(<KPICard title="Revenue" value={50000} />);
    expect(screen.getByText("50000")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<KPICard title="Test" value="123" loading />);
    // Skeleton should be rendered (has specific class)
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("shows trend indicator with up direction", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        trend={{ value: 15, direction: "up" }}
      />
    );
    expect(screen.getByText("15%")).toBeInTheDocument();
    // Check for up trend icon
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows trend indicator with down direction", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        trend={{ value: -10, direction: "down" }}
      />
    );
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("shows trend indicator with neutral direction", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        trend={{ value: 0, direction: "neutral" }}
      />
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(<KPICard title="Users" value="1,000" icon={Users} />);
    // Icon should be rendered
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        description="This is a description"
      />
    );
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("renders trend label when provided", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        trend={{ value: 15, direction: "up", label: "vs last month" }}
      />
    );
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <KPICard title="Test" value="123" className="custom-class" />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("does not show trend when loading", () => {
    render(
      <KPICard
        title="Test"
        value="123"
        loading
        trend={{ value: 15, direction: "up" }}
      />
    );
    // Trend should not be visible during loading
    expect(screen.queryByText("15%")).not.toBeInTheDocument();
  });

  it("renders card with correct structure", () => {
    const { container } = render(<KPICard title="Test" value="123" />);
    // Should have Card component structure
    expect(container.querySelector("[class*='rounded']")).toBeInTheDocument();
  });
});
