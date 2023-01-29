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
    private modalProvider: ModalProvider
  ) {}

}
