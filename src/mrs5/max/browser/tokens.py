from five import grok
from plone.directives import form

from zope import schema
from z3c.form import button
from zope.component import getUtility
from zope.component.hooks import getSite

from Products.CMFCore.utils import getToolByName
from Products.CMFCore.interfaces import ISiteRoot
from Products.statusmessages.interfaces import IStatusMessage

from mrs5.max import MRSMAXMessageFactory as _
from mrs5.max.utilities import set_user_oauth_token, IMAXClient

grok.templatedir('views_templates')


class ICredentials(form.Schema):

    username = schema.TextLine(
        title=_(u'The username.'),
    )

    password = schema.Password(
        title=_(u'Password'),
        description=_(u'The provided username account password.'),
    )


class getRestrictedTokenForm(form.SchemaForm):
    grok.name('getRestrictedToken')
    grok.require('cmf.ManagePortal')
    grok.template('gettokenform')
    grok.context(ISiteRoot)

    schema = ICredentials
    ignoreContext = True

    label = _(u'Get a valid token')
    description = _(u'Give the credentials of a valid account.')

    def update(self):
        # call the base class version - this is very important!
        super(getRestrictedTokenForm, self).update()

        # disable Plone's editable border
        self.request.set('disable_border', True)
        self.actions['get_token'].addClass('context')

    @button.buttonAndHandler(_(u'Get token'), name='get_token')
    def handleApply(self, action):
        data, errors = self.extractData()
        if errors:
            self.status = self.formErrorsMessage
            return

        username = data['username']
        password = data['password']

        maxclient, settings = getUtility(IMAXClient)()

        settings.max_restricted_username = username

        try:
            settings.max_restricted_token = maxclient.getToken(username, password)
            IStatusMessage(self.request).addStatusMessage(
                'Restricted token issued for user: {}'.format(username),
                'info')
        except AttributeError, error:
            IStatusMessage(self.request).addStatusMessage(
                error,
                'Username or password invalid.')

        # Add context for this site MAX server with the restricted token
        portal = getSite()
        portal_permissions = dict(read='subscribed', write='subscribed', subscribe='restricted')
        # maxclient.setActor(self.maxui_settings.max_restricted_username)
        # maxclient.setToken(self.maxui_settings.max_restricted_token)
        # maxclient.addContext(portal.absolute_url(),
        #                      portal.title,
        #                      portal_permissions
        #                      )

        context_params = {
            'url': portal.absolute_url(),
            'displayName': portal.title,
            'permissions': portal_permissions
        }

        maxclient.setActor(settings.max_restricted_username)
        maxclient.setToken(settings.max_restricted_token)

        try:
            maxclient.contexts.post(**context_params)
        except:
            IStatusMessage(self.request).addStatusMessage(
                'There was an error trying to create the default (portal root) URL into MAX server.', 'error')

        # Add the restricted token to the Plone admin user
        set_user_oauth_token('admin', settings.max_restricted_token)

        # Redirect back with a status message
        self.request.response.redirect('{}/{}'.format(self.context.absolute_url(), '@@maxui-settings'))


class resetMyOauthToken(grok.View):
    grok.name('resetToken')
    # grok.require('base.authenticated')
    grok.context(ISiteRoot)

    def render(self):
        pm = getToolByName(self.context, 'portal_membership')
        member = pm.getAuthenticatedMember()
        member.setMemberProperties({'oauth_token': ''})
