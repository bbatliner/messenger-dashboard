'use strict';

// var app = require('ampersand-app');
var View = require('ampersand-view');
// var ipc = require('electron-safe-ipc/guest');
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

    render: function () {
        this.renderWithTemplate(this);

        _.defer(function () {
            new Awesomplete(this.queryByHook('friends-list'), {
                list: '#friends-list',
                minChars: 1,
                autoFirst: true
            });
        }.bind(this));

        return this;
    }
});
