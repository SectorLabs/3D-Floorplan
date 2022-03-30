from rest_framework import routers
from backend.views import DataViewset
router = routers.DefaultRouter()
router.register('data', DataViewset, basename='MyModel1')