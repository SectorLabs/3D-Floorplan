
from multiprocessing import context
from string import printable
from django.shortcuts import redirect, render
from .models import SketchfabData, ProjectInventory, InventoryGroup, Image
from django.core import serializers
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, response, HttpResponseNotFound
from rest_framework import viewsets
from django.core.serializers import serialize
import json
import ast
from .forms import ProjectForm, InnentryGroupForm, ProjectInventoryForm,  ImageForm


def index_view(request, prj):
    # URL Format : http://localhost:8000/zameen_business_hub-123/

    proj_id = prj.split('-')
    if len(proj_id) == 2:
        proj_id = proj_id[1]
        # response = SketchfabData.objects.all().values_list('project_title','project_logo','project_image',"project_inventory").filter(project_id=proj_id)
        response = SketchfabData.objects.get(project_id=proj_id)
        # "Handle case: if proj id from url donot exist in db ::
        #  return 404 page or something like that. "
        response = response.get_inventory()
        response = response.replace("'", "\"")
        print("                                    ")
        print(response)
        print("                                    ")
        # response = json.dumps(response)
        response = json.loads(response)

        globaldict = {}
        inventory_id = {}
        floorplans_groups = {}
        SketchFabInstanceid = {}
        temp = 0
        temp1 = 0
        for value in response[0]["project"]["inventory_details"]:
            if temp == 0:
                default_inventory = value["project_inventory"]["inventory_id"]
                temp = 1

            # print(response)

            inventory_id.update(
                {value["project_inventory"]["name"]: value["project_inventory"]["inventory_id"]})
            for value1 in value["project_inventory"]["group_details"]:
                # print(value["project_inventory"]["group_details"])
                # print(value1)
                # print("I am a : " + value1['inventory_group']['instance_id'])
                if value1['inventory_group']['instance_id'] is not None or value1['inventory_group']['instance_id'] != "None":
                    floorplans_groups[
                        value["project_inventory"]["inventory_id"]] = value1["inventory_group"]["instance_id"]
                    # floorplans_groups[value["project_inventory"]["inventory_id"]
                    #                   ] = value1['inventory_group']['instance_id']
                viewdict = {}
                for value2 in value1["inventory_group"]["project_views"]:
                    if value2["view_group"] == "None" or value2["view_group"] is None:
                        viewdict.update({value2["view_name"]: {
                                        "annotation_index": value2["annotation_index"], "image_path": value2["view_image"]}})
                    else:
                        viewdict.update({value2["view_name"]: {
                                        "annotation_index": value2["annotation_index"], "image_path": value2["view_image"], "group": value2["view_group"]}})
            globaldict[value["project_inventory"]["inventory_id"]] = viewdict
        # print("This is floorplan:", floorplans_groups)
        # print('This is our global dict:', globaldict)

        return render(request, 'backend/index.html', context={"all": response[0], "views": globaldict, "inventory_ids": inventory_id, "floorplans_groups": floorplans_groups,
                                                              "default_inventory": default_inventory})
    else:
        return HttpResponseNotFound("<h1>Page not Found!<h1>")


def registerPage(request):
    return render(request, 'frontend/register.html')


def loginPage(request):
    print("I am alogin pgae")
    return render(request, 'frontend/login.html')


def HomePage(request):
    return render(request, 'frontend/home.html')


def AddProject(request):
    print("Helloe project")
    if request.method == 'POST':
        project_id = request.POST.get('project_id')
        project_title = request.POST.get('project_title')
        project_logo = request.POST.get('project_logo')
        project_image = request.POST.get('project_image')
        # project_inventory = request.POST.get('project_inventory')
        SketchfabData.objects.create(project_id=project_id, project_title=project_title, project_logo=project_logo,
                                     project_image=project_image)

        return render(request, 'frontend/newProject.html', {"msg": "Project Added Successfully!"})

    else:
        print("I am in else")


def get_project(request):
    # if this is a POST request we need to process the form data
    Prj_form = ProjectForm(request.POST, request.FILES)
    InvGrp_form = InnentryGroupForm(request.POST, request.FILES)
    Inv_form = ProjectInventoryForm(request.POST, request.FILES)
    Img_Form = ImageForm(request.POST, request.FILES)
    # for inside the project page main
    if request.method == 'POST' and request.FILES and 'PrjSaveButton' in request.POST:
        # create a form instance and populate it with data from the request:

        # check whether it's valid:
        if Prj_form.is_valid():
            Prj_form.save()
            # return render(request, 'Project_form.html', { "msg": "Project Added Successfully!"})
        else:
            print(Prj_form.errors)
            return HttpResponse('<h1>Form is not valid</h1>')

# for inside project inventry group
    if request.method == 'POST' and 'GrpSaveButton' in request.POST:
        # check whether it's valid:

        if InvGrp_form.is_valid():
            InvGrp_form.save()
            # return render(request, 'Project_form.html', {'InvGrp_form': InvGrp_form, "msg": "Inventry Group Added Successfully!"})
        else:
            print(InvGrp_form.errors)
            return HttpResponse('<h1>Form is not valid</h1>')

    if request.method == 'POST' and 'InvSaveButton' in request.POST:
        # check whether it's valid:

        if Inv_form.is_valid():
            Inv_form.save()
            # return render(request, 'Project_form.html', {'InvGrp_form': InvGrp_form, "msg": "Inventry Group Added Successfully!"})
        else:
            print(Inv_form.errors)
            return HttpResponse('<h1>Form is not valid</h1>')

    if request.method == 'POST' and 'ImgSaveButton' in request.POST:
        # check whether it's valid:

        if Img_Form.is_valid():
            Img_Form.save()
            # return render(request, 'Project_form.html', {'InvGrp_form': InvGrp_form, "msg": "Inventry Group Added Successfully!"})
        else:
            print(Img_Form.errors)
            return HttpResponse('<h1>Form is not valid</h1>')

    # if a GET (or any other method) we'll create a blank form
    else:
        Prj_form = ProjectForm()

    return render(request, 'Project_form.html', {'InvGrp_form': InvGrp_form, 'Prj_form': Prj_form, 'Inv_form': Inv_form, "Img_Form": Img_Form, "msg": " "})


def Project(request):
    project_list = SketchfabData.objects.all().values_list(
        'project_id', 'project_title')
    project_list = {'project_list': project_list}
    print(project_list)
    return render(request, 'frontend/projects.html', project_list)


def AddInventryGroup(request):
    if request.method == 'POST':
        pass
    else:
        return render(request, 'frontend/add_group.html', {})
