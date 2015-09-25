'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host'); // Module for inter-process communication
var ipcChannels = require('./ipc-channels');
var async = require('async');

var api = null; // API object returned on log in

module.exports = function () {

    // =====
    // LOGIN
    // =====
    function afterLogin(resolve, reject) {
        var userId = api.getCurrentUserId();
        api.getUserInfo(userId, function (err, ret) {
            if (err) {
                return reject(err);
            }
            var userInfo = ret[userId];
            var names = userInfo.name.split(' ');
            var user = {
                id: userId,
                firstName: names[0],
                lastName: names[1]
            };
            resolve(user);
        });
    }

    ipc.respond(ipcChannels.facebookLogin, function (username, password) {
        return new Promise(function (resolve, reject) {
            // If already logged in, send back the logged in user
            if (api !== null) {
                return afterLogin(resolve, reject);
            }
            login({email: username, password: password}, function (err, tmpApi) {
                if (err) {
                    return reject(err);
                }
                // Store the api for future use
                api = tmpApi;
                // Get the user's name and send it back to the client
                afterLogin(resolve, reject);

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
    });

    // ============
    // SEND MESSAGE
    // ============
    ipc.respond(ipcChannels.facebookSendMessage, function (message, threadId) {
        return new Promise(function (resolve, reject) {
            if (api === null) {
                return reject('Please log in to Facebook to use the chat API.');
            }

            api.sendMessage(message, threadId, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
        
    });

    // =============
    // FETCH THREADS
    // =============
    ipc.respond(ipcChannels.facebookFetchThreads, function () {
        return new Promise(function (resolve, reject) {
            if (api === null) {
                return reject('Please log in to Facebook to use the chat API.');
            }

            api.getThreadList(0, 10, function (err, threads) {
                if (err) {
                    return reject(err);
                }
                var transformedThreads = [];
                async.each(threads, function (thread, callback) {
                    // If this conversation is only between two people
                    if (thread.participants.length <= 2) {
                        // Find the name of the other person and attach it to the thread object
                        api.getUserInfo(thread.other_user_fbid, function (err, ret) {
                            if (err) {
                                return callback(err);
                            }
                            var info = ret[thread.other_user_fbid];
                            thread.name = info.name;
                            transformedThreads.push(thread);
                            callback();
                        });
                    } else {
                        transformedThreads.push(thread);
                        callback();
                    }
                }, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(transformedThreads);
                });
            });
        });
    });

    // ==============
    // FETCH MESSAGES
    // ==============
    ipc.respond(ipcChannels.facebookFetchMessages, function (threadId, isGroup) {
        return new Promise(function (resolve, reject) {
            if (api === null) {
                return reject('Please log in to Facebook to use the chat API.');
            }
            
            api.getMessages(threadId, isGroup, 0, 20, function (err, messages) {
                if (err) {
                    return reject(err);
                }
                var transformedMessages = [];
                async.each(messages, function (message, callback) {
                    if (message.author.startsWith('fbid:')) {
                        var authorId = message.author.substring(5);
                        api.getUserInfo(authorId, function (err, ret) {
                            if (err) {
                                return callback(err);
                            }
                            var info = ret[authorId];
                            message.author = info.name;
                            transformedMessages.push(message);
                            callback();
                        });
                    } else {
                        transformedMessages.push(message);
                        callback();
                    }
                }, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(transformedMessages);
                });
            });
        });
        
    });
};