import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HTTP_INTERCEPTOR_PROVIDER } from 'ng2-http-interceptor';
import {TranslateModule, TranslateService, TranslateStaticLoader, TranslateLoader} from "ng2-translate";
import { Http } from '@angular/http';
import { BigBoardApp } from './app.component';

import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';
import { CTAPanel } from '../components/cta-panel/cta-panel';

import { Consts } from './consts';
import { AuthProvider } from '../providers/auth';
import { SettingsProvider } from '../providers/settings';
import { UtilsProvider } from '../providers/utils';
import { DataProvider } from '../providers/data';
import { WidgetProvider } from '../widgets/widget-provider';

import { CallsWidget } from '../widgets/calls/calls-widget';

import { NgGridModule } from 'angular2-grid';
import { MomentModule } from 'angular2-moment';

export function appConfigValue() {
  // This variable is created in config/app.config.dev or config/app.config.prod
  // (depending on how you build the application, dev vs. prod)
  return window['APP_CONFIG'];
}

export function translateFactory(http: Http) {
  return new TranslateStaticLoader(http, '../config/i18n', '.json');
}

@NgModule({
  declarations: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage,
    CallsWidget,
    CTAPanel
  ],
  imports: [
    IonicModule.forRoot(BigBoardApp),
    NgGridModule,
    MomentModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: translateFactory,
      deps: [Http]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage
  ],
  providers: [...HTTP_INTERCEPTOR_PROVIDER, {provide: ErrorHandler, useClass: IonicErrorHandler}, Consts, AuthProvider, SettingsProvider, UtilsProvider, WidgetProvider, DataProvider]
})
export class AppModule {}
