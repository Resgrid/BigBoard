import * as voiceAction from '../actions/voice.actions';
import { Action, Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  concatMap,
  exhaustMap,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { VoiceState } from '../store/voice.store';
import { KazooVoiceService, VoiceService } from '@resgrid/ngx-resgridlib';
import { OpenViduService } from 'src/app/providers/openvidu';
import { HomeState } from '../../home/store/home.store';
import {
  selectHomeState,
  selectSettingsState,
  selectVoiceState,
} from 'src/app/store';
import { SettingsState } from '../../settings/store/settings.store';
import { AudioProvider } from 'src/app/providers/audio';
import { MenuController, ToastController } from '@ionic/angular';

@Injectable()
export class VoiceEffects {
  getVoipInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType<voiceAction.GetVoipInfo>(
        voiceAction.VoiceActionTypes.GET_VOIPINFO,
      ),
      concatLatestFrom(() => [
        this.store.select(selectVoiceState),
        this.homeStore.select(selectHomeState),
        this.settingsStore.select(selectSettingsState),
      ]),
      mergeMap(([action, voiceState, homeState, settingsState], index) =>
        this.voiceService.getDepartmentVoiceSettings().pipe(
          tap((data) => {
            if (data && data.Data && data.Data.VoiceEnabled) {
              //await this.audioProvider.requestMicrophonePermissions();
              this.openViduService.mute();

              if (
                voiceState.currentActiveVoipChannel &&
                voiceState.currentActiveVoipChannel.Id !== ''
              ) {
                this.openViduService.leaveSession();
              }
            }
          }),
          // If successful, dispatch success action with result
          map((data) => ({
            type: voiceAction.VoiceActionTypes.GET_VOIPINFO_SUCCESS,
            payload: data.Data,
          })),
          tap((data) => {}),
          // If request fails, dispatch failed action
          catchError(() =>
            of({ type: voiceAction.VoiceActionTypes.GET_VOIPINFO_FAIL }),
          ),
        ),
      ),
    ),
  );

  getVoipInfoSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<voiceAction.GetVoipInfoSuccess>(
        voiceAction.VoiceActionTypes.GET_VOIPINFO_SUCCESS,
      ),
      map((data) => ({
        type: voiceAction.VoiceActionTypes.START_VOIP_SERVICES,
        payload: data.payload,
      })),
    ),
  );

  startVoipServices$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.StartVoipServices>(
          voiceAction.VoiceActionTypes.START_VOIP_SERVICES,
        ),
        tap((action) => {
          //this.voiceProvider.startVoipServices(action.payload);
        }),
      ),
    { dispatch: false },
  );

  setNoChannel$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.SetNoChannel>(
          voiceAction.VoiceActionTypes.SET_NOCHANNEL,
        ),
        tap((data) => {
          this.openViduService.leaveSession();
        }),
      ),
    { dispatch: false },
  );

  setActiveChannel$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.SetActiveChannel>(
          voiceAction.VoiceActionTypes.SET_ACTIVECHANNEL,
        ),
        concatLatestFrom(() => [
          this.homeStore.select(selectHomeState),
          this.settingsStore.select(selectSettingsState),
        ]),
        mergeMap(([action, homeState, settingsState], index) =>
          of(action).pipe(
            map((data) => {
              if (data && data.channel) {
                if (data.channel.Id === '') {
                  this.openViduService.leaveSession();
                } else {
                  if (
                    settingsState &&
                    settingsState.user &&
                    settingsState.user.fullName
                  ) {
                    let name = settingsState.user.fullName;

                    return this.openViduService.joinChannel(data.channel, name);
                  } else {
                    return this.showToast(
                      'You must login to join a voip channel',
                    );
                  }
                }
              }

              return of(true);
            }),
          ),
        ),
      ),
    { dispatch: false },
  );

  voipCallStartTransmitting$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.StartTransmitting>(
          voiceAction.VoiceActionTypes.START_TRANSMITTING,
        ),
        tap((data) => {
          this.openViduService.unmute();
        }),
      ),
    { dispatch: false },
  );

  voipCallStopTransmitting$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.StopTransmitting>(
          voiceAction.VoiceActionTypes.STOP_TRANSMITTING,
        ),
        tap((data) => {
          this.openViduService.mute();
        }),
      ),
    { dispatch: false },
  );

  addOpenViduStream$ = createEffect(() =>
    this.actions$.pipe(
      ofType<voiceAction.AddOpenViduStream>(
        voiceAction.VoiceActionTypes.ADD_OPENVIDU_STREAM,
      ),
      map((data) => ({
        type: voiceAction.VoiceActionTypes.DONE,
      })),
    ),
  );

  removeOpenViduStream$ = createEffect(() =>
    this.actions$.pipe(
      ofType<voiceAction.RemoveOpenViduStream>(
        voiceAction.VoiceActionTypes.REMOVE_OPENVIDU_STREAM,
      ),
      map((data) => ({
        type: voiceAction.VoiceActionTypes.DONE,
      })),
    ),
  );

  done$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<voiceAction.Done>(voiceAction.VoiceActionTypes.DONE),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store<VoiceState>,
    //private voiceProvider: KazooVoiceService,
    private voiceService: VoiceService,
    private openViduService: OpenViduService,
    private homeStore: Store<HomeState>,
    private settingsStore: Store<SettingsState>,
    private audioProvider: AudioProvider,
    private toastController: ToastController,
    private menuCtrl: MenuController,
  ) {}

  runModal = async (component, size) => {
    await this.closeModal();
    await this.menuCtrl.close();

    if (!size) {
      size = 'md';
    }
  };

  showToast = async (message) => {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
    });
    toast.present();
  };

  closeModal = () => {};
}
