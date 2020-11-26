# -*- encoding: utf-8 -*-
from five import grok
from max5.client.rest import MaxClient
from mrs5.max.browser.controlpanel import IMAXUISettings
from mrs5.max.utilities import IMAXClient
from mrs5.max.utilities import prettyResponse
from plone import api
from plone.registry.interfaces import IRegistry
from Products.CMFPlone.interfaces import IConfigurationChangedEvent
from Products.PluggableAuthService.interfaces.authservice import IPropertiedUser
from Products.PluggableAuthService.interfaces.events import IPrincipalCreatedEvent
from zope.component import getUtility
from zope.component import queryUtility
from zope.component.hooks import getSite

import logging
import plone.api


logger = logging.getLogger('mrs5.max')


@grok.subscribe(IConfigurationChangedEvent)
def updateMAXUserInfo(event):
    """This subscriber will trigger when a user change his/her profile data."""

    # Only execute if the event triggers on user profile data change
    if 'fullname' in event.data or 'twitter_username' in event.data:
        pm = api.portal.get_tool(name="portal_membership")
        if pm.isAnonymousUser():  # the user has not logged in
            username = ''
            return
        else:
	    username = api.user.get_current().id
        memberdata = pm.getMemberById(username)
        properties = dict(displayName=memberdata.getProperty('fullname', ''),
                          twitterUsername=memberdata.getProperty('twitter_username', '')
                          )

        registry = queryUtility(IRegistry)
        settings = registry.forInterface(IMAXUISettings, check=False)
        oauth_token = memberdata.getProperty('oauth_token', '')

        maxclient = MaxClient(url=settings.max_server, oauth_server=settings.oauth_server)
        maxclient.setActor(username)
        maxclient.setToken(oauth_token)

        maxclient.people[username].put(**properties)


@grok.subscribe(IConfigurationChangedEvent)
def updateOauthServerOnOsirisPASPlugin(event):
    """This subscriber will trigger when an admin updates the MAX settings.

        El oauth_server del pasosiris5 se rellena cuando esta vacio desde
        max5.client/src/max5/client/client.py
        def oauth_server(self)

        que llama a:
        https://max.upcnet.es/vilalta/info
        {"max.oauth_server": "https://oauth.upcnet.es/vilalta", "version": "5.3.16", "max.server_id": "vilalta"}
        Por tanto, se guarda el max.oauth_server

        Si guardamos la configuración del MAX UI settings, tambien lee lo anterior
        por tanto no importa el dominio que se escriba en esta configuracion para esto
    """

    if 'oauth_server' in event.data:
        portal = getSite()
        portal.acl_users.pasosiris5.oauth_server = event.data['oauth_server']


@grok.subscribe(IPropertiedUser, IPrincipalCreatedEvent)
def createMAXUser(principal, event):
    """This subscriber will trigger when a user is created."""

    pid = 'mrs5.max'
    qi_tool = plone.api.portal.get_tool(name='portal_quickinstaller')
    installed = [p['id'] for p in qi_tool.listInstalledProducts()]

    if pid in installed:
        maxclient, settings = getUtility(IMAXClient)()
        maxclient.setActor(settings.max_restricted_username)
        maxclient.setToken(settings.max_restricted_token)

        user = principal.getId()

        try:
            maxclient.people[user].post()

            if maxclient.last_response_code == 201:
                logger.info('MAX user created for user: %s' % user)
            elif maxclient.last_response_code == 200:
                logger.info('MAX user already created for user: {}'.format(user))
            else:
                logger.error('Error creating MAX user for user: {}. '.format(user))
                logger.error(prettyResponse(maxclient.last_response))
        except:
            logger.error('Could not contact with MAX server.')
            logger.error(prettyResponse(maxclient.last_response))
