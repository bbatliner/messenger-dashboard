'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host');
var ipcChannels = require('./ipc-channels');

var api = null; // API object returned on log in

module.exports = function () {

    // Memoize these API calls for performance
    var storedUserIds = {};
    // Convert a Facebook ID to a Facebook User object
    function fbIdToUser(fbid) {
        return new Promise(function (resolve, reject) {
            if (fbid in storedUserIds) {
                return resolve(storedUserIds[fbid]);
            }
            api.getUserInfo(fbid, function (err, ret) {
                if (err) {
                    return reject(err);
                }
                var user = ret[fbid];
                if (!user) {
                    return reject('Fbid ' + fbid + ' did not match any Facebook users.');
                }
                storedUserIds[fbid] = user;
                user.id = fbid;
                resolve(user);
            });
        });
    }

    // Parse a Facebook thread object and attach its proper name
    function parseThreadName(thread) {
        return new Promise(function (resolve, reject) {
            // If this conversation is only between two people (and has never been between more than two people)
            if (thread.participants.length + thread.formerParticipants.length <= 2) {
                // Find the name of the other person and attach it to the thread object
                fbIdToUser(thread.threadFbid)
                    .then(function (user) {
                        thread.name = user.name;
                        resolve(thread);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            // If this is an unnamed group conversation
            else if (thread.name === '') {
                var promises = [];
                thread.participants.forEach(function (participant) {
                    promises.push(fbIdToUser(participant));
                });
                Promise.all(promises)
                    .then(function (users) {
                        var name = '';
                        for (var i = 0, len = users.length; i < len; i++) {
                            name += users[i].name;
                            if (i !== len - 1) { name += ', '; }
                            if (i === len - 2) { name += '& '; }
                        }
                        thread.name = name;
                        resolve(thread);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            // Otherwise if the name is defined, send back the thread as-is
            else {
                resolve(thread);
            }
        });
    }

    // =====
    // LOGIN
    // =====
    ipc.on(ipcChannels.facebookLogin, function (username, password) {
        function afterLogin() {
            var userId = api.getCurrentUserID();
            fbIdToUser(userId)
                .then(function (user) {
                    ipc.send(ipcChannels.facebookLoginSuccess, user);
                })
                .catch(function (err) {
                    console.error(err);
                    ipc.send(ipcChannels.facebookLoginError, JSON.stringify(err));
                });
        }
        // If already logged in, send back the logged in user
        if (api !== null) {
            return afterLogin();
        }
        login({email: username, password: password}, function (err, tmpApi) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookLoginError, JSON.stringify(err));
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
                // Marks message as read as soon as they're received
                api.markAsRead(message.threadID);
                message.threadID = message.threadID.toString();
                ipc.send(ipcChannels.facebookMessageReceived + '-' + message.threadID, message);
            });
        });
    });

    // ============
    // SEND MESSAGE
    // ============
    ipc.on(ipcChannels.facebookSendMessage, function (message, threadId) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
        }
        api.sendMessage(message, threadId, function (err, info) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookSendMessageError, JSON.stringify(err));
            }
            // Marks message as read as soon as they're sent
            api.markAsRead(threadId);
            ipc.send(ipcChannels.facebookSendMessage + '-' + threadId, info);
        });
    });

    // =============
    // FETCH THREADS
    // =============
    ipc.on(ipcChannels.facebookFetchThreads, function (number) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
        }

        api.getThreadList(0, number || 10, function (err, threads) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookFetchThreadsError, JSON.stringify(err));
            }
            threads.forEach(function (thread) {
                // Send these threads as we parse their names for "smooth" loading in the UI
                parseThreadName(thread)
                    .then(function (thread) {
                        ipc.send(ipcChannels.facebookFetchThreadsSuccess, [thread]);
                    })
                    .catch(function (err) {
                        console.error(err);
                        ipc.send(ipcChannels.facebookFetchMessagesError, JSON.stringify(err));
                    });
            });
        });
    });

    // ==============
    // FETCH MESSAGES
    // ==============
    ipc.on(ipcChannels.facebookFetchMessages, function (threadId) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
        }
        
        api.getThreadHistory(threadId, 0, 20, 0, function (err, messages) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookFetchMessagesError, JSON.stringify(err));
            }
            ipc.send(ipcChannels.facebookFetchMessages + '-' + threadId, messages);
        });
    });

    // ==============
    // SEARCH THREADS
    // ==============
    // TODO: Add support for adding a new thread? (this only searches existing threads)
    // Memoize these API calls for performance
    var storedThreadSearches = {};
    ipc.on(ipcChannels.facebookSearchThreads, function (query) {
        if (api === null) {
            return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
        }

        // Don't waste an api request on an empty string...
        if (query.length === 0) {
            return;
        }

        if (query in storedThreadSearches) {
            return ipc.send(ipcChannels.facebookSearchThreadsSuccess, storedThreadSearches[query]);
        }

        api.searchForThread(query, function (err, threads) {
            if (err) {
                return ipc.send(ipcChannels.facebookSearchThreadsError, JSON.stringify(err));
            }
            var promises = [];
            threads.forEach(function (thread) {
                promises.push(parseThreadName(thread));
            });
            // Wait for all of these threads' names to resolve so typeahead suggestions appear all at once
            Promise.all(promises)
                .then(function (threads) {
                    storedThreadSearches[query] = threads;
                    ipc.send(ipcChannels.facebookSearchThreadsSuccess, threads);
                })
                .catch(function (err) {
                    console.error(err);
                    ipc.send(ipcChannels.facebookSearchThreadsError, JSON.stringify(err));
                });
        });
    });
};
