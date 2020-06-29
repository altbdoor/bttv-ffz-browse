;((
    { merge, of, fromEvent, combineLatest },
    { tap, map, filter, switchMap, catchError, debounceTime, share },
    { ajax }
) => {
    const searchLoading = document.querySelector('#search-loading')
    const searchContent = document.querySelector('#search-content')
    const emoteTemplate = document.querySelector('#tmpl-emote').innerHTML
    Mustache.parse(emoteTemplate)

    const form = document.querySelector('form[name="searchForm"]')
    const initChannelName = window.location.hash.substr(1)
    form.elements.channelName.value =
        form.elements.channelName.value || initChannelName

    const getFfzAjax = (channelName) =>
        ajax
            .getJSON(`https://api.frankerfacez.com/v1/room/${channelName}`)
            .pipe(share())

    const getBttv = (source) =>
        source.pipe(
            map((data) => data.room.twitch_id),
            switchMap((twitchId) =>
                ajax.getJSON(
                    `https://api.betterttv.net/3/cached/users/twitch/${twitchId}`
                )
            ),
            map((data) =>
                data.channelEmotes.map((emote) => ({
                    type: 'bttv',
                    code: emote.code,
                    img: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
                    url: `https://betterttv.com/emotes/${emote.id}`,
                    badgeClass: 'badge-info',
                }))
            ),
            catchError(() => of([]))
        )

    const getFfz = (source) =>
        source.pipe(
            map((data) => {
                const roomSet = data.room.set
                return data.sets[roomSet].emoticons.map((emote) => {
                    const urlKey = Object.keys(emote.urls)
                        .sort()
                        .pop()

                    return {
                        type: 'ffz',
                        code: emote.name,
                        img: emote.urls[urlKey],
                        url: `https://www.frankerfacez.com/emoticon/${emote.id}`,
                        badgeClass: 'badge-success',
                    }
                })
            }),
            catchError(() => of([]))
        )

    const getSubs = (source) =>
        source.pipe(
            map((data) => data.room.twitch_id),
            switchMap((twitchId) =>
                ajax.getJSON(
                    `https://api.twitchemotes.com/api/v4/channels/${twitchId}`
                )
            ),
            map((data) =>
                data.emotes.map((emote) => ({
                    type: 'subs',
                    code: emote.code,
                    img: `https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/3.0`,
                    url: `https://twitchemotes.com/emotes/${emote.id}`,
                    badgeClass: 'badge-danger',
                }))
            ),
            catchError(() => of([]))
        )

    const formSubmit = merge(
        of({
            channelName: initChannelName,
            emoteType: form.elements.emoteType.value,
        }),
        fromEvent(form, 'submit').pipe(
            tap((evt) => evt.preventDefault()),
            map((evt) => evt.target.elements),
            map(({ channelName, emoteType }) => ({
                channelName: channelName.value.toLowerCase(),
                emoteType: emoteType.value,
            }))
        )
    ).pipe(filter((data) => !!data.channelName))

    formSubmit
        .pipe(
            switchMap(({ channelName, emoteType }) => {
                const ffzObs = getFfzAjax(channelName)

                return combineLatest([
                    ['all', 'bttv'].includes(emoteType)
                        ? getBttv(ffzObs)
                        : of([]),
                    ['all', 'ffz'].includes(emoteType)
                        ? getFfz(ffzObs)
                        : of([]),
                    ['all', 'subs'].includes(emoteType)
                        ? getSubs(ffzObs)
                        : of([]),
                ])
            }),
            map((data) =>
                data
                    .flat()
                    .sort((emoteA, emoteB) =>
                        emoteA.code.localeCompare(emoteB.code)
                    )
            )
        )
        .subscribe((emotes) => {
            searchLoading.classList.add('d-none')
            const content = Mustache.render(emoteTemplate, { emotes })
            searchContent.innerHTML = content
        })

    formSubmit.subscribe(() => {
        searchLoading.classList.remove('d-none')
        searchContent.innerHTML = ''
    })

    fromEvent(form.elements.channelName, 'input')
        .pipe(
            debounceTime(200),
            map((evt) => !!evt.target.value)
        )
        .subscribe((hasVal) => {
            const error = document.querySelector('#search-error')
            error.classList.toggle('d-none', hasVal)
        })
})(rxjs, rxjs.operators, rxjs.ajax)
