import { Component } from '@angular/core';
import { MenuController, ModalController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { SettingsState } from './features/settings/store/settings.store';
import { StorageProvider } from './providers/storage';
import * as SettingsActions from './features/settings/actions/settings.actions';
import { Observable } from 'rxjs';
import { HomeState } from './features/home/store/home.store';
import {
  selectHomeState,
  selectSettingsState,
  selectThemePreferenceState,
} from './store';
import {
  CallResultData,
  UnitResultData,
  UtilsService,
} from '@resgrid/ngx-resgridlib';
import * as HomeActions from './features/home/actions/home.actions';
import { take } from 'rxjs/operators';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { SleepProvider } from './providers/sleep';
import { SubSink } from 'subsink';

declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public noCallSelected: CallResultData;
  public noUnitSelected: UnitResultData;
  public homeState$: Observable<HomeState | null>;
  public settingsState$: Observable<SettingsState | null>;
  public themePreference$: Observable<number | null>;
  private subs = new SubSink();

  constructor(
    private platform: Platform,
    private storage: StorageProvider,
    public menu: MenuController,
    private store: Store<SettingsState>,
    private homeStore: Store<HomeState>,
    private modalController: ModalController,
    private translateService: TranslateService,
    private sleepProvider: SleepProvider,
    private settingsStore: Store<SettingsState>,
    private utilsProvider: UtilsService,
  ) {
    this.homeState$ = this.homeStore.select(selectHomeState);
    this.settingsState$ = this.store.select(selectSettingsState);
    this.themePreference$ = this.store.select(selectThemePreferenceState);

    this.noCallSelected = new CallResultData();
    this.noCallSelected.Name = 'No Call Selected';
    this.noCallSelected.CallId = '0';
    this.noCallSelected.Nature = 'Tap this card to select a call';

    this.noUnitSelected = new UnitResultData();
    this.noUnitSelected.Name = 'No Unit Selected';
    this.noUnitSelected.UnitId = '0';
    this.noUnitSelected.GroupName = 'Tap this card to select a unit';

    this.initializeApp();
  }

  async initializeApp() {
    const that = this;

    this.menu.enable(false);

    this.translateService.setDefaultLang('en');
    this.translateService.use('en');

    this.platform.ready().then(async () => {
      await this.storage.init();

      //StatusBar.styleDefault();

      this.wireupAppEvents();
      await this.sleepProvider.init();
      await SplashScreen.hide();

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.toggleDarkTheme(prefersDark.matches);
      prefersDark.addListener((mediaQuery) =>
        this.toggleDarkTheme(mediaQuery.matches),
      );

      setTimeout(function () {
        that.store.dispatch(new SettingsActions.PrimeSettings());
      }, 1000);
    });
  }

  public getDate(date) {
    return this.utilsProvider.getDate(date);
  }

  public async menuOpened() {
    let modal = await this.modalController.getTop();

    if (modal) {
      this.modalController.dismiss();
    }
  }

  // Add or remove the "dark" class based on if the media query matches
  private toggleDarkTheme(shouldAdd) {
    this.themePreference$.pipe(take(1)).subscribe((enableDarkMode) => {
      if (enableDarkMode === -1) {
        document.body.classList.toggle('dark', shouldAdd);
      } else if (enableDarkMode === 0) {
        document.body.classList.toggle('dark', false);
      } else if (enableDarkMode === 1) {
        document.body.classList.toggle('dark', true);
      }
    });
  }

  private wireupAppEvents() {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      this.modalController.getTop().then((popover) => {
        if (popover) {
          this.modalController.dismiss();
        } else {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            if (
              window.location.href.endsWith('/home/tabs/map') ||
              window.location.href.endsWith('/home/tabs')
            ) {
              return;
            } else {
              window.history.back();
            }
          }
        }
      });
    });

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);

      this.store.dispatch(new SettingsActions.SetIsAppActive(isActive));
    });

    CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data);
    });

    CapacitorApp.addListener('appRestoredResult', (data) => {
      console.log('Restored state:', data);
    });
  }
}
