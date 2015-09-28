'use strict';

var app = require('ampersand-app');
var _ = require('lodash');
var Router = require('./router');
var MainView = require('./views/main');
var Me = require('./models/me');
var domReady = require('domready');
var ipc = require('electron-safe-ipc/guest');

// Polyfill promises
require('es6-promise').polyfill();

// Define some constants for IPC channels
app.ipc = require('../ipc-channels');
// Define some constants for in-app events
app.events = require('./app-events');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
    me: new Me(),
    router: new Router(),
    root: location.pathname,
    // This is where it all starts
    init: function() {
        // Create and attach our main view
        this.mainView = new MainView({
            model: this.me,
            el: document.body
        });

        // this kicks off our hash based routing (location or slash based routing doesn't work in Electron/file://)
        // and causes the first matching handler in the router to fire.
        this.router.history.start({ pushState: false, root: this.root });

        // Set up error handling
        ipc.on(app.ipc.facebookAuthError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookLoginError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookFetchMessagesError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookFetchThreadsError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookSendMessageError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookFetchFriendsListError, function (err) {
            console.error(err);
        });
        ipc.on(app.ipc.facebookSearchThreadsError, function (err) {
            console.error(err);
        });
    },
    // This is a helper for navigating around the app.
    // this gets called by a global click handler that handles
    // all the <a> tags in the app.
    // it expects a url pathname for example: "/costello/settings"
    navigate: function(page) {
        var url = (page.charAt(0) === '/') ? page.slice(1) : page;
        // Electron "hack":
        // Remove a drive prefix, like 'C:/' or 'D:/', from a file loaded with 'file://'
        url = url.substring(url.indexOf('/') + 1, url.length);
        this.router.history.navigate(url, {
            trigger: true
        });
    }
});

// run it on domReady
domReady(_.bind(app.init, app));
