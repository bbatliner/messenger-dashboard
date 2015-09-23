'use strict';

var app = require('ampersand-app');
var _ = require('lodash');
// var config = require('clientconfig');
var Router = require('./router');
var MainView = require('./views/main');
var Me = require('./models/me');
var People = require('./models/persons');
var domReady = require('domready');

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
    me: new Me(),
    people: new People(),
    router: new Router(),
    root: location.pathname,
    // This is where it all starts
    init: function() {
        // Create and attach our main view
        this.mainView = new MainView({
            model: this.me,
            el: document.body
        });

        // this kicks off our backbutton tracking (browser history)
        // and will cause the first matching handler in the router
        // to fire.
        this.router.history.start({ pushState: false, root: this.root });
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
