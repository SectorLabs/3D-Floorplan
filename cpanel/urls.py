
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from backend.views import AddProject, index_view, loginPage, registerPage, AddInventryGroup, HomePage, Project
# from .routers import router


admin.site.site_header = "3D Floorplans Control Panel"
admin.site.site_title = "3D Floorplans Control Panel"
admin.site.index_title = "Welcome to Sketchfab Control Panel"

urlpatterns = [
    # path('grappelli/', include('grappelli.urls')),
    path('admin/', admin.site.urls),
    path('', include('backend.urls')),
    # path('add_project/', AddProject),
    path('projects/', Project),


] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
