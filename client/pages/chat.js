'use strict';

var app = require('ampersand-app');
var PageView = require('./base');
var ThreadView = require('../views/thread');
var AddThreadView = require('../views/add-thread');
var ipc = require('electron-safe-ipc/guest');


module.exports = PageView.extend({
    template: require('../templates/pages/chat.jade')(),

    bindings: {
        'model.fullName': '[data-hook=name]'
    },

    render: function () {
        this.renderWithTemplate(this);

        ipc.send(app.ipc.facebookFetchThreads, 1);

        app.me.threads.on('active-changed', function (oldActive) {
            // CUSTOM VIEW SWAPPING (!)

            // Create the new thread view from the currently active model
            var activeIndex = app.me.threads.models.findIndex(function(model) { return model.active; });
            var newThread = new ThreadView({model: app.me.threads.at(activeIndex)});

            // Store references to the thread-list element, and the current .thread
            var threadList = this.queryByHook('thread-list');
            var currentThreadEl = this.el.querySelector('.thread');
            if (currentThreadEl) {
                // If a thread currently exists in the DOM, slide it out
                currentThreadEl.classList.add(activeIndex > oldActive ? 'slideOutRight' : 'slideOutLeft');
                // Remove it from the DOM when its animation finishes
                setTimeout(function () {
                    currentThreadEl.parentNode.removeChild(currentThreadEl);
                }, 1000);
            }

            // Render the new thread, populating its .el property
            newThread.render();
            // Add the animation class and add the element to the thread-list
            newThread.el.classList.add(activeIndex > oldActive ? 'slideInLeft' : 'slideInRight');
            threadList.appendChild(newThread.el);
        }.bind(this));

        this.renderSubview(new AddThreadView({
            model: this.model
        }), this.queryByHook('add-thread'));

        return this;
    }
});
