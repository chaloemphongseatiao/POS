/**
 * Sales forecasting for the dashboard.
 *
 * Shop revenue is dominated by two things: which day of the week it is
 * (a Saturday looks nothing like a Tuesday) and a slow drift up or down. So
 * the model is a weekday-seasonal average with a damped linear trend — small
 * enough to run in the browser off `/api/reports/daily`, which means no API
 * change and no version skew between the two deployments.
 *
 * Everything here works on Bangkok calendar-day keys ("YYYY-MM-DD"), the same
 * buckets the API reports on.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** How much history feeds each part of the model. */
const TREND_WINDOW = 28;
const SEASON_WINDOW = 56;
/** Pull each weekday factor towards 1 as if it had one extra average day. */
const SEASON_SHRINK = 1;
/** Bounds on a weekday factor, wide enough for a always-closed day but not for a freak one. */
const SEASON_CLAMP = { min: 0.15, max: 2 };
/** The trend may move the forecast by at most this share of the baseline per week. */
const MAX_TREND_SHIFT = 0.25;

export const FORECAST_DAYS = 7;
/** Below this many days of history the shape is noise, not a season. */
export const MIN_HISTORY_DAYS = 7;

export interface ForecastDay {
  date: string;
  revenue: number;
  /** One standard error below/above `revenue`, floored at zero. */
  low: number;
  high: number;
}

export interface SalesForecast {
  /** The dense day-by-day history the model was fitted on, oldest first. */
  history: { date: string; revenue: number }[];
  /** `FORECAST_DAYS` days starting with today. */
  days: ForecastDay[];
  total: number;
  dailyAverage: number;
  /** Actual revenue of the `FORECAST_DAYS` complete days before today. */
  previousTotal: number;
  /** Forecast total against `previousTotal`, in percent. `null` when there is nothing to compare to. */
  changePct: number | null;
  /**
   * How close the same model came on the last week of history, as
   * 100 − mean absolute percentage error. `null` when history is too short to
   * hold a week back.
   */
  accuracyPct: number | null;
}

export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Sunday, matching `Date#getDay`. The key is already a Bangkok day, so read it as UTC. */
export function weekdayOf(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

/**
 * The API only returns days that saw activity. A closed or dead day is a real
 * zero and has to be in the series, or every average silently counts only the
 * good days. History starts at the first day with data — padding zeros before
 * the shop had any would be inventing a slump.
 */
function densify(rows: { date: string; revenue: number }[], lastDay: string) {
  const byDate = new Map(rows.map((row) => [row.date, row.revenue]));
  const start = rows.map((row) => row.date).sort()[0];
  if (!start || start > lastDay) return [];

  const dense: { date: string; revenue: number }[] = [];
  for (let date = start; date <= lastDay; date = addDays(date, 1)) {
    dense.push({ date, revenue: byDate.get(date) ?? 0 });
  }
  return dense;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Least-squares slope per day through points that need not be evenly spaced. */
function slopeOf(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const xMean = mean(points.map((point) => point.x));
  const yMean = mean(points.map((point) => point.y));
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.x - xMean) * (point.y - yMean);
    denominator += (point.x - xMean) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Multiplier per weekday, shrunk towards 1 so a weekday seen twice can't swing the forecast. */
function weekdayFactors(series: { date: string; revenue: number }[]): number[] {
  const overall = mean(series.map((day) => day.revenue));
  if (overall <= 0) return Array(7).fill(1);

  const sums = Array(7).fill(0);
  const counts = Array(7).fill(0);
  for (const day of series) {
    const weekday = weekdayOf(day.date);
    sums[weekday] += day.revenue;
    counts[weekday] += 1;
  }

  return sums.map((sum, weekday) => {
    const shrunk = (sum + SEASON_SHRINK * overall) / (counts[weekday] + SEASON_SHRINK);
    return Math.min(SEASON_CLAMP.max, Math.max(SEASON_CLAMP.min, shrunk / overall));
  });
}

interface Model {
  /** Fitted revenue before seasonality, for a day `index` places after the window start. */
  trendAt: (index: number) => number;
  /** Index of the last day of the training window. */
  lastIndex: number;
  factors: number[];
  /** Standard error of the fit on its own training window. */
  sigma: number;
}

function fit(series: { date: string; revenue: number }[]): Model {
  const trendWindow = series.slice(-TREND_WINDOW);
  const seasonWindow = series.slice(-SEASON_WINDOW);
  const factors = weekdayFactors(seasonWindow);

  // The trend is fitted on deseasonalised revenue. Run straight on the raw
  // series, a repeating weekly shape correlates with the time axis and leaks
  // into the slope — a shop with busy weekends would look like it was growing.
  //
  // A weekday pinned to the floor factor is one the shop is closed on; dividing
  // its zero through says nothing about the level of trading, so it is left out
  // of the level and the trend (its own forecast still comes out near zero).
  const points = trendWindow
    .map((day, index) => ({ x: index, y: day.revenue / factors[weekdayOf(day.date)], factor: factors[weekdayOf(day.date)] }))
    .filter((point) => point.factor > SEASON_CLAMP.min);
  const fitted = points.length > 0 ? points : trendWindow.map((day, index) => ({ x: index, y: day.revenue }));

  const base = mean(fitted.map((point) => point.y));
  // The regression line passes through the mean of the days it was fitted on.
  const lastIndex = trendWindow.length - 1;
  const centre = mean(fitted.map((point) => point.x));

  // A trend fitted on a handful of days extrapolates absurdly, so cap the pace
  // it may move at.
  const limit = base > 0 ? (base * MAX_TREND_SHIFT) / FORECAST_DAYS : 0;
  const rawSlope = slopeOf(fitted);
  const slope = Math.min(limit, Math.max(-limit, rawSlope));

  const trendAt = (index: number) => base + slope * (index - centre);
  const residuals = trendWindow.map(
    (day, index) => day.revenue - Math.max(0, trendAt(index) * factors[weekdayOf(day.date)]),
  );

  return {
    trendAt,
    lastIndex,
    factors,
    sigma: Math.sqrt(mean(residuals.map((residual) => residual ** 2))),
  };
}

/** Project `count` days forward, the first one being `startDate`. */
function project(model: Model, startDate: string, count: number): ForecastDay[] {
  const days: ForecastDay[] = [];
  for (let step = 0; step < count; step++) {
    const date = addDays(startDate, step);
    const revenue = Math.max(0, model.trendAt(model.lastIndex + 1 + step) * model.factors[weekdayOf(date)]);
    days.push({
      date,
      revenue,
      low: Math.max(0, revenue - model.sigma),
      high: revenue + model.sigma,
    });
  }
  return days;
}

/**
 * Refit on everything but the last week and score the model against days it
 * never saw. Reported as 100 − MAPE so a bigger number reads as better;
 * zero-revenue days are skipped because a percentage error against zero is
 * meaningless.
 */
function backtest(series: { date: string; revenue: number }[]): number | null {
  const train = series.slice(0, -FORECAST_DAYS);
  const holdout = series.slice(-FORECAST_DAYS);
  if (train.length < MIN_HISTORY_DAYS * 2) return null;

  const predicted = project(fit(train), holdout[0].date, holdout.length);
  const errors: number[] = [];
  for (let i = 0; i < holdout.length; i++) {
    if (holdout[i].revenue <= 0) continue;
    errors.push(Math.abs(predicted[i].revenue - holdout[i].revenue) / holdout[i].revenue);
  }
  if (errors.length === 0) return null;

  return Math.max(0, Math.min(100, 100 - mean(errors) * 100));
}

/**
 * Build the forecast from the daily breakdown.
 *
 * `today` is excluded from the fit — it is still being rung up, so counting it
 * as a finished day would drag every average down — but it is the first day
 * the forecast covers.
 */
export function buildSalesForecast(
  rows: { date: string; revenue: number }[],
  today: string,
): SalesForecast | null {
  const history = densify(rows, addDays(today, -1));
  if (history.length < MIN_HISTORY_DAYS) return null;

  const days = project(fit(history), today, FORECAST_DAYS);
  const total = days.reduce((sum, day) => sum + day.revenue, 0);
  const previousTotal = history
    .slice(-FORECAST_DAYS)
    .reduce((sum, day) => sum + day.revenue, 0);

  return {
    history,
    days,
    total,
    dailyAverage: total / FORECAST_DAYS,
    previousTotal,
    changePct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
    accuracyPct: backtest(history),
  };
}
