import * as settingsAction from '../actions/settings.actions';
import { Action, Store } from '@ngrx/store';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType,
} from '@ngrx/effects';
import {
  catchError,
  concatMap,
  exhaustMap,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { SettingsState } from '../store/settings.store';
import { MenuController, ModalController, Platform } from '@ionic/angular';
import { ModalLoginPage } from '../modals/login/modal-login.page';
import { AuthProvider } from '../providers/auth';
import { AlertProvider } from 'src/app/providers/alert';
import { LoadingProvider } from 'src/app/providers/loading';
import { StorageProvider } from 'src/app/providers/storage';
import { Router } from '@angular/router';
import { ModalServerInfoPage } from '../modals/serverInfo/modal-serverInfo.page';
import { HomeState } from '../../home/store/home.store';
import * as homeActions from '../../../features/home/actions/home.actions';
import { SleepProvider } from 'src/app/providers/sleep';
import { ModalConfirmLogoutPage } from '../modals/confirmLogout/modal-confirmLogout.page';
import { ModalAboutPage } from '../modals/about/modal-about.page';
import * as Sentry from "@sentry/angular";
import * as WidgetActions from '../../widgets/actions/widgets.actions';

@Injectable()
export class SettingsEffects {
  private _modalRef: HTMLIonModalElement | null;

  showLoginModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SHOW_LOGIN_MODAL),
        exhaustMap((data) => this.runModal(ModalLoginPage, null, null))
      ),
    { dispatch: false }
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.Login>(settingsAction.SettingActionTypes.LOGIN),
      exhaustMap((action) =>
        this.authProvider
          .login(action.payload.username, action.payload.password)
          .pipe(
            mergeMap((data) =>
              from(this.storageProvider.setLoginData(data)).pipe(
                //filter((data) => !!data),
                map((data) => {
                  if (data && data.Rights) {
                    Sentry.setUser({ 
											username: data.sub, 
											email: data.Rights.EmailAddress,
											name: data.Rights.FullName,
											departmentId: data.Rights.DepartmentId,
											departmentName: data.Rights.DepartmentName });
                    
                    return {
                      type: settingsAction.SettingActionTypes
                        .SET_LOGINDATA_NAV_HOME,
                      user: {
                        userId: data.sub,
                        emailAddress: data.Rights.EmailAddress,
                        fullName: data.Rights.FullName,
                        departmentId: data.Rights.DepartmentId,
                        departmentName: data.Rights.DepartmentName,
                      },
                    };
                  } else {
                    return {
                      type: settingsAction.SettingActionTypes.NAV_SETTINGS,
                    };
                  }
                }),
                tap((data) => {
                  this.authProvider.startTrackingRefreshToken();
                }),
                catchError(() =>
                  of({ type: settingsAction.SettingActionTypes.LOGIN_FAIL })
                )
              )
            )
          )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.LOGIN_SUCCESS),
        switchMap(() => this.loadingProvider.hide()),
        switchMap(() => this.router.navigate(['/home']))
      ),
    { dispatch: false }
  );

  loginDone$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.LOGIN_DONE),
        switchMap(() => this.loadingProvider.hide())
      ),
    { dispatch: false }
  );

  loginFail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.LOGIN_FAIL),
        switchMap(() => this.loadingProvider.hide()),
        switchMap((action) =>
          this.alertProvider.showErrorAlert(
            'Login Error',
            '',
            'There was an issue trying to log you in, please check your username and password and try again.'
          )
        )
      ),
    { dispatch: false }
  );

  loggingIn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.IS_LOGIN),
        switchMap(() => this.loadingProvider.show())
      ),
    { dispatch: false }
  );

  primeSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.PrimeSettings>(
        settingsAction.SettingActionTypes.PRIME_SETTINGS
      ),
      exhaustMap((action) =>
        forkJoin([
          this.storageProvider.getStartupData(),
          this.authProvider.refreshTokens(),
        ]).pipe(
          map((data) => {
            try {
              if (
                data &&
                data[0] &&
                data[0].loginData &&
                data[0].loginData.Rights
              ) {
                Sentry.setUser({ 
                  username: data[0].loginData.sub, 
                  email: data[0].loginData.Rights.EmailAddress,
                  name: data[0].loginData.Rights.FullName,
                  departmentId: data[0].loginData.Rights.DepartmentId,
                  departmentName: data[0].loginData.Rights.DepartmentName });

                return {
                  type: settingsAction.SettingActionTypes
                    .SET_LOGINDATA_NAV_HOME,
                  user: {
                    userId: data[0].loginData.sub,
                    emailAddress: data[0].loginData.Rights.EmailAddress,
                    fullName: data[0].loginData.Rights.FullName,
                    departmentId: data[0].loginData.Rights.DepartmentId,
                    departmentName: data[0].loginData.Rights.DepartmentName,
                  },
                  perferDarkMode: data[0].perferDarkMode,
                  keepAlive: data[0].keepAlive,
                };
              } else {
                return {
                  type: settingsAction.SettingActionTypes.NAV_SETTINGS,
                };
              }
            } catch (error) {
              console.error(JSON.stringify(error));
              return {
                type: settingsAction.SettingActionTypes.NAV_SETTINGS,
              };
            }
          }),
          catchError(() =>
            of({ type: settingsAction.SettingActionTypes.NAV_SETTINGS })
          )
        )
      )
    )
  );

  setLoginDataNavHome$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SET_LOGINDATA_NAV_HOME),
        tap(() => {
          this.authProvider.startTrackingRefreshToken();
        }),
        tap(() => {
          this.store.dispatch(new WidgetActions.LoadAllWidgetSettings());
        }),
        switchMap(() => this.loadingProvider.hide()),
        switchMap(() => this.closeModal()),
        switchMap(() => this.router.navigate(['/home']))
      ),
    { dispatch: false }
  );

  navToSettings$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.NAV_SETTINGS),
        switchMap(() => this.router.navigate(['/home/tabs/settings']))
      ),
    { dispatch: false }
  );

  setServerAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.SetServerAddress>(
        settingsAction.SettingActionTypes.SET_SERVERADDRESS
      ),
      switchMap((action) =>
        this.storageProvider.setServerAddress(action.serverAddress)
      ),
      map((data) => {
        return {
          type: settingsAction.SettingActionTypes.SET_SERVERADDRESS_DONE,
        };
      })
    )
  );

  setServerAddressDone$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SET_SERVERADDRESS_DONE),
        switchMap((action) =>
          this.closeModal()
        ),
        switchMap((action) =>
          this.alertProvider.showOkAlert(
            'Resgrid Api',
            'Server Address Set',
            'The server address has been saved. You will need to quit the application completely and re-open for this to take effect.'
          )
        )
      ),
    { dispatch: false }
  );

  showSetServerAddressModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SHOW_SETSERVER_MODAL),
        switchMap((data) => this.runModal(ModalServerInfoPage, null, null))
      ),
    { dispatch: false }
  );

  savePerferDarkModeSetting$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.SavePerferDarkModeSetting>(
        settingsAction.SettingActionTypes.SAVE_PERFER_DARKMODE_SETTING
      ),
      switchMap((action) =>
        this.storageProvider.setPerferDarkMode(action.perferDarkMode)
      ),
      map((data) => {
        return {
          type: settingsAction.SettingActionTypes.DONE,
        };
      })
    )
  );

  saveKeepAliveSetting$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.SaveKeepAliveSetting>(
        settingsAction.SettingActionTypes.SAVE_KEEP_ALIVE_SETTING
      ),
      switchMap(async (action) =>
        this.storageProvider.setKeepAlive(action.keepAlive)
      ),
      map((data) => {
        return {
          type: settingsAction.SettingActionTypes.DONE,
        };
      })
    )
  );

  getApplicationSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.GetApplicationSettings>(
        settingsAction.SettingActionTypes.GET_APP_SETTINGS
      ),
      exhaustMap((action) =>
        forkJoin([
          from(this.storageProvider.getKeepAlive()),
          from(this.storageProvider.getPerferDarkMode()),
        ]).pipe(
          map((result) => ({
            type: settingsAction.SettingActionTypes.SET_APP_SETTINGS,
            keepAlive: result[0],
            perferDarkMode: result[1],
          }))
        )
      )
    )
  );

  showConfirmLogoff$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SHOW_LOGOUTPROMPT),
        exhaustMap((data) =>
          this.runModal(ModalConfirmLogoutPage, null, null, {
            breakpoints: [0, 0.2, 0.5, 1],
            initialBreakpoint: 0.2,
          })
        )
      ),
    { dispatch: false }
  );

  logoff$ = createEffect(() =>
    this.actions$.pipe(
      ofType(settingsAction.SettingActionTypes.LOGOUT),
      switchMap(() => this.storageProvider.clear()),
      tap(() => {
        this.authProvider.logout();
      }),
      switchMap(async () => this.closeModal()),
      map((data) => {
        return {
          type: settingsAction.SettingActionTypes.DONE,
        };
      })
    )
  );

  showAboutModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.SHOW_ABOUT_MODAL),
        exhaustMap((data) => this.runModal(ModalAboutPage, null, null))
      ),
    { dispatch: false }
  );

  setIsAppActive$ = createEffect(() =>
    this.actions$.pipe(
      ofType<settingsAction.SetIsAppActive>(
        settingsAction.SettingActionTypes.SET_IS_APP_ACTIVE
      ),
      tap((action) => {
        if (!action.isActive) {

        } else {

				}
      }),
      map((data) => {
        return {
          type: settingsAction.SettingActionTypes.DONE,
        };
      })
    )
  );

  done$ = createEffect(
    () => this.actions$.pipe(ofType(settingsAction.SettingActionTypes.DONE)),
    { dispatch: false }
  );

  dismissModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(settingsAction.SettingActionTypes.DISMISS_MODAL),
        switchMap(() => this.closeModal())
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store<SettingsState>,
    private modalController: ModalController,
    private authProvider: AuthProvider,
    private alertProvider: AlertProvider,
    private loadingProvider: LoadingProvider,
    private storageProvider: StorageProvider,
    private router: Router,
    private homeStore: Store<HomeState>,
    private menuCtrl: MenuController,
    private platform: Platform
  ) {}

  runModal = async (component, cssClass, properties, opts = {}) => {
    await this.closeModal();
    await this.menuCtrl.close();

    if (!cssClass) {
      cssClass = 'modal-container';
    }

    this._modalRef = await this.modalController.create({
      component: component,
      cssClass: cssClass,
      componentProps: properties,
      ...opts,
    });

    return this._modalRef.present();
  };

  closeModal = async () => {
    try {
      if (this._modalRef) {
        await this.modalController.dismiss();
        this._modalRef = null;
      }
    } catch (error) {
      this._modalRef = null;
    }
  };
}
