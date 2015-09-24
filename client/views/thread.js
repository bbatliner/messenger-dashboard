'use strict';

var View = require('ampersand-view');
var Message = require('../models/message');
var MessageView = require('./message');
var ipc = require('electron-safe-ipc/guest');


module.exports = View.extend({
    template: require('../templates/includes/thread.jade')(),

    bindings: {
        'model.name': '[data-hook=name]'
    },

    events: {
        'click [data-hook=send-reply]': 'handleSendReplyClick'
    },

    render: function () {
        this.renderWithTemplate(this);

        this.renderCollection(this.model.messages, MessageView, this.queryByHook('message-list'));

        // Add new messages received to this thread, if they belong
        ipc.on('facebook-message-received', function (message) {
            message.thread_id = message.thread_id.toString();
            if (message.thread_id === this.model.thread_fbid) {
                this.model.messages.add(message);
            }
        }.bind(this));
    },

    handleSendReplyClick: function () {
        var message = this.queryByHook('reply').value;
        ipc.send('facebook-send-message', message, this.model.thread_fbid);
        ipc.on('facebook-send-message-error', function (err) {
            console.error(err);
        });
        ipc.on('facebook-send-message-success', function () {
            this.queryByHook('reply').value = '';
            var newMessage = new Message({
                body: message,
                timestamp: Date.now()
            });
            this.model.messages.add(newMessage);
        }.bind(this));
    }
});