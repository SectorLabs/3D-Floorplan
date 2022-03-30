from django.urls import path, include
from . import views

app_name = 'backend'
urlpatterns = [

    path('', views.get_project, name='home'),
    path('<slug:prj>/', views.index_view),
    path('login/', views.loginPage),
    path('register/', views.registerPage),
    path('add_project/', views.AddProject, name='add_project'),
    path('projects/', views.Project, ),

]
