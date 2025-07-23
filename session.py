# crawler/session.py

import requests

class ScannerSession:
    """
    Wraps requests.Session() to handle cookies, headers, etc.
    """

    def __init__(self):
        self.session = requests.Session()
        # TODO: load any auth tokens or headers here

    def get(self, url: str, **kwargs):
        return self.session.get(url, timeout=kwargs.get("timeout"))

    def post(self, url: str, data=None, **kwargs):
        return self.session.post(url, data=data, timeout=kwargs.get("timeout"))

    # TODO: add login() method later
