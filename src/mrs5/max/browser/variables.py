from plone import api
from zope.component import queryUtility
from zope.component.hooks import getSite
from zope.publisher.browser import BrowserView

from plone.registry.interfaces import IRegistry

from mrs5.max.browser.controlpanel import IMAXUISettings
from ulearn5.core.controlpanel import IUlearnControlPanelSettings

# WARNING: If any other parameter should be added to the instantation you must
# add it too to the maxui.loader.js file.

TEMPLATE = """\
if (!window._MAXUI) {window._MAXUI = {}; }
window._MAXUI.username = '%(username)s';
window._MAXUI.oauth_token = '%(oauth_token)s';
window._MAXUI.max_server = '%(max_server)s';
window._MAXUI.max_server_alias = '%(max_server_alias)s';
window._MAXUI.avatar_url = '%(avatar_url)s';
window._MAXUI.profile_url = '%(profile_url)s'
window._MAXUI.contexts = '%(contexts)s';
window._MAXUI.activitySource = '%(activitySource)s';
window._MAXUI.activitySortView = '%(activitySortView)s';
window._MAXUI.language = '%(language)s';
window._MAXUI.hidePostboxOnTimeline = false;
window._MAXUI.domain = '%(domain)s';
window._MAXUI.literals = %(literals)s;
window._MAXUI.showSubscriptionList = true;
"""


class MAXJSVariables(BrowserView):

    def __call__(self, *args, **kwargs):
        context = self.context
        response = self.request.response
        portal_url = getSite().absolute_url()
        response.addHeader('content-type', 'text/javascript;;charset=utf-8')
        response.addHeader('Cache-Control', 'must-revalidate, max-age=0, no-cache, no-store')

        registry = queryUtility(IRegistry)
        settings = registry.forInterface(IMAXUISettings, check=False)

        if api.user.is_anonymous():  # the user has not logged in
            username = ''
            oauth_token = ''
        else:
            user = api.user.get_current()
            # Force username to lowercase
            username = user.id.lower()
            oauth_token = user.getProperty('oauth_token', None)

        # Use the restricted username and token in case we are admin.
        if username == 'admin':
            username = settings.max_restricted_username
            oauth_token = settings.max_restricted_token

        pl = api.portal.get_tool('portal_languages')
        default_lang = pl.getDefaultLanguage()

        activity_views_map = {
            'Darreres Activitats': 'recent',
            'Activitats mes valorades': 'likes',
            'Activitats destacades': 'flagged'
        }

        maxui = {}

        try:
            ulearn_settings = registry.forInterface(IUlearnControlPanelSettings)
            activity_view = ulearn_settings.activity_view
        except:
            activity_view = 'darreres_activitats'
        return TEMPLATE % dict(
            username=username,
            oauth_token=oauth_token,
            max_server=settings.max_server,
            max_server_alias=settings.max_server_alias,
            avatar_url='%s/people/{0}/avatar/mini' % (settings.max_server),
            profile_url='%s/profile/{0}' % (portal_url),
            contexts=self.context.absolute_url(),
            activitySource='timeline',
            activitySortView=activity_views_map.get(activity_view, 'recent'),
            language=default_lang,
            domain=settings.domain,
            literals=maxui,
        )
