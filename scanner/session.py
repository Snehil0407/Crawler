# crawler/session.py

import requests

class CustomSession:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (WebScannerBot)"
        })

    def get(self, url, **kwargs):
        try:
            response = self.session.get(url, timeout=10, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException:
            return None
