
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('djangoapp/', include('djangoapp.urls', namespace='djangoapp_api')),
    path('', include('djangoapp.urls')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
