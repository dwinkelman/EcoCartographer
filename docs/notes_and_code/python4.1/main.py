from ecocartographer import classes, util, query, polyline

from urllib import urlopen, quote
import xml.etree.ElementTree as ET

import math
import time

LatLng = classes.LatLng
Pt = classes.Pt
Bounds = classes.Bounds
Intersection = classes.Intersection
Connection = classes.Connection
TempIntersection = classes.TempIntersection
Vehicle = classes.Vehicle
Path = classes.Path

Geocoder = query.Geocoder()
Elevator = query.Elevator()
Director = query.Director()

Polyline = polyline.PolylineCodec()

MPHtoMS = 0.44704

def GetDirectionsQueries(start, end):
    t0 = time.time()
    '''Generates a list of Google Directions API URLs from the start and end coordinates.'''
    '''Working version: 4/23/2015, 4/26/2015 (1 hour)'''
    dlat = start.lat - end.lat #vector latitude
    dlng = start.lng - end.lng #vector longitude
    center = LatLng(start.lat - dlat/2, start.lng - dlng/2) #average of start and end
    radius = math.hypot(dlat, dlng)/2 #distance between start and end /2
    angle = math.radians(90)
    try:
        angle = math.atan(dlat/dlng)
    except: #if dlng == 0, then angle is 90 or 270, depending on start.lat < or > end.lat
        if start.lat > end.lat: #going south; default is set to north, so no else is necessary
            angle = math.radians(270)
    wpts = [] #coordinates for points along edges of circular net to be made
    for i in range(0,360,45):
        wpts.append(LatLng(
            center.lat + math.sin(math.radians(i + angle))*radius,
            center.lng + math.cos(math.radians(i + angle))*radius
            ))
    route_stem1 = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + start.toStringURL() + '&destination=' + end.toStringURL() + '&waypoints='
    route_stem2 = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + end.toStringURL() + '&destination=' + start.toStringURL() + '&waypoints='
    wpts1 = [3,1,4,0,5,7,6]
    wpts2 = [7,2,6,3,5,4] #both sets of coordinates go roughly perpendicular to each other
    wpts1r, wpts2r = wpts1, wpts2
    wpts1r.reverse()
    wpts2r.reverse()
    routes = [route_stem1 + '|'.join(map(lambda a: wpts[a].toStringURL(), wpts1)) + '&avoid=highways&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE',
              route_stem2 + '|'.join(map(lambda a: wpts[a].toStringURL(), wpts1r)) + '&&avoid=highwayskey=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE',
              route_stem1 + '|'.join(map(lambda a: wpts[a].toStringURL(), wpts2r)) + '&avoid=highways&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE',
              route_stem2 + '|'.join(map(lambda a: wpts[a].toStringURL(), wpts2)) + '&avoid=highways&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE',
              route_stem1 + '&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'
    ] #reverse used to check for one-way roads
    t1 = time.time()
    print 'GetDirectionsQueries(): ' + str(t1-t0)
    return routes
    

def GetPoints(start, end):
    '''Generates route. Returns url to HTML page to load instructions. Accepts LatLng Object as arguments'''
    routes = GetDirectionsQueries(start,end)
    '''t2 = time.time()
    responses = []
    counter = 0
    for i in routes:
        if counter*0.2 + t2 < time.time(): #check if 0.2 seconds has elapsed since last query made
            responses.append(eval(urlopen(i).read())) #get data from url, parse, and add to variable
            print 'Done: '+i
        else:
            print 'Waiting...'
            time.sleep(t2 + 0.2 - time.time())
            try:
                responses.append(eval(urlopen(i).read()))
            except IOError:
                print 'Query Failed. Try again later.'
            print 'Done: '+i
        counter += 1
    t3 = time.time()
    print 'Get Directions from Google Directions API: ' + str(t3-t2)'''
    responses = map(Director.directions, routes)
    '''Finished here on 4/26/2015'''

    t4 = time.time()
    lats, lngs = [], [] #used to calculate Bounds of all points
    pts_start = [] #list of Pt objects
    lats_append, lngs_append = lats.append, lngs.append #used to reduce number of . references
    pts_start_append = pts_start.append
    for response in responses: #iterate through all the data
        for leg in response['routes'][0]['legs']:
            for step in leg['steps']:
                p = Polyline.decode(step['polyline']['points']) #retrieve data from all steps attributes' polylines
                speed = 35 * MPHtoMS #default speed value
                roadname = util.roadFormat(step['html_instructions'])
                try:
                    speed = math.ceil(float(step['distance']['value']) / step['duration']['value'] * (5*MPHtoMS)) / (5*MPHtoMS)  #gets speed, rounds up 5 mph
                except ZeroDivisionError:
                    None
                
                lats_append(p[0][0])
                lngs_append(p[0][1])
                pts_start_append((LatLng(p[0][0],p[0][1]),speed,roadname,True))
                for pt in p[1:-1]:
                    lats_append(pt[0])
                    lngs_append(pt[1])
                    pts_start_append((LatLng(pt[0],pt[1]),speed,roadname,False))
    final = Polyline.decode(responses[-1]['routes'][0]['legs'][-1]['steps'][-1]['polyline']['points'])[-1]
    lats_append(final[0])
    lngs_append(final[1])
    pts_start_append((LatLng(final[0],final[1]),0,True))
    bounds = Bounds(max(lats),min(lats),max(lngs),min(lngs)) #make bounds object to get Overpass data in this range
    pts = map(lambda a: Pt(a[1][0], a[0], a[1][1], a[1][2]), enumerate(pts_start)) #make pts array with enumerate (index needed as argument)
    for i, index in zip(pts[1:-1], range(1,len(pts)-1)):
        i.next = pts[index+1]
        i.last = pts[index-1]
    pts[0].next = pts[1]
    pts[-1].last = pts[-2]
    t5 = time.time()
    print 'Generate pts list: ' + str(t5-t4)
    
    '''Finished here 4/29/15 after 1.25 hours'''
    return pts, bounds

def References(pts):
    '''Makes a list of lists of indexes in pts of pts that have the same coordinates'''
    strings = map(lambda a: a.string, pts)
    points = {}
    for index, i  in enumerate(strings):
        if not i in points:
            points[i] = []
        points[i].append(index)
    for i in pts:
        i.references = points[i.string]
    return points.values()

def Overpass(pts, references, bounds):
    #make url
    beginning = 'http://overpass-api.de/api/interpreter?data='
    query = quote('node["highway"="traffic_signals"]'+bounds.toOverpassString()+';out;')
    data = None
    while data == None: #get Overpass API data until successful
        try: data = urlopen(beginning + query).read()
        except: print 'Overpass Failed. Trying Again.'
    data = ET.fromstring(data)

    #iterate through nodes, and make some temporary data objects for them to speed things up
    for node in data.findall('node'):
        lat, lng = float(node.attrib['lat']), float(node.attrib['lon'])
        pt = LatLng(lat, lng)
        closest, dist = None, 1000
        for ref in references:
            if 0.001 > pts[ref[0]].pt.lat - lat > -0.001 and 0.001 > pts[ref[0]].pt.lng - lng > -0.001: #in reasonable range
                if pt.distanceTo(pts[ref[0]].pt) < dist: #is closest so far
                    #if so, update information
                    closest = ref
                    dist = pt.distanceTo(pts[ref[0]].pt)
        if closest != None: #sometimes pts don't match
            for ref in closest: #assign isStoplight to true for all references for closest point
                pts[ref].isStoplight = True

    #update stopsign
    for ref in references:
        for index in ref:
            if pts[index].isStopsign:
                for index in ref:
                    pts[index].isStopsign = True
                break
    
    return pts
        
def OriginalIntersections(pts):
    '''Get original pts that can be intersections. Returns straight list of indexes.'''
    '''ptcount = [pts[0].references]
    indexes = [0]
    ptcount_append = ptcount.append
    indexes_append = indexes.append
    frequencies = map(lambda a: len(a.references), pts)

    #add possible intersections, all occurances and duplicates
    for index, i in enumerate(frequencies[2:-2]):
        if i > frequencies[index-2] and i > frequencies[index+2]:
            ptcount_append(pts[index].references)
            indexes_append(index)

    ptcount_append(pts[-1].references)
    indexes_append(len(pts)-1)

    print len(ptcount), ptcount[:10]

    #strip duplicates from the array
    ptcount = util.uniquify(ptcount)

    #get indexes in pts of possible intersections
    indexes = reduce(list.__add__, (zip([index]*len(mi),mi) for index, mi in enumerate(ptcount))) #TypeError: reduce() of empty sequence with no initial value

    #filter duplicates
    new_ptcount = []
    new_ptcount_append = new_ptcount.append
    for i in enumerate(ptcount):
        if ptcount.indexof(i[1]) == i[0]:
            new_ptcount_append(i[1])

    return ptcount, indexes'''

    '''#data structure: pt_index, string_of_coords, references, intersection_id

    ptcount = [(0, pts[0].pt.toStringURL(), pts[0].references, 0)]
    ptcount_append = ptcount.append
    frequencies = map(lambda a: len(a.references), pts)
    counter = 1

    for index, i in enumerate(frequencies[2:-2]):
        if frequencies[index] > frequencies[index-2] or frequencies[index] > frequencies[index+2]: #stands out in frequency, probable intersection
            ptcount_append((index, pts[index].pt.toStringURL(), pts[index].references, counter))
            counter += 1

    ptcount_append((len(pts)-1, pts[-1].pt.toStringURL(), pts[-1].references, counter))

    return ptcount'''

    freqs = map(lambda a: len(a.references), pts)

    indexes = [0] + filter(lambda a: freqs[a]>freqs[a-1] or freqs[a]>freqs[a+1], range(1,len(freqs)-1))
    if len(pts[-1].references) > 1: indexes += [len(pts)-1]
    else: indexes += [len(pts)-2]
    all_indexes = map(lambda a: pts[a].references, indexes)
    return sorted(util.uniquify(util.flatten(all_indexes)))

def IntersectionsJoin(indexes):
    '''Requires sorted input. Joins the indexes given by OriginalIntersections or IntersectionsTrim into a dictionary using the intersection latlng strings as keys.'''
    '''inter = {}
    for pt, string, ref, index in ind[:-1]:
        if not string in inter:
            inter[string] = {}
        if not ind[index+1][1] in inter[string]:
            inter[string][ind[index+1][1]] = ind[index+1]
            
    return inter'''

    inter = {}
    zipped = zip(indexes, map(lambda a: pts[a].pt.toStringURL(), indexes), range(len(indexes)))
    for index, string, i in zipped[:-1]:
        if not string in inter:
            inter[string] = TempIntersection({}, index == 0)
        if not zipped[i+1][1] in inter[string]:
            inter[string][zipped[i+1][1]] = []
        inter[string][zipped[i+1][1]] += [(index, zipped[i+1][0])]

    #add end to inter
    inter[zipped[-1][1]].isEnd = True
            
    return inter

def IntersectionsTrim(inter):
    '''Removes intersections that do not have more than 1 connection (since they are redundant).
    Possibly will do more later, like searching for loops.
    Returns straight list of indexes.'''
    new = filter(lambda a: any((len(a[1])>2, a[1].isStart, a[1].isEnd)), inter.items()) #has more than two intersections
    series = []
    series_append = series.append
    for key, value in new:
        for intersection in value.values():
            '''tup = intersection[1:4]
            for pt in intersection[2]:
                series_append(tuple([pt])+)'''
            series += map(lambda a: a[0], intersection)

    return sorted(util.uniquify(series))

def IntersectionsBuild(inter, pts):
    '''Makes Intersections objects (with Connections) in a dictionary.'''
    intersections = {}
    ptslast = len(pts)-1
    if len(pts[-1].references) == 1: ptslast = len(pts)-2
    #makes dictionary of intersections (using string of LatLng as key) first
    for key, value in inter.items():
        pt = pts[value.values()[0][0][0]]
        intersections[key] = Intersection(
            map(lambda a: pts[a], pt.references),
            pt.pt,
            0 in pt.references,
            ptslast in pt.references
            )
    #uses intersections to append connections to other intersections
    for index, ints in inter.items():
        for cindex, con in ints.items():
            if index != cindex:
                con = sorted(con, key=lambda a: a[1]-a[0]) #take route with least number of points (if there are different versions)
                intersections[index][cindex] = Connection(pts[con[0][0]:con[0][1]+1], intersections[index], intersections[cindex])
    return intersections

def Intersections(pts):
    '''Returns a dictionary of Intersections with Connections, with strings as keys.'''
    intind = OriginalIntersections(pts)
    net = IntersectionsJoin(intind)
    trimmed = IntersectionsTrim(net)
    rejoined = IntersectionsJoin(trimmed)
    intersections = IntersectionsBuild(rejoined, pts)
    intsInRange = util.uniquify(util.flatten(map(lambda a: a[0], OptimalDistance(intersections)))) #makes list of intersections within reasonable distance to start/end
    ultimate_trim = sorted(util.flatten(map(lambda a: intersections[a].references[0].references, intsInRange)))
    return IntersectionsBuild(IntersectionsJoin(ultimate_trim), pts)

def OptimalDistance(intersections, factor=2):
    '''Intersections as taken from Intersections() and start/end as keys are taken to get candidate routes based on distance.
    Factor is multiplier of linear distance from start to end.'''

    def Branch(previous, current, distance):
        '''Recursive function to build up routes. Previous is list of indexes, current is an Intersection.'''
        for key, connection in current.items(): #iterate through connections
            if connection.end.key not in previous: #not already arrived at
                new_distance = distance + connection.distance
                if connection.end.isEnd: #arrives at the end
                    solutions_append((previous + [current.key, connection.end.key], new_distance))
                elif distance + connection.end.pt.distanceTo(current.pt) < max_dist: #is still under distance limit
                    Branch(previous + [current.key], connection.end, new_distance)
                #if no possible options, exits this recurrance of the function

    t0 = time.time()
    start = filter(lambda a: a.isStart, intersections.values())[0]
    end = filter(lambda a: a.isEnd, intersections.values())[0]
    max_dist = start.pt.distanceTo(end.pt) * factor
    solutions = []
    solutions_append = solutions.append
    #format = ([keys], distance (meters))
    Branch([], start, 0)
    t1 = time.time()
    print t1 - t0
    return solutions

def ValidReferences(intersections):
    refs = []
    for inter in intersections.values():
        for con in inter.values():
            refs += map(lambda a: a.references, con)
    return util.uniquifyTuples(refs)

def ComputeEnergy(intersections, vehicle):
    for inter in intersections.values():
        for con in inter.values():
            con.energy = con.Energy(vehicle)
    return None

def OptimalEnergyInitial(intersections, routes):
    '''Get optimal route using pre-generated routes.'''

    #get list of most promising routes
    output = []
    for route, distance in routes:
        total = 0
        for index, inter in enumerate(route[:-1]):
            total += intersections[inter][route[index+1]].energy
        output.append((route, total))

    output = sorted(output, key=lambda a: a[1])
    return output[:min(len(output), 10)]

def OptimalEnergyDetailed(intersections, routes, vehicle):
    '''Calculates more in-depth forces for each route'''

    #generate single path for each route
    new_routes = []
    for route, energy in routes:
        #compile path
        path = []
        for index, inter in enumerate(route[:-1]):
            path += intersections[inter][route[index+1]].path[:-1] #leave out last in each path, since duplicate of next path
        path += [intersections[route[-2]][route[-1]].path[-1]]
        new_routes.append(Path(path, vehicle))
        
    return new_routes
            
def Ecocartographer(start, end):
    '''Main function. Call this to get the end data.'''
    pts, bounds = GetPoints(start, end) #all LatLngs in order
    references = References(pts) #list of lists of pts indexes that share the same coordinates
    intersections = Intersections(pts) #list of references that can be intersections, flat list of intersections_indexes
    
    return pts, references, intersections

start = Geocoder.geocode(input('Start Location:'))
end = Geocoder.geocode(input('End Location:'))
vehicle = None
pts, bounds, references, intersections, intint, net, trimmed, rejoined, intsInRange, ultimate_trim, final_inter, final_refs = None, None, None, None, None, None, None, None, None, None, None, None
raw, recalc = None

#used for diagnostic/easy-run purposes
if __name__ == '__main__':
    vehicle = Vehicle(1500, 0.35, 4)
    pts, bounds = GetPoints(start, end)
    references = References(pts)
    pts = Overpass(pts, references, bounds)
    intind = OriginalIntersections(pts)
    net = IntersectionsJoin(intind)
    trimmed = IntersectionsTrim(net)
    rejoined = IntersectionsJoin(trimmed)
    intersections = IntersectionsBuild(net, pts)
    routes = OptimalDistance(intersections)
    intsInRange = util.uniquify(util.flatten(map(lambda a: a[0], routes))) #makes list of intersections within reasonable distance to start/end
    ultimate_trim = sorted(util.flatten(map(lambda a: intersections[a].references[0].references, intsInRange)))
    final_inter = IntersectionsBuild(IntersectionsJoin(ultimate_trim), pts)
    final_refs = ValidReferences(final_inter)
    pts, raw = Elevator.elevation(pts, final_refs)
    ComputeEnergy(final_inter, vehicle)
    routes_force = OptimalEnergyInitial(final_inter, routes)
    recalc = OptimalEnergyDetailed(final_inter, routes_force, vehicle)
    for route in recalc:
        route.getInstructions(vehicle)
