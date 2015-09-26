'use strict';

var AmpersandModel = require('ampersand-model');


module.exports = AmpersandModel.extend({
    type: 'user',
    props: {
        id: ['string', false, ''],
        firstName: ['string', false, ''],
        lastName: ['string', false, '']
    },
    derived: {
        isLoggedIn: {
            deps: ['firstName', 'lastName'],
            cache: false,
            fn: function () {
                return !!this.id;
            }
        },
        fullName: {
            deps: ['firstName', 'lastName'],
            cache: true,
            fn: function () {
                return this.firstName + ' ' + this.lastName;
            }
        }
    }
});
