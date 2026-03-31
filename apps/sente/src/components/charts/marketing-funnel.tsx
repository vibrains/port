"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/utils/format";

export interface FunnelBreakdownItem {
  label: string;
  value: number | null;
  color: string;
  valueType?: "number" | "currency";
}

interface FunnelTrend {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
}

export interface FunnelStage {
  name: string;
  value: number | null;
  breakdown: FunnelBreakdownItem[];
  conversionRate?: number | null;
  placeholder?: string;
  enabled: boolean;
  valueType?: "number" | "currency";
  trend?: FunnelTrend;
}

interface MarketingFunnelProps {
  stages: FunnelStage[];
  title?: string;
  description?: string;
  className?: string;
}

function formatStageValue(value: number | null, valueType: "number" | "currency" = "number") {
  if (value == null) return "--";
  return valueType === "currency" ? formatCurrency(value) : formatCompactNumber(value);
}

function TrendBadge({ trend }: { trend: FunnelTrend }) {
  const Icon = trend.direction === "up" ? ArrowUp : trend.direction === "down" ? ArrowDown : Minus;
  const trendClass =
    trend.direction === "up"
      ? "text-green-600"
      : trend.direction === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <div className={cn("inline-flex items-center gap-1 text-xs", trendClass)}>
      <Icon className="h-3 w-3" />
      <span>{trend.value.toFixed(1)}%</span>
      <span className="text-muted-foreground">{trend.label}</span>
    </div>
  );
}

export function MarketingFunnel({
  stages,
  title = "Marketing Funnel",
  description = "Cross-channel flow from awareness to conversion",
  className,
}: MarketingFunnelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const total = stage.breakdown.reduce((sum, item) => {
              return sum + (item.value && item.value > 0 ? item.value : 0);
            }, 0);

            return (
              <div key={stage.name} className="space-y-2">
                <div
                  className="w-full md:w-[var(--stage-width)] md:mx-auto"
                  style={{ ["--stage-width" as string]: `${Math.max(44, 100 - index * 12)}%` }}
                >
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      stage.enabled
                        ? "border-border bg-card"
                        : "border-dashed border-muted-foreground/50 bg-muted/40"
                    )}
                    title={!stage.enabled && stage.placeholder ? stage.placeholder : undefined}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {stage.name}
                      </p>
                      <p className="text-lg font-semibold">
                        {formatStageValue(stage.value, stage.valueType)}
                      </p>
                    </div>

                    {stage.enabled ? (
                      <>
                        <div className="flex h-3 overflow-hidden rounded-md bg-muted">
                          {stage.breakdown.map((item) => {
                            const raw = item.value ?? 0;
                            const grow = total > 0 ? Math.max(raw, 0) : 1;
                            return (
                              <div
                                key={`${stage.name}-${item.label}`}
                                className="h-full"
                                style={{
                                  backgroundColor: item.color,
                                  flexGrow: grow,
                                }}
                              />
                            );
                          })}
                        </div>

                        <div className="mt-3 grid gap-1 sm:grid-cols-2">
                          {stage.breakdown.map((item) => (
                            <p
                              key={`${stage.name}-${item.label}-label`}
                              className="text-xs text-muted-foreground"
                            >
                              <span
                                className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                                style={{ backgroundColor: item.color }}
                              />
                              {item.label}: {formatStageValue(item.value, item.valueType ?? "number")}
                            </p>
                          ))}
                        </div>

                        {stage.trend && (
                          <div className="mt-2">
                            <TrendBadge trend={stage.trend} />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">{stage.placeholder}</p>
                    )}
                  </div>
                </div>

                {index > 0 && stage.enabled && stage.conversionRate != null && (
                  <div className="flex justify-center text-xs text-muted-foreground">
                    <span>
                      v {formatPercent(stage.conversionRate, 1)} conversion from previous stage
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
