/*jshint camelcase:false */
'use strict';

var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    fetch: function () {
        ipc.send('facebook-fetch-messages', this.parent.thread_fbid);
        ipc.on('facebook-fetch-messages-error', function (err) {
            console.error(err);
        });
        ipc.on('facebook-fetch-messages-success', function (messages) {
            this.add(messages);
        }.bind(this));
    }
});
