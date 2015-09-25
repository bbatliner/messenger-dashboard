'use strict';

var app = require('ampersand-app');
var PageView = require('./base');
var ipc = require('electron-safe-ipc/guest');
var ThreadCollection = require('../models/thread-collection');

module.exports = PageView.extend({
    template: require('../templates/pages/login.jade')(),

    events: {
        'click [data-hook=login]': 'handleLoginClick'
    },

    render: function () {
        this.renderWithTemplate(this);

        ipc.removeAllListeners(app.ipc.facebookLoginSuccess);
        ipc.on(app.ipc.facebookLoginSuccess, function (id, firstName, lastName) {
            this.model.id = id;
            this.model.firstName = firstName;
            this.model.lastName = lastName;
            this.model.threads = new ThreadCollection();
            app.navigate('messages');
        }.bind(this));

        return this;
    },

    handleLoginClick: function (e) {
        e.preventDefault();
        var email = this.queryByHook('email').value;
        var password = this.queryByHook('password').value;
        ipc.send(app.ipc.facebookLogin, email, password);        
    }
});
