import { useMemo, useState } from "react";
import {
  Activity,
  BarChart as BarChartIcon,
  Calendar as CalendarIcon,
  LineChart as LineChartIcon,
  Target,
  Thermometer,
} from "lucide-react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useBloodInventory } from "@/hooks/useBloodInventory";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import {
  buildDonationSeries,
  buildRequestTrendSeries,
  calculateFulfillmentRate,
  calculateInventoryTurnover,
  generateDemandForecast,
  identifyShortages,
  type AnalyticsGranularity,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const GRANULARITY_OPTIONS: AnalyticsGranularity[] = ["daily", "weekly", "monthly"];

const QUICK_RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
];

export default function AdminAnalytics() {
  const { data: inventory = [], isLoading: inventoryLoading, error: inventoryError } = useBloodInventory();
  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useBloodRequests();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [bloodType, setBloodType] = useState<string>("all");
  const [hospital, setHospital] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("weekly");

  const loading = inventoryLoading || requestsLoading;
  const errorMessage = inventoryError?.message ?? requestsError?.message;

  const fromDate = dateRange?.from ?? subDays(new Date(), 90);
  const toDate = dateRange?.to ?? new Date();
  const start = startOfDay(fromDate.getTime() <= toDate.getTime() ? fromDate : toDate);
  const end = endOfDay(fromDate.getTime() <= toDate.getTime() ? toDate : fromDate);

  const analyticsFilters = useMemo(
    () => ({
      start,
      end,
      bloodType,
      hospital,
      urgency: urgency as "all" | "critical" | "normal",
      granularity,
    }),
    [start, end, bloodType, hospital, urgency, granularity]
  );

  const hospitalOptions = useMemo(() => {
    const unique = new Set<string>();
    inventory.forEach((record) => unique.add(record.hospitalName));
    requests.forEach((record) => unique.add(record.hospitalName));
    return Array.from(unique)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [inventory, requests]);

  const donationSeries = useMemo(
    () => buildDonationSeries(inventory, analyticsFilters),
    [inventory, analyticsFilters]
  );

  const requestSeries = useMemo(
    () => buildRequestTrendSeries(requests, analyticsFilters),
    [requests, analyticsFilters]
  );

  const fulfillmentStats = useMemo(
    () => calculateFulfillmentRate(requests, analyticsFilters),
    [requests, analyticsFilters]
  );

  const turnoverStats = useMemo(
    () => calculateInventoryTurnover(inventory, requests, analyticsFilters),
    [inventory, requests, analyticsFilters]
  );

  const shortageAlerts = useMemo(
    () => identifyShortages(inventory, analyticsFilters),
    [inventory, analyticsFilters]
  );

  const forecastSeries = useMemo(
    () => generateDemandForecast(requests, analyticsFilters),
    [requests, analyticsFilters]
  );

  const totalUnitsDonated = useMemo(
    () => donationSeries.reduce((acc, point) => acc + point.units, 0),
    [donationSeries]
  );

  const projectedDemand = useMemo(() => {
    if (!forecastSeries.length) return 0;
    const futurePoints = forecastSeries.filter((point) => point.actual === undefined);
    if (!futurePoints.length) {
      return Math.round(forecastSeries[forecastSeries.length - 1]?.forecast ?? 0);
    }
    const avg =
      futurePoints.reduce((acc, point) => acc + point.forecast, 0) /
      futurePoints.length;
    return Math.round(avg);
  }, [forecastSeries]);

  const shortageCount = shortageAlerts.length;

  const resetFilters = () => {
    setDateRange({ from: subDays(new Date(), 90), to: new Date() });
    setBloodType("all");
    setHospital("all");
    setUrgency("all");
    setGranularity("weekly");
  };

  if (errorMessage) {
    return (
      <Card className="border-destructive/80 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Analytics unavailable</CardTitle>
          <CardDescription>
            We could not load the analytics data. Please refresh or try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Operational Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Track donation inflows, request fulfillment, and forecast demand to orchestrate proactive drives.
          </p>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          Reset filters
        </Button>
      </header>

      <Card className="border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Select a time horizon and focus area to refine insights.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Date range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Select range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                  defaultMonth={dateRange?.from ?? new Date()}
                />
                <div className="flex flex-wrap gap-2 border-t p-3">
                  {QUICK_RANGES.map(({ label, value }) => (
                    <Button
                      key={label}
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDateRange({ from: subDays(new Date(), value), to: new Date() })
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Blood type</span>
            <Select value={bloodType} onValueChange={setBloodType}>
              <SelectTrigger>
                <SelectValue placeholder="All blood types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All blood types</SelectItem>
                {BLOOD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Hospital</span>
            <Select value={hospital} onValueChange={setHospital}>
              <SelectTrigger>
                <SelectValue placeholder="All facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All facilities</SelectItem>
                {hospitalOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Urgency</span>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue placeholder="All urgency levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All urgency levels</SelectItem>
                <SelectItem value="critical">Critical only</SelectItem>
                <SelectItem value="normal">Routine demand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Granularity</span>
            <Select value={granularity} onValueChange={(value) => setGranularity(value as AnalyticsGranularity)}>
              <SelectTrigger>
                <SelectValue placeholder="Grouping" />
              </SelectTrigger>
              <SelectContent>
                {GRANULARITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/70">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-24" />
              </CardContent>
            </Card>
          ))}
          <Card className="border-border/70 md:col-span-2 xl:col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Units donated</CardTitle>
                <LineChartIcon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalUnitsDonated.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total units captured across the selected window.</p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fulfillment rate</CardTitle>
                <Activity className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fulfillmentStats.requestRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {fulfillmentStats.fulfilledRequests} of {fulfillmentStats.totalRequests} requests fulfilled.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projected weekly demand</CardTitle>
                <Target className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{projectedDemand.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Forecasted units needed in upcoming weeks.</p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shortage alerts</CardTitle>
                <Thermometer className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{shortageCount}</div>
                <p className="text-xs text-muted-foreground">Facilities below target stock or flagged limited.</p>
              </CardContent>
            </Card>
          </div>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChartIcon className="h-5 w-5" /> Donation throughput
                </CardTitle>
                <CardDescription>Track incoming units over time filtered by your selections.</CardDescription>
              </CardHeader>
              <CardContent>
                {donationSeries.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No donation activity recorded for the current filters.
                  </div>
                ) : (
                  <ChartContainer
                    className="h-72"
                    config={{
                      units: {
                        label: "Units donated",
                        color: "hsl(349 80% 55%)",
                      },
                    }}
                  >
                    <AreaChart data={donationSeries}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="label" tickMargin={12} />
                      <YAxis width={60} />
                      <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                      <Area
                        type="monotone"
                        dataKey="units"
                        stroke="var(--color-units)"
                        fill="var(--color-units)"
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" /> Request fulfillment trend
                </CardTitle>
                <CardDescription>Visualize progress on approvals and completed requests.</CardDescription>
              </CardHeader>
              <CardContent>
                {requestSeries.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No request activity recorded for the current filters.
                  </div>
                ) : (
                  <ChartContainer
                    className="h-72"
                    config={{
                      pending: {
                        label: "Pending",
                        color: "hsl(215 90% 60%)",
                      },
                      approved: {
                        label: "Approved",
                        color: "hsl(142 70% 45%)",
                      },
                      fulfilled: {
                        label: "Fulfilled",
                        color: "hsl(222 52% 45%)",
                      },
                      rejected: {
                        label: "Rejected",
                        color: "hsl(1 75% 55%)",
                      },
                    }}
                  >
                    <ComposedChart data={requestSeries}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="label" tickMargin={12} />
                      <YAxis width={60} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="pending" stackId="requests" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" stackId="requests" fill="var(--color-approved)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fulfilled" stackId="requests" fill="var(--color-fulfilled)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" stackId="requests" fill="var(--color-rejected)" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="h-5 w-5" /> Inventory turnover
                </CardTitle>
                <CardDescription>Compare current stock against fulfilled demand by blood group.</CardDescription>
              </CardHeader>
              <CardContent>
                {turnoverStats.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No inventory records match the current filters.
                  </div>
                ) : (
                  <ChartContainer
                    className="h-72"
                    config={{
                      inventoryUnits: {
                        label: "On hand",
                        color: "hsl(189 70% 50%)",
                      },
                      fulfilledUnits: {
                        label: "Fulfilled",
                        color: "hsl(12 82% 55%)",
                      },
                      turnoverRatio: {
                        label: "Turnover",
                        color: "hsl(50 90% 50%)",
                      },
                    }}
                  >
                    <ComposedChart data={turnoverStats}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="bloodType" />
                      <YAxis yAxisId="left" width={60} />
                      <YAxis yAxisId="right" orientation="right" width={50} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar yAxisId="left" dataKey="inventoryUnits" fill="var(--color-inventoryUnits)" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="fulfilledUnits" fill="var(--color-fulfilledUnits)" radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        stroke="var(--color-turnoverRatio)"
                        strokeWidth={2}
                        dataKey="turnoverRatio"
                        dot={false}
                      />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LineChartIcon className="h-5 w-5" /> Demand forecast
                </CardTitle>
                <CardDescription>Projected workload built from historical request patterns.</CardDescription>
              </CardHeader>
              <CardContent>
                {forecastSeries.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    Not enough data to generate a forecast yet.
                  </div>
                ) : (
                  <ChartContainer
                    className="h-72"
                    config={{
                      actual: {
                        label: "Actual",
                        color: "hsl(210 80% 55%)",
                      },
                      forecast: {
                        label: "Forecast",
                        color: "hsl(271 80% 60%)",
                      },
                    }}
                  >
                    <LineChart data={forecastSeries}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="label" tickMargin={12} />
                      <YAxis width={60} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="var(--color-actual)"
                        strokeWidth={2}
                        dot={false}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="var(--color-forecast)"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        name="Forecast"
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="h-5 w-5" /> Shortage watchlist
                </CardTitle>
                <CardDescription>Prioritize outreach and drives for the most constrained facilities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {shortageAlerts.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    No shortages detected for the active filters.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {shortageAlerts.map((alert) => (
                      <div
                        key={`${alert.hospitalName}-${alert.bloodType}`}
                        className="rounded-lg border border-border/60 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{alert.hospitalName}</h3>
                          <Badge variant={alert.status === "available" ? "outline" : "destructive"}>
                            {alert.bloodType}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Remaining stock: <span className="font-semibold text-foreground">{alert.units}</span> units
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Status: <span className="font-semibold capitalize">{alert.status.replace("_", " ")}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
