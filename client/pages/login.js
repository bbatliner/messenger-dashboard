'use strict';

var app = require('ampersand-app');
var PageView = require('./base');
var ipc = require('electron-safe-ipc/guest');

module.exports = PageView.extend({
    template: require('../templates/pages/login.jade')(),

    events: {
        'click [data-hook=login]': 'handleLoginClick'
    },

    handleLoginClick: function (e) {
        e.preventDefault();
        var email = this.queryByHook('email').value;
        var password = this.queryByHook('password').value;
        ipc.send('facebook-login', email, password);
        ipc.on('facebook-login-error', function (err) {
            console.err(err);
        });
        ipc.on('facebook-login-success', function (firstName, lastName) {
            this.model.firstName = firstName;
            this.model.lastName = lastName;
            app.navigate('messages');
        }.bind(this));
    }
});
