import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { RequestOptions, Headers} from '@angular/http';
import { StatusBar, Splashscreen } from 'ionic-native';
import { HttpInterceptorService } from 'ng2-http-interceptor';
import { TranslateService } from "ng2-translate";
import { Storage } from "@ionic/storage";

import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';

import { SettingsProvider } from '../providers/settings';

import {LANG_KEY, LANG_EN} from "./constants";
import {TRANSLATIONS_EN} from "../config/i18n/en";

@Component({
  templateUrl: 'app.html'
})
export class BigBoardApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(public platform: Platform,
              private httpInterceptor: HttpInterceptorService,
              private settingsProvider: SettingsProvider,
              private translate: TranslateService,
              private storage: Storage) {
    this.initializeApp();
    this.wireupInteceptors();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'About', component: AboutPage },
      { title: 'Settings', component: SettingsPage }
    ];

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
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
    // Set translations for each supported language
    this.translate.setTranslation(LANG_EN, TRANSLATIONS_EN);

    // Set default translation
    this.translate.setDefaultLang(LANG_EN);

    // Check browser/device storage if there is a setting for the preferred language
    this.storage.get(LANG_KEY).then((savedLang: string) => {
      if (savedLang) {
        this.translate.use(savedLang);
        //this.langActions.setLanguage(savedLang);
      }
      else { // Use English by default and save this preference to device/browser storage
        this.translate.use(LANG_EN);
        this.storage.set(LANG_KEY, LANG_EN);
      }
    });
  }

  private wireupInteceptors() {
    this.httpInterceptor.request().addInterceptor((data, method) => {
      let authHeader = 'Basic ' + this.settingsProvider.settings.AuthToken;
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
        data[data.length] = new RequestOptions({headers: new Headers({'Authorization': authHeader})});
      }

      return data;
    });
  }
}
