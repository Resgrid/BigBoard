(function () {
    'use strict';

    angular.module('bigBoard.utils').factory('deviceUtils', deviceUtils);

    deviceUtils.$inject = ['$q', '$timeout', '$cordovaDevice'];
    function deviceUtils($q, $timeout, $cordovaDevice) {

        return {
            getDevice: function () {
                if ($cordovaDevice)
                    return $cordovaDevice.getPlatform();

                return "Web";
            },
            isPhone: function () {
                if (typeof (cordova) !== "undefined")
                    return true;

                return false;
            },
            isChrome: function() {
                if (window.ENVIRONMENT) {
                    if (window.ENVIRONMENT === 'chrome.release' || window.ENVIRONMENT === 'chrome.testing') {
                        return true;
                    }
                }

                return false;
            },
            isAndroid: function () {
                if (typeof (cordova) !== "undefined")
                    return false;

                if ($cordovaDevice.getPlatform() == 'Android' || $cordovaDevice.getPlatform() == 'android')
                    return true;

                return false;
            },
            isIOS: function () {
                if (typeof (cordova) !== "undefined")
                    return false;

                if ($cordovaDevice.getPlatform() == 'ios' || $cordovaDevice.getPlatform() == 'iOS')
                    return true;

                return false;
            },
            isWinPhone: function () {
                if (typeof (cordova) !== "undefined")
                    return false;

                if (window.ENVIRONMENT) {
                    if (window.ENVIRONMENT === 'chrome.release' || window.ENVIRONMENT === 'chrome.testing') {
                        return false;
                    }
                }

                if ($cordovaDevice)
                    if ($cordovaDevice.getPlatform() == 'WP8' || $cordovaDevice.getPlatform() == 'Win32NT' || $cordovaDevice.getPlatform() == 'WinCE')
                        return true;

                return false;
            }
        }
    }

}());