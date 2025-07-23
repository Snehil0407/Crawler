import json
import os
from urllib.parse import urlparse
from tldextract import extract

def save_to_json(data, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def is_same_domain(url1, url2):
    """Check if two URLs belong to the same domain."""
    domain1 = extract(url1).registered_domain
    domain2 = extract(url2).registered_domain
    return domain1 == domain2

def is_valid_link(url):
    """Check if a URL is valid and not a file or mailto link."""
    try:
        parsed = urlparse(url)
        return bool(parsed.netloc) and not url.startswith(('mailto:', 'tel:', 'javascript:'))
    except:
        return False
