var _serviceUrlBase = 'http://resgridapi.local';
//var _serviceUrlBase = 'https://api.resgrid.com';
var _serviceUrl = _serviceUrlBase + '/api/v3';

angular.module('bigBoard')
    .constant('SERVICEURL', _serviceUrl)
    .constant('SERVICEURLBASE', _serviceUrlBase)
    .constant('VERSION', '1.0.0')
    .constant('RELEASEDATE', 'March 1st 2016')
    .constant('NAME', 'Resgrid BigBoard')
    .constant('MAPKEY', '');

var CONSTS = {
    EVENTS: {
        COREDATASYNCED: 'coreDataSynced',
        SETTINGS_SAVED: 'settingsSaved',
        MESSAGE_RECIPIENT_ADDED: 'messageRecipientAdded',
        REGISTRATION_OPERATION_FINISHED: 'registrationOperationFinished',
        PERSONNEL_SETTINGS_UPDATED: 'personnelWidgetSettingsUpdated',
        MAP_SETTINGS_UPDATED: 'mapWidgetSettingsUpdated',
        MAP_RESIZED: 'personnelWidgetResized',
        WEATHER_SETTINGS_UPDATED: 'weatherWidgetSettingsUpdated',
        WEATHER_RESIZED: 'weatherWidgetResized',
        UNIT_SETTINGS_UPDATED: 'unitWidgetSettingsUpdated',
        CALL_SETTINGS_UPDATED: 'callWidgetSettingsUpdated',
        CALLS_UPDATED: 'eventsCallsUpdated',
        PERSONNEL_UPDATED: 'eventsPersonnelUpdated',
        UNITS_UPDATED: 'eventsUnitsUpdated'
    },
    DATA: {
        LOCALPERSONNEL: [],
        LOCALGROUPS: [],
        DEMO_TOKEN: 'Z1VLalNNbVQvcUR5bzBaaEF0TFJrZzYxc3BEclRxR3czYk5WYmNYMVNJaz0='
    },
    STATUS: {
        STANDINGBY: 0,
        NOTRESPONDING: 1,
        RESPONDING: 2,
        ONSCENE: 3,
        AVAILABLESTATION: 4,
        RESPONDINGTOSTATION: 5,
        RESPONDINGTOSCENE: 6
    },
    STAFFING: {
        NORMAL: 0,
        DELAYED: 1,
        UNAVAILABLE: 2,
        COMMITTED: 3,
        ONSHIFT: 4
    },
    DETAILTYPES: {
        NONE: 0,
        STATIONS: 1,
        CALLS: 2,
        CALLSANDSTATIONS: 3
    },
    NOTETYPES: {
        NONE: 0,
        OPTIONAL: 1,
        REQUIRED: 2
    },
    CUSTOMTYPES: {
        PERSONNEL: 1,
        UNIT: 2,
        STAFFING: 3
    },
    MESSAGETYPES: {
        NORMAL: 0,
        CALLBACK: 1,
        POLL: 2
    }
};
