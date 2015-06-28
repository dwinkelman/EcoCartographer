import json

JPERLITERGASOLINE = 34800000
JPERGALLONGASOLINE = 131700000
METERSPERMILE = 1609.34

class Console(object):
    new_text = '''
    <div class="output %s">
      <table>
        <tr>
          <td class="icon-td">
            <div class="icon">
              <img src="images/%s.png">
            </div>
          </td>
          <td class="status-td">
            <div class="status %s">
              %s.
            </div>
          </td>
          <td class="type-td">
            <div class="type">
              %s
            </div>
          </td>
          <td class="outof-td">
            <div class="outof">
              %i of %i
            </div>
          </td>
        </tr>
      </table>
    </div>
    '''
    
    def __init__(self, path):
        self.path = path

    def add(self, event, num=1, outof=1, success=True, error=''):
        event_class, img_src, status_class, status_text, type_text = None, None, None, None, None
        event_class = event.lower()
        type_text = event.capitalize()
        if success:
            img_src = 'check'
            status_class = 'success'
            status_text = 'Success' + error
        else:
            img_src = 'failed'
            status_class = 'error'
            status_text = 'Error: ' + error
        f = file(self.path,'a')
        f.write(self.new_text % (event_class, img_src, status_class, status_text, type_text, num, outof))
        f.close()

def JSON(path, routes, recom):
    '''Save JSON data derived from routes to file "path"'''
    #prepare object
    out = {
        'routes':[],
        'status':'OK',
        'recommended':{},
        'savings':[]
    }
    for route in routes:
        steps = []
        for ins in route.instructions:
            steps.append({
                'feature':ins.feature,
                'command':ins.command,
                'polyline':ins.polyline,
                'instruction':ins.string,
                'energy_used':ins.energy_used_string,
                'energy':int(ins.energy),
                'distance':int(ins.distance),
                'start':{
                    'lat':ins.start.pt.lat,
                    'lng':ins.start.pt.lng
                },
                'end':{
                    'lat':ins.end.pt.lat,
                    'lng':ins.end.pt.lng
                }
            })
        robj = {
            'steps':steps,
            'distance':{
                'meters':int(route.distance),
                'miles':round(route.distance/METERSPERMILE,1)
            },
            'energy':{
                'joules':int(route.energy),
                'gasoline':{
                    'liters':round(route.energy/JPERLITERGASOLINE*4,2),
                    'gallons':round(route.energy/JPERGALLONGASOLINE*4,2)
                }
            },
            'time':{
                'seconds':int(route.time),
                'minutes':round(route.time/60)
            },
            'polyline':route.polyline
        }
        out['routes'].append(robj)
    out['recom'] = {
        'distance':{
            'meters':int(recom.distance),
            'miles':round(recom.distance/METERSPERMILE,1)
        },
        'energy':{
            'joules':int(recom.energy),
            'gasoline':{
                'liters':round(recom.energy/JPERLITERGASOLINE*4,2),
                'gallons':round(recom.energy/JPERGALLONGASOLINE*4,2)
            }
        },
        'time':{
            'seconds':int(recom.time),
            'minutes':round(recom.time/60)
        },
        'polyline':recom.polyline
    }
    recomJ = int(recom.energy)
    out['savings'] = [{
        'route':index,
        'joules':recomJ-int(route.energy),
        'gasoline':{
            'liters':round((recomJ-route.energy)/JPERLITERGASOLINE*4,2),
            'gallons':round((recomJ-route.energy)/JPERGALLONGASOLINE*4,2)
        }} for index, route in enumerate(routes)]
                
    with open(path, 'w') as outfile:
        json.dump(out, outfile)
        
def HTML(path, routes, recom):
    '''Save HTML formatted output to "path"'''
    big = '''
      <div id="%i" class="item">
        <div id="head">
          <div id="title">
            <input type="checkbox" name="route-disp" value="%i" checked>
            Route %i
          </div>
          <div id="specs">
            <div>
              <span class="key">Gasoline: </span>
              <span class="value">%s gallons</span>
            </div>
            <div>
              <span class="key">Distance: </span>
              <span class="value">%s miles</span>
            </div>
            <div>
              <span class="key">Time: </span>
              <span class="value">%i minutes</span>
            </div>
            <div>
              <span class="key">Gas Savings: </span>
              <span class="value">%s %s</span>
            </div>
          </div>
        </div>
        <ol id="steps">
          <div id="title">Steps:</div>
          %s
        </ol>
      </div>'''
    recom_big = '''
      <div id="-1" class="item">
        <div id="head">
          <div id="title">
            <input type="checkbox" name="route-disp" value="-1" checked>
            Google Maps Route
          </div>
          <div id="specs">
            <div>
              <span class="key">Gasoline: </span>
              <span class="value">%s gallons</span>
            </div>
            <div>
              <span class="key">Distance: </span>
              <span class="value">%s miles</span>
            </div>
            <div>
              <span class="key">Time: </span>
              <span class="value">%i minutes</span>
            </div>
          </div>
        </div>
      </div>'''
    small = '''
          <li>
            <div class="icons">
              %s
            </div>
            <div class="ins">
              %s
            </div>
          </li>'''
    image = '<img src="%s">'
    output = ''
    for index, route in enumerate(routes):
        steps = ''
        for step in route.instructions:
            icons = ''
            if step.feature == 'start':
                icons = image % ('images/start.png')
            else:
                icons += image % ('images/'+step.command+'.png')
                if step.feature == 'stoplight':
                    icons += image % ('images/stoplight.png')
                elif step.feature == 'stopsign':
                    icons += image % ('images/stopsign.png')
            steps += small % (icons, step.string)
        number = index + 1
        gasoline = str(round(route.energy/JPERGALLONGASOLINE*4,2))
        distance = str(round(route.distance/METERSPERMILE,1))
        time = int(route.time/60)+1
        savings = str(round((recom.energy-route.energy)/JPERGALLONGASOLINE*4,2))
        savings_unit = 'gallons'
        if float(savings) < 0:
            savings = 'No'
            savings_unit = 'Savings'
        output += big % (index, index, number, gasoline, distance, time, savings, savings_unit, steps)
    output += recom_big % (
        str(round(recom.energy/JPERGALLONGASOLINE*4,2)),
        str(round(recom.distance/METERSPERMILE,1)),
        int(recom.time/60)+1
    )
    f = file(path, 'w')
    f.write(output)
    f.close()

def WriteFail(path):
    out = {'status':'FAILED', 'routes':[]}
    with open(path, 'w') as outfile:
        json.dump(out, outfile)
