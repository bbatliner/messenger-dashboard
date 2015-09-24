'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host'); // Module for inter-process communication

var api = null; // API object returned on log in

module.exports = function () {

    // =====
    // LOGIN
    // =====
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
    }

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

            // =============
            // PUSH MESSAGES
            // =============
            api.listen(function (err, message) {
                if (err) {
                    return console.error(err);
                }
                ipc.send('facebook-message-received', message);
            });
        });
    });

    // ============
    // SEND MESSAGE
    // ============
    ipc.on('facebook-send-message', function (message, threadId) {
        if (api === null) {
            return ipc.send('facebook-send-message-error', 'Please log in to Facebook to use the chat API.');
        }

        api.sendMessage(message, threadId, function (err, id) {
            if (err) {
                return ipc.send('facebook-send-message-error', err);
            }
            ipc.send('facebook-send-message-success', id);
        });
    });

    // =============
    // FETCH THREADS
    // =============
    ipc.on('facebook-fetch-threads', function () {
        if (api === null) {
            return ipc.send('facebook-fetch-threads-error', 'Please log in to Facebook to use the chat API.');
        }

        api.getThreadList(0, 10, function (err, threads) {
            if (err) {
                return ipc.send('facebook-fetch-threads-error', err);
            }
            threads.forEach(function (thread) {
                // If this conversation is only between two people
                if (thread.participants.length <= 2) {
                    // Find the name of the other person and attach it to the thread object
                    api.getUserInfo(thread.other_user_fbid, function (err, ret) {
                        if (err) {
                            return ipc.send('facebook-fetch-threads-error', err);
                        }
                        var info = ret[thread.other_user_fbid];
                        thread.name = info.name;
                        ipc.send('facebook-fetch-threads-success', [thread]);
                    });
                } else {
                    ipc.send('facebook-fetch-threads-success', [thread]);
                }
            });
            
        });
    });

    // ==============
    // FETCH MESSAGES
    // ==============
    ipc.on('facebook-fetch-messages', function (threadId, isGroup) {
        if (api === null) {
            return ipc.send('facebook-fetch-messages-error', 'Please log in to Facebook to use the chat API.');
        }

        api.getMessages(threadId, isGroup, 0, 20, function (err, messages) {
            if (err) {
                return ipc.send('facebook-fetch-messages-error', err);
            }
            // Send back the threadId so the other process can identify if this event is responding to its message
            ipc.send('facebook-fetch-messages-success', threadId, messages);
        });
    });
};