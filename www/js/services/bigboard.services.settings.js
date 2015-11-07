(function () {
	'use strict';

	angular.module('bigBoard.services').factory('settingsService', settingsService);

	settingsService.$inject = ['$q', 'localStorageService', 'chromeStorage', 'deviceUtils'];
	function settingsService($q, localStorageService, chromeStorageService, deviceUtils) {
	var localStorage = localStorageService;
	var secureStorage;

	var userName;
	var password;

	var stringToBoolean = function (string) {
		switch (string.toString().toLowerCase()) {
			case "true": case "yes": case "1": return true;
			case "false": case "no": case "0": case null: return false;
			default: return Boolean(string);
		}
	};

	if (deviceUtils.isChrome()) {
		localStorage = chromeStorageService;
	}

	return {
		init: function() {
			if (deviceUtils.isPhone()) {
				secureStorage = new cordova.plugins.SecureStorage(
					function () {
						console.log('Secure Storage Init Success')
					},
					function (error) {
						console.log('Secure Storage Error ' + error);
					},
					'resgridresponder');

				// Prime username and password
				secureStorage.get(
					function (value) { userName = value },
					function (error) { console.log('Error ' + error); },
					'Username');

				secureStorage.get(
					function (value) { password = value },
					function (error) { console.log('Error ' + error); },
					'Password');
			}
		},
		areSettingsSet: function () {

			if (deviceUtils.isPhone() && secureStorage) {
				if (!userName || !password)
					return false;
			} else { // Fallback for non-cordova enabled systems
				if (!localStorage.get("Username"))
					return false;

				if (!localStorage.get("Password"))
					return false;
			}

			return true;
		},
		getUsername: function () {
			if (deviceUtils.isPhone() && secureStorage) {
				return userName;
			}

			return localStorage.get("Username");
		},
		setUsername: function (userName) {
			if (deviceUtils.isPhone() && secureStorage) {
				secureStorage.set(
					function (key) { console.log('Set ' + key); },
					function (error) { console.log('Error ' + error); },
					'Username', userName);
			} else {
				localStorage.set("Username", userName);
			}
		},
		getEmailAddress: function () {
			return localStorage.get("EmailAddress");
		},
		setEmailAddress: function (emailAddress) {
			localStorage.set("EmailAddress", emailAddress);
		},
		getFullName: function () {
			return localStorage.get("FullName");
		},
		setFullName: function (fullName) {
			localStorage.set("FullName", fullName);
		},
		getDepartmentId: function () {
			return localStorage.get("DepartmentId");
		},
		setDepartmentId: function (departmentId) {
			localStorage.set("DepartmentId", departmentId);
		},
		getPassword: function () {
			if (deviceUtils.isPhone() && secureStorage) {
				return password;
			}

			return localStorage.get("Password");
		},
		setPassword: function (password) {
			if (deviceUtils.isPhone() && secureStorage) {
				secureStorage.set(
					function (key) { console.log('Set ' + key); },
					function (error) { console.log('Error ' + error); },
					'Password', password);
			} else {
				localStorage.set("Password", password);
			}
		},
		getAuthToken: function () {
			return localStorage.get("AuthToken");
		},
		setAuthToken: function (authToken) {
			localStorage.set("AuthToken", authToken);
		},
		getAuthTokenExpiry: function () {
			return localStorage.get("AuthTokenExpiry");
		},
		setAuthTokenExpiry: function (authTokenExpiry) {
			localStorage.set("AuthTokenExpiry", authTokenExpiry);
		},

		getEnableDetailedResponses: function () {
			var detailedResponse = localStorage.get("EnableDetailedResponses");

			if (detailedResponse != null) {
				var result = stringToBoolean(detailedResponse);
				return result;
			}
			else
				return true;

		},
		setEnableDetailedResponses: function (detailedResponses) {
			localStorage.set("EnableDetailedResponses", detailedResponses);
		},
		getEnableGeolocation: function () {
			var geoLocation = localStorage.get("EnableGeolocation");

			if (geoLocation != null)
				return stringToBoolean(geoLocation);
			else
				return false;
		},
		setEnableGeolocation: function (geoLocation) {
			localStorage.set("EnableGeolocation", geoLocation);
		},
		getEnableHttps: function () {
			var https = localStorage.get("EnableHttps");

			if (https != null)
				return stringToBoolean(https);
			else
				return false;
		},
		setEnableHttps: function (enableHttps) {
			localStorage.set("EnableHttps", enableHttps);
		},
		getEnablePushNotifications: function () {
			var push = localStorage.get("EnablePushNotifications");

			if (push != null)
				return stringToBoolean(push);
			else
				return false;
		},
		setEnablePushNotifications: function (enablePushNotifications) {
			localStorage.set("EnablePushNotifications", enablePushNotifications);
		},
		getPushDeviceId: function () {
			return localStorage.get("PushDeviceId");
		},
		setPushDeviceId: function (deviceId) {
			localStorage.set("PushDeviceId", deviceId);
		},
		getPushDeviceUriId: function () {
			return localStorage.get("PushDeviceUriId");
		},
		setPushDeviceUriId: function (deviceUriId) {
			localStorage.set("PushDeviceUriId", deviceUriId);
		},
		getEnableAutoRefresh: function () {
			var toggle = localStorage.get("EnableAutoRefresh");

			if (toggle != null)
				return stringToBoolean(toggle);
			else
				return false;
		},
		setEnableAutoRefresh: function (enableAutoRefresh) {
			localStorage.set("EnableAutoRefresh", enableAutoRefresh);
		},
		getPersonnelFilter: function () {
			return localStorage.get("PersonnelFilter");
		},
		setPersonnelFilter: function (personnelFilter) {
			localStorage.set("PersonnelFilter", personnelFilter);
		},
		getUnitsFilter: function () {
			return localStorage.get("UnitsFilter");
		},
		setUnitsFilter: function (unitsFilter) {
			localStorage.set("UnitsFilter", unitsFilter);
		},
		getDepartmentName: function () {
			return localStorage.get("DepartmentName");
		},
		setDepartmentName: function (departmentName) {
			localStorage.set("DepartmentName", departmentName);
		},
		getDepartmentCreatedOn: function () {
			return localStorage.get("DepartmentCreatedOn");
		},
		setDepartmentCreatedOn: function (departmentCreatedOn) {
			localStorage.set("DepartmentCreatedOn", departmentCreatedOn);
		},
		getUserId: function () {
			return localStorage.get("UserId");
		},
		setUserId: function (userId) {
			localStorage.set("UserId", userId);
		},
		getSortRespondingTop: function () {
			var toggle = localStorage.get("SortRespondingTop");

			if (toggle != null)
				return stringToBoolean(toggle);
			else
				return false;
		},
		setSortRespondingTop: function (sortRespondingTop) {
			localStorage.set("SortRespondingTop", sortRespondingTop);
		},
		getEnableCustomSounds: function () {
			var toggle = localStorage.get("EnableCustomSounds");

			if (toggle != null)
				return stringToBoolean(toggle);
			else
				return false;
		},
		setEnableCustomSounds: function (enableCustomSounds) {
			localStorage.set("EnableCustomSounds", enableCustomSounds);
		},
		getCustomRespondingText: function () {
			var text = localStorage.get("CustomRespondingText");

			if (text != null)
				return text.trim().toLowerCase();
			else
				return "respond";
		},
		setCustomRespondingText: function (customRespondingText) {
			localStorage.set("CustomRespondingText", customRespondingText);
		},
		prime: function() {
			localStorage.get("Username");
			localStorage.get("Password");
			localStorage.get("EmailAddress");
			localStorage.get("FullName");
			localStorage.get("DepartmentId");
			localStorage.get("Password");
			localStorage.get("AuthToken");
			localStorage.get("AuthTokenExpiry");
			localStorage.get("EnableDetailedResponses");
			localStorage.get("EnableGeolocation");
			localStorage.get("EnablePushNotifications");
			localStorage.get("PushDeviceId");
			localStorage.get("EnableAutoRefresh");
			localStorage.get("PersonnelFilter");
			localStorage.get("UnitsFilter");
			localStorage.get("DepartmentName");
			localStorage.get("DepartmentCreatedOn");
			localStorage.get("UserId");
			localStorage.get("SortRespondingTop");
			localStorage.get("EnableCustomSounds");
			localStorage.get("CustomRespondingText");
		}
	}
}
})();