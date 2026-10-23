
import json
import logging

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel
from .restapis import (
    get_request,
    analyze_review_sentiments,
    post_review,
)

logger = logging.getLogger(__name__)


def ensure_car_inventory():
    from .populate import initiate
    initiate()


# Login
@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get("userName", "")
        password = data.get("password", "")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            return JsonResponse({
                "userName": username,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "status": "Authenticated"
            })

        return JsonResponse({
            "userName": username,
            "status": "Invalid credentials"
        }, status=401)

    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)


# Logout
def logout_request(request):
    logout(request)
    return JsonResponse({"status": "Logged out"})


# Registration
@csrf_exempt
def registration(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        data = json.loads(request.body)

        username = data.get("userName", "").strip()
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not all([username, first_name, last_name, email, password]):
            return JsonResponse(
                {"error": "All fields are required"},
                status=400
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"error": "Username already exists"},
                status=409
            )

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Email already exists"},
                status=409
            )

        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password
        )

        return JsonResponse({
            "userName": user.username,
            "status": "Registered successfully"
        }, status=201)

    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)


# Home page: display dealerships
def get_dealerships(request):
    dealerships = get_request("fetchDealers") or []

    return render(
        request,
        "Home.html",
        {"dealerships": dealerships}
    )


def get_dealers_api(request):
    dealers = get_request("fetchDealers")
    if dealers is None:
        return JsonResponse({"status": 502, "error": "Dealership service unavailable"}, status=502)
    return JsonResponse({"status": 200, "dealers": dealers})


def get_dealers_by_state_api(request, state):
    dealers = get_request("fetchDealers")
    if dealers is None:
        return JsonResponse({"status": 502, "error": "Dealership service unavailable"}, status=502)
    if state.lower() != "all":
        dealers = [dealer for dealer in dealers if dealer.get("state", "").lower() == state.lower()]
    return JsonResponse({"status": 200, "dealers": dealers})


def get_dealer_reviews_api(request, dealer_id):
    reviews = get_request(f"fetchReviews/dealer/{dealer_id}")
    if reviews is None:
        return JsonResponse({"status": 502, "error": "Review service unavailable"}, status=502)
    return JsonResponse({"status": 200, "reviews": reviews})


def get_all_reviews_api(request):
    reviews = get_request("fetchReviews")
    if reviews is None:
        return JsonResponse({"status": 502, "error": "Review service unavailable"}, status=502)
    return JsonResponse({"status": 200, "reviews": reviews})


# Return all car makes and their models as JSON
def get_cars(request):
    ensure_car_inventory()
    makes = CarMake.objects.prefetch_related("car_models").all()

    data = []

    for make in makes:
        models = []

        for car in make.car_models.all():
            models.append({
                "id": car.id,
                "name": car.name,
                "CarMake": make.name,
                "CarModel": car.name,
                "type": car.type,
                "year": car.year
            })
        data.extend(models)

    return JsonResponse({"status": 200, "CarModels": data})


# Return one car make
def get_car_make(request, make_id):
    ensure_car_inventory()
    try:
        make = CarMake.objects.get(id=make_id)

        return JsonResponse({
            "id": make.id,
            "name": make.name,
            "description": make.description
        })

    except CarMake.DoesNotExist:
        return JsonResponse({"error": "Car make not found"}, status=404)


# Return models belonging to one car make
def get_car_models(request, make_id):
    ensure_car_inventory()
    models = CarModel.objects.filter(car_make_id=make_id)

    data = [
        {
            "id": car.id,
            "name": car.name,
            "type": car.type,
            "year": car.year
        }
        for car in models
    ]

    return JsonResponse(data, safe=False)


# Return one car model
def get_car_model(request, model_id):
    ensure_car_inventory()
    try:
        car = CarModel.objects.select_related("car_make").get(id=model_id)

        return JsonResponse({
            "id": car.id,
            "name": car.name,
            "type": car.type,
            "year": car.year,
            "car_make": car.car_make.name
        })

    except CarModel.DoesNotExist:
        return JsonResponse({"error": "Car model not found"}, status=404)


# Dealership details and reviews
def get_dealer_details(request, dealer_id):
    dealer = get_request(f"fetchDealer/{dealer_id}")

    if not dealer:
        return JsonResponse(
            {"error": "Dealership not found"},
            status=404
        )

    return JsonResponse({"status": 200, "dealer": dealer})


def get_dealer_reviews(request, dealer_id):
    reviews = get_request(f"fetchReviews/dealer/{dealer_id}")
    if reviews is None:
        return JsonResponse({"status": 502, "error": "Review service unavailable"}, status=502)
    return JsonResponse({"status": 200, "reviews": reviews})


# Add a dealership review
@csrf_exempt
def add_review(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            if request.content_type == "application/json":
                return JsonResponse({"error": "Login is required to submit a review"}, status=401)
            return redirect("/login")
        try:
            data = json.loads(request.body) if request.content_type == "application/json" else request.POST
            if not hasattr(data, "get"):
                return JsonResponse({"error": "Review data must be an object"}, status=400)

            review_data = {
                "name": str(data.get("name", "")).strip(),
                "dealership": int(data.get("dealership", 0)),
                "review": str(data.get("review", "")).strip(),
                "purchase": data.get("purchase", ""),
                "purchase_date": data.get("purchase_date", ""),
                "car_make": data.get("car_make", ""),
                "car_model": data.get("car_model", ""),
                "car_year": int(data.get("car_year", 0))
            }

            required_fields = ("name", "review", "purchase_date", "car_make", "car_model")
            if (any(not review_data[field] for field in required_fields)
                    or review_data["dealership"] <= 0
                    or not 2015 <= review_data["car_year"] <= 2023):
                error_message = "Complete all review fields and use a vehicle year from 2015 to 2023."
                if request.content_type == "application/json":
                    return JsonResponse({"error": error_message}, status=400)
                messages.error(request, error_message)
                return redirect("/")

            if isinstance(review_data["purchase"], str):
                review_data["purchase"] = review_data["purchase"].lower() in ("true", "1", "yes")

            sentiment = analyze_review_sentiments(review_data["review"])
            if isinstance(sentiment, dict) and sentiment.get("sentiment") in ("positive", "neutral", "negative"):
                review_data["sentiment"] = sentiment["sentiment"]

            result = post_review(review_data)

            if result:
                if request.content_type == "application/json":
                    return JsonResponse({"status": 200, "review": result}, status=201)
                messages.success(
                    request,
                    "Your review was submitted successfully."
                )
                return redirect(
                    f"/dealer/{review_data['dealership']}"
                )

            messages.error(
                request,
                "Unable to submit your review. Please try again."
            )

        except (ValueError, TypeError):
            if request.content_type == "application/json":
                return JsonResponse({"error": "Invalid review data"}, status=400)
            messages.error(request, "Please check the submitted details.")

        return redirect("/")

    dealerships = get_request("fetchDealers") or []

    return render(
        request,
        "AddReview.html",
        {"dealerships": dealerships}
    )


# About Us
def about(request):
    return render(request, "About.html")


# Contact Us
def contact(request):
    return render(request, "Contact.html")


# Analyze review sentiment
def analyze_review(request):
    text = request.GET.get("text", "Fantastic services")
    result = analyze_review_sentiments(text)

    if result is None:
        return JsonResponse(
            {"error": "Sentiment analyzer unavailable"},
            status=502
        )

    return JsonResponse(
        result,
        safe=not isinstance(result, list)
    )
