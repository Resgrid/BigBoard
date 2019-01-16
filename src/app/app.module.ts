import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BigBoardApp } from './app.component';
import { APP_CONFIG_TOKEN } from "../config/app.config-interface";

import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { SplashPage } from '../pages/splash-page/splash-page';
import { CTAPanel } from '../components/cta-panel/cta-panel';
import { ChannelProvider, ChannelConfig, SignalrWindow } from "../providers/channel";
import { HttpInterceptorModule } from '../interceptors/http.interceptor.module';

import { Consts } from './consts';
import { AuthProvider } from '../providers/auth';
import { SettingsProvider } from '../providers/settings';
import { UtilsProvider } from '../providers/utils';
import { DataProvider } from '../providers/data';
import { MapProvider } from '../providers/map';
import { WidgetPubSub } from '../providers/widget-pubsub';
import { AlertProvider } from '../providers/alert';
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

import 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/do';
import { CallsProvider } from '../providers/calls';

export function appConfigValue() {
  // This variable is created in config/app.config.dev or config/app.config.prod
  // (depending on how you build the application, dev vs. prod)
  return window['APP_CONFIG'];
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

Raven
  .config('https://785f79e60e484c7baa50033af2d2869d@sentry.io/135552')
  .install();

export class RavenErrorHandler implements ErrorHandler {
  handleError(err:any) : void {
    try {
      Raven.captureException(err.originalError);
    } catch (ex) {
      console.log(ex);
    }
  }
}

@NgModule({
  declarations: [
    BigBoardApp,
    HomePage,
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
    HttpClientModule,
    HttpInterceptorModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    BigBoardApp,
    HomePage,
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
  providers: [{ provide: APP_CONFIG_TOKEN, useFactory: appConfigValue }, { provide: SignalrWindow, useValue: window },  
  {provide: ErrorHandler, useClass: /*IonicErrorHandler*/ RavenErrorHandler }, Consts, AuthProvider, MapProvider, 
  SettingsProvider, UtilsProvider, DataProvider, ChannelProvider, WidgetPubSub, ChannelProvider, AlertProvider, 
  CallsProvider]
})
export class AppModule {}
