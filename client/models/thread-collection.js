'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var MessageCollection = require('./message-collection');
var Thread = require('./thread');
var ipc = require('electron-safe-ipc/guest');


module.exports = AmpersandCollection.extend({
    model: Thread,

    mainIndex: ['threadFbid'],

    comparator: function (a, b) {
        return b.lastAccessed > a.lastAccessed; // put the user's most recent thread at the top (index 0)
    },

    initialize: function () {
        this._lastSetActive = 0;
        this._setActiveInterval = 600;

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
    },

    getActiveIndex: function () {
        return this.models.findIndex(function(model) { return model.active; });
    }
});
