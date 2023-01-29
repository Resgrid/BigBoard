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
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { ModalProvider } from 'src/app/providers/modal';
import { CallsService, PersonnelService, UnitsService, UnitStatusService } from '@resgrid/ngx-resgridlib';

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

  setWeatherSettingsDone$ = createEffect(
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

  getPersonnelList$ = createEffect(() =>
		this.actions$.pipe(
			ofType<widgetsAction.GetPersonnelStatuses>(
				widgetsAction.WidgetsActionTypes.GET_PERSONNEL_STATUSES
			),
			mergeMap((action) =>
				this.personnelService.getAllPersonnelInfos('').pipe(
					map((data) => ({
						type: widgetsAction.WidgetsActionTypes.GET_PERSONNEL_STATUSES_DONE,
						statuses: data.Data,
					})),
					catchError(() =>
						of({
							type: widgetsAction.WidgetsActionTypes.DONE,
						})
					)
				)
			)
		)
	);

  getCalls$ = createEffect(() =>
		this.actions$.pipe(
			ofType<widgetsAction.GetCalls>(
				widgetsAction.WidgetsActionTypes.GET_CALLS
			),
			mergeMap((action) =>
				this.callsService.getActiveCalls().pipe(
					map((data) => ({
						type: widgetsAction.WidgetsActionTypes.GET_CALLS_DONE,
						calls: data.Data,
					})),
					catchError(() =>
						of({
							type: widgetsAction.WidgetsActionTypes.DONE,
						})
					)
				)
			)
		)
	);

  getUnits$ = createEffect(() =>
		this.actions$.pipe(
			ofType<widgetsAction.GetUnits>(
				widgetsAction.WidgetsActionTypes.GET_UNITS
			),
			mergeMap((action) =>
				this.unitsService.getAllUnitsInfos('').pipe(
					map((data) => ({
						type: widgetsAction.WidgetsActionTypes.GET_UNITS_DONE,
						units: data.Data,
					})),
					catchError(() =>
						of({
							type: widgetsAction.WidgetsActionTypes.DONE,
						})
					)
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
    private personnelService: PersonnelService,
    private callsService: CallsService,
    private unitsService: UnitsService,
    private unitStatusService: UnitStatusService
  ) {}
}