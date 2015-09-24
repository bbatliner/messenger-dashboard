/*jshint camelcase:false */
'use strict';

var AmpersandState = require('ampersand-state');


module.exports = AmpersandState.extend({
    type: 'object',
    props: {
        action_id: { type: 'string', required: true, default: '', allowNull: true },
        action_type: ['string', true, ''],
        attachments: ['array', true, function () { return []; }],
        author: ['string', true, ''],
        author_email: ['string', true, ''],
        body: ['string', true, ''],
        folder: ['string', true, ''],
        forward_count: ['number', true, 0],
        forward_message_ids: ['array', true, function () { return []; }],
        has_attachment: ['boolean', true, false],
        html_body: { type: 'string', required: true, default: '', allowNull: true },
        is_filtered_content: ['boolean', true, false],
        is_filtered_content_account: ['boolean', true, false],
        is_filtered_content_bh: ['boolean', true, false],
        is_filtered_content_invalid_app: ['boolean', true, false],
        is_filtered_content_quasar: ['boolean', true, false],
        is_forward: ['boolean', true, false],
        is_spoof_warning: ['boolean', true, false],
        is_unread: ['boolean', true, false],
        message_id: ['string', true, ''],
        offline_threading_id: ['string', true, ''],
        other_user_fbid: { type: 'string', required: true, default: '' , allowNull: true },
        ranges: ['array', true, function () { return []; }],
        raw_attachments: { type: 'string', required: true, default: '', allowNull: true },
        source: ['string', true, ''],
        source_tags: ['array', true, function () { return []; }],
        subject: { type: 'string', required: true, default: '', allowNull: true },
        thread_fbid: ['string', true, ''],
        thread_id: ['string', true, ''],
        threading_id: { type: 'string', required: true, default: '', allowNull: true },
        timestamp: ['number', true, 0],
        timestamp_absolute: ['string', true, ''],
        timestamp_datetime: ['string', true, ''],
        timestamp_relative: ['string', true, ''],
        timestamp_time_passed: ['number', true, 0]
    }
});
