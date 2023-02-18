import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  CallPrioritiesService,
  CallsService,
  CallTypesService,
  ConnectionState,
  Consts,
  EventsService,
  GroupsService,
  SignalRService,
  StatusesService,
  UnitRolesService,
  UnitsService,
} from '@resgrid/ngx-resgridlib';
import * as _ from 'lodash';
import { AppPayload } from '../models/appPayload';
import { Store } from '@ngrx/store';
import { HomeState } from '../store/home.store';
import { SettingsState } from '../../settings/store/settings.store';
import { selectIsLoggedInState, selectSettingsState } from 'src/app/store';
import * as HomeActions from '../actions/home.actions';
import * as WidgetsActions from '../../widgets/actions/widgets.actions';
import { StorageProvider } from 'src/app/providers/storage';
import { WidgetsState } from '../../widgets/store/widgets.store';

@Injectable({
  providedIn: 'root',
})
export class HomeProvider {
  public isLoggedInState$: Observable<boolean | null>;
  private signalRConnectionStateSub$: Subscription | null;
  private settingStateSub$: Subscription | null;
  private isStarted: boolean = false;

  constructor(
    public http: HttpClient,
    private widgetsStore: Store<WidgetsState>,
    private settingsStore: Store<SettingsState>,
    private homeStore: Store<HomeState>,
    private signalRProvider: SignalRService,
    private events: EventsService,
    private consts: Consts
  ) {
    this.isLoggedInState$ = this.settingsStore.select(selectIsLoggedInState);

    const that = this;
    setTimeout(function () {
      that.isLoggedInState$.subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          //that.homeStore.dispatch(new HomeActions.LoadAppData());
        }
      });
    }, 1000);
  }

  public startSignalR() {
    this.homeStore.dispatch(new HomeActions.UpdateSignalrState(1));

    if (!this.signalRConnectionStateSub$) {
      this.signalRConnectionStateSub$ = this.signalRProvider.connectionState$.subscribe(
        (state: ConnectionState) => {
          this.settingsStore
            .select(selectSettingsState)
            .pipe(take(1))
            .subscribe((settings) => {
              if (state === ConnectionState.Disconnected) {
                if (settings && settings.user) {
                  this.homeStore.dispatch(new HomeActions.UpdateSignalrState(0));
                  this.signalRProvider.restart(settings.user.departmentId);
                  this.homeStore.dispatch(new HomeActions.UpdateSignalrState(1));
                }
              } else if (state === ConnectionState.Connected) {
                if (settings && settings.user) {
                  this.homeStore.dispatch(new HomeActions.UpdateSignalrState(2));
                }
              }
            });
        }
      );
    }

    if (!this.settingStateSub$) {
      this.settingStateSub$ = this.settingsStore
        .select(selectSettingsState)
        .subscribe((settings) => {
          if (settings && settings.user && settings.user.departmentId && !this.isStarted) {
            this.signalRProvider.start(settings.user.departmentId);
            this.init();

            this.isStarted = true;
          }
        });
      }
  }

  public stopSignalR() {
    if (this.signalRConnectionStateSub$) {
      this.signalRConnectionStateSub$.unsubscribe();
      this.signalRConnectionStateSub$ = null;
    }

    if (this.settingStateSub$) {
      this.settingStateSub$.unsubscribe();
      this.settingStateSub$ = null;
    }

    this.homeStore.dispatch(new HomeActions.UpdateSignalrState(0));
    this.signalRProvider.stop();
  }

  public init() {
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.PERSONNEL_STATUS_UPDATED,
      (data: any) => {
        this.widgetsStore.dispatch(new WidgetsActions.GetPersonnelStatuses());
        this.widgetsStore.dispatch(new WidgetsActions.GetMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.PERSONNEL_STAFFING_UPDATED,
      (data: any) => {
        this.widgetsStore.dispatch(new WidgetsActions.GetPersonnelStatuses());
        this.widgetsStore.dispatch(new WidgetsActions.GetMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.UNIT_STATUS_UPDATED,
      (data: any) => {
        this.widgetsStore.dispatch(new WidgetsActions.GetUnits());
        this.widgetsStore.dispatch(new WidgetsActions.GetMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.CALLS_UPDATED,
      (data: any) => {
        this.widgetsStore.dispatch(new WidgetsActions.GetCalls());
        this.widgetsStore.dispatch(new WidgetsActions.GetMapData());
      }
    );
  }
}
