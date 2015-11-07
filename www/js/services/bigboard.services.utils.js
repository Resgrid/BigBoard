var utilsService = [
		'$q', function ($q) {
				return {
					load: function() {
						// Check user's connection
						if ((navigator.connection.type != Connection.NONE) || window.navigator.onLine) {
								if (typeof google == 'undefined') {
										jQuery.getScript('https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places&callback=ExternalScriptsLoaded');
								} else {
										window.ExternalScriptsLoaded();
								}

						} else {

								// Return false 
								callback(false);
						}
					}
				}
		}
];

angular.module('bigBoard.services').factory('utilsService', utilsService);