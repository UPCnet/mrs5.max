from OFS.Image import Image

from zope.interface import implements
from zope.publisher.interfaces import IPublishTraverse, NotFound

from plone.namedfile.utils import set_headers, stream_data

from Products.Five import BrowserView
from Products.CMFCore.utils import getToolByName


class getAvatar(BrowserView):
    """ Return the raw portrait of the given user ../@@avatar/{username} """

    implements(IPublishTraverse)

    def __init__(self, context, request):
        super(getAvatar, self).__init__(context, request)
        self.username = None

    def publishTraverse(self, request, name):

        if self.username is None:  # ../@@avatar/username
            self.username = name
        else:
            raise NotFound(self, name, request)
        return self

    def __call__(self):
        pm = getToolByName(self, 'portal_membership')
        portrait = pm.getPersonalPortrait(self.username)

        if isinstance(portrait, Image):
            # Return the user's portrait cache at will
            self.request.response.addHeader('Content-Type', portrait.content_type)
            self.request.response.addHeader('X-Theme-Disabled', '1')
            set_headers(portrait, self.request.response, filename=self.username)
            return stream_data(portrait)
        else:
            # Return default image, no caching
            self.request.response.addHeader('Content-Type', portrait.getContentType())
            self.request.response.addHeader('Cache-Control', 'must-revalidate, max-age=0, no-cache, no-store')
            return portrait._readFile(portrait)
