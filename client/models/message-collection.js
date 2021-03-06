'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    comparator: 'timestamp',

    initialize: function () {
        var threadFetchMessage = app.ipc.facebookFetchMessages + '-' + this.parent.threadFbid;
        ipc.removeAllListeners(threadFetchMessage);
        ipc.on(threadFetchMessage, function (messages) {
            this.reset();
            messages.forEach(function (message) { 
                message.threadID = this.parent.threadFbid;
            }.bind(this));
            this.add(messages);
        }.bind(this));
    },

    fetch: function () {
        ipc.send(app.ipc.facebookFetchMessages, this.parent.threadFbid);
    }
});
