let angApp = require(__dirname + '/../init')

const chimeversePlugin = require(__dirname +'/../../libs/converse.js/3rdparty/chimeverse-plugin')

angApp.factory('ChimeVerseService', ($window, $timeout, CredentialsServise, SystemService, AppStateService, SettingsService) => {

    let chimeverseService = {}

    chimeverseService._notifyMessage = () => {
        SystemService.playAudio()
        SystemService.showEnvelope()
    }

    chimeverseService._hideNotifyMessage = () => {
        SystemService.hideEnvelope()
    }

    chimeverseService.logout = () => {
        let credentials = CredentialsServise.getCredentials()
        credentials.then((result) => {
            let remove = CredentialsServise.removeCredentials(result.login)
            console.log('Remove credential on logout')
            remove.then(() => {
                AppStateService.set(AppStateService.APP_STATE_LOGIN)
            })
        })
    }

    chimeverseService.initConverse = (bosh, login, password) => {
        AppStateService.set(AppStateService.APP_STATE_DEFAULT) // Always set to default state before init
        chimeversePlugin.register(login)
        let lang = navigator.language
        let allowBookmarks = SettingsService.get('allowBookmarks')
        let omemoDefault = SettingsService.get('omemoDefault')
        let xmppResource = '.' + (Math.random().toString(36)+'00000000000000000').slice(2, 7); // Generate 5 char unique str
        $timeout(() => {
            converse.initialize({
                allow_bookmarks: allowBookmarks,
                auto_login: true,
                auto_reconnect: true,
                bosh_service_url: bosh,
                // debug: true,
                i18n: lang,
                jid: login + '/Chimeverse'+xmppResource,
                omemo_default: omemoDefault,
                password: password,
                priority: 50,
                view_mode: 'embedded',
                whitelisted_plugins: ['chimeVerse'],
            })
        }, 50)
    }

    chimeverseService.getCredentialsAndLogin = () => {
        let credentials = CredentialsServise.getCredentials()
        credentials.then((result) => {
            chimeverseService.initConverse(result.bosh, result.login, result.password)
        }, (error) => {
            AppStateService.set(AppStateService.APP_STATE_LOGIN)
        })
    }


    chimeverseService.chatToOpen = null

    $window.document.addEventListener('conversejs-logout', function (e) {
        chimeverseService.logout()
    })

    $window.document.addEventListener('conversejs-unread', function (e) {
        let sender = e.detail
        chimeverseService.chatToOpen = sender
        chimeverseService._notifyMessage()
    })

    $window.document.addEventListener('conversejs-no-unread', function (e) {
        chimeverseService._hideNotifyMessage()
    })

    return chimeverseService

})