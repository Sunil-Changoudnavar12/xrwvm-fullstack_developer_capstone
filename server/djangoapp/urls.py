
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

app_name = "djangoapp"

urlpatterns = [
    # Dealership home page
    path("", views.get_dealerships, name="dealerships"),

    # About and contact
    path("about", views.about, name="about"),
    path("contact", views.contact, name="contact"),

    # Authentication
    path("login", views.login_user, name="login"),
    path("logout", views.logout_request, name="logout"),
    path("register", views.registration, name="register"),

    # Cars: all makes and models
    path("cars", views.get_cars, name="get_cars"),
    path("get_cars", views.get_cars, name="get_cars_api"),

    # Individual car makes and models
    path(
        "get_car_make/<int:make_id>",
        views.get_car_make,
        name="get_car_make"
    ),
    path(
        "get_car_models/<int:make_id>",
        views.get_car_models,
        name="get_car_models"
    ),
    path(
        "get_car_model/<int:model_id>",
        views.get_car_model,
        name="get_car_model"
    ),

    # Dealership details and reviews
    path(
        "dealer/<int:dealer_id>",
        views.get_dealer_details,
        name="dealer_details"
    ),
    path(
        "dealer/<int:dealer_id>/reviews",
        views.get_dealer_reviews,
        name="dealer_reviews"
    ),
    path("add_review", views.add_review, name="add_review"),

    # Sentiment analysis
    path(
        "analyze_review",
        views.analyze_review,
        name="analyze_review"
    ),
    path("get_dealers", views.get_dealers_api, name="get_dealers"),
    path("get_dealers/<str:state>", views.get_dealers_by_state_api, name="get_dealers_by_state"),
    path("reviews", views.get_all_reviews_api, name="all_reviews_api"),
    path("reviews/dealer/<int:dealer_id>", views.get_dealer_reviews_api, name="dealer_reviews_api"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
