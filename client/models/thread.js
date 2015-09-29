'use strict';

var AmpersandState = require('ampersand-state');


module.exports = AmpersandState.extend({
    type: 'object',
    props: {
        active: ['boolean', true, false],
        threadID: ['string', true, ''],
        threadFbid: ['string', true, ''],
        participants: ['array', true, function () { return []; }],
        blockedParticipants: ['array', true, function () { return []; }],
        formerParticipants: ['array', true, function () { return []; }],
        name: ['string', true, ''],
        snippet: ['string', true, ''],
        snippetHasAttachment: ['boolean', true, false],
        snippetAttachments: ['array', true, function () { return []; }],
        snippetSender: ['string', true, ''],
        unreadCount: ['number', true, 0],
        messageCount: ['number', true, 0],
        imageSrc: { type: 'string', required: true, default: '', allowNull: true },
        timestamp: ['number', true, 0],
        serverTimestamp: ['number', true, 0],
        muteSettings: ['array', true, function () { return []; }],
        isCanonicalUser: ['boolean', true, false],
        isCanonical: ['boolean', true, false],
        canonicalFbid: ['string', false, ''],
        isSubscribed: ['boolean', true, false],
        rootMessageThreadingID: ['string', true, ''],
        folder: ['string', true, ''],
        isArchived: ['boolean', true, false],
        recipientsLoadable: ['boolean', true, false],
        hasEmailParticipant: ['boolean', true, false],
        readOnly: ['boolean', true, false],
        canReply: ['boolean', true, false],
        lastMessageID: ['string', true, '']
    },
    derived: {
        isGroupChat: {
            deps: ['participants'],
            cache: true,
            fn: function () {
                return this.participants.length + this.formerParticipants.length > 2;
            }
        },
    },
    setActive: function () {
        if (this.collection) {
            this.collection.forEach(function (thread) {
                thread.active = false;
            });
        }
        this.active = true;
        this.trigger('active-changed');
    }
});
