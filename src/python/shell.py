from bottle import get, post, request, run, route, static_file # or route
from main import EcoCartographer

@route('/css/<filename>')
def css(filename):
    return static_file(filename, root='../css')

@route('/javascript/<filename>')
def javascript(filename):
    return static_file(filename, root='../javascript')

@route('/images/<filename>')
def image(filename):
    return static_file(filename, root='../images')

@route('/routes/<identity>/<filename>')
def routes(identity, filename):
    return file('../routes/'+identity+'/'+filename,'r').read()

@route('/fonts/<filename>')
def font(filename):
    return static_file(filename, root='../fonts')

@route('/<filename>')
def other(filename):
    return static_file(filename, root='../')

@get('/main.php') # or @route('/login')
def login():
    return file('../main.html','r').read()

@post('/main.php') # or @route('/login', method='POST')
def do_login():
    args = {
        'start': request.forms.get('start').replace('+',' '),
        'end': request.forms.get('end').replace('+',' '),
        'mass': int(request.forms.get('mass')),
        'cd': float(request.forms.get('drag')),
        'area': float(request.forms.get('area')),
        'disp': float(request.forms.get('disp'))/1000000,
        'routes': int(request.forms.get('routes')),
        'id': '../routes/' + request.forms.get('id')
    }
    EcoCartographer(args)
    return args

run(host="localhost", port=8080)
