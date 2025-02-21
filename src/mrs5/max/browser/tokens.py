from mrs5.max import _
from mrs5.max.utilities import IMAXClient, set_user_oauth_token
from plone import api
from plone.autoform.form import AutoExtensibleForm
from plone.supermodel import model
from Products.Five.browser import BrowserView
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from Products.statusmessages.interfaces import IStatusMessage
from z3c.form import button, form
from zope import schema
from zope.component import getUtility
from zope.component.hooks import getSite


class ICredentials(model.Schema):

    username = schema.TextLine(
        title=_('The username.'),
    )

    password = schema.Password(
        title=_('Password'),
        description=_('The provided username account password.'),
    )


class getRestrictedTokenForm(AutoExtensibleForm, form.Form):

    index = ViewPageTemplateFile("views_templates/gettokenform.pt")

    schema = ICredentials
    ignoreContext = True

    label = _('Get a valid token')
    description = _('Give the credentials of a valid account.')

    def __call__(self):
        self.update()
        return self.index()

    def update(self):
        # call the base class version - this is very important!
        super(getRestrictedTokenForm, self).update()

        # disable Plone's editable border
        self.request.set('disable_border', True)
        self.actions['get_token'].addClass('context')

    @button.buttonAndHandler(_('Get token'), name='get_token')
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
                f'Restricted token issued for user: {username}', 'info'
            )
        except AttributeError as error:
            IStatusMessage(self.request).addStatusMessage(
                error,
                'Username or password invalid.')

        # Add context for this site MAX server with the restricted token
        portal = getSite()
        portal_permissions = dict(
            read='subscribed', write='subscribed', subscribe='restricted')
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
            IStatusMessage(
                self.request).addStatusMessage(
                'There was an error trying to create the default (portal root) URL into MAX server.',
                'error')

        # Add the restricted token to the Plone admin user
        set_user_oauth_token('admin', settings.max_restricted_token)

        # Redirect back with a status message
        self.request.response.redirect(
            f'{self.context.absolute_url()}/@@maxui-settings')


class resetMyOauthToken(BrowserView):

    def __call__(self):
        pm = api.portal.get_tool(name='portal_membership')
        member = pm.getAuthenticatedMember()
        member.setMemberProperties({'oauth_token': ''})
