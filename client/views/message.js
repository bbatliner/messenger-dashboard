'use strict';

var View = require('ampersand-view');


module.exports = View.extend({
    template: require('../templates/includes/message.jade')(),
    bindings: {
        'model.body': '[data-hook=body]',
        'model.senderName': '[data-hook=sender]'
    }
});
