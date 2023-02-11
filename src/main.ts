import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { defineCustomElements as pwaElements} from '@ionic/pwa-elements/loader';
import { defineCustomElements as jeepSqlite} from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

if (environment.production) {
  enableProdMode();
}

const serverErrorsRegex = new RegExp(
  `500 Internal Server Error|401 Unauthorized|403 Forbidden|404 Not Found|502 Bad Gateway|503 Service Unavailable`,
  'mi'
);

// --> Below only required if you want to use a web platform
try {
  const platform = Capacitor.getPlatform();
  if(platform === "web") {
    // Web platform
    // required for toast component in Browser
    pwaElements(window);

    // required for jeep-sqlite Stencil component
    // to use a SQLite database in Browser
    jeepSqlite(window);

    window.addEventListener('DOMContentLoaded', async () => {
        const jeepEl = document.createElement("jeep-sqlite");
        document.body.appendChild(jeepEl);
    });
  }
} catch (err) {
  console.log(
    `database.service initialize Error: ${JSON.stringify(err)}`
  );
}
// Above only required if you want to use a web platform <--

if (environment.loggingKey && environment.loggingKey !== 'LOGGINGKEY') {
  Sentry.init({
    dsn: environment.loggingKey,
    release: environment.version,
    environment: environment.production ? 'prod' : 'dev',
    // We ignore Server Errors. We have to define here since Angular
    // http client uses setTimeout to detect http call progress.
    // And when the call fails, it throws an exception inside that timeout
    // that bubbles up higher to the main Angular's error handler.
    ignoreErrors: [serverErrorsRegex],
    integrations: [
      // Registers and configures the Tracing integration,
      // which automatically instruments your application to monitor its
      // performance, including custom Angular routing instrumentation
      new Integrations.BrowserTracing({
        tracingOrigins: ['localhost', 'https://api.resgrid.com/api', 'https://bigboard.resgrid.com'],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,
  });
}

platformBrowserDynamic()
      .bootstrapModule(AppModule)
      .then((success) => console.log(`Bootstrap success`))
      .catch((err) => console.error(err));