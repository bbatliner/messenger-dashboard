'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    comparator: 'timestamp',

    fetch: function () {
        this.reset();
        ipc.request(app.ipc.facebookFetchMessages, this.parent.thread_fbid, this.parent.isGroupChat)
            .then(function (messages) {
                this.add(messages);
            }.bind(this));
    }
});
