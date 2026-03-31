import { render, screen } from "@testing-library/react";
import { KPICardGroup } from "../kpi-card-group";
import { KPICard } from "../kpi-card";

describe("KPICardGroup", () => {
  it("renders children", () => {
    render(
      <KPICardGroup>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </KPICardGroup>
    );

    expect(screen.getByTestId("child1")).toBeInTheDocument();
    expect(screen.getByTestId("child2")).toBeInTheDocument();
  });

  it("applies 4-column grid by default", () => {
    const { container } = render(
      <KPICardGroup>
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-4");
  });

  it("applies 2-column grid when columns=2", () => {
    const { container } = render(
      <KPICardGroup columns={2}>
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).not.toContain("lg:grid-cols-4");
  });

  it("applies 3-column grid when columns=3", () => {
    const { container } = render(
      <KPICardGroup columns={3}>
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });

  it("applies custom className", () => {
    const { container } = render(
      <KPICardGroup className="custom-gap">
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("custom-gap");
  });

  it("renders with KPI cards as children", () => {
    render(
      <KPICardGroup>
        <KPICard title="Revenue" value="$10,000" />
        <KPICard title="Users" value="1,000" />
        <KPICard title="Orders" value="100" />
        <KPICard title="Conversion" value="10%" />
      </KPICardGroup>
    );

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Conversion")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("applies gap styling", () => {
    const { container } = render(
      <KPICardGroup>
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("gap-4");
  });

  it("renders grid container", () => {
    const { container } = render(
      <KPICardGroup>
        <div>Child</div>
      </KPICardGroup>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid");
  });
});
