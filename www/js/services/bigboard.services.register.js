var registerService = [
    '$q', '$http', 'SERVICEURLBASE', '$rootScope', 'settingsService', function ($q, $http, SERVICEURLBASE, $rootScope, settingsService) {
        var registerDepartmentUrl = SERVICEURLBASE + '/DepartmentRegistration/Register';
        var isEmailInUseUrl = SERVICEURLBASE + '/DepartmentRegistration/CheckIfEmailInUse?emailAddress=';
        var isDepartmentNameInUseUrl = SERVICEURLBASE + '/DepartmentRegistration/CheckIfDepartmentNameUsed?departmentName=';
        var isUsernameInUseUrl = SERVICEURLBASE + '/DepartmentRegistration/CheckIfUserNameUsed?userName=';

        return {
            isEmailAddressInUse: function (emailAddress) {
                var email = encodeURIComponent(emailAddress);
                return $http.get(isEmailInUseUrl + email);
            },
            isDepartmentNameInUse: function (departmentName) {
                var name = encodeURIComponent(departmentName);
                return $http.get(isDepartmentNameInUseUrl + name);
            },
            isUserNameInUse: function (userName) {
                var name = encodeURIComponent(userName);
                return $http.get(isUsernameInUseUrl + name);
            },
            registerDepartment: function (department) {
                return $http.post(registerDepartmentUrl, department);
            }
        }
    }
];

angular.module('bigBoard.services').factory('registerService', registerService);