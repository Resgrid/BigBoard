import * as homeAction from '../actions/home.actions';
import { Action, Store } from '@ngrx/store';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType,
} from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { MenuController, ModalController } from '@ionic/angular';
import { AlertProvider } from 'src/app/providers/alert';
import { LoadingProvider } from 'src/app/providers/loading';
import { StorageProvider } from 'src/app/providers/storage';
import { Router } from '@angular/router';
import {
  MappingService,
  UnitStatusService,
  UnitLocationService,
  SaveUnitLocationInput,
  UnitRolesService,
  GroupsService,
} from '@resgrid/ngx-resgridlib';
import { HomeState } from '../store/home.store';
import { HomeProvider } from '../providers/home';
import { VoiceState } from '../../voice/store/voice.store';
import * as VoiceActions from '../../voice/actions/voice.actions';
import { selectHomeState } from 'src/app/store';
import { ModalProvider } from 'src/app/providers/modal';

@Injectable()
export class HomeEffects {
  startSignalR$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(homeAction.HomeActionTypes.START_SIGNALR),
        tap((action) => {
          this.homeProvider.startSignalR();
        })
      ),
    { dispatch: false }
  );

  stopSignalR$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(homeAction.HomeActionTypes.STOP_SIGNALR),
        tap((action) => {
          this.homeProvider.stopSignalR();
        })
      ),
    { dispatch: false }
  );

  saveWidgetLayout$ = createEffect(() =>
		this.actions$.pipe(
			ofType<homeAction.SaveWidgetLayout>(homeAction.HomeActionTypes.SAVE_WIDGET_LAYOUT),
			concatLatestFrom(() => [this.store.select(selectHomeState)]),
			switchMap(([action, homeState], index) => {
				return this.storageProvider.saveLayout(homeState.widgets);
			})
		),
    { dispatch: false }
	);

  widgetLayoutUpdated$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(homeAction.HomeActionTypes.UPDATE_WIDGET_LAYOUT),
				map((data) => ({
					type: homeAction.HomeActionTypes.SAVE_WIDGET_LAYOUT,
				}))
			)
	);

  removeWidget$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(homeAction.HomeActionTypes.REMOVE_WIDGET),
				map((data) => ({
					type: homeAction.HomeActionTypes.SAVE_WIDGET_LAYOUT,
				}))
			)
	);

  loadWidgetLayout$ = createEffect(() =>
    this.actions$.pipe(
      ofType<homeAction.LoadWidgetLayout>(homeAction.HomeActionTypes.LOAD_WIDGET_LAYOUT),
      switchMap((action) =>
        from(this.storageProvider.loadLayout()).pipe(
          map((data) => ({
            type: homeAction.HomeActionTypes.LOAD_WIDGET_LAYOUT_DONE,
            widgets: data,
          }))
        )
      )
    )
  );

  getGroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType<homeAction.GetGroups>(homeAction.HomeActionTypes.GET_GROUPS),
      switchMap((action) =>
        from(this.groupsService.getallGroups()).pipe(
          map((data) => ({
            type: homeAction.HomeActionTypes.GET_GROUPS_DONE,
            groups: data.Data,
          }))
        )
      )
    )
  );

  closeModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(homeAction.HomeActionTypes.CLOSE_MODAL),
        switchMap((action) => this.modalProvider.closeModal(null))
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store<HomeState>,
    private homeProvider: HomeProvider,
    private modalProvider: ModalProvider,
    private storageProvider: StorageProvider,
    private groupsService: GroupsService,
  ) {}

}
