((angular, window, document) => {
    angular.module('EmoteBrowseApp', []).config([
        '$compileProvider',
        ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false)
            $compileProvider.commentDirectivesEnabled(false)
            $compileProvider.cssClassDirectivesEnabled(false)
        }
    ])

    .controller('EmoteDisplayController', [
        '$http',
        function($http) {
            const vm = this

            vm.channelNotFound = false
            vm.emotes = []
            vm.searchCompleted = false

            vm.searchChannel = searchChannel
            vm.getImageUrl = getImageUrl

            // =====

            function searchChannel(form) {
                vm.channelNotFound = false
                vm.emotes = []
                vm.searchCompleted = false

                if (form.$valid) {
                    $http.get(`https://api.betterttv.net/2/channels/${form.channelName.$modelValue}`).then((res) => {
                        vm.emotes = res.data.emotes
                        vm.urlTemplate = res.data.urlTemplate
                    }).catch(() => {
                        vm.channelNotFound = true
                    }).finally(() => {
                        vm.searchCompleted = true
                    })
                }
            }

            function getImageUrl(urlTemplate, imageId) {
                const url = urlTemplate.replace('{{image}}', '3x').replace('{{id}}', imageId)
                return url
            }
        }
    ])

})(angular, window, document)
