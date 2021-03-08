from plone import api
from pas.plugins.preauth.interfaces import IPreauthTask
from pas.plugins.preauth.interfaces import IPreauthHelper

from zope.component import getUtility
from zope.interface import implements
from zope.component import adapts

from mrs5.max.utilities import prettyResponse
from mrs5.max.utilities import IMAXClient
from max5.client.client import BadUsernameOrPasswordError

import logging

logger = logging.getLogger('mrs5.max')


def getToken(user, password, grant_type=None):
    maxclient, settings = getUtility(IMAXClient)()
    try:
        token = maxclient.getToken(user, password)
        return token
    except BadUsernameOrPasswordError as error:
        logger.error('Invalid credentials for user "{}" on "{}"'.format(user, maxclient.oauth_server))
        return 'BadUsernameOrPasswordError'
    except Exception as error:
        logger.error('Exception raised while getting token for user "{}" from "{}"'.format(user, maxclient.oauth_server))
        logger.error('{}: {}'.format(error.__class__.__name__, error.message))
    # An empty token is returned in an exception is raised
    return ''


class oauthTokenRetriever(object):
    implements(IPreauthTask)
    adapts(IPreauthHelper)

    def __init__(self, context):
        self.context = context

    def execute(self, credentials):
        user = credentials.get('login').lower()
        password = credentials.get('password')

        if user == "admin":
            return

        member = api.user.get(username=user)

        oauth_token = getToken(user, password)

        # Modificamos este codigo para que le devuelva al pas.plugins.preauth BadUsernameOrPasswordError
        # y no continue mirando los siguientes plugins de Authentication Plugins
        if oauth_token == 'BadUsernameOrPasswordError':
            return 'BadUsernameOrPasswordError'
        elif oauth_token:
            member.setMemberProperties({'oauth_token': oauth_token})
            logger.info('oAuth token set for user: %s ' % user)
        else:
            logger.warning('oAuth token NOT set for user: %s ' % user)

        return


class maxUserCreator(object):
    implements(IPreauthTask)
    adapts(IPreauthHelper)

    def __init__(self, context):
        self.context = context

    def execute(self, credentials):
        user = credentials.get('login').lower()
        # password = credentials.get('password')

        if user == "admin":
            return

        # Disable the creation of the user in MAX by him/herself
        # token = getToken(user, password)
        # if token == '':
        #     logger.warning('MAX user not created, we don\'t have a valid token')
        #     return

        maxclient, settings = getUtility(IMAXClient)()
        maxclient.setActor(settings.max_restricted_username)
        maxclient.setToken(settings.max_restricted_token)
        # maxclient.setActor(user)
        # maxclient.setToken(token)

        member = api.user.get(username=user)

        try:
            #Mayo2018: Si el usuario existe, lo creamos en el max.
            #Esto lo hacemos porque si han dado de alta un usuario en el ldap
            #y entra en comunidades lo hemos de dar de alta en el max
            if member != None:
                maxclient.people[user].post()

                if maxclient.last_response_code == 201:
                    logger.info('MAX user created:  %s' % user)
                elif maxclient.last_response_code == 200:
                    logger.info('MAX user already created: {}'.format(user))
                else:
                    logger.error('Error creating MAX user: {}. '.format(user))
                    logger.error(prettyResponse(maxclient.last_response))

                # Temporarily subscribe always the user to the default context
                # July2014 - Victor: Disable automatic subscription to the default
                # context as it was proven to not be used anymore.
                # maxclient.setActor(user)
                # portal_url = api.portal.get().absolute_url()
                # maxclient.people[user].subscriptions.post(object_url=portal_url)
            else:
                logger.info('Invalid credentials for user: {}'.format(user))


        except:
            logger.error('Could not contact with MAX server.')
            logger.error(prettyResponse(maxclient.last_response))

