from django import template

register = template.Library()
def sethref(value, arg):
    """Removes all values of arg from the given string"""

    return '#'+value.lower().replace(arg, '-')

def setid(value,arg):
     return value.lower().replace(arg, '-')

def strip(value):
     return value.strip()


register.filter('sethref', sethref)
register.filter('setid', setid)
register.filter('strip', strip)