import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: 'https://35c04bb8023f8747846780a3ce513ae0@o4511551627591680.ingest.de.sentry.io/4511551640240208',
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});