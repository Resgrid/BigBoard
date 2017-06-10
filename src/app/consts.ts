import {Injectable} from "@angular/core";

/**
 * The key used to store the language in local storage or device storage
 * @type {string}
 */
export const LANG_KEY = 'lang';

/**
 * Code for supported languages
 * @type {string}
 */
export const LANG_EN = 'en';

/**
 * Key used to store in device/browser storage a boolean
 * to know if the user has been presented the tutorial already
 * @type {string}
 */
export const HAS_SEEN_TUTORIAL_KEY = 'hasSeenTutorial';

@Injectable()
export class Consts {
	public EVENTS = {
		LOGGED_IN: 'userLoggedIn',
		SYSTEM_READY: 'systemReady',
		COREDATASYNCED: 'coreDataSynced',
		LOCAL_DATA_SET: 'localDataSet',
		SETTINGS_SAVED: 'settingsSaved',
		MESSAGE_RECIPIENT_ADDED: 'messageRecipientAdded',
		REGISTRATION_OPERATION_FINISHED: 'registrationOperationFinished',
		CORDOVA_DEVICE_RESUMED: 'onResumeCordova',
		CORDOVA_DEVICE_PAUSED: 'onPauseCordova',
		HIDE_SPLASH_SCREEN: 'hideSplashScreen',
		STATUS_UPDATED: 'statusUpdated'
	}

	public WIDGET_TYPES = {
		PERSONNEL: 1,
		MAP: 2,
		WEATHER: 3,
		UNITS: 4,
		CALLS: 5,
		LOG: 6,
		LINKS: 7
	}

	public STATUS = {
		STANDINGBY: 0,
		NOTRESPONDING: 1,
		RESPONDING: 2,
		ONSCENE: 3,
		AVAILABLESTATION: 4,
		RESPONDINGTOSTATION: 5,
		RESPONDINGTOSCENE: 6
	}

	public STAFFING = {
		NORMAL: 0,
		DELAYED: 1,
		UNAVAILABLE: 2,
		COMMITTED: 3,
		ONSHIFT: 4
	}

	public DETAILTYPES = {
		NONE: 0,
		STATIONS: 1,
		CALLS: 2,
		CALLSANDSTATIONS: 3
	}

	public NOTETYPES = {
		NONE: 0,
		OPTIONAL: 1,
		REQUIRED: 2
	}

	public CUSTOMTYPES = {
		PERSONNEL: 1,
		UNIT: 2,
		STAFFING: 3
	}

	public MESSAGETYPES = {
		NORMAL: 0,
		CALLBACK: 1,
		POLL: 2
	}
}