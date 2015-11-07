(function () {
    'use strict';

    angular.module('bigBoard.services').factory('notyService', notyService);

    notyService.$inject = [];
    function notyService() {
        var queue = [];

        return {
            queue: queue,
            add: function( item ) {
                queue.push(item);
                setTimeout(function(){
                    // remove the alert after 2000 ms
                    $('.alerts .alert').eq(0).remove();
                    queue.shift();
                },2000);
            },
            pop: function(){
                return this.queue.pop();
            }
        };
    }

})();