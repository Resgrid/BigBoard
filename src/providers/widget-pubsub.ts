import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/map';

@Injectable()
export class WidgetPubSub {
    public widgets$: Observable<any>;
    private _observer: Observer<any>;

    public EVENTS = {
        CALLS_SETTINGS: 'callWidgetSettingsUpdated',
        PERSONNEL_SETTINGS: 'personnelWidgetSettingsUpdated',
        MAP_SETTINGS: 'mapWidgetSettingsUpdated',
        UNITS_SETTINGS: 'unitsWidgetSettingsUpdated',
        WEATHER_SETTINGS: 'weatherWidgetSettingsUpdated',
        PERSONNEL_STATUS_UPDATED: 'signalrPersonnelStatusUpdated',
        PERSONNEL_STAFFING_UPDATED: 'signalPersonnelStatusUpdated',
        UNIT_STATUS_UPDATED: 'signalrUnitStatusUpdated',
        CALL_STATUS_UPDATED: 'signalrCallStatusUpdated',
        PERSONNEL_GROUP_SORT_UPDATED: 'personnelGroupSortUpdated',
        PERSONNEL_GROUP_HIDE_UPDATED: 'personnelGroupHidesUpdated'
    };

    constructor() {
        this.widgets$ = new Observable(observer => {
            this._observer = observer;
        }).share(); // share() allows multiple subscribers
    }

    watch() {
        return this.widgets$;
    }

    emitCallWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.CALLS_SETTINGS,
            data: settings
        })
    }

    emitPersonnelWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.PERSONNEL_SETTINGS,
            data: settings
        })
    }

    emitMapWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.MAP_SETTINGS,
            data: settings
        })
    }

    emitUnitsWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.UNITS_SETTINGS,
            data: settings
        })
    }

    emitWeatherWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.WEATHER_SETTINGS,
            data: settings
        })
    }

    emitPersonnelStatusUpdated(event) {
        this._observer.next({
            event: this.EVENTS.PERSONNEL_STATUS_UPDATED,
            data: event
        })
    }

    emitPersonnelStaffingUpdated(event) {
        this._observer.next({
            event: this.EVENTS.PERSONNEL_STAFFING_UPDATED,
            data: event
        })
    }

    emitUnitStatusUpdated(event) {
        this._observer.next({
            event: this.EVENTS.UNIT_STATUS_UPDATED,
            data: event
        })
    }

    emitCallUpdated(event) {
        this._observer.next({
            event: this.EVENTS.CALL_STATUS_UPDATED,
            data: event
        })
    }

    emitPersonnelWidgetSortUpdated(event) {
        this._observer.next({
            event: this.EVENTS.PERSONNEL_GROUP_SORT_UPDATED,
            data: event
        })
    }

    emitPersonnelWidgetHideUpdated(event) {
        this._observer.next({
            event: this.EVENTS.PERSONNEL_GROUP_HIDE_UPDATED,
            data: event
        })
    }
}