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
        'click [data-hook=send-reply]': 'handleSendReplyClick',
        'click [data-hook=refresh]': 'handleRefreshClick'
    },

    render: function () {
        this.renderWithTemplate(this);

        this.renderCollection(this.model.messages, MessageView, this.queryByHook('message-list'));

        if (!this.model.messages.length) {
            this.model.messages.fetch();
        }

        // Thread specific message received channel
        var messageReceived = app.ipc.facebookMessageReceived + '-' + this.model.threadFbid;
        var sentMessage = app.ipc.facebookSendMessage + '-' + this.model.threadFbid;

        // Add new messages received to this thread, if they belong
        ipc.removeAllListeners(messageReceived);
        ipc.on(messageReceived, function (message) {
            this.model.messages.add(message);
            this.model.bump();         
        }.bind(this));

        ipc.removeAllListeners(sentMessage);
        ipc.on(sentMessage, function (messageInfo) {
            // Create new message with basic info
            var newMessage = new Message({
                senderName: app.me.fullName,
                senderID: app.me.id,
                messageID: messageInfo.messageID,
                threadID: messageInfo.threadID !== null ? messageInfo.threadID : this.model.threadFbid,
                body: this.queryByHook('reply').value
            });
            this.model.messages.add(newMessage);
            this.model.bump();
            this.queryByHook('reply').value = '';
        }.bind(this));

        return this;
    },

    handleSendReplyClick: function () {
        var message = this.queryByHook('reply').value;
        ipc.send(app.ipc.facebookSendMessage, message, this.model.threadFbid);
    },

    handleRefreshClick: function () {
        this.model.messages.fetch();
    }
});
