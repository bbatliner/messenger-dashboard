'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var MessageCollection = require('./message-collection');
var Thread = require('./thread');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Thread,

    comparator: function (a, b) { 
        return b.timestamp - a.timestamp; // put the most recent timestamps at the top of the list
    },

    initialize: function () {
        var threadsFetched = app.ipc.facebookFetchThreads + '-' + app.me.id;
        ipc.removeAllListeners(threadsFetched);
        ipc.on(threadsFetched, function (threads) {
            threads.forEach(function (thread) {
                var newThread = new Thread(thread);
                var messages = new MessageCollection([], { parent: newThread });
                newThread.messages = messages;
                this.add([newThread]);
            }.bind(this));
        }.bind(this));
    },

    fetch: function () {
        this.reset();
        ipc.send(app.ipc.facebookFetchThreads, app.me.id);
    }
});
