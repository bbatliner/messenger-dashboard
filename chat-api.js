'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host'); // Module for inter-process communication
var ipcChannels = require('./ipc-channels');

var api = null; // API object returned on log in

module.exports = function () {

    // =====
    // LOGIN
    // =====
    function afterLogin() {
        var userId = api.getCurrentUserId();
        api.getUserInfo(userId, function (err, ret) {
            if (err) {
                return ipc.send(ipcChannels.facebookLoginError, err.toString());
            }
            var userInfo = ret[userId];
            var names = userInfo.name.split(' ');
            ipc.send(ipcChannels.facebookLoginSuccess, userId, names[0], names[1]);
        });
    }

    ipc.on(ipcChannels.facebookLogin, function (username, password) {
        // If already logged in, send back the logged in user
        if (api !== null) {
            return afterLogin();
        }
        login({email: username, password: password}, function (err, tmpApi) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookLoginError, err.toString());
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
                ipc.send(ipcChannels.facebookMessageReceived + '-' + message.thread_id, message);
            });
        });
    });

    // ============
    // SEND MESSAGE
    // ============
    ipc.on(ipcChannels.facebookSendMessage, function (message, threadId) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookSendMessageError, 'Please log in to Facebook to use the chat API.');
        }

        api.sendMessage(message, threadId, function (err) {
            if (err) {
                return ipc.send(ipcChannels.facebookSendMessageError, err.toString());
            }
            ipc.send(ipcChannels.facebookSendMessage + '-' + threadId);
        });
    });

    // =============
    // FETCH THREADS
    // =============
    ipc.on(ipcChannels.facebookFetchThreads, function (userId) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookFetchThreadsError, 'Please log in to Facebook to use the chat API.');
        }

        api.getThreadList(0, 10, function (err, threads) {
            if (err) {
                return ipc.send(ipcChannels.facebookFetchThreadsError, err.toString());
            }
            threads.forEach(function (thread) {
                // If this conversation is only between two people
                if (thread.participants.length <= 2) {
                    // Find the name of the other person and attach it to the thread object
                    api.getUserInfo(thread.other_user_fbid, function (err, ret) {
                        if (err) {
                            return ipc.send(ipcChannels.facebookFetchThreadsError, err.toString());
                        }
                        var info = ret[thread.other_user_fbid];
                        thread.name = info.name;
                        ipc.send(ipcChannels.facebookFetchThreads + '-' + userId, [thread]);
                    });
                } else {
                    ipc.send(ipcChannels.facebookFetchThreads + '-' + userId, [thread]);
                }
            });
            
        });
    });

    // ==============
    // FETCH MESSAGES
    // ==============
    ipc.on(ipcChannels.facebookFetchMessages, function (threadId, isGroup) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookFetchMessagesError, 'Please log in to Facebook to use the chat API.');
        }
        
        api.getMessages(threadId, isGroup, 0, 20, function (err, messages) {
            if (err) {
                return ipc.send(ipcChannels.facebookFetchMessagesError, err.toString());
            }
            messages.forEach(function (message) {
                if (message.author.startsWith('fbid:')) {
                    var authorId = message.author.substring(5);
                    api.getUserInfo(authorId, function (err, ret) {
                        if (err) {
                            return ipc.send(ipcChannels.facebookFetchMessagesError, err.toString());
                        }
                        var info = ret[authorId];
                        message.author = info.name;
                        ipc.send(ipcChannels.facebookFetchMessages + '-' + threadId, [message]);
                    });
                } else {
                    // Send back the threadId so the other process can identify if this event is responding to its message
                    ipc.send(ipcChannels.facebookFetchMessages + '-' + threadId, [message]);
                }
            });
        });
    });
};