from plone import api
import unittest2 as unittest

from mrs5.max.testing import \
    MRS5_MAX_INTEGRATION_TESTING


class TestExample(unittest.TestCase):

    layer = MRS5_MAX_INTEGRATION_TESTING

    def setUp(self):
        self.app = self.layer['app']
        self.portal = self.layer['portal']
        self.qi_tool = api.portal.get_tool(name='portal_quickinstaller')

    def test_product_is_installed(self):
        """ Validate that our products GS profile has been run and the product
            installed
        """
        pid = 'mrs5.max'
        installed = [p['id'] for p in self.qi_tool.listInstalledProducts()]
        self.assertTrue(pid in installed,
                        'package appears not to have been installed')
