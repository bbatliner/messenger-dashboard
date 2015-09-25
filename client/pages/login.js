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
        ipc.request(app.ipc.facebookLogin, email, password)
            .then(function (user) {
                this.model.id = user.id;
                this.model.firstName = user.firstName;
                this.model.lastName = user.lastName;
                app.navigate('messages');
            }.bind(this));       
    }
});
