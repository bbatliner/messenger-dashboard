/*jshint camelcase:false */
'use strict';

var AmpersandState = require('ampersand-state');
var MessageCollection = require('./message-collection');


module.exports = AmpersandState.extend({
    type: 'object',
    props: {
        thread_id: ['string', true, ''],
        thread_fbid: ['string', true, ''],
        other_user_fbid: { type: 'string', required: true, default: '' , allowNull: true },
        participants: ['array', true, function () { return []; }],
        former_participants: ['array', true, function () { return []; }],
        name: ['string', true, ''],
        snippet: ['string', true, ''],
        snippet_has_attachment: ['boolean', true, false],
        snippet_attachments: ['array', true, function () { return []; }],
        snippet_sender: ['string', true, ''],
        unread_count: ['number', true, 0],
        message_count: ['number', true, 0],
        image_src: { type: 'string', required: true, default: '', allowNull: true },
        timestamp_absolute: ['string', true, ''],
        timestamp_datetime: ['string', true, ''],
        timestamp_relative: ['string', true, ''],
        timestamp_time_passed: ['number', true, 0],
        timestamp: ['number', true, 0],
        server_timestamp: ['number', true, 0],
        mute_settings: ['array', true, function () { return []; }],
        is_canonical_user: ['boolean', true, false],
        is_canonical: ['boolean', true, false],
        canonical_fbid: ['string', false, ''],
        is_subscribed: ['boolean', true, false],
        folder: ['string', true, ''],
        is_archived: ['boolean', true, false],
        recipients_loadable: ['boolean', true, false],
        name_conversation_sheet_dismissed: ['boolean', true, false],
        has_email_participant: ['boolean', true, false],
        read_only: ['boolean', true, false]
    },
    derived: {
        isGroupChat: {
            deps: ['participants'],
            cache: true,
            fn: function () {
                return this.participants.length > 2;
            }
        },
    },
    collections: {
        messages: MessageCollection
    }
});
