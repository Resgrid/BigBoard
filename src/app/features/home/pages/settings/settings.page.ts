import { ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { SettingsState } from '../../../../features/settings/store/settings.store';
import * as SettingsActions from '../../../../features/settings/actions/settings.actions';
import { Observable, Subscription } from 'rxjs';
import { HomeState } from '../../store/home.store';
import {
  selectHomeState,
  selectKeepAliveState,
  selectSettingsState,
  selectThemePreferenceState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { SleepProvider } from 'src/app/providers/sleep';
import { OpenViduDevicesService } from 'src/app/providers/openviduDevices';
import { IDevice } from 'src/app/models/deviceType';

@Component({
  selector: 'app-home-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  public homeState$: Observable<HomeState | null>;
  public settingsState$: Observable<SettingsState | null>;
  public themePreference$: Observable<number | null>;
  public keepAlive$: Observable<boolean | null>;

  public keepAliveEnabled: boolean = false;
  public headSetType: string = '-1';
  public themePreference: string = '-1';

  private subs = new SubSink();

  public microphones: IDevice[] = [];
  public selectedMicrophone: string;

  public speakers: IDevice[] = [];
  public selectedSpeaker: IDevice;

  constructor(
    public menuCtrl: MenuController,
    private store: Store<SettingsState>,
    private homeStore: Store<HomeState>,
    private sleepProvider: SleepProvider,
    private platform: Platform,
    private deviceService: OpenViduDevicesService,
    private changeDetection: ChangeDetectorRef,
  ) {
    this.homeState$ = this.homeStore.select(selectHomeState);
    this.settingsState$ = this.store.select(selectSettingsState);
    this.themePreference$ = this.store.select(selectThemePreferenceState);
    this.keepAlive$ = this.store.select(selectKeepAliveState);
  }

  ngOnInit() {
    this.menuCtrl.enable(false);
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }

  async ionViewDidEnter() {
    this.menuCtrl.enable(false);

    await this.deviceService.initDevices(); //.then(() => {
    this.microphones = this.deviceService.getMicrophones();

    this.subs.sink = this.themePreference$.subscribe((themePreference) => {
      if (themePreference !== null && themePreference !== undefined) {
        this.themePreference = themePreference.toString();
        this.changeDetection.detectChanges();
      }
    });
  }

  ionViewWillLeave() {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  showLoginModal() {
    this.store.dispatch(new SettingsActions.ShowLoginModal());
  }

  showSetServerAddressModal() {
    this.store.dispatch(new SettingsActions.ShowSetServerModal());
  }

  showsAboutModal() {
    this.store.dispatch(new SettingsActions.ShowAboutModal());
  }

  public setPerferDarkMode(event) {
    this.store.dispatch(
      new SettingsActions.SavePerferDarkModeSetting(parseInt(event)),
    );
  }

  public setKeepAlive(event) {
    this.store.dispatch(
      new SettingsActions.SaveKeepAliveSetting(event.detail.checked),
    );

    if (event.detail.checked) {
      this.sleepProvider.enable();
    } else {
      this.sleepProvider.disable();
    }
  }

  public logOut() {
    this.store.dispatch(new SettingsActions.ShowPromptForLogout());
  }

  public isAndroid() {
    return this.platform.is('android');
  }

  public isIos() {
    return this.platform.is('ios');
  }
}
