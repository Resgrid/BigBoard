import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';

// Config needs ot be imported before app.module,
// because it defines the global APP_CONFIG variable which is used by the app module
import "../config/app.config.prod";

import { AppModule } from './app.module';

//enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);