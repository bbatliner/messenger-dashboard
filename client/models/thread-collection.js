'use strict';

var app = require('ampersand-app');
var AmpersandCollection = require('ampersand-collection');
var Thread = require('./thread');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Thread,

    comparator: function (a, b) { 
        return b.timestamp - a.timestamp; // put the most recent timestamps at the top of the list
    },

    fetch: function () {
        this.reset();
        ipc.request(app.ipc.facebookFetchThreads)
            .then(function (threads) {
                this.add(threads);
            }.bind(this));
    }
});
