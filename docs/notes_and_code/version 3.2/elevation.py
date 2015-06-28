from bottle import Bottle, route, run, static_file, get, request, response, hook
from urllib import urlopen, unquote

@hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'

@route('/get-elevation/<query>')
def func(query):
    query = 'https://maps.googleapis.com/maps/api/elevation/json?locations=enc:'+query
    print query
    data = urlopen(query)
    return data.read()


run(host='localhost', port=8080, debug=True)
