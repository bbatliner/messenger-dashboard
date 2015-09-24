'use strict';

var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    fetch: function () {
        ipc.send('facebook-fetch-messages');
        ipc.on('facebook-fetch-threads-error', function (err) {
            console.error(err);
        });
        ipc.on('facebook-fetch-threads-success', function (threads) {
            this.add(threads, {merge:true});
        }.bind(this));
    }
});
