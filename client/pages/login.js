'use strict';

var app = require('ampersand-app');
var PageView = require('./base');
var ThreadCollection = require('../models/thread-collection');
var ipc = require('electron-safe-ipc/guest');

module.exports = PageView.extend({
    template: require('../templates/pages/login.jade')(),

    events: {
        'click [data-hook=login]': 'handleLoginClick'
    },

    initialize: function () {
        ipc.removeAllListeners(app.ipc.facebookLoginSuccess);
        ipc.on(app.ipc.facebookLoginSuccess, function (user) {
            this.model.id = user.id;
            this.model.firstName = user.firstName;
            this.model.lastName = user.lastName;
            this.model.threads = new ThreadCollection();
            app.navigate('messages');
        }.bind(this));
    },

    handleLoginClick: function (e) {
        e.preventDefault();
        var email = this.queryByHook('email').value;
        var password = this.queryByHook('password').value;
        ipc.send(app.ipc.facebookLogin, email, password);   
    }
});
