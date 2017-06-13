import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { HttpInterceptorModule } from 'ng-http-interceptor';
import { TranslateModule, TranslateService, TranslateStaticLoader, TranslateLoader } from "ng2-translate";
import { Http } from '@angular/http';
import { BigBoardApp } from './app.component';
import { APP_CONFIG_TOKEN } from "../config/app.config-interface";

import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';
import { SplashPage } from '../pages/splash-page/splash-page';
import { CTAPanel } from '../components/cta-panel/cta-panel';
import { ChannelProvider, ChannelConfig, SignalrWindow } from "../providers/channel";

import { Consts } from './consts';
import { AuthProvider } from '../providers/auth';
import { SettingsProvider } from '../providers/settings';
import { UtilsProvider } from '../providers/utils';
import { DataProvider } from '../providers/data';
import { WidgetPubSub } from '../providers/widget-pubsub';
import { SafePipe } from '../pipes/safe';

import { AddPopover } from '../components/add-popover/add-popover';
import { AppPopover } from '../components/app-popover/app-popover';

import { CallsWidget } from '../widgets/calls/calls-widget';
import { CallsModal } from '../widgets/calls/calls-modal';
import { PersonnelWidget } from '../widgets/personnel/personnel-widget';
import { PersonnelModal } from '../widgets/personnel/personnel-modal';
import { UnitsWidget } from '../widgets/units/units-widget';
import { UnitsModal } from '../widgets/units/units-modal';
import { WeatherWidget } from '../widgets/weather/weather-widget';
import { WeatherModal } from '../widgets/weather/weather-modal';
import { MapWidget } from '../widgets/map/map-widget';
import { MapModal } from '../widgets/map/map-modal';
import { LinksWidget } from '../widgets/links/links-widget';

import { NgGridModule } from 'angular2-grid';
import { MomentModule } from 'angular2-moment';

import * as Raven from 'raven-js';

export function appConfigValue() {
  // This variable is created in config/app.config.dev or config/app.config.prod
  // (depending on how you build the application, dev vs. prod)
  return window['APP_CONFIG'];
}

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, 'assets/i18n', '.json');
}

Raven
  .config('https://785f79e60e484c7baa50033af2d2869d@sentry.io/135552')
  .install();

export class RavenErrorHandler implements ErrorHandler {
  handleError(err:any) : void {
    Raven.captureException(err.originalError);
  }
}

@NgModule({
  declarations: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage,
    CallsWidget,
    CTAPanel,
    SplashPage,
    AppPopover,
    AddPopover,
    CallsModal,
    PersonnelWidget,
    PersonnelModal,
    UnitsWidget,
    UnitsModal,
    WeatherWidget,
    WeatherModal,
    SafePipe,
    MapWidget,
    MapModal,
    LinksWidget
  ],
  imports: [
    IonicModule.forRoot(BigBoardApp),
    NgGridModule,
    MomentModule,
    BrowserModule,
    HttpInterceptorModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage,
    SplashPage,
    AppPopover,
    AddPopover,
    CallsModal,
    PersonnelWidget,
    PersonnelModal,
    UnitsWidget,
    UnitsModal,
    WeatherWidget,
    WeatherModal,
    MapWidget,
    MapModal,
    LinksWidget
  ],
  providers: [{ provide: APP_CONFIG_TOKEN, useFactory: appConfigValue },
  {provide: ErrorHandler, useClass: RavenErrorHandler }, Consts, AuthProvider, 
  SettingsProvider, UtilsProvider, DataProvider, TranslateService, ChannelProvider, WidgetPubSub, ChannelProvider, 
  { provide: SignalrWindow, useValue: window }]
})
export class AppModule {}
