import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BigBoardApp } from './app.component';

import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';

import { Consts } from './consts';
import { AuthProvider } from '../providers/auth';
import { SettingsProvider } from '../providers/settings';
import { UtilsProvider } from '../providers/utils';
import { WidgetProvider } from '../widgets/widget-provider';

import { CallsWidget } from '../widgets/calls/calls-widget';

import { NgGridModule } from 'angular2-grid';
import { DynamicHTMLModule, DynamicComponentModule, DynamicComponentOptions } from 'ng-dynamic';
import { MomentModule } from 'angular2-moment';

import { WidgetsModule } from '../widgets/widgets.module'

@NgModule({
  declarations: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage
  ],
  imports: [
    WidgetsModule,
    NgGridModule,
     DynamicHTMLModule.forRoot({
      components: [
        { component: CallsWidget, selector: 'calls-widget' },
      ]
    }),
    DynamicComponentModule.forRoot({
      imports: [WidgetsModule]
    }),
    MomentModule,
    IonicModule.forRoot(BigBoardApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    BigBoardApp,
    HomePage,
    AboutPage,
    SettingsPage
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}, Consts, AuthProvider, SettingsProvider, UtilsProvider, WidgetProvider, DynamicComponentOptions]
})
export class AppModule {}
