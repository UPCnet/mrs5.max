/*global _MAXUI*/
/*global _MAXUI_Activity */
/*
* Defines a global namespace var to hold maxui stuff, and a function onReady that
* will be called as a result of the maxui code being completely loaded.
* Custom settings and instantiation of maxui MUST be done in the onReady function body
* Other calculations that needs maxui to be loaded MAY be done also in the onReady function body
*/


if (!window._MAXUI_Activity) {window._MAXUI_Activity = {}; }
window._MAXUI_Activity.onReady = function() {
    // This is called when the code has loaded.
    var settingsactivity = {'language' : _MAXUI.language,
                'username' : _MAXUI.username,
                'oAuthToken' : _MAXUI.oauth_token,
                'maxServerURL' : _MAXUI.max_server,
                'maxServerURLAlias' : _MAXUI.max_server_alias,
                'avatarURLpattern' : _MAXUI.avatar_url,
                'readContext' : _MAXUI.contexts,
                'activitySource': _MAXUI.activitySource,
                'domain': _MAXUI.domain,
                'activitySortOrder': 'comments',
                'activitySortView': _MAXUI.activitySortView,
                'hidePostboxOnTimeline': _MAXUI.hidePostboxOnTimeline,
                'literals': _MAXUI.literals,
                'showSubscriptionList': _MAXUI.showSubscriptionList,
                'UISection': 'timeline',
                'disableTimeline': false,
                'disableConversations': true
               };

    $('#maxuiactivity-widget-container').maxUIActivity(settingsactivity);
/*    var intervalIDActivity = setInterval(function(event) {
        if ($().maxUIActivity) {
            clearInterval(intervalIDActivity);
            $('#maxuiactivity-widget-container').maxUIActivity(settingsactivity);
        }
    }, 30);*/


};

/*
* Loads the maxui code asynchronously
* The generated script tag will be inserted after the first existing script tag
* found in the document.
* Modify `mui_location` according to yout settings
*/

(function(d_activity){
var muiactivity_location = window.PORTAL_URL + '/++maxui++static/maxuiactivity.min.js';
var muiactivity = d_activity.createElement('script'); muiactivity.type = 'text/javascript'; muiactivity.async = true;
muiactivity.src = muiactivity_location;
var s_activity= d_activity.getElementsByTagName('script')[0]; s_activity.parentNode.insertBefore(muiactivity, s_activity);

}(document));
