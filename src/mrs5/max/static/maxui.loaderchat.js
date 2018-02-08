/*global _MAXUI */
/*global _MAXUI_Chat */
/*
* Defines a global namespace var to hold maxui stuff, and a function onReady that
* will be called as a result of the maxui code being completely loaded.
* Custom settings and instantiation of maxui MUST be done in the onReady function body
* Other calculations that needs maxui to be loaded MAY be done also in the onReady function body
*/


if (!window._MAXUI_Chat) {window._MAXUI_Chat = {}; }
window._MAXUI_Chat.onReady = function() {
    // This is called when the code has loaded.
    var settingschat = {'language' : _MAXUI.language,
                'username' : _MAXUI.username,
                'oAuthToken' : _MAXUI.oauth_token,
                'maxServerURL' : _MAXUI.max_server,
                'maxServerURLAlias' : _MAXUI.max_server_alias,
                'avatarURLpattern' : _MAXUI.avatar_url,
                'domain': _MAXUI.domain,
                'literals': _MAXUI.literals,
                'UISection': 'conversations',
                'disableTimeline': true,
                'disableConversations': false
               };

    $('#maxuichat-widget-container').maxUIChat(settingschat);
/*    var intervalIDChat = setInterval(function(event) {
        if ($().maxUIChat) {
            clearInterval(intervalIDChat);
            $('#maxuichat-widget-container').maxUIChat(settingschat);
        }
    }, 20);*/



};

/*
* Loads the maxui code asynchronously
* The generated script tag will be inserted after the first existing script tag
* found in the document.
* Modify `mui_location` according to yout settings
*/

(function(d_chat){
var muichat_location = '++maxui++static/maxuichat.min.js';
var muichat = d_chat.createElement('script'); muichat.type = 'text/javascript'; muichat.async = true;
muichat.src = muichat_location;
var s_chat = d_chat.getElementsByTagName('script')[0]; s_chat.parentNode.insertBefore(muichat, s_chat);

}(document));
