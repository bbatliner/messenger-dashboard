'use strict';

// Define the IPC channels used by this application
var channels = {
    facebookLogin: 'facebook-login',
    facebookSendMessage: 'facebook-send-message',
    facebookMessageReceived: 'facebook-message-received',
    facebookFetchThreads: 'facebook-fetch-threads',
    facebookFetchMessages: 'facebook-fetch-messages',
    facebookSearchThreads: 'facebook-search-threads'
};

// Add corresponding '-error' channels for each action
for (var channel in channels) {
    if (channels.hasOwnProperty(channel)) {
        channels[channel + 'Error'] = channels[channel] + '-error';
    }
}

// Login does not have associated data to identify the channel with (thread id, user id, etc)
// So we manually add this generic success channel
channels.facebookLoginSuccess = channels.facebookLogin + '-success';
// Same with fetching threads
channels.facebookFetchThreadsSuccess = channels.facebookFetchThreads + '-success';
// Same with searching threads
channels.facebookSearchThreadsSuccess = channels.facebookSearchThreads + '-success';

// Generic auth error (api === null)
channels.facebookAuthError = 'facebook-auth-error';

module.exports = channels;
