
import os
import requests
from urllib.parse import quote
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

def _service_url(upper_name, legacy_name, default):
    configured = os.getenv(upper_name) or os.getenv(legacy_name) or default
    parsed = urlparse(configured.strip())
    if parsed.scheme in ("http", "https") and parsed.hostname and not any(c.isspace() for c in configured):
        return configured.rstrip("/")
    print(f"Invalid {upper_name} configuration; using the local development URL")
    return default.rstrip("/")


backend_url = _service_url("BACKEND_URL", "backend_url", "http://localhost:3030")
sentiment_analyzer_url = _service_url(
    "SENTIMENT_ANALYZER_URL", "sentiment_analyzer_url", "http://localhost:5050"
)


def get_request(endpoint, **kwargs):
    request_url = f"{backend_url.rstrip('/')}/{endpoint.lstrip('/')}"

    try:
        response = requests.get(
            request_url,
            params=kwargs,
            timeout=10
        )

        if response.status_code == 200:
            return response.json()

        print("GET request failed:", response.status_code)
        return None

    except requests.RequestException as error:
        print("Network error:", error)
        return None


def analyze_review_sentiments(text):
    request_url = (
        f"{sentiment_analyzer_url.rstrip('/')}/analyze/{quote(text, safe='')}"
    )

    try:
        response = requests.get(request_url, timeout=3)

        if response.status_code == 200:
            return response.json()

        print("Sentiment request failed:", response.status_code)
        return None

    except requests.RequestException as error:
        print("Network error:", error)
        return None


def post_review(data_dict):
    request_url = f"{backend_url.rstrip('/')}/insert_review"

    try:
        response = requests.post(
            request_url,
            json=data_dict,
            timeout=10
        )

        if response.status_code in (200, 201):
            return response.json()

        print("POST request failed:", response.status_code)
        return None

    except requests.RequestException as error:
        print("Network error:", error)
        return None
