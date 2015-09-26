'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    comparator: 'timestamp',

    initialize: function () {
        var threadFetchMessage = app.ipc.facebookFetchMessages + '-' + this.parent.thread_fbid;
        ipc.removeAllListeners(threadFetchMessage);
        ipc.on(threadFetchMessage, function (messages) {
            if (messages[0].thread_fbid === this.parent.thread_fbid) {
                this.add(messages);
            }
        }.bind(this));
    },

    fetch: function () {
        this.reset();
        ipc.send(app.ipc.facebookFetchMessages, this.parent.thread_fbid, this.parent.isGroupChat);
    }
});
