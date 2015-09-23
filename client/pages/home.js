'use strict';

var PageView = require('./base');


module.exports = PageView.extend({
    pageTitle: 'home',
    template: require('../templates/pages/home.jade')()
});
