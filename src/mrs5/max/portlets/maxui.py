from zope import schema
from zope.component import getMultiAdapter
from zope.component import getUtility
from zope.component.hooks import getSite

from zope.formlib import form
from zope.interface import implements

from plone.app.portlets.portlets import base
from plone.memoize.view import memoize_contextless
from plone.portlets.interfaces import IPortletDataProvider
from plone.portlets.interfaces import IPortletManager
from plone.portlets.interfaces import IPortletRetriever
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from mrs5.max import _


class IMaxUIPortlet(IPortletDataProvider):
    """A portlet

    It inherits from IPortletDataProvider because for this portlet, the
    data that is being rendered and the portlet assignment itself are the
    same.
    """


class Assignment(base.Assignment):
    """Portlet assignment.

    This is what is actually managed through the portlets UI and associated
    with columns.
    """

    implements(IMaxUIPortlet)

    def __init__(self):
        pass

    @property
    def title(self):
        """This property is used to give the title of the portlet in the
        "manage portlets" screen.
        """
        return _(u'maxui', default=u'MAX UI')


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
        columns = ['ContentWellPortlets.BelowTitlePortletManager1',
                   'ContentWellPortlets.BelowTitlePortletManager2',
                   'ContentWellPortlets.BelowTitlePortletManager3',
                   'plone.leftcolumn', 'plone.rightcolumn']
        for column in columns:
            managerColumn = getUtility(IPortletManager, name=column)
            retriever = getMultiAdapter((self.context, managerColumn), IPortletRetriever)
            portlets = retriever.getPortlets()
            for portlet in portlets:
                if portlet['name'] == 'maxuichat':
                    return False
        return True


class AddForm(base.NullAddForm):
    """Portlet add form.
    """
    def create(self):
        return Assignment()
