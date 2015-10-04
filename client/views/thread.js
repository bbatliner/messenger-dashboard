'use strict';

var app = require('ampersand-app');
var View = require('ampersand-view');
var Message = require('../models/message');
var MessageView = require('./message');
var Mousetrap = require('mousetrap');
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

        // Resize the thread's messages when the window changes size, so the chats always fill the screen
        this._prevHeight = -1;
        window.onresize = function () {
            // SUPER DIRTY polynomial regression I did to calculate the height of the messages scrollbox depending on the height of the window.
            // TODO: Find a pure CSS for this. Or find a more elegant javascript solution.
            if (this._prevHeight === window.innerHeight) {
                return;
            } else {
                this._prevHeight = window.innerHeight;
                this.queryByHook('message-list').style.height = (-7.986753736*Math.pow(10,-11)*Math.pow(window.innerHeight,4)+3.90489248*Math.pow(10,-7)*Math.pow(window.innerHeight,3)-6.809750631*Math.pow(10,-4)*Math.pow(window.innerHeight,2)+5.490517914*Math.pow(10,-1)*Math.pow(window.innerHeight,1)-109.7386284).toString() + 'vh'; 
            }            
        }.bind(this);
        // Call once to start
        _.defer(window.onresize);

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
                timestamp: messageInfo.timestamp
            });
            this.model.messages.add(newMessage);
            this.model.trigger('bump');
            replyInput.value = '';
            replyInput.focus();
        }.bind(this));

        // Make sure the chats stayed scrolled to the bottom (whenever chats are added/removed/sorted, or this thread is marked active)
        this.model.messages.on('add remove sort', this.scrollToBottom.bind(this));
        this.model.on('active-changed', function() {
            _.defer(this.scrollToBottom.bind(this));
        }.bind(this));

        // Shortcut to focus write message input
        Mousetrap.bindGlobal(app.shortcuts.writeMessage, function () {
            this.queryByHook('reply').focus();
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
        if (this.model.active) {
            var els = document.querySelectorAll('.thread .messages');
            var scroll = function () {
                el.scrollTop = el.scrollHeight;
            };
            for (var i = 0, len = els.length; i < len; i++) {
                var el = els[i];
                // TODO: The thread should "remember" its scroll pos so you can pick up from where you were last.
                _.defer(scroll);
            }
        }
    }
});
