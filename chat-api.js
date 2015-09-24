'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host'); // Module for inter-process communication

var api = null; // API object returned on log in

module.exports = function () {

    function afterLogin() {
        var userId = api.getCurrentUserId();
        api.getUserInfo(userId, function (err, ret) {
            if (err) {
                return ipc.send('facebook-login-error', err);
            }
            var userInfo = ret[userId];
            var names = userInfo.name.split(' ');
            return ipc.send('facebook-login-success', names[0], names[1]);
        });
    };

    ipc.on('facebook-login', function (username, password) {
        // If already logged in, send back the logged in user
        if (api !== null) {
            return afterLogin();
        }
        login({email: username, password: password}, function (err, tmpApi) {
            if (err) {
                console.error(err);
                return ipc.send('facebook-login-error', err);
            }
            // Store the api for future use
            api = tmpApi;
            // Get the user's name and send it back to the client
            afterLogin();
        });
    });
};