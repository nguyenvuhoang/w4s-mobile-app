export const PERIOD_TYPE = {
    DAY: "DAY",
    WEEK: "WEEK",
    MONTH: "MONTH",
    QUARTER: "QUARTER",
    YEAR: "YEAR",
} as const;

export type PeriodType = typeof PERIOD_TYPE[keyof typeof PERIOD_TYPE];
