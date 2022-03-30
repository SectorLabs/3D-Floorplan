import json
from sys import maxsize
from django.db import models
from django.forms import inlineformset_factory
from django.utils.safestring import mark_safe
# Model file is used to create the database tables
# individual image path name and image annotation of each image


class Image(models.Model):
    image = models.ImageField(upload_to='media', blank=False, null=False)
    image_name = models.CharField(max_length=70, blank=True, null=True)
    annotation_index = models.IntegerField(blank=True, null=True)
    view_group = models.CharField(max_length=500, blank=True, null=True)

    def asset_image(self):
        if self.image:
            return mark_safe('<img src="%s" style="width: 100px; height:100px;" />' % self.image.url)
        else:
            return 'No Image Found'

    def __str__(self):
        return '{}'.format(self.image_name)

    class Meta:
        verbose_name = "Project View"
        verbose_name_plural = "Project Views"

# project inventory of the project like : studio , one bed apartment, two bed apartment, three bed apartment, four bed apartment, etc.


class InventoryGroup(models.Model):
    # Image_fk = models.ForeignKey(
    #     'Image', on_delete=models.CASCADE, blank=True, null=True)
    group_name = models.CharField(
        max_length=500, blank=True, null=True, default="Full View")
    instance_id = models.CharField(
        max_length=500, blank=True, null=True, verbose_name="Sketchfab Group ID")
    project_views = models.ManyToManyField(
        'Image', verbose_name="Project Views")
    # Imagee = models.ForeignKey(
    #     Image, on_delete=models.CASCADE, related_name='project_img')

    class Meta:
        verbose_name = "Group"
        verbose_name_plural = "Groups"

    def __str__(self):
        return '{}'.format(self.group_name)

    def get_project_views(self):
        a = {"inventory_group": {"group_name": self.group_name,
                                 "instance_id": self.instance_id, "project_views": []}}
        for p in self.project_views.all():
            a["inventory_group"]["project_views"].append(
                {"view_image": p.image.url, "view_name": p.image_name, "annotation_index": p.annotation_index, "view_group": p.view_group})
        return a

# inventery groups class for the floor plan view (Upper and Lower view)


class ProjectInventory(models.Model):
    # group_fk = models.ForeignKey(
    #     'InventoryGroup', on_delete=models.CASCADE, blank=True, null=True)
    inventory_id = models.CharField(max_length=500, blank=False, null=False)
    name = models.CharField(max_length=500, blank=False, null=False)
    group = models.BooleanField(default=False, blank=True, null=True)
    group_name = models.ManyToManyField(
        'InventoryGroup', verbose_name="inventory-Group",)

    # inventoryGroup = models.ForeignKey(
    #     InventoryGroup, on_delete=models.CASCADE, related_name='project_inventory_grp')

    class Meta:
        verbose_name = "Project Inventory"
        verbose_name_plural = "Project Inventories"

    def __str__(self):
        return '{}'.format(self.name)

    def get_groups(self):
        a = {"project_inventory": {"inventory_id": self.inventory_id,
                                   "name": self.name, "group": self.group, "group_details": []}}
        for p in self.group_name.all():
            a["project_inventory"]["group_details"].append(
                p.get_project_views())
        return a

# class for main project details and its logo image and project inventory


class SketchfabData(models.Model):
    # project_fk = models.ForeignKey(
    #     'ProjectInventory', on_delete=models.CASCADE, related_name='inventory_fk', blank=True, null=True)
    project_id = models.CharField(max_length=500, blank=False, null=False)
    project_title = models.CharField(
        max_length=500, blank=False, null=False, verbose_name="Project Name")
    project_logo = models.ImageField(
        upload_to='media', blank=False, null=False, verbose_name="Project Logo")
    project_image = models.ImageField(
        upload_to='media', blank=False, null=False, verbose_name="Project Image")
    project_inventory = models.ManyToManyField(
        'ProjectInventory', verbose_name="inventory",)

    # inventory = models.ForeignKey(
    #     ProjectInventory, on_delete=models.CASCADE, related_name='project_inv')

    class Meta:
        verbose_name = "3D Floorplan"
        verbose_name_plural = "3D Floorplans"

    def project_image_ftn(self):
        if self.project_image:
            return mark_safe('<img src="%s" style="width: 100px; height:100px;" />' % self.project_image.url)
        else:
            return 'No Image Found'

    def project_logo_ftn(self):
        if self.project_logo:
            return mark_safe('<img src="%s" style="width: 100px; height:100px;" />' % self.project_logo.url)
        else:
            return 'No Image Found'

    def get_inventory(self):
        a = [{"project": {"project_id": self.project_id, "project_title": self.project_title,
                          "project_logo": self.project_logo.url, "project_image": self.project_image.url,
                          "inventory_details": []}}]

        for p in self.project_inventory.all().order_by('id'):
            # print("---------------------------")
            # print(p)
            # print("---------------------------")
            a[0]["project"]["inventory_details"].append(p.get_groups())
        return json.dumps(a)

    def get_inventory_edit(self):
        return ",".join([str(p) for p in self.project_inventory.all()])

    def __str__(self):
        return '{}'.format(self.project_title)
