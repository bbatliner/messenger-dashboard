'use strict';

var app = require('ampersand-app');
var ViewSwitcher = require('ampersand-view-switcher');
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

        this.activeThreadSwitcher = new ViewSwitcher(this.queryByHook('thread-list'), {
            // nothing!
        });

        ipc.send(app.ipc.facebookFetchThreads, 1);

        app.me.threads.on('active-changed', function() {
            var activeIndex = app.me.threads.models.findIndex(function(model) { return model.active; });
            var newThread = new ThreadView({model: app.me.threads.at(activeIndex)});
            var threadList = this.queryByHook('thread-list');
            var currentThreadEl = document.querySelector('.thread');
            if (currentThreadEl) {
                currentThreadEl.classList.add('slideOutRight');
                setTimeout(function () {
                    currentThreadEl.parentNode.removeChild(currentThreadEl);
                }, 1000);
            }
            newThread.render();
            threadList.appendChild(newThread.el);
            newThread.el.classList.add('slideInLeft');
        }.bind(this));

        this.renderSubview(new AddThreadView({
            model: this.model
        }), this.queryByHook('add-thread'));

        return this;
    }
});
