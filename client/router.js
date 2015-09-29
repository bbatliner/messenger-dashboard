'use strict';

var app = require('ampersand-app');
var Router = require('ampersand-router');
var LoginPage = require('./pages/login');
var ChatPage = require('./pages/chat');


module.exports = Router.extend({
    routes: {
        'login': 'login',
        'chat': 'chat',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    login: function () {
        if (app.me.isLoggedIn) {
            return this.redirectTo('chat');
        }
        app.trigger('page', new LoginPage({
            model: app.me
        }));
    },

    chat: function () {
        if (!app.me.isLoggedIn) {
            return this.redirectTo('login');
        }
        app.trigger('page', new ChatPage({
            model: app.me
        }));
    },

    catchAll: function () {
        this.redirectTo('chat');
    }
});
