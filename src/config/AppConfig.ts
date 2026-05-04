
export const AppConfig = {
  IS_PRODUCTION: true,

  FEATURES: {
    ENABLE_FIAT: false,
  },

  SESSION: {
    IDLE_TIMEOUT: 300 * 60 * 1000,
  },
  API: {
    TIMEOUT: 15000,
    RETRY_COUNT: 3,
  },
  UI: {
    TOAST_DURATION: 3000,
    DebounceTime: 500,
  },
  SENTRY: {
    DSN: "https://a4224c13c9aedbf8f951b4fcca7d95e2@o4510513805393920.ingest.us.sentry.io/4510513812865024",
    ENVIRONMENT: "DEVELOPMENT",
  },
  CACHE: {
    CATEGORY_TIMEOUT: 30 * 60 * 1000,
  },
  WALLET_SUMMARY: {
    REFRESH_INTERVAL: 30 * 60 * 1000,
  }
};

