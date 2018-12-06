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
        '$http', '$q',
        function($http, $q) {
            const vm = this

            vm.emotes = []
            vm.searchCompleted = false

            vm.searchChannel = searchChannel

            // =====

            function searchChannel(form) {
                vm.emotes = []
                vm.searchCompleted = false

                if (form.$valid) {
                    let bttvPromise = $q.resolve()
                    let ffzPromise = $q.resolve()

                    if (['all', 'bttv'].indexOf(form.emoteType.$modelValue) !== -1) {
                        bttvPromise = $http.get(`https://api.betterttv.net/2/channels/${form.channelName.$modelValue}`).then((res) => {
                            return res.data.emotes.map((emote) => ({
                                type: 'bttv',
                                code: emote.code,
                                img: getBttvImageUrl(res.data.urlTemplate, emote.id),
                            }))
                        }).catch(() => {
                            return null
                        })
                    }

                    if (['all', 'ffz'].indexOf(form.emoteType.$modelValue) !== -1) {
                        ffzPromise = $http.get(`https://api.frankerfacez.com/v1/room/${form.channelName.$modelValue}`).then((res) => {
                            const roomSet = res.data.room.set
                            return res.data.sets[roomSet].emoticons.map((emote) => {
                                const urlKey = Object.keys(emote.urls).sort().pop()

                                return {
                                    type: 'ffz',
                                    code: emote.name,
                                    img: emote.urls[urlKey],
                                }
                            })
                        }).catch(() => {
                            return null
                        })
                    }

                    $q.all([bttvPromise, ffzPromise]).then((promiseList) => {
                        vm.emotes = promiseList.filter((data) => data)
                            .reduce((acc, list) => acc.concat(list), [])
                    }).finally(() => {
                        vm.searchCompleted = true
                    })
                }
            }

            function getBttvImageUrl(urlTemplate, imageId) {
                return urlTemplate.replace('{{image}}', '3x').replace('{{id}}', imageId)
            }
        }
    ])

})(angular, window, document)
