import * as widgetsAction from '../actions/widgets.actions';
import { Action, Store } from '@ngrx/store';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType,
} from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { WidgetsState } from '../store/widgets.store';
import { MenuController, ToastController } from '@ionic/angular';
import { StorageProvider } from 'src/app/providers/storage';
import { from, map, mergeMap, switchMap } from 'rxjs';
import { ModalProvider } from 'src/app/providers/modal';

@Injectable()
export class WidgetsEffects {

  setWeatherSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetWeatherSettings>(
        widgetsAction.WidgetsActionTypes.SET_WEATHER_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.saveWeatherWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_WEATHER_SETTINGS_DONE,
        };
      })
    )
  );

  setServerAddressDone$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(widgetsAction.WidgetsActionTypes.SET_WEATHER_SETTINGS_DONE),
        switchMap((action) =>
          this.modalProvider.closeModal(null)
        )
      ),
    { dispatch: false }
  );

  getWeatherSettings$ = createEffect(() =>
		this.actions$.pipe(
			ofType<widgetsAction.GetWeatherSettings>(widgetsAction.WidgetsActionTypes.GET_WEATHER_SETTTINGS),
			mergeMap((action) =>
        from(this.storageProvider.loadWeatherWidgetSettings()).pipe(
            map((data) => ({
              type: widgetsAction.WidgetsActionTypes.GET_WEATHER_SETTTINGS_DONE,
              settings: data,
            }))
				)
			)
		)
	);
  
  done$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<widgetsAction.Done>(widgetsAction.WidgetsActionTypes.DONE)
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store<WidgetsState>,
    private modalProvider: ModalProvider,
    private storageProvider: StorageProvider,
  ) {}
}