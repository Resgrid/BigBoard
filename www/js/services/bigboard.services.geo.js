(function () {
	'use strict';

	angular.module('bigBoard.services').factory('geoService', geoService);

	geoService.$inject = ['$q', '$rootScope', '$cordovaGeolocation', 'settingsService', '$timeout'];
	function geoService($q, $rootScope, $cordovaGeolocation, settingsService, $timeout) {
		var _watch = null;
		var _gpsCoordilates = null;
		var _position = null;
		var _runRequested = false;

		var stopGeolocation = function () {
			if (_watch) {
				console.log('Stopping Geolocation');
				_watch.clearWatch();

				_watch = null;
			}
		};

		var runGeolocation = function () {
			_runRequested = true;

			console.log('Starting Geolocation');

			// begin a watch
			var options = {
				frequency: 1000,
				timeout: 3000,
				enableHighAccuracy: true
			};

			if (settingsService.getEnableGeolocation()) {
				if (_watch)
					stopGeolocation();

				_watch = $cordovaGeolocation.watchPosition(options);
				_watch.then(null,
													 function (err) {
													 	_gpsCoordilates = null;
													 	_position = null;
													 }, function (position) {
													 	if (position.coords) {
													 		_position = position;
													 		_gpsCoordilates = position.coords.latitude + "," + position.coords.longitude;
													 	}
													 });
			}
		};

		$rootScope.$on('onResumeCordova', function (event) {
			console.log('Device Resumed Event - In GeoService');
			runGeolocation();
		});

		$rootScope.$on('onPauseCordova', function (event) {
			console.log('Device Paused Event - In GeoService');
			stopGeolocation();
		});

		return {
			run: runGeolocation,
			stop: stopGeolocation,
			getCoordinates: function () {
				return _gpsCoordilates;
			},
			runRequested: function () {
				return _runRequested;
			},
			geoLocationEnabled: function() {
				return settingsService.getEnableGeolocation();
			},
			getLocation: function () {
				var deferred = $q.defer();

				$timeout(function() {
					if (settingsService.getEnableGeolocation()) {
						deferred.resolve($cordovaGeolocation.getCurrentPosition());
					} else {
						deferred.reject();
					}
				}, 0);

				return deferred.promise;
			}
		}
	}

})();