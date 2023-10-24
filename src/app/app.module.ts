import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { Drivers, Storage } from '@ionic/storage';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxResgridLibModule } from '@resgrid/ngx-resgridlib';
import { CacheProvider } from './providers/cache';
import { reducers, metaReducers } from './reducers';
import { IonicStorageModule } from '@ionic/storage-angular';
import { SettingsModule } from './features/settings/settings.module';
import { HomeModule } from './features/home/home.module';
import { WidgetsModule } from './features/widgets/widgets.module';
import { SafePipe } from './pipes/safe';
import { PipesModule } from './pipes/pipes.module';

export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

let getBaseUrl = (): string => {
  const storedValue = localStorage.getItem(`RgUnitApp.serverAddress`);

  if (storedValue) {
    return storedValue.trim();
  }
  return environment.baseApiUrl;
};

const cacheProvider = new CacheProvider();

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        CommonModule,
        HttpClientModule,
        NgxResgridLibModule.forRoot({
            baseApiUrl: getBaseUrl,
            apiVersion: 'v4',
            clientId: 'RgBigBoardApp',
            googleApiKey: '',
            channelUrl: environment.channelUrl,
            channelHubName: environment.channelHubName,
            realtimeGeolocationHubName: environment.realtimeGeolocationHubName,
            logLevel: environment.logLevel,
            isMobileApp: true,
            cacheProvider: cacheProvider
        }),
        StoreModule.forRoot(reducers, { metaReducers }),
        EffectsModule.forRoot([]),
        StoreRouterConnectingModule.forRoot(),
        StoreDevtoolsModule.instrument({
            maxAge: 10,
            name: 'Resgrid BigBoard',
            logOnly: environment.production,
        }),
        IonicStorageModule.forRoot({
            name: '__RGBigB',
            driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient],
            },
        }),
        IonicModule.forRoot({
            mode: 'md'
        }),
        AppRoutingModule,
        HammerModule,
        SettingsModule,
        HomeModule,
        WidgetsModule,
        PipesModule
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: CacheProvider, useValue: cacheProvider }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
