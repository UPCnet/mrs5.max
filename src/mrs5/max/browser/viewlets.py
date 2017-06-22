from five import grok
from plone import api
from zope.interface import Interface
from zope.component import queryUtility
from plone.app.layout.viewlets.interfaces import IPortalHeader
from plone.registry.interfaces import IRegistry
from mrs5.max.browser.controlpanel import IMAXUISettings


class OauthNGDirective(grok.Viewlet):
    grok.context(Interface)
    grok.name('ulearn.oauthngdirective')
    grok.viewletmanager(IPortalHeader)

    def update(self):
        registry = queryUtility(IRegistry)
        settings = registry.forInterface(IMAXUISettings, check=False)
        user = api.user.get_current()
        self.username = user.id
        self.oauth_token = user.getProperty('oauth_token', '')
        self.max_server = settings.max_server
