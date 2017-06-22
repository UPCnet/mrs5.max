from plone.resource.traversal import ResourceTraverser


class MAXUITraverser(ResourceTraverser):
    """The MAXUI theme traverser.

    Allows traversal to /++maxui++<name> using ``plone.resource`` to fetch
    things stored either on the filesystem or in the ZODB.
    """

    name = 'maxui'
