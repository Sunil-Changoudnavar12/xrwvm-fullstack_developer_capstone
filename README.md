# Dealerships full stack capstone

This repository contains a Django application, a React client, an Express/Mongoose API backed by MongoDB, and a Flask/NLTK sentiment service.

## Run locally on Windows

Prerequisites: Python with the packages in `server/requirements.txt`, Node.js, npm, and Docker Desktop running.

1. Start MongoDB, the dealership API, and sentiment analysis from the repository root:

   ```powershell
   docker compose -f server/database/docker-compose.yml up --build
   ```

   The API listens on port 3030, MongoDB on 27017, and sentiment analysis on 5050. The API initializes the supplied dealerships and reviews only when the corresponding MongoDB collections are empty, so restarting the stack does not erase existing records.

2. In a second terminal, migrate and start Django:

   ```powershell
   cd server
   .\venv\Scripts\python.exe manage.py migrate
   .\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
   ```

   If you are using another Python environment, activate it and install `requirements.txt` first. Django uses SQLite locally. It proxies dealership and review requests to `http://localhost:3030` and sentiment requests to `http://localhost:5050` by default. Set `backend_url` and `sentiment_analyzer_url` to change these service URLs.

3. In another terminal, install and start React:

   ```powershell
   cd server/frontend
   npm ci
   npm start
   ```

   Open `http://localhost:3000`. The React development server proxies Django requests to port 8000. The Django-served pages are available directly at `http://localhost:8000/`, `/about`, and `/contact`.

## Configuration

Set `DJANGO_SECRET_KEY` to a private random value and `DJANGO_DEBUG=false` for non-local use. Set `DJANGO_ALLOWED_HOSTS` to the deployment hostnames. Never commit production credentials. `DJANGO_ALLOWED_HOSTS` defaults to local development hosts.

The car inventory is loaded idempotently into Django the first time `/djangoapp/get_cars` is requested. User accounts use Django's authentication database. Submitting a review requires an authenticated session.

## Checks

From `server`, run `python manage.py check`, `python manage.py makemigrations --check --dry-run`, and `python manage.py test`. The React production bundle is built with `npm run build` from `server/frontend`. The Node API syntax check is `node --check server/database/app.js`.

The CI workflow runs these Django checks, builds React, and checks the Node API syntax. Deployment is not configured in this repository.
