from five import grok
from plone import api
from hashlib import sha1
from zope.interface import Interface
from zope.component import getUtility
from zope.component.hooks import getSite
from plone.memoize.view import memoize_contextless
from Products.CMFPlone.interfaces import IPloneSiteRoot
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from mrs5.max.utilities import IMAXClient

import json


class MAXUserSearch(grok.View):
    grok.context(Interface)
    grok.name('max.ajaxusersearch')
    grok.require('base.authenticated')

    def render(self):
        self.request.response.setHeader("Content-type", "application/json")
        query = self.request.form.get('q', '')
        results = dict(more=False, results=[])
        if query:
            current_user = api.user.get_current()
            oauth_token = current_user.getProperty('oauth_token', '')

            maxclient, settings = getUtility(IMAXClient)()
            maxclient.setActor(current_user.getId())
            maxclient.setToken(oauth_token)

            fulluserinfo = maxclient.people.get(qs={'limit': 0, 'username': query})

            values = [dict(id=userinfo.get('username'), text=userinfo.get('displayName')) for userinfo in fulluserinfo]
            results['results'] = values
            return json.dumps(results)
        else:
            return json.dumps({"error": "No query found"})


class GetMaxHash(grok.View):
    grok.context(Interface)
    grok.name('max.hash')
    grok.require('base.authenticated')

    def render(self):
        url = self.context.absolute_url()
        return sha1(url).hexdigest()
