# crawler/crawler.py

import threading
from queue import Queue
from urllib.parse import urljoin
from utils import is_same_domain, is_valid_link
from scanner.forms import extract_forms
from scanner.session import CustomSession
from scanner.sqli import SQLiScanner
from bs4 import BeautifulSoup
from tldextract import extract

class WebCrawler:
    def __init__(self, base_url):
        self.base_url = base_url
        self.visited = set()
        self.domain = extract(base_url).registered_domain
        self.links = []
        self.forms = []
        self.vulnerable_points = []
        self.session = CustomSession()
        self.sqli_scanner = SQLiScanner(self.session)
        self.queue = Queue()
        self.queue.put(base_url)
        self.threads = []
        self.max_threads = 5

    def crawl(self):
        """Start crawling with multiple threads"""
        for _ in range(self.max_threads):
            thread = threading.Thread(target=self._crawl_worker)
            thread.daemon = True
            thread.start()
            self.threads.append(thread)

        self.queue.join()
        return self.links, self.forms, self.vulnerable_points

    def _crawl_worker(self):
        """Worker thread for crawling"""
        while True:
            try:
                url = self.queue.get()
                if url not in self.visited:
                    self._process_url(url)
                self.queue.task_done()
            except Exception as e:
                print(f"Error in crawl worker: {str(e)}")
                self.queue.task_done()

    def _process_url(self, url):
        """Process a single URL"""
        if url in self.visited:
            return

        print(f"[+] Crawling: {url}")
        self.visited.add(url)

        try:
            response = self.session.get(url)
            if "text/html" not in response.headers.get("Content-Type", ""):
                return

            # Extract forms from response
            forms = extract_forms(response)
            self.forms.extend(forms)
            
            # Test each form for vulnerabilities
            for form in forms:
                form_url = urljoin(url, form['action'])
                form_data = {input_field['name']: input_field['value'] 
                           for input_field in form['inputs']}
                
                # Test each input field
                for input_field in form['inputs']:
                    if form['method'] == 'post':
                        result = self.sqli_scanner.test_post_parameter(
                            form_url, form_data, input_field['name'])
                    else:
                        result = self.sqli_scanner.test_get_parameter(
                            form_url, input_field['name'], input_field['value'])
                    
                    if result["vulnerable"]:
                        self.vulnerable_points.append(result)
                        print(f"[!] Found vulnerable {form['method'].upper()} parameter: {input_field['name']} in {form_url}")

            # Extract and queue new links
            soup = BeautifulSoup(response.text, "html.parser")
            for tag in soup.find_all("a", href=True):
                link = urljoin(url, tag['href'])
                if is_valid_link(link) and is_same_domain(link, self.base_url):
                    if link not in self.visited:
                        self.links.append(link)
                        self.queue.put(link)

        except Exception as e:
            print(f"[-] Error processing {url}: {str(e)}")

    def get_links(self):
        return self.links

    def get_forms(self):
        return self.forms

    def get_vulnerable_points(self):
        return self.vulnerable_points
