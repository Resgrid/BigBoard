import * as widgetsAction from '../actions/widgets.actions';
import { Action, Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { WidgetsState } from '../store/widgets.store';
import { MenuController, ToastController } from '@ionic/angular';
import { StorageProvider } from 'src/app/providers/storage';
import { catchError, forkJoin, from, map, mergeMap, of, switchMap } from 'rxjs';
import { ModalProvider } from 'src/app/providers/modal';
import {
  CallsService,
  MappingService,
  NotesService,
  PersonnelService,
  UnitsService,
  UnitStatusService,
} from '@resgrid/ngx-resgridlib';

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
          settings: data
        };
      })
    )
  );

  setPersonnelSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetPersonnelSettings>(
        widgetsAction.WidgetsActionTypes.SET_PERSONNEL_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.savePersonnelWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_PERSONNEL_SETTINGS_DONE,
          settings: data
        };
      })
    )
  );

  setUnitSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetUnitSettings>(
        widgetsAction.WidgetsActionTypes.SET_UNITS_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.saveUnitsWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_UNITS_SETTINGS_DONE,
          settings: data
        };
      })
    )
  );

  setCallsSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetCallsSettings>(
        widgetsAction.WidgetsActionTypes.SET_CALLS_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.saveCallWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_CALLS_SETTINGS_DONE,
          settings: data
        };
      })
    )
  );

  setNotesSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetNotesSettings>(
        widgetsAction.WidgetsActionTypes.SET_NOTES_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.saveNotesWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_NOTES_SETTINGS_DONE,
          settings: data
        };
      })
    )
  );

  setMapSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.SetMapSettings>(
        widgetsAction.WidgetsActionTypes.SET_MAP_SETTINGS
      ),
      switchMap((action) =>
        this.storageProvider.saveMapWidgetSettings(action.settings)
      ),
      map((data) => {
        return {
          type: widgetsAction.WidgetsActionTypes.SET_MAP_SETTINGS_DONE,
          settings: data
        };
      })
    )
  );

  getWeatherSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.GetWeatherSettings>(
        widgetsAction.WidgetsActionTypes.GET_WEATHER_SETTTINGS
      ),
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

  getNotes$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.GetNotes>(
        widgetsAction.WidgetsActionTypes.GET_NOTES
      ),
      mergeMap((action) =>
        this.notesService.getDispatchNote().pipe(
          map((data) => ({
            type: widgetsAction.WidgetsActionTypes.GET_NOTES_DONE,
            notes: data.Data,
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

  loadMapData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<widgetsAction.GetMapData>(
        widgetsAction.WidgetsActionTypes.GET_MAPDATA
      ),
      mergeMap((action) =>
        this.mapProvider.getMapDataAndMarkers().pipe(
          map((data) => ({
            type: widgetsAction.WidgetsActionTypes.GET_MAPDATA_DONE,
            data: data.Data,
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

  loadAllWidgetSettings$ = createEffect(() =>
		this.actions$.pipe(
			ofType<widgetsAction.LoadAllWidgetSettings>(
				widgetsAction.WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS
			),
			switchMap((action) =>
				forkJoin([
					from(this.storageProvider.loadWeatherWidgetSettings()),
					from(this.storageProvider.loadPersonnelWidgetSettings()),
					from(this.storageProvider.loadCallWidgetSettings()),
					from(this.storageProvider.loadUnitsWidgetSettings()),
					from(this.storageProvider.loadNotesWidgetSettings()),
          from(this.storageProvider.loadMapWidgetSettings()),
				]).pipe(
					map((result) => ({
						type: widgetsAction.WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS_DONE,
						weatherWidgetSettings: result[0],
						personnelWidgetSettings: result[1],
						callsWidgetSettings: result[2],
						unitsWidgetSettings: result[3],
						notesWidgetSettings: result[4],
            mapWidgetSettings: result[5],
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
    private personnelService: PersonnelService,
    private callsService: CallsService,
    private unitsService: UnitsService,
    private notesService: NotesService,
	private mapProvider: MappingService,
  ) {}
}
