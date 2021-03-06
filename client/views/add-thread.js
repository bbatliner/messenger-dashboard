'use strict';

var app = require('ampersand-app');
var View = require('ampersand-view');
var ipc = require('electron-safe-ipc/guest');
var MessageCollection = require('../models/message-collection');
var Thread = require('../models/thread');
var Awesomplete = require('awesomplete');
var Mousetrap = require('mousetrap');


module.exports = View.extend({
    template: require('../templates/includes/add-thread.jade')(),

    bindings: {
        'model.name': '[data-hook=name]'
    },

    events: {
        'keyup [data-hook=friends-list]': 'handleQueryChange',
        'click [data-hook=add-new-thread]': 'handleAddThreadClick',
        'awesomplete-selectcomplete [data-hook=friends-list]': 'handleAddThreadClick'
    },

    initialize: function () {
        this.friendsList = [];
        ipc.removeAllListeners(app.ipc.facebookSearchThreadsSuccess);
        ipc.on(app.ipc.facebookSearchThreadsSuccess, function (friendsList) {
            this.friendsList = friendsList; // store the friends list, which contains threads!
            this.awesomplete.list = friendsList.map(function (friend) { return friend.name; });
        }.bind(this));
    },

    render: function () {
        this.renderWithTemplate(this);

        this.awesomplete = new Awesomplete(this.queryByHook('friends-list'), {
            list: [],
            minChars: 1,
            maxItems: 5,
            autoFirst: true,
            sort: Awesomplete.SORT_BYLENGTH
        });

        // Shortcut to focus search friends input
        Mousetrap.bindGlobal(app.shortcuts.searchForThread, function () {
            this.queryByHook('friends-list').focus();
        }.bind(this));

        return this;
    },

    handleQueryChange: function () {
        var query = this.queryByHook('friends-list').value;
        // Prevent unnecessary API calls (e.g., user holds down a key)
        if (this._query === query) {
            return;
        } else {
            this._query = query;
        }
        if (query.length) {
            ipc.send(app.ipc.facebookSearchThreads, query);
        }
    },

    handleAddThreadClick: function () {
        var threadName = this.queryByHook('friends-list').value;
        var thread = this.friendsList.find(function (friend) { return friend.name === threadName; });
        if (thread) {
            this.queryByHook('friends-list').value = '';
            // Only add the thread if it doesn't already exist in our threads
            var existingThread = app.me.threads.get(thread.threadFbid);
            if (!existingThread) {
                var newThread = new Thread(thread);
                var messages = new MessageCollection([], { parent: newThread });
                newThread.messages = messages;
                app.me.threads.add(newThread);
                newThread.setActive();
            }
            // Otherwise bump the existing thread, as long as its not currently shown
            else if (!existingThread.active) {
                existingThread.setActive();
            }
        } 
        // else alert the user that that thread doesn't exist?
    }
});
