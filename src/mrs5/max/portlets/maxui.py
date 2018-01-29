from zope import schema
from zope.component.hooks import getSite
from zope.formlib import form
from zope.interface import implements

from plone.app.portlets.portlets import base
from plone.memoize.view import memoize_contextless
from plone.portlets.interfaces import IPortletDataProvider

from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from mrs5.max import MRSMAXMessageFactory as _


class IMaxUIPortlet(IPortletDataProvider):
    """A portlet

    It inherits from IPortletDataProvider because for this portlet, the
    data that is being rendered and the portlet assignment itself are the
    same.
    """

    displayChat = schema.Bool(
        title=_(u'Display chat'),
        required=True,
        default=True
    )


class Assignment(base.Assignment):
    """Portlet assignment.

    This is what is actually managed through the portlets UI and associated
    with columns.
    """

    implements(IMaxUIPortlet)

    def __init__(self, displayChat=True):
        self.displayChat = displayChat

    @property
    def title(self):
        """This property is used to give the title of the portlet in the
        "manage portlets" screen.
        """
        return "Max UI Portlet"


class Renderer(base.Renderer):
    """Portlet renderer.

    This is registered in configure.zcml. The referenced page template is
    rendered, and the implicit variable 'view' will refer to an instance
    of this class. Other methods can be added and referenced in the template.
    """

    render = ViewPageTemplateFile('maxui.pt')

    @memoize_contextless
    def portal_url(self):
        return self.portal().absolute_url()

    @memoize_contextless
    def portal(self):
        return getSite()

    def isDisplayedChat(self):
        if hasattr(self.data, 'displayChat'):
            return self.data.displayChat
        return True


class AddForm(base.AddForm):
    """Portlet add form.
    """
    schema = IMaxUIPortlet
    label = _(u"Add Max UI Portlet")
    description = _(u"This portlet displays Max UI.")

    def create(self, data):
        return Assignment(displayChat=data.get('displayChat', True))


class EditForm(base.EditForm):
    """Portlet edit form.
    """
    schema = IMaxUIPortlet
    label = _(u"Edit Max UI Portlet")
    description = _(u"This portlet displays Max UI.")
