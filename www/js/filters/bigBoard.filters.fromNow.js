angular.module('bigBoard').filter('fromNow', function () {
    return function (valueFromModel) {
        if (moment) {
            return moment(valueFromModel).fromNow();
        }
        // fallback in case moment doesn't exist.
        return valueFromModel;
    };
});