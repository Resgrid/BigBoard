import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HTTP_INTERCEPTOR_PROVIDER } from 'ng2-http-interceptor';
import {TranslateModule, TranslateService, TranslateStaticLoader, TranslateLoader} from "ng2-translate";
import { Http } from '@angular/http';
import { BigBoardApp } from './app.component';

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
import { WidgetProvider } from '../widgets/widget-provider';
import { WidgetPubSub } from '../providers/widget-pubsub';

import { AddPopover } from '../components/add-popover/add-popover';
import { AppPopover } from '../components/app-popover/app-popover';

import { CallsWidget } from '../widgets/calls/calls-widget';
import { CallsModal } from '../widgets/calls/calls-modal';
import { PersonnelWidget } from '../widgets/personnel/personnel-widget';
import { PersonnelModal } from '../widgets/personnel/personnel-modal';

import { NgGridModule } from 'angular2-grid';
import { MomentModule } from 'angular2-moment';

export function appConfigValue() {
  // This variable is created in config/app.config.dev or config/app.config.prod
  // (depending on how you build the application, dev vs. prod)
  return window['APP_CONFIG'];
}

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, 'assets/i18n', '.json');
}

let channelConfig = new ChannelConfig();
channelConfig.url = "https://api.resgrid.com/signalr";
channelConfig.hubName = "eventingHub";

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
    PersonnelModal
  ],
  imports: [
    IonicModule.forRoot(BigBoardApp),
    NgGridModule,
    MomentModule,
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
    PersonnelModal
  ],
  providers: [...HTTP_INTERCEPTOR_PROVIDER, {provide: ErrorHandler, useClass: IonicErrorHandler}, Consts, AuthProvider, 
  SettingsProvider, UtilsProvider, WidgetProvider, DataProvider, TranslateService, ChannelProvider, WidgetPubSub, 
  ChannelProvider, { provide: SignalrWindow, useValue: window }, { provide: 'channel.config', useValue: channelConfig }]
})
export class AppModule {}
