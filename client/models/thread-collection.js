'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var MessageCollection = require('./message-collection');
var Thread = require('./thread');
var ipc = require('electron-safe-ipc/guest');


module.exports = AmpersandCollection.extend({
    model: Thread,

    mainIndex: ['threadFbid'],

    comparator: 'timestamp', // TODO: Is this really necessary?

    initialize: function () {
        ipc.removeAllListeners(app.ipc.facebookFetchThreadsSuccess);
        ipc.on(app.ipc.facebookFetchThreadsSuccess, function (threads) {
            threads.forEach(function (thread) {
                var newThread = new Thread(thread);
                var messages = new MessageCollection([], { parent: newThread });
                newThread.messages = messages;
                this.add(newThread);
                if (this.length === 1) { newThread.setActive(); }
            }.bind(this));
        }.bind(this));
    }
});
