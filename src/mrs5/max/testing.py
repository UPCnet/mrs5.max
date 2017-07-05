# -*- coding: utf-8 -*-
from plone.app.contenttypes.testing import PLONE_APP_CONTENTTYPES_FIXTURE
from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.testing import z2

from plone.app.testing import PLONE_FIXTURE

from zope.configuration import xmlconfig


class Mrs5MaxLayer(PloneSandboxLayer):

    defaultBases = (PLONE_FIXTURE,)

    def setUpZope(self, app, configurationContext):
         # Load ZCML
        import mrs5.max
        xmlconfig.file(
            'configure.zcml',
            mrs5.max,
            context=configurationContext
        )

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'mrs5.max:default')


MRS5_MAX_FIXTURE = Mrs5MaxLayer()


MRS5_MAX_INTEGRATION_TESTING = IntegrationTesting(
    bases=(MRS5_MAX_FIXTURE,),
    name='Mrs5MaxLayer:IntegrationTesting'
)


MRS5_MAX_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(MRS5_MAX_FIXTURE,),
    name='Mrs5MaxLayer:FunctionalTesting'
)


MRS5_MAX_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        MRS5_MAX_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        z2.ZSERVER_FIXTURE
    ),
    name='Mrs5MaxLayer:AcceptanceTesting'
)
