import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { RequestOptions, Headers } from '@angular/http';
import { StatusBar, Splashscreen } from 'ionic-native';
import { HttpInterceptorService } from 'ng-http-interceptor';
import { TranslateService } from "ng2-translate";
import { BrowserModule } from '@angular/platform-browser';

import { SplashPage } from '../pages/splash-page/splash-page';
import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';

import { SettingsProvider } from '../providers/settings';

import { LANG_EN } from "./consts";

import * as Raven from 'raven-js';

@Component({
  templateUrl: 'app.html'
})
export class BigBoardApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = SplashPage;

  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform,
    private httpInterceptor: HttpInterceptorService,
    private settingsProvider: SettingsProvider,
    private translate: TranslateService) {
    this.initializeApp();
    this.wireupInteceptors();

    this.pages = [
      { title: 'Dashboard', component: HomePage },
     // { title: 'About', component: AboutPage },
      { title: 'Settings', component: SettingsPage }
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      this.settingsProvider.init().then(() => {
        this.setupTranslations();

        if (this.settingsProvider.areSettingsSet()) {
          Raven.setUserContext({
              id: this.settingsProvider.getUserId(),
              username: this.settingsProvider.getUsername(),
              email: this.settingsProvider.getEmail()
          });
        }

        this.nav.setRoot(HomePage);
      })
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  /**
   * Configure translations for the TranslationService
   * and set language the user's preference (if there is one saved) or to English otherwise
   */
  setupTranslations() {
    this.translate.addLangs([LANG_EN]);
    this.translate.setDefaultLang(LANG_EN);

    // Check browser/device storage if there is a setting for the preferred language
    if (this.settingsProvider.getLanguage()) {
      this.translate.use(this.settingsProvider.getLanguage());
    } else {
      this.translate.use(LANG_EN);
      this.settingsProvider.setLanguage(LANG_EN);
    }
  }

  /**
   * Angular 1 style HTTP inteceptor for setting the auth
   * header on every request if we have an auth token.
   */
  private wireupInteceptors() {
    this.httpInterceptor.request().addInterceptor((data, method) => {
      let authToken = this.settingsProvider.settings.AuthToken;

      if (authToken) {
        let authHeader = 'Basic ' + authToken;
        let headersFound: boolean = false;

        data.forEach(element => {
          if (element instanceof RequestOptions) {
            headersFound = true;

            if (element.headers.has("Authorization"))
              element.headers.delete("Authorization");

            element.headers.append('Authorization', authHeader);
          }
        });

        if (!headersFound) {
          data[data.length] = new RequestOptions({ headers: new Headers({ 'Authorization': authHeader }) });
        }
      }

      return data;
    });
  }
}
