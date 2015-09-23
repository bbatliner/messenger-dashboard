'use strict';

var Collection = require('ampersand-collection');
var Person = require('./person');


module.exports = Collection.extend({
    model: Person,
    url: '/api/people'
});
