# -*- coding: utf-8 -*-
from zope import schema
from z3c.form import button
from zope.event import notify
from zope.component import queryUtility
from zope.component import getUtility

from plone.app.controlpanel.events import ConfigurationChangedEvent

from Products.statusmessages.interfaces import IStatusMessage
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from plone.app.registry.browser import controlpanel
from plone.registry.interfaces import IRegistry

from max5.client.rest import MaxClient
from mrs5.max import _

from plone.directives import form


DEFAULT_OAUTH_TOKEN_ENDPOINT = u'https://oauth.beta.upc.edu'
DEFAULT_MAX_SERVER = u'https://max.beta.upc.edu/betaupc'
DEFAULT_HUB_SERVER = u'https://hub.beta.upc.edu'
# DEFAULT_HUB_SERVER = u'http://hub.upcnet.es'
DEFAULT_DOMAIN = u'betaupc'
DEFAULT_MAX_RESTRICTED_USERNAME = u'restricted'


class IMAXUISettings(form.Schema):
    """Global oAuth settings. This describes records stored in the
    configuration registry and obtainable via plone.registry.
    """

    form.mode(oauth_server='hidden')
    oauth_server = schema.TextLine(
        title=_(u'label_oauth_server', default=u'OAuth token endpoint'),
        description=_(u'help_oauth_server',
                      default=u"Please, specify the URI for the oAuth server."),
        required=True,
        default=DEFAULT_OAUTH_TOKEN_ENDPOINT
    )

    max_server = schema.TextLine(
        title=_(u'label_max_server', default=u'MAX Server URL'),
        description=_(u'help_max_server',
                      default=u"Please, specify the MAX Server URL."),
        required=True,
        default=DEFAULT_MAX_SERVER
    )

    max_server_alias = schema.TextLine(
        title=_(u'label_max_server_alias', default=u'MAX Server URL Alias (Fallback when no CORS available)'),
        description=_(u'help_max_server_alias',
                      default=u"Please, specify the MAX Server URL Alias."),
        required=False,
        default=DEFAULT_MAX_SERVER
    )

    form.mode(max_restricted_username='hidden')
    max_restricted_username = schema.TextLine(
        title=_(u'label_max_restricted_username', default=u'MAX restricted username'),
        description=_(u'help_max_restricted_username',
                      default=u"Please, specify the MAX restricted username."),
        required=False,
        default=DEFAULT_MAX_RESTRICTED_USERNAME
    )

    form.mode(max_restricted_token='hidden')
    max_restricted_token = schema.Password(
        title=_(u'label_max_restricted_token', default=u'MAX restricted user token'),
        description=_(u'help_max_restricted_token',
                      default=u"Please, specify the MAX restricted user token."),
        required=False,
    )

    hub_server = schema.TextLine(
        title=_(u'label_hub_server', default=u'uLearnHub server'),
        description=_(u'help_hub_server',
                      default=u"Please, specify the uLearnHub server for this site."),
        required=False,
        default=DEFAULT_HUB_SERVER
    )

    domain = schema.TextLine(
        title=_(u'label_domain', default=u'MAX domain'),
        description=_(u'help_domain',
                      default=u"Please, specify the HUB domain for this site."),
        required=False,
        default=DEFAULT_DOMAIN
    )


class MAXUISettingsEditForm(controlpanel.RegistryEditForm):
    """MAXUI settings form.
    """
    schema = IMAXUISettings
    id = "MAXUISettingsEditForm"
    label = _(u"MAX UI settings")
    description = _(u"help_maxui_settings_editform",
                    default=u"Settings related to MAX, including OAuth server "
                            "endpoint and grant method.")

    def updateFields(self):
        super(MAXUISettingsEditForm, self).updateFields()
        # self.fields = self.fields.omit('max_app_token')

    def updateWidgets(self):
        super(MAXUISettingsEditForm, self).updateWidgets()

    @button.buttonAndHandler(_('Save'), name=None)
    def handleSave(self, action):
        data, errors = self.extractData()
        if errors:
            self.status = self.formErrorsMessage
            return

        # Auto-fill the oauth_server from max_server info endpoint
        maxclient = MaxClient(url=data['max_server'])
        data['oauth_server'] = maxclient.oauth_server

        self.applyChanges(data)

        # Imports required to be here because of circular dependencies
        from mrs5.max.utilities import IMAXClient
        from mrs5.max.utilities import IHubClient
        # Update the connection to the (singleton) clients utilities
        maxclient = getUtility(IMAXClient)
        maxclient.create_new_connection()

        hubclient = getUtility(IHubClient)
        hubclient.create_new_connection()

        notify(ConfigurationChangedEvent(self, data))

        IStatusMessage(self.request).addStatusMessage(_(u"Changes saved"),
                                                      "info")
        self.context.REQUEST.RESPONSE.redirect("@@maxui-settings")

    @button.buttonAndHandler(_('Cancel'), name='cancel')
    def handleCancel(self, action):
        IStatusMessage(self.request).addStatusMessage(_(u"Edit cancelled"),
                                                      "info")
        self.request.response.redirect("%s/%s" % (self.context.absolute_url(),
                                                  self.control_panel_view))


class MAXUISettingsControlPanel(controlpanel.ControlPanelFormWrapper):
    """MAXUI settings control panel.
    """
    form = MAXUISettingsEditForm
    index = ViewPageTemplateFile('controlpanel.pt')

    def update(self):
        registry = queryUtility(IRegistry)
        self.maxui_settings = registry.forInterface(IMAXUISettings)
        super(MAXUISettingsControlPanel, self).update()

    def restricted_token_class(self):
        return self.maxui_settings.max_restricted_token and 'info' or 'warning'

    def app_token_class(self):
        return self.maxui_settings.max_app_token and 'info' or 'warning'
