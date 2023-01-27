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

@Injectable()
export class HomeEffects {
  private _modalRef: HTMLIonModalElement | null;

  closeModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(homeAction.HomeActionTypes.CLOSE_MODAL),
        switchMap((action) => this.closeModal())
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store<HomeState>,
    private modalController: ModalController,
    private alertProvider: AlertProvider,
    private loadingProvider: LoadingProvider,
    private storageProvider: StorageProvider,
    private mapProvider: MappingService,
    private router: Router,
    private homeProvider: HomeProvider,
    private voiceStore: Store<VoiceState>,
    private unitStatusService: UnitStatusService,
    private unitLocationService: UnitLocationService,
    private menuCtrl: MenuController,
    private unitRolesService: UnitRolesService
  ) {}

  runModal = async (component, cssClass, properties) => {
    await this.closeModal();
    await this.menuCtrl.close();

    if (!cssClass) {
      cssClass = 'modal-container';
    }

    this._modalRef = await this.modalController.create({
      component: component,
      cssClass: cssClass,
      componentProps: {
        info: properties,
      },
    });

    return from(this._modalRef.present());
  };

  closeModal = async () => {
    //if (this._modalRef) {
    await this.modalController.dismiss();
    this._modalRef = null;
    //}
  };
}
