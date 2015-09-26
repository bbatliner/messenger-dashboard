'use strict';

var AmpersandState = require('ampersand-state');


module.exports = AmpersandState.extend({
    type: 'object',
    props: {
        senderName: ['string', true, ''],
        senderID: ['string', true, ''],
        attachments: ['array', true, function () { return []; }],
        body: ['string', true, ''],
        messageID: ['string', true, ''],
        threadID: ['string', true, ''],
        threadName: ['string', true, ''],
        timestamp: ['number', false, Date.now()],
        timestampAbsolute: ['string', false, ''],
        timestampRelative: ['string', false, ''],
        timestampDatetime: ['string', false, '']
    }
});
