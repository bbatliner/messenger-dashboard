'use strict';

var app = require('ampersand-app');
var PageView = require('./base');
var ThreadView = require('../views/thread');
var AddThreadView = require('../views/add-thread');
var Mousetrap = require('mousetrap');
var ipc = require('electron-safe-ipc/guest');


module.exports = PageView.extend({
    template: require('../templates/pages/chat.jade')(),

    bindings: {
        'model.fullName': '[data-hook=name]'
    },

    render: function () {
        this.renderWithTemplate(this);

        ipc.send(app.ipc.facebookFetchThreads, 1);

        app.me.threads.on('active-changed', this.swapActiveThread.bind(this));

        this.renderSubview(new AddThreadView({
            model: this.model
        }), this.queryByHook('add-thread'));

        this._nextSwitch = 0;
        Mousetrap.bindGlobal(app.shortcuts.previousChat, function () {
            if (Date.now() > this._nextSwitch) {
                this._nextSwitch = Date.now() + 1000;
                var activeIndex = app.me.threads.getActiveIndex();
                if (activeIndex - 1 >= 0) {
                    app.me.threads.at(activeIndex - 1).setActive();
                }
            }
        }.bind(this));

        Mousetrap.bindGlobal(app.shortcuts.nextChat, function () {
            if (Date.now() > this._nextSwitch) {
                this._nextSwitch = Date.now() + 1000;
                var activeIndex = app.me.threads.getActiveIndex();
                if (activeIndex + 1 < app.me.threads.length) {
                    app.me.threads.at(activeIndex + 1).setActive();
                }
            }
        }.bind(this));

        return this;
    },

    swapActiveThread: function (oldActiveIndex) {
        // CUSTOM VIEW SWAPPING (!)

        // Create the new thread view from the currently active model
        var activeIndex = app.me.threads.getActiveIndex();
        var newThread = new ThreadView({model: app.me.threads.at(activeIndex)});

        // Store references to the thread-list element, and the current .thread
        var threadList = this.queryByHook('thread-list');
        var currentThreadEl = this.el.querySelector('.thread');
        if (currentThreadEl) {
            // If a thread currently exists in the DOM, slide it out
            currentThreadEl.classList.add(activeIndex < oldActiveIndex ? 'slideOutRight' : 'slideOutLeft');
            // Remove it from the DOM when its animation finishes
            setTimeout(function () {
                currentThreadEl.parentNode.removeChild(currentThreadEl);
            }, 1000);
        }

        // Render the new thread, populating its .el property
        newThread.render();
        // Add the animation class and add the element to the thread-list
        newThread.el.classList.add(activeIndex < oldActiveIndex ? 'slideInLeft' : 'slideInRight');
        threadList.appendChild(newThread.el);
    }
});
