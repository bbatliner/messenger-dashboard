'use strict';

var app = require('ampersand-app');
var View = require('ampersand-view');


module.exports = View.extend({
    template: require('../templates/includes/message.jade')(),
    bindings: {
        'model.body': '[data-hook=body]',
        'model.senderName': {
            type: function (el, value) {
                if (value === app.me.fullName) {
                    // Don't show the user their own name!
                    el.innerText = 'You';
                } else {
                    // First name only
                    el.innerText = value.split(' ')[0];
                }
            },
            selector: '[data-hook=sender]'
        }
    }
});
