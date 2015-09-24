'use strict';

var AmpersandCollection = require('ampersand-collection');
var Thread = require('./thread');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Thread,

    fetch: function () {
        ipc.send('facebook-fetch-threads');
        ipc.on('facebook-fetch-threads-error', function (err) {
            console.error(err);
        });
        ipc.on('facebook-fetch-threads-success', function (threads) {
            this.add(threads, {merge:true});
        }.bind(this));
    }
});
