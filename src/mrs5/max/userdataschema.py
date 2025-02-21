# -*- coding: utf-8 -*-
from mrs5.max import _
from plone.app.users.browser.schemaeditor import getFromBaseSchema
from plone.app.users.browser.userdatapanel import (UserDataPanel,
                                                   UserDataPanelAdapter)
from plone.app.users.schema import (ICombinedRegisterSchema, IRegisterSchema,
                                    IUserDataSchema, IUserSchemaProvider)
from Products.CMFPlone import PloneMessageFactory as PLMF
from Products.CMFPlone.interfaces import IPloneSiteRoot
from zope import schema
from zope.component.hooks import getSite
from ZPublisher.HTTPRequest import FileUpload


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
        title=PLMF('label_delete_portrait', default='Delete Portrait'),
        description='',
        required=False)

    twitter_username = schema.TextLine(
        title=_('label_twitter', default='Twitter username'),
        description=_('help_twitter',
                      default="Fill in your Twitter username."),
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
                form_name='In User Profile'
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
