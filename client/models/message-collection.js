/*jshint camelcase:false */
'use strict';

var AmpersandCollection = require('ampersand-collection');
var Message = require('./message');
var ipc = require('electron-safe-ipc/guest');

module.exports = AmpersandCollection.extend({
    model: Message,

    fetch: function () {
        ipc.send('facebook-fetch-messages', this.parent.thread_fbid, this.parent.isGroupChat);
        ipc.on('facebook-fetch-messages-error', function (err) {
            console.error(err);
        });
        ipc.on('facebook-fetch-messages-success', function (threadId, messages) {
            // Check the threadId contained in the response to make sure these messages belong to this thread
            if (this.parent.thread_fbid === threadId) {
                this.add(messages, {merge:true});
            }
        }.bind(this));
    }
});
