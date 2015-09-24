'use strict';

var PageView = require('./base');
// var Thread = require('../models/thread');
// var ThreadCollection = require('../models/thread-collection');


module.exports = PageView.extend({
    template: require('../templates/pages/messages.jade')(),

    bindings: {
        'model.fullName': '[data-hook=name]'
    },

    render: function () {
        this.renderWithTemplate();

        // Fetch a thread's messages when a new thread is added
        this.collection.on('add', function (thread) {
            thread.messages.fetch();
        });

        if (!this.collection.length) {
            this.collection.fetch();
        }
    }
});
