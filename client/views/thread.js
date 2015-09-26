'use strict';

var app = require('ampersand-app');
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

        if (!this.model.messages.length) {
            this.model.messages.fetch();
        }

        // TODO: Should this be moved up to 'main' or 'app', and it should then add the message to the appropriate thread?
        // Thread specific message received channel
        var messageReceived = app.ipc.facebookMessageReceived + '-' + this.model.thread_fbid;
        var sentMessage = app.ipc.facebookSendMessage + '-' + this.model.thread_fbid;

        // Add new messages received to this thread, if they belong
        ipc.removeAllListeners(messageReceived);
        ipc.on(messageReceived, function (message) {
            // Transform data
            message.thread_id = message.thread_id.toString();
            message.author = message.sender_name;
            message.timestamp = Date.now();
            this.model.messages.add(message);
            this.bump();         
        }.bind(this));

        ipc.removeAllListeners(sentMessage);
        ipc.on(sentMessage, function () {
            // Create new message with basic info
            var newMessage = new Message({
                author: app.me.fullName,
                body: this.queryByHook('reply').value,
                timestamp: Date.now()
            });
            this.model.messages.add(newMessage);
            this.bump();
            this.queryByHook('reply').value = '';
        }.bind(this));

        return this;
    },

    handleSendReplyClick: function () {
        var message = this.queryByHook('reply').value;
        ipc.send(app.ipc.facebookSendMessage, message, this.model.thread_fbid);
    },

    bump: function () {
        this.model.timestamp = Date.now();
        this.model.collection.sort();
    }
});
