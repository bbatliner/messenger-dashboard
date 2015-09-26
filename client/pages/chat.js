'use strict';

var PageView = require('./base');
var ThreadView = require('../views/thread');


module.exports = PageView.extend({
    template: require('../templates/pages/chat.jade')(),

    bindings: {
        'model.fullName': '[data-hook=name]'
    },

    render: function () {
        this.renderWithTemplate(this);

        this.renderCollection(this.collection, ThreadView, this.queryByHook('thread-list'));

        if (!this.collection.length) {
            this.collection.fetch();
        }

        return this;
    }
});
