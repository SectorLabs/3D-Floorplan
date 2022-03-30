from pyexpat import model
from unicodedata import name
from django.contrib import admin
from django.db import models
from django.db.models import fields
from .models import SketchfabData, ProjectInventory, Image, InventoryGroup
from django import forms
from django.utils.html import format_html
from nested_inline.admin import NestedStackedInline, NestedModelAdmin
from django.contrib import messages
from django.forms import BaseInlineFormSet

# admin.site.site_header = "3D Floorplans Control Panel"
# admin.site.site_title = "3D Floorplans Control Panel"
# admin.site.index_title = "Welcome to Sketchfab Control Panel"
# admin.py file is used to create the admin panel


# class RelationshipFormSet(BaseInlineFormSet):
#     def get_queryset(self):
#         if not hasattr(self, '_queryset'):
#             criteria = {name}  # Your criteria here
#             qs = super(RelationshipFormSet,
#                        self).get_queryset().filter(**criteria)
#             self._queryset = qs
#         return self._queryset


class Project_to_inventry(admin.TabularInline):
    model = SketchfabData.project_inventory.through
    # fields = ('move_up_down_links', )
    # readonly_fields = ('move_up_down_links',)
    # # ordering = ('order',)
    extra = 1

    # def get_queryset(self, request):
    #     qs = super().get_queryset(request)
    #     # if request.user.is_superuser:
    #     print("superuser")
    #     print(request)
    #     print(qs)
    #     print(qs.filter(id=4))

    #     return qs.filter(id=4)

    # def get_queryset(self):
    #     if not hasattr(self, '_queryset'):
    #         qs = super(Project_to_inventry,
    #                    self).get_queryset().filter(sketchfabdata_id=6)
    #         self._queryset = qs
    #         print(qs)
    #     return self._queryset
    # def get_queryset(self, request):
    #     return super().get_queryset().filter(user=request.user)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "Name":
            kwargs["queryset"] = InventoryGroup.objects.filter(
                owner=request.user)
        return super(Project_to_inventry, self).formfield_for_manytomany(db_field, request, **kwargs)

# getting the 1st 3d floor plan view window


class Inventry_to_group(admin.TabularInline):
    model = ProjectInventory.group_name.through
    extra = 1
    # auto-update user field in save_formset method of parent modeladmin.
    # exclude = ("project_inventory", )

    # def get_queryset(self, request):
    #     """Alter the queryset to return no existing entries"""
    #     # get the existing query set, then empty it.
    #     qs = super(Inventry_to_group, self).get_queryset(request)
    #     print("-------90-----------")
    #     print(qs.none())
    #     print("---------87---------")
    #     return qs.none()


class Image_to_inventry_group(admin.TabularInline):
    model = InventoryGroup.project_views.through
    extra = 1


# project view admin panel
class ImageAdmin(admin.ModelAdmin):
    def viewimg_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.image.url))
    model = Image
    fields = ['image', 'image_name', 'annotation_index', "view_group"]
    list_display = ('viewimg_ftn', 'image_name',
                    'annotation_index', "view_group")

    extra = 1
    viewimg_ftn.short_description = 'Project View'
    # fk_name = 'inventory_fk'

    # def active(self, obj):
    #     return obj.is_active == 1

    # active.boolean = True

    # def make_active(modeladmin, request, queryset):
    #     queryset.update(is_active=1)
    #     messages.success(
    #         request, "Selected Record(s) Marked as Active Successfully !!")

    # def make_inactive(modeladmin, request, queryset):
    #     queryset.update(is_active=0)
    #     messages.success(
    #         request, "Selected Record(s) Marked as Inactive Successfully !!")

    # admin.site.add_action(make_active, "Make Active")
    # admin.site.add_action(make_inactive, "Make Inactive")

    # Specifing the fields of the group


class InventoryGroupAdmin(admin.ModelAdmin):
    model = InventoryGroup
    extra = 1
    fields = ['group_name', 'instance_id']
    # 'project_views'
    list_display = ('group_name', 'instance_id', )
    # 'get_project_views'
    # fk_name = 'group_fk'
    inlines = [Image_to_inventry_group]


# getting the project inventory data from the database and making its view in the admin panel
class ProjectInventoryAdmin(admin.ModelAdmin):
    model = ProjectInventory,
    fields = ['inventory_id', 'name', 'group']
    # 'group_name'
    list_display = ('inventory_id', 'name', 'group',
                    )
    inlines = [Inventry_to_group]
    extra = 1
    # fk_name = 'project_fk'
    # inlines=[InventoryGroupAdmin]


class SketchfabDataAdmin(admin.ModelAdmin):
    def project_logo_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.project_logo.url))

    def project_image_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.project_image.url))

    # fields = [('project_id', 'project_title'), ('project_logo',
    #           'project_image'), 'project_inventory']

    fieldsets = [
        (None, {
            'fields': ('project_id', 'project_title', 'project_logo', 'project_image')
        }),
        # ('Project Inventery', {
        #     'fields': ('project_inventory',),
        #     'classes': ['collapse']
        # }),
    ]
    inlines = [Project_to_inventry, ]
    # exclude = ('project_inventory',)

    class Meta:
        model = SketchfabData

    list_display = ('project_id', 'project_title', 'project_logo_ftn',
                    'project_image_ftn', 'get_inventory_edit',)
    list_filter = ('project_title', 'project_inventory')
    search_fields = ['project_title']
    project_logo_ftn.short_description = 'Project Logo'
    project_image_ftn.short_description = 'Project Image'
    project_logo_ftn.allow_tags = True
    project_image_ftn.allow_tags = True

    readonly_fields = ['project_logo_ftn', 'project_image_ftn']
    # inlines=[ProjectInventoryAdmin]


admin.site.register(SketchfabData, SketchfabDataAdmin)
admin.site.register(ProjectInventory, ProjectInventoryAdmin)
admin.site.register(InventoryGroup, InventoryGroupAdmin)
admin.site.register(Image, ImageAdmin)
