import * as Sentry from '@sentry/react-native'; 

export const logMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, any>
) => {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
};

export const logError = (
  error: unknown,
  context?: Record<string, any>
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};
