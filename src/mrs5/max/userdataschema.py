# -*- coding: utf-8 -*-
from zope import schema
from zope.interface import implements
from plone.app.users.schema import IUserDataSchema, ICombinedRegisterSchema, IRegisterSchema
from plone.app.users.schema import IUserSchemaProvider
from plone.app.users.browser.userdatapanel import UserDataPanelAdapter
from plone.app.users.browser.userdatapanel import UserDataPanel

from ZPublisher.HTTPRequest import FileUpload
from Products.CMFPlone import PloneMessageFactory as PLMF
from zope.component.hooks import getSite
from plone.app.users.browser.schemaeditor import getFromBaseSchema
from Products.CMFPlone.interfaces import IPloneSiteRoot

from mrs5.max import MRSMAXMessageFactory as _


class IEnhancedUserDataSchema(IRegisterSchema):
    """ Use all the fields from the default user data schema, and add various
    extra fields.
    """
    # portrait = FileUpload(title=PLMF(u'label_portrait', default=u'Portrait'),
    #     description=_(u'help_portrait',
    #                   default=u'To add or change the portrait: click the '
    #                   '"Browse" button; select a picture of yourself.'),
    #     required=False)

    pdelete = schema.Bool(
        title=PLMF(u'label_delete_portrait', default=u'Delete Portrait'),
        description=u'',
        required=False)

    twitter_username = schema.TextLine(
        title=_(u'label_twitter', default=u'Twitter username'),
        description=_(u'help_twitter',
                      default=u"Fill in your Twitter username."),
        required=False,
    )


class UserDataSchemaProvider(UserDataPanel):

    @property
    def schema(self):
        portal = getSite()
        schema = getattr(portal, '_v_userdata_schema', None)
        if schema is None:
            portal._v_userdata_schema = schema = getFromBaseSchema(
                IEnhancedUserDataSchema,
                form_name=u'In User Profile'
            )
            # as schema is a generated supermodel,
            # needed adapters can only be registered at run time
            provideAdapter(EnhancedUserDataPanelAdapter, (IPloneSiteRoot,), schema)
        return schema

    # def getSchema(self):
    #     """
    #     """
    #     return IEnhancedUserDataSchema


class EnhancedUserDataPanelAdapter(UserDataPanelAdapter):

    def get_twitter_username(self):
        return self.context.getProperty('twitter_username', '')

    def set_twitter_username(self, value):
        return self.context.setMemberProperties({'twitter_username': value})

    twitter_username = property(get_twitter_username, set_twitter_username)
