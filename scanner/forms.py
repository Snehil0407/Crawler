# crawler/forms.py

from typing import List, Dict, Union
from bs4 import BeautifulSoup
import requests

def extract_forms(response: Union[str, requests.Response]) -> List[Dict]:
    """Extract forms from HTML content or response object"""
    if isinstance(response, requests.Response):
        html = response.text
    else:
        html = response

    soup = BeautifulSoup(html, "html.parser")
    forms = []

    for form in soup.find_all("form"):
        form_data = {
            "method": form.get("method", "get").lower(),
            "action": form.get("action", ""),
            "inputs": []
        }

        for input_tag in form.find_all(["input", "textarea"]):
            input_type = input_tag.get("type", "text")
            input_name = input_tag.get("name")
            input_value = input_tag.get("value", "")
            
            if input_name:  # Only add inputs with names
                form_data["inputs"].append({
                    "type": input_type,
                    "name": input_name,
                    "value": input_value
                })

        forms.append(form_data)

    return forms
