'use strict';

var AmpersandModel = require('ampersand-model');
var ThreadCollection = require('./thread-collection');


module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        firstName: ['string', false, ''],
        lastName: ['string', false, '']
    },
    derived: {
        isLoggedIn: {
            deps: ['firstName', 'lastName'],
            cache: false,
            fn: function () {
                return !!(this.firstName || this.lastName);
            }
        },
        fullName: {
            deps: ['firstName', 'lastName'],
            cache: true,
            fn: function () {
                return this.firstName + ' ' + this.lastName;
            }
        }
    },
    collections: {
        threads: ThreadCollection
    }
});
