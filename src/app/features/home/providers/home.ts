import { Injectable, Inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, forkJoin, Subscription } from "rxjs";
import { map, take } from "rxjs/operators";
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
  UnitsService
} from '@resgrid/ngx-resgridlib';
import * as _ from "lodash";
import { AppPayload } from "../models/appPayload";
import { Store } from "@ngrx/store";
import { HomeState } from "../store/home.store";
import { SettingsState } from "../../settings/store/settings.store";
import { selectIsLoggedInState, selectSettingsState } from "src/app/store";
import * as HomeActions from "../actions/home.actions";
import { StorageProvider } from "src/app/providers/storage";

@Injectable({
  providedIn: "root",
})
export class HomeProvider {
  public isLoggedInState$: Observable<boolean | null>;

  constructor(
    public http: HttpClient,
    private unitsProvider: UnitsService,
    private callsProvider: CallsService,
    private callPrioritiesProvider: CallPrioritiesService,
    private statusesService: StatusesService,
    private unitRolesService: UnitRolesService,
    private callTypesProvider: CallTypesService,
    private homeStore: Store<HomeState>,
    private settingsStore: Store<SettingsState>,
    private storageProvider: StorageProvider,
    private groupsProvider: GroupsService,
    private signalRProvider: SignalRService,
    private events: EventsService,
    private consts: Consts
  ) {
    this.isLoggedInState$ = this.settingsStore.select(selectIsLoggedInState);

    const that = this;
    setTimeout(function(){
      that.isLoggedInState$.subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          //that.homeStore.dispatch(new HomeActions.LoadAppData());
        }
      });
    }, 1000);
  }

  public getAppData(): Observable<AppPayload> {
    const getUnits = this.unitsProvider.getAllUnits();
    const getCalls = this.callsProvider.getActiveCalls();
    const getCallPriorities = this.callPrioritiesProvider.getAllCallPriorites();
    const getunitStatuses = this.statusesService.getAllUnitStatuses();
    const getUnitRolesAssignments = this.unitRolesService.getAllUnitRolesAndAssignmentsForDepartment();
    const getCallTypes = this.callTypesProvider.getAllCallTypes();
    const getGroups = this.groupsProvider.getallGroups();

    return forkJoin({
      units: getUnits,
      calls: getCalls,
      priorities: getCallPriorities,
      unitStatuses: getunitStatuses,
      roleAssignments: getUnitRolesAssignments,
      callTypes: getCallTypes,
      groups: getGroups,
    }).pipe(
      map((results) => {
        return {
          Units: results.units.Data,
          Calls: results.calls.Data,
          CallPriorties: results.priorities.Data,
          UnitStatuses: results.unitStatuses.Data,
          UnitRoleAssignments: results.roleAssignments.Data,
          CallTypes: results.callTypes.Data,
          Groups: results.groups.Data
        };
      })
    );
  }

  public startSignalR() {
    this.settingsStore
      .select(selectSettingsState)
      .pipe(take(1))
      .subscribe((settings) => {
        if (settings && settings.user && settings.user.departmentId) {
          this.signalRProvider.connectionState$.subscribe(
            (state: ConnectionState) => {
              if (state === ConnectionState.Disconnected) {
                if (settings && settings.user) {
                  this.signalRProvider.restart(settings.user.departmentId);
                }
              }
            }
          );

          this.signalRProvider.start(settings.user.departmentId);
          this.init();
        }
      });
  }

  public stopSignalR() {
    this.signalRProvider.stop();
  }

  public init() {
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.PERSONNEL_STATUS_UPDATED,
      (data: any) => {
        //this.homeStore.dispatch(new HomeActions.RefreshMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.PERSONNEL_STAFFING_UPDATED,
      (data: any) => {
        //this.homeStore.dispatch(new HomeActions.RefreshMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.UNIT_STATUS_UPDATED,
      (data: any) => {
        //this.homeStore.dispatch(new HomeActions.RefreshMapData());
      }
    );
    this.events.subscribe(
      this.consts.SIGNALR_EVENTS.CALLS_UPDATED,
      (data: any) => {
        //this.homeStore.dispatch(new HomeActions.RefreshMapData());
      }
    );
  }
}
