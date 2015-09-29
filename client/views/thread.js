'use strict';

var app = require('ampersand-app');
var View = require('ampersand-view');
var Message = require('../models/message');
var MessageView = require('./message');
var ipc = require('electron-safe-ipc/guest');
var _ = require('lodash');


module.exports = View.extend({
    template: require('../templates/includes/thread.jade')(),

    bindings: {
        'model.name': '[data-hook=name]'
    },

    events: {
        'click [data-hook=send-reply]': 'handleSendReplyClick',
        'keyup [data-hook=reply]': 'handleInputEnter',
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
            this.scrollToBottom();     
        }.bind(this));

        ipc.removeAllListeners(sentMessage);
        ipc.on(sentMessage, function (messageInfo) {
            var replyInput = this.queryByHook('reply');
            // Create new message with basic info
            var newMessage = new Message({
                senderName: app.me.fullName,
                senderID: app.me.id,
                messageID: messageInfo.messageID,
                threadID: messageInfo.threadID !== null ? messageInfo.threadID : this.model.threadFbid,
                body: replyInput.value,
                timestamp: Date.now()
            });
            this.model.messages.add(newMessage);
            replyInput.value = '';
            replyInput.focus();
        }.bind(this));

        // Make sure the chats stayed scrolled to the bottom (whenever chats are added/removed/sorted, or this thread is marked active)
        this.model.messages.on('add remove sort', this.scrollToBottom.bind(this));
        this.model.on('active-changed', function() {
            _.defer(this.scrollToBottom.bind(this));
        }.bind(this));

        return this;
    },

    handleInputEnter: function (e) {
        if (e.keyCode === 13) {
            this.handleSendReplyClick(e);
        }
    },

    handleSendReplyClick: function () {
        var message = this.queryByHook('reply').value;
        ipc.send(app.ipc.facebookSendMessage, message, this.model.threadFbid);
    },

    handleRefreshClick: function () {
        this.model.messages.fetch();
    },

    scrollToBottom: function () {
        var els = document.querySelectorAll('.thread .messages');
        for (var i = 0, len = els.length; i < len; i++) {
            var el = els[i];
            el.scrollTop = el.scrollHeight;
        }
    }
});
