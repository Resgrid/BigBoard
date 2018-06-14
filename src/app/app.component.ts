import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { RequestOptions, Headers } from '@angular/http';
import { StatusBar, Splashscreen } from 'ionic-native';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { SplashPage } from '../pages/splash-page/splash-page';
import { HomePage } from '../pages/home/home';
//import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';

import { SettingsProvider } from '../providers/settings';

import { LANG_EN } from "./consts";

import * as Raven from 'raven-js';

@Component({
  templateUrl: 'app.html'
})
export class BigBoardApp {
  @ViewChild(Nav) nav: Nav;

  //rootPage: any = SplashPage;
  rootPage: any = HomePage;

  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform,
    private settingsProvider: SettingsProvider,
    private translate: TranslateService) {
    this.initializeApp();

    this.pages = [
      { title: 'Dashboard', component: HomePage },
      // { title: 'About', component: AboutPage },
      { title: 'Settings', component: SettingsPage }
    ];
  }

  initializeApp() {
    this.translate.setDefaultLang('en');
    
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();

      this.settingsProvider.init().then(() => {
        this.setupTranslations();

        if (this.settingsProvider.areSettingsSet()) {
          Raven.setUserContext({
            id: this.settingsProvider.getUserId(),
            username: this.settingsProvider.getUsername(),
            email: this.settingsProvider.getEmail()
          });
        }

        Splashscreen.hide();
        this.nav.setRoot(HomePage).then(
          response => {
            console.log('Response ' + response);
          },
          error => {
            console.log('Error: ' + error);
          }
        ).catch(exception => {
          console.log('Exception ' + exception);
        });
      })
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component).then(
      response => {
        console.log('Response ' + response);
      },
      error => {
        console.log('Error: ' + error);
      }
    ).catch(exception => {
      console.log('Exception ' + exception);
    });
  }

  /**
   * Configure translations for the TranslationService
   * and set language the user's preference (if there is one saved) or to English otherwise
   */
  setupTranslations() {
    // Check browser/device storage if there is a setting for the preferred language
    if (this.settingsProvider.getLanguage()) {
      this.translate.use(this.settingsProvider.getLanguage());
    } else {
      this.translate.use(LANG_EN);
      this.settingsProvider.setLanguage(LANG_EN);
    }
  }
}
