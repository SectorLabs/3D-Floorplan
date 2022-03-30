from cProfile import label
from django import forms

from .models import Image, InventoryGroup, ProjectInventory, SketchfabData


class ProjectForm(forms.ModelForm):
    class Meta:
        model = SketchfabData
        fields = "__all__"

    # project_id = forms.CharField(label='Project ID:', max_length=20)
    # project_title = forms.CharField(
    #     label='Project Title:', max_length=70)
    # project_logo = forms.ImageField()
    # project_image = forms.ImageField()
    # project_inventory = forms.ModelMultipleChoiceField(
    #     queryset=ProjectInventory.objects.all(),
    #     widget=forms.CheckboxSelectMultiple
    # )


class ImageForm(forms.ModelForm):
    class Meta:
        model = Image
        fields = "__all__"


class InnentryGroupForm(forms.ModelForm):
    class Meta:
        model = InventoryGroup
        fields = "__all__"


class ProjectInventoryForm(forms.ModelForm):
    class Meta:
        model = ProjectInventory
        fields = "__all__"
