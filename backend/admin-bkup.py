from django.contrib import admin
from django.db import models
from django.db.models import fields
from .models import SketchfabData,ProjectInventory,Image,InventoryGroup
from django import forms
from django.utils.html import format_html
from nested_inline.admin import NestedStackedInline, NestedModelAdmin





class ImageAdmin(NestedStackedInline):
    def viewimg_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.image.url))
    model=Image
    fields=['image','image_name','annotation_index',"view_group"]
    list_display=('viewimg_ftn','image_name','annotation_index',"view_group")
    extra = 1
    fk_name = 'inventory_fk'
    
class InventoryGroupAdmin(NestedStackedInline):
    model=InventoryGroup
    extra=1
    fields=['group_name','instance_id']
    list_display=('group_name','instance_id')
    fk_name = 'group_fk'
    inlines=[ImageAdmin]

class ProjectInventoryAdmin(NestedStackedInline):
    model=ProjectInventory
    fields=['inventory_id','name','group']
    list_display=('inventory_id','name','group')
    extra = 1
    fk_name = 'project_fk'
    inlines=[InventoryGroupAdmin]

class SketchfabDataAdmin(NestedModelAdmin):
    def project_logo_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.project_logo.url))
    def project_image_ftn(self, obj):
        return format_html('<img src="{}" width="auto" height="200px" />'.format(obj.project_image.url))
    fields = ['project_id','project_title','project_logo','project_image',"project_inventory"]
    list_display=('project_id','project_title','project_logo_ftn','project_image_ftn',"get_inventory")

    project_logo_ftn.short_description = 'Project Logo'
    project_image_ftn.short_description = 'Project Image'
    project_logo_ftn.allow_tags = True
    project_image_ftn.allow_tags = True



    readonly_fields = ['project_logo_ftn','project_image_ftn']
    inlines=[ProjectInventoryAdmin]






admin.site.register(SketchfabData, SketchfabDataAdmin)
# admin.site.register(ProjectInventory, ProjectInventoryAdmin)
# admin.site.register(Image, ImageAdmin)