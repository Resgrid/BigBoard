(function () {
	'use strict';

	angular.module('bigBoard.services').factory('authService', authService);

	authService.$inject = ['$q', '$http', 'SERVICEURL'];
	function authService($q, $http, SERVICEURL) {
		var loginUrl = SERVICEURL + '/Auth/Validate';
		
		return {
			login: function (userName, password) {
				return $http.post(loginUrl, {
					Usr: userName,
					Pass: password
				});
			}
		}
	}

}());