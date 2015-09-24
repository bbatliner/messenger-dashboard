'use strict';

var PageView = require('./base');


module.exports = PageView.extend({
    template: require('../templates/pages/messages.jade')(),

    bindings: {
        'model.fullName': '[data-hook=name]'
    }
});
