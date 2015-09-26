'use strict';

var app = require('ampersand-app');
var View = require('ampersand-view');
var ipc = require('electron-safe-ipc/guest');
var _ = require('lodash');
var Awesomplete = require('awesomplete');


module.exports = View.extend({
    template: require('../templates/includes/add-thread.jade')(),

    bindings: {
        'model.name': '[data-hook=name]'
    },

    events: {
        'click [data-hook=send-reply]': 'handleSendReplyClick',
        'click [data-hook=refresh]': 'handleRefreshClick'
    },

    initialize: function () {
        var fetchFriendsListSuccess = app.ipc.facebookFetchFriendsList + '-' + this.model.id;
        ipc.removeAllListeners(fetchFriendsListSuccess);
        ipc.on(fetchFriendsListSuccess, function (friendsList) {
            this.friendsList = friendsList;
            new Awesomplete(this.queryByHook('friends-list'), {
                list: friendsList.map(function(friend){return friend.name;}),
                minChars: 1,
                autoFirst: true
            });
        }.bind(this));
    },

    render: function () {
        this.renderWithTemplate(this);

        _.defer(function () {
            ipc.send(app.ipc.facebookFetchFriendsList, this.model.id);
        }.bind(this));

        return this;
    }
});
