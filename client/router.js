'use strict';

var app = require('ampersand-app');
var Router = require('ampersand-router');
var LoginPage = require('./pages/login');
var MessagesPage = require('./pages/messages');


module.exports = Router.extend({
    routes: {
        'login': 'login',
        'messages': 'messages',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    login: function () {
        if (app.me.isLoggedIn) {
            return this.redirectTo('messages');
        }
        app.trigger('page', new LoginPage({
            model: app.me
        }));
    },

    messages: function () {
        if (!app.me.isLoggedIn) {
            return this.redirectTo('login');
        }
        app.trigger('page', new MessagesPage({
            model: app.me
        }));
    },

    catchAll: function () {
        this.redirectTo('messages');
    }
});
