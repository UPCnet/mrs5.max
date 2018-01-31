# -*- coding: utf-8 -*-
"""Init and utils."""

from zope.i18nmessageid import MessageFactory
import logging

_ = MessageFactory('mrs5.max')

requests_log = logging.getLogger('requests')
requests_log.setLevel(logging.WARNING)
