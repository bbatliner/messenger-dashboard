'use strict';

// This module is responsible for registering any IPC event handlers associated with the Facebook chat API.
// This includes listening for requests to log in, send a message, or get user info, and using the chat API
// to fulfill those requests.

var login = require('facebook-chat-api');
var ipc = require('electron-safe-ipc/host'); // Module for inter-process communication
var ipcChannels = require('./ipc-channels');

var api = null; // API object returned on log in

module.exports = function () {

    // Memoize these API calls for performance
    var storedUserIds = {};
    function fbIdToUser(fbid) {
        return new Promise(function (resolve, reject) {
            if (fbid in storedUserIds) {
                return resolve(storedUserIds[fbid]);
            }
            api.getUserInfo(fbid, function (err, ret) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                var user = ret[fbid];
                storedUserIds[fbid] = user;
                user.id = fbid;
                resolve(user);
            });
        });
    }

    // =====
    // LOGIN
    // =====
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

    ipc.on(ipcChannels.facebookLogin, function (username, password) {
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
            ipc.send(ipcChannels.facebookSendMessage + '-' + threadId, info);
        });
    });

    // =============
    // FETCH THREADS
    // =============
    ipc.on(ipcChannels.facebookFetchThreads, function () {
        if (api === null) {
            return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
        }

        api.getThreadList(0, 10, function (err, threads) {
            if (err) {
                console.error(err);
                return ipc.send(ipcChannels.facebookFetchThreadsError, JSON.stringify(err));
            }
            threads.forEach(function (thread) {
                // If this conversation is only between two people
                if (thread.participants.length <= 2) {
                    // Find the name of the other person and attach it to the thread object
                    fbIdToUser(thread.threadFbid)
                        .then(function (user) {
                            thread.name = user.name;
                            ipc.send(ipcChannels.facebookFetchThreadsSuccess, [thread]);
                        })
                        .catch(function (err) {
                            console.error(err);
                            ipc.send(ipcChannels.facebookFetchThreadsError, JSON.stringify(err));
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
                            ipc.send(ipcChannels.facebookFetchThreadsSuccess, [thread]);
                        })
                        .catch(function (err) {
                            console.error(err);
                            ipc.send(ipcChannels.facebookFetchThreadsError, JSON.stringify(err));
                        });
                }
                // Otherwise if the name is defined, send back the thread as-is
                else {
                    ipc.send(ipcChannels.facebookFetchThreadsSuccess, [thread]);
                }
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
    // ipc.on(ipcChannels.facebookSearchThreads, function (query) {
    //     if (api === null) {
    //         return ipc.send(ipcChannels.facebookAuthError, 'Please log in to Facebook to use the chat API.');
    //     }

    //     api.searchThreads(query, function (err, threads) {
    //         if (err) {
    //             return ipc.send(ipcChannels.facebookSearchThreadsError, JSON.stringify(err));
    //         }

    //         var promises = [];
    //         friendIds.forEach(function (friendId) {
    //             promises.push(fbIdToUser(friendId.toString()));
    //         });
    //         Promise.all(promises)
    //             .then(function (friends) {
    //                 var trimmedFriends = friends.map(function (friend) {
    //                     return {
    //                         id: friend.id,
    //                         name: friend.name
    //                     };
    //                 });
    //                 ipc.send(ipcChannels.facebookSearchThreads + '-' + userId, trimmedFriends);
    //             })
    //             .catch(function (err) {
    //                 ipc.send(ipcChannels.facebookSearchThreadsError, JSON.stringify(err));
    //             });
    //     });
    // });
};
