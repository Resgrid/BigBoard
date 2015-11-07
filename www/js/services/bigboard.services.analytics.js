(function () {
	'use strict';

	angular.module('bigBoard.services').factory('analyticsService', analyticsService);

	analyticsService.$inject = ['settingsService'];
	function analyticsService(settingsService) {
		var initAnalytics = function () {
			if (settingsService.areSettingsSet()) {
				if (typeof mixpanel !== 'undefined') {
					mixpanel.identify(settingsService.getUserId());

					mixpanel.register_once({
						"DepartmentId": settingsService.getDepartmentId()
					});

					mixpanel.people.set({
						"$email": settingsService.getEmailAddress(),
						"$created": new Date(settingsService.getDepartmentCreatedOn() * 1000),
						"$last_login": new Date(),
						"departmentId": settingsService.getDepartmentId(),
						"departmentName": settingsService.getDepartmentName(),
						"userId": settingsService.getUserId(),
						"$name": settingsService.getFullName()
					});
				}
			}
		};

		var track = function (feature) {
			if (typeof mixpanel !== 'undefined') {
				mixpanel.track(feature);
			}
		};


		return {
			init: initAnalytics,
			trackFeature: track
		};
	};

}());