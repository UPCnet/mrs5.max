from mrs5.max.browser.controlpanel import IMAXUISettings
from plone import api
from plone.app.layout.viewlets.interfaces import IPortalHeader
from plone.registry.interfaces import IRegistry
from Products.Five.browser import BrowserView
from ulearn5.core.browser.viewlets import viewletBase
from zope.component import queryUtility
from zope.interface import Interface, implementer
from zope.viewlet.interfaces import IViewlet


@implementer(IViewlet)
class OauthNGDirective(viewletBase):

    def update(self):
        registry = queryUtility(IRegistry)
        settings = registry.forInterface(IMAXUISettings, check=False)
        user = api.user.get_current()
        self.username = user.id
        self.oauth_token = user.getProperty('oauth_token', '')
        self.max_server = settings.max_server
