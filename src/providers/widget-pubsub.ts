import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';

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
        NOTES_SETTINGS: 'notesWidgetSettingsUpdated',
        PERSONNEL_STATUS_UPDATED: 'signalrPersonnelStatusUpdated',
        PERSONNEL_STAFFING_UPDATED: 'signalPersonnelStatusUpdated',
        UNIT_STATUS_UPDATED: 'signalrUnitStatusUpdated',
        CALL_STATUS_UPDATED: 'signalrCallStatusUpdated',
        PERSONNEL_GROUP_SORT_UPDATED: 'personnelGroupSortUpdated',
        PERSONNEL_GROUP_HIDE_UPDATED: 'personnelGroupHidesUpdated',
        SIGNALR_CONNECTED: 'signalConnected',
        MAP_WIDGET_RESIZED: 'mapWidgetResized'
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

    emitNotesWidgetSettingsUpdated(settings) {
        this._observer.next({
            event: this.EVENTS.NOTES_SETTINGS,
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

    emitSignalRConnected(event) {
        this._observer.next({
            event: this.EVENTS.SIGNALR_CONNECTED,
            data: event
        })
    }

    emitMapSizeUpdated(event) {
        this._observer.next({
            event: this.EVENTS.MAP_WIDGET_RESIZED,
            data: event
        })
    }
}