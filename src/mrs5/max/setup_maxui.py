# -*- coding: utf-8 -*-
import requests
import re
import os
import sys
import json


ORIGINAL_MAXUI_FONT_URL = 'font'
DEFAULT_MAXUI_FONTS_URL = './maxui/font'
DEFAULT_MAXUI_FONTS_FOLDER = './maxui/font'
DEFAULT_MAXUI_GITHUB_URL = 'https://github.com/UPCnet/max.ui5.js'
DEFAULT_MAXUI_BRANCH = 'master'
DEFAULT_MAXUI_JS = './maxui.min.js'
DEFAULT_MAXUICHAT_JS = './maxuichat.min.js'
DEFAULT_MAXUIACTIVITY_JS = './maxuiactivity.min.js'
DEFAULT_MAXUI_CSS = './maxui.css'


def saveConfiguration(config):
    """
        Loads stored configuration from .maxui_setup
    """
    dump = json.dumps(config, indent=4, sort_keys=True)
    open('.maxui_setup', 'w').write(dump)


def getConfiguration():
    """
        Gests current configuration stored on .maxui_setup
    """
    if not os.path.exists('.maxui_setup'):
        default = {
            'github_url': DEFAULT_MAXUI_GITHUB_URL,
            'branch': DEFAULT_MAXUI_BRANCH,
        }
        saveConfiguration(default)
    data = open('.maxui_setup').read()
    config = json.loads(data)
    return config


def downloadFile(config, filename, raw=True):
    """
        Downloads a file from the repo and branch specified in the configuration
        If raw is False, will download the github page html instead of the raw file
    """
    params = dict(config)
    params['filename'] = filename
    params['tree'] = 'raw' if raw else 'tree'
    url = '{github_url}/{tree}/{branch}/{filename}'.format(**params)
    sys.stdout.write(f" Downloading {url} ")
    sys.stdout.flush()
    response = requests.get(url, verify=False)
    if response.status_code != 200:
        return False
    sys.stdout.write("✓\n")
    sys.stdout.flush()
    return response.content


def main():
    # Setup configuration parameters
    # User will be asked if not setted

    print()
    config = getConfiguration()

    if 'fonts_url' not in config:
        fonts_url = input(f"Fonts base_url ['{DEFAULT_MAXUI_FONTS_URL}']: ")
        fonts_url = fonts_url.strip()
        fonts_url = fonts_url.rstrip('/')
        config['fonts_url'] = fonts_url if fonts_url else DEFAULT_MAXUI_FONTS_URL

    if 'fonts_location' not in config:
        fonts_location = input(
            f"Font files location ['{DEFAULT_MAXUI_FONTS_FOLDER}']: ")
        fonts_url = fonts_url.strip()
        fonts_url = fonts_url.rstrip('/')
        config['fonts_location'] = fonts_url if fonts_url else DEFAULT_MAXUI_FONTS_FOLDER

    if 'js_location' not in config:
        js_location = input(f"Javascript file location ['{DEFAULT_MAXUI_JS}']: ")
        js_location = js_location.strip()
        config['js_location'] = js_location if js_location else DEFAULT_MAXUI_JS

    if 'js_location_chat' not in config:
        js_location_chat = input(
            f"Javascript file location ['{DEFAULT_MAXUICHAT_JS}']: ")
        js_location_chat = js_location_chat.strip()
        config['js_location_chat'] = js_location_chat if js_location_chat else DEFAULT_MAXUICHAT_JS

    if 'js_location_activity' not in config:
        js_location_activity = input(
            f"Javascript file location ['{DEFAULT_MAXUIACTIVITY_JS}']: ")
        js_location_activity = js_location_activity.strip()
        config['js_location_activity'] = js_location_activity if js_location_activity else DEFAULT_MAXUIACTIVITY_JS

    if 'css_location' not in config:
        css_location = input(f"Stylesheet file location ['{DEFAULT_MAXUI_CSS}']: ")
        css_location = css_location.strip()
        config['css_location'] = css_location if css_location else DEFAULT_MAXUI_CSS

    saveConfiguration(config)

    version = json.loads(downloadFile(config, 'package.json'))['version']

    js = downloadFile(config, f'builds/{version}/maxui.min.js')
    if not js:
        print(f' MAX UI Version {version} build not found')
        sys.exit(1)
    # Store downloaded js
    open(config['js_location'], 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxui.min.js.map')
    if not js:
        print(f' MAX UI jsmap Version {version} build not found')
        sys.exit(1)
    # Store downloaded js map
    fname = config['js_location'].split('.js')[0]
    open(f'{fname}.map', 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxui.js')
    if not js:
        print(f' MAX UI js source Version {version} build not found')
        sys.exit(1)
    # Store downloaded js source for map
    path = '/'.join(config['js_location'].split('/')[:-1])
    open(f'{path}/maxui.js', 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuichat.min.js')
    if not js:
        print(f' MAX UI Version {version} build not found')
        sys.exit(1)
    # Store downloaded js
    open(config['js_location_chat'], 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuichat.min.js.map')
    if not js:
        print(f' MAX UI jsmap Version {version} build not found')
        sys.exit(1)
    # Store downloaded js map
    fname = config['js_location_chat'].split('.js')[0]
    open(f'{fname}.map', 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuichat.js')
    if not js:
        print(f' MAX UI js source Version {version} build not found')
        sys.exit(1)
    # Store downloaded js source for map
    path = '/'.join(config['js_location_chat'].split('/')[:-1])
    open(f'{path}/maxuichat.js', 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuiactivity.min.js')
    if not js:
        print(f' MAX UI Version {version} build not found')
        sys.exit(1)
    # Store downloaded js
    open(config['js_location_activity'], 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuiactivity.min.js.map')
    if not js:
        print(f' MAX UI jsmap Version {version} build not found')
        sys.exit(1)
    # Store downloaded js map
    fname = config['js_location_activity'].split('.js')[0]
    open(f'{fname}.map', 'w').write(js)

    js = downloadFile(config, f'builds/{version}/maxuiactivity.js')
    if not js:
        print(f' MAX UI js source Version {version} build not found')
        sys.exit(1)
    # Store downloaded js source for map
    path = '/'.join(config['js_location_activity'].split('/')[:-1])
    open(path + '/maxuiactivity.js', 'w').write(js)

    # Download and modify CSS
    css = downloadFile(config, f'builds/{version}/maxui.min.css')
    sys.stdout.write(" Modifying font links ")
    sys.stdout.flush()
    # css = re.sub(r"(url\(['\"]?){}(['\"]?)".format(ORIGINAL_MAXUI_IMAGES_URL), r"\1{images_url}\2".format(**config), css)
    css = re.sub(
        r"(url\(['\"]?){}(/maxicons['\"]?)".format(ORIGINAL_MAXUI_FONT_URL),
        r"\1{fonts_url}\2".format(**config),
        css)
    open(config['css_location'], 'w').write(css)
    sys.stdout.write("✓\n")
    sys.stdout.flush()

    # Download fonts
    extensions = ['eot', 'svg', 'ttf', 'woff']
    for extension in extensions:
        fontbytes = downloadFile(config, f'builds/{version}/font/maxicons.{extension}')
        open(config['fonts_location'] + '/maxicons.' + extension, 'w').write(fontbytes)

    # #Download images
    # images = downloadFile(config, 'img', raw=False)
    # image_urls = re.findall(r'href=".*?/%s/img/(.*?)"' % (config['branch']), images)
    # for image in image_urls:
    #     imagebytes = downloadFile(config, 'img/' + image)
    #     open(config['images_location'] + '/' + unquote(image), 'w').write(imagebytes)

    print(f'\n MAX UI {version} setup finished\n')


if __name__ == "__main__":
    main()
