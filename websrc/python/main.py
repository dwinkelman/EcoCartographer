import classes, util, query, polyline, ecio, network

from urllib import urlopen, quote

import math
import time
import sys

LatLng = classes.LatLng
Pt = classes.Pt
Bounds = classes.Bounds
Intersection = network.Intersection
Connection = network.Connection
TempIntersection = classes.TempIntersection
Vehicle = classes.Vehicle
Path = classes.Path
Longpath = network.Longpath
Micropath = network.Micropath

Geocoder = query.Geocoder()
Elevator = query.Elevator()
Director = query.Director()
Overpasser = query.Overpasser()

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
    return routes
    

def GetPoints(start, end, console):
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
    responses = []
    for index, route in enumerate(routes):
        results, success = Director.directions(route, console, index+1, len(routes), 0)
        if not success:
            return None, None, None, False
        else:
            responses.append(results)
    '''Finished here on 4/26/2015'''

    t0 = time.time()
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
    '''pts = map(lambda a: Pt(a[1][0], a[0], a[1][1], a[1][2]), enumerate(pts_start)) #make pts array with enumerate (index needed as argument)'''
    pts = [Pt(pt[0], index, pt[1], pt[2]) for index, pt in enumerate(pts_start)] #list comprehension of above (faster, more Pythonic)
    for i, index in zip(pts[1:-1], range(1,len(pts)-1)):
        i.next = pts[index+1]
        i.last = pts[index-1]
    pts[0].next = pts[1]
    pts[-1].last = pts[-2]

    '''steps = [step for leg in [leg for response in responses for leg in response['routes'][0]['legs']] for step in leg['steps']]
    polylines = [Polyline.decode(step['polyline']['points']) for step in steps]
    lats, lngs = [coords[0] for polyline in polylines for coords in polyline], [coords[1] for polyline in polylines for coords in polyline]'''

    recom = pts[-sum([len(Polyline.decode(step['polyline']['points'])) for leg in [leg for legs in responses[-1]['routes'][0]['legs']] for step in leg['steps']]):]
    
    t1 = time.time()

    console.add('Set Directions Data', error=': '+str(round(t1-t0, 3)))
    
    '''Finished here 4/29/15 after 1.25 hours'''
    return pts, bounds, recom, True

def References(pts, console):
    '''Makes a list of lists of indexes in pts of pts that have the same coordinates'''
    t0 = time.time()
    strings = [a.string for a in pts]
    points = {}
    for index, i  in enumerate(strings):
        if not i in points:
            points[i] = []
        points[i].append(index)
    for i in pts:
        i.references = points[i.string]
    console.add('References', error=': '+str(round(time.time()-t0, 3)))
    return points.values()
        
def OriginalIntersections(pts, console):
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

    t0 = time.time()

    freqs = [len(a.references) for a in pts]

    indexes = [0] + filter(lambda a: freqs[a]>freqs[a-1] or freqs[a]>freqs[a+1], range(1,len(freqs)-1))
    if len(pts[-1].references) > 1: indexes += [len(pts)-1]
    else: indexes += [len(pts)-2]
    '''all_indexes = map(lambda a: pts[a].references, indexes)'''
    all_indexes = [pts[a].references for a in indexes] #list comp version

    console.add('Original Intersections', error=': '+str(round(time.time()-t0, 3)))
    
    return sorted(util.uniquify(util.flatten(all_indexes)))

def IntersectionsJoin(pts, indexes, console):
    '''Requires sorted input. Joins the indexes given by OriginalIntersections or IntersectionsTrim into a dictionary using the intersection latlng strings as keys.'''
    '''inter = {}
    for pt, string, ref, index in ind[:-1]:
        if not string in inter:
            inter[string] = {}
        if not ind[index+1][1] in inter[string]:
            inter[string][ind[index+1][1]] = ind[index+1]
            
    return inter'''

    t0 = time.time()

    inter = {}
    zipped = zip(indexes, [pts[a].pt.toStringURL() for a in indexes], range(len(indexes)))
    for index, string, i in zipped[:-1]:
        if not string in inter:
            inter[string] = TempIntersection({}, index == 0)
        if not zipped[i+1][1] in inter[string]:
            inter[string][zipped[i+1][1]] = []
        inter[string][zipped[i+1][1]] += [(index, zipped[i+1][0])]

    #add end to inter
    inter[zipped[-1][1]].isEnd = True

    console.add('Intersections Join', error=': '+str(round(time.time()-t0, 3)))
            
    return inter

def IntersectionsTrim(inter, console):
    '''Removes intersections that do not have more than 1 connection (since they are redundant).
    Possibly will do more later, like searching for loops.
    Returns straight list of indexes.'''

    t0 = time.time()
    
    new = filter(lambda a: any((len(a[1])>2, a[1].isStart, a[1].isEnd)), inter.items()) #has more than two intersections
    series = []
    series_append = series.append
    for key, value in new:
        for intersection in value.values():
            '''tup = intersection[1:4]
            for pt in intersection[2]:
                series_append(tuple([pt])+)'''
            '''series += map(lambda a: a[0], intersection)'''
            series += [a[0] for a in intersection]

    console.add('Intersections Trim', error=': '+str(round(time.time()-t0, 3)))

    return sorted(util.uniquify(series))

def IntersectionsBuild(inter, pts, console):
    '''Makes Intersections objects (with Connections) in a dictionary.'''

    t0 = time.time()
    
    intersections = {}
    ptslast = len(pts)-1
    if len(pts[-1].references) == 1: ptslast = len(pts)-2
    #makes dictionary of intersections (using string of LatLng as key) first
    for key, value in inter.items():
        pt = pts[value.values()[0][0][0]]
        intersections[key] = Intersection(
            #map(lambda a: pts[a], pt.references),
            [pts[a] for a in pt.references],
            0 in pt.references,
            ptslast in pt.references
            )
    #uses intersections to append connections to other intersections
    for index, ints in inter.items():
        for cindex, con in ints.items():
            if index != cindex:
                con = sorted(con, key=lambda a: a[1]-a[0]) #take route with least number of points (if there are different versions)
                intersections[index][cindex] = Connection(pts[con[0][0]:con[0][1]+1], intersections[index], intersections[cindex])

    console.add('Build Intersections', error=': '+str(round(time.time()-t0, 3)))
                
    return intersections

"""def Intersections(pts, console):
    '''Returns a dictionary of Intersections with Connections, with strings as keys.'''
    intind = OriginalIntersections(pts)
    net = IntersectionsJoin(intind)
    trimmed = IntersectionsTrim(net)
    rejoined = IntersectionsJoin(trimmed)
    intersections = IntersectionsBuild(rejoined, pts)
    t0 = time.time()
    intsInRange = list(set(util.flatten(map(lambda a: a[0], OptimalDistance(intersections))))) #makes list of intersections within reasonable distance to start/end
    ultimate_trim = sorted(util.flatten(map(lambda a: intersections[a].references[0].references, intsInRange)))
    console.add('Intersections', error=': '+str(time.time()-t0))
    return IntersectionsBuild(IntersectionsJoin(ultimate_trim), pts)"""

def OptimalDistance(intersections, console, factor=2):
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
    console.add('Recursive', error=': '+str(round(t1-t0, 3)))
    return solutions

'''def ValidReferences(intersections, console):
    t0 = time.time()
    refs = []
    for inter in intersections.values():
        for con in inter.values():
            refs += map(lambda a: a.references, con)
    console.add('Valid References', error=': '+str(time.time()-t0))
    return util.uniquifyTuples(refs)'''

def ComputeEnergy(intersections, connections, vehicle):
    '''Generate energy requiments for only required connections given dict of intersections'''
    network = {[key for key, inter in intersections.items() if inter.isEnd][0]:[]} #if I don't include endpoint, it will not get added since it is referenced, but not as an int1
    for int1, int2 in connections:
        if not int1 in network:
            network[int1] = []
        network[int1].append(int2)

    for int1, int2s in network.items():
        for int2 in int2s:
            if len(network[int2]):
                for int3 in network[int2]:
                    intersections[int1][int2].extend(int3, vehicle)
            else:
                intersections[int1][int2].extend('random_key', vehicle)
    
    '''for index, inter in intersections.items():
        for cindex, con in inter.items():
            for key in con.end.keys():
                con.extend(key, vehicle)'''

def OptimalEnergy(intersections, routes, number, vehicle, console):
    '''Get optimal route from pre-generated routes'''
    t0 = time.time()
    calcRoutes = []
    for route, distance in routes:
        energy = 0
        t = 0 #can't use time, because of module time
        for int1, int2, int3 in zip(route[:-2], route[1:-1], route[2:]):
            energy += intersections[int1][int2][int3].energy
            t += intersections[int1][int2][int3].time
        energy += intersections[route[-2]][route[-1]].micropath.energy
        t += intersections[route[-2]][route[-1]].micropath.time
        calcRoutes.append((route, energy, t, distance))

    calcRoutes.sort(key=lambda a: a[1]) #sort by energy usage

    top = calcRoutes[:min(number*5, len(calcRoutes))] #get best routes, more than you need to filter near-duplicates
    newTop = util.filterRoutes(top, f=3) #take out very similar routes of greater energy
    newTop = newTop[:min(len(newTop), number)] #take only what you need

    output = []
    for route, energy, t, distance in newTop:
        path = [intersections[route[0]][route[1]][route[2]][0]]
        for int1, int2, int3 in zip(route[:-2], route[1:-1], route[2:]):
            path.extend(intersections[int1][int2][int3][1:-1])
        output.append(Longpath(path, vehicle, ('energy',energy), ('distance',distance), ('time',t)))

    console.add('Optimal Energy', error=': '+str(round(time.time()-t0, 3)))

    return output

pts, references, recom, final_inter, final_refs, routes, elev_queries, recalc = None, None, None, None, None, None, None, None
            
def EcoCartographer(args):
    '''Main function. Returns routes objects and saves files.'''

    start_time = time.time()

    #prepare files
    util.mkdir(args['id'])
    Console = ecio.Console(args['id']+'/console.html')

    start, success = Geocoder.geocode(args['start'], Console, 1, 2, 0)
    if not success:
        ecio.WriteFail(args['id']+'/output.json')
        return False
    end, success = Geocoder.geocode(args['end'], Console, 2, 2, 0)
    if not success:
        ecio.WriteFail(args['id']+'/output.json')
        return False
    vehicle = Vehicle(mass=args['mass'], drag_coefficient=args['cd'], area=args['area'], displacement=args['disp'])

    #generate pts and references
    '''Update shape of network generation'''
    pts, bounds, recom, success = GetPoints(start, end, Console)
    if not success:
        ecio.WriteFail(args['id']+'/output.json')
        return False
    references = References(pts, Console)

    #get Overpass API data
    '''pts = Overpasser.overpass(pts, references, bounds, Console)'''
    #moved later on after elev_refs and interpol_refs were calculated to reduce number of refs to sift through

    #generate original intersections, without filtering based on connections
    intind = OriginalIntersections(pts, Console)
    net = IntersectionsJoin(pts, intind, Console)
    intersections = IntersectionsBuild(net, pts, Console)

    #calculate likely routes through intersections
    routes = OptimalDistance(intersections, Console)

    #filter intersections by being in calculated intersections already
    intsInRange = util.uniquify(util.flatten(map(lambda a: a[0], routes))) #makes list of intersections within reasonable distance to start/end
    ultimate_trim = sorted(util.flatten(map(lambda a: intersections[a].references[0].references, intsInRange))) #points included in intersections
    final_inter = IntersectionsBuild(IntersectionsJoin(pts, ultimate_trim, Console), pts, Console)
    '''final_refs = ValidReferences(final_inter)'''

    #get elevation data of relevant pts
    '''Add in support for interpolation'''
    elev_refs, interpol_refs, cons_used = Elevator.getInterpolations(routes, final_inter, Console)
    final_refs = elev_refs + [ref for ref, ref1, ref2 in interpol_refs]
    ref_chunks = Overpasser.chunk(pts, final_refs)
    pts = Overpasser.overpass(pts, final_refs, ref_chunks, bounds, Console)
    pts, elev_queries, success = Elevator.elevation(pts, elev_refs, interpol_refs, Console)
    if not success:
        ecio.WriteFail(args['id']+'/output.json')
        return False

    #calculate energy requirements
    ComputeEnergy(final_inter, cons_used, vehicle)
    recalc = OptimalEnergy(final_inter, routes, args['routes'], vehicle, Console)
    recom = Micropath(recom, vehicle)
    recom_distance = sum([pt.pt.distanceTo(pt.next.pt) for pt in recom[:-1]])
    recom_instructions = Longpath(recom, vehicle, ('energy', recom.energy), ('distance', recom_distance), ('time', recom.time))

    #output instructions to files
    '''Output to JSON and HTML'''
    ecio.JSON(args['id']+'/output.json',recalc,recom_instructions)
    ecio.HTML(args['id']+'/output.html',recalc,recom_instructions)
    Console.add('Finished',error=': '+str(round(time.time()-start_time,3)))

    return recalc, recom #final routes

#used for diagnostic/easy-run purposes
if len(sys.argv) < 2:
    args = {
        'start':'6936 Millbridge Road, Clemmons, NC',
        'end':'Atkins High School, Winston-Salem, NC',
        'mass':1500,
        'cd':0.35,
        'area':3.0,
        'disp':0.002,
        'routes':10,
        'id':'../routes/'+input('path (remember: string!): ')
    }
    '''Main function. Returns routes objects and saves files.'''

    start_time = time.time()

    #prepare files
    util.mkdir(args['id'])
    Console = ecio.Console(args['id']+'/console.html')

    start, success = Geocoder.geocode(args['start'], Console, 1, 2, 0)
    end, success = Geocoder.geocode(args['end'], Console, 2, 2, 0)
    vehicle = Vehicle(mass=args['mass'], drag_coefficient=args['cd'], area=args['area'], displacement=args['disp'])

    #generate pts and references
    '''Update shape of network generation'''
    pts, bounds, recom, success = GetPoints(start, end, Console)
    references = References(pts, Console)

    #get Overpass API data
    '''pts = Overpasser.overpass(pts, references, bounds, Console)'''
    #moved later on after elev_refs and interpol_refs were calculated to reduce number of refs to sift through

    #generate original intersections, without filtering based on connections
    intind = OriginalIntersections(pts, Console)
    net = IntersectionsJoin(pts, intind, Console)
    intersections = IntersectionsBuild(net, pts, Console)

    #calculate likely routes through intersections
    routes = OptimalDistance(intersections, Console)

    #filter intersections by being in calculated intersections already
    intsInRange = util.uniquify(util.flatten(map(lambda a: a[0], routes))) #makes list of intersections within reasonable distance to start/end
    ultimate_trim = sorted(util.flatten(map(lambda a: intersections[a].references[0].references, intsInRange))) #points included in intersections
    final_inter = IntersectionsBuild(IntersectionsJoin(pts, ultimate_trim, Console), pts, Console)
    '''final_refs = ValidReferences(final_inter)'''

    #get elevation data of relevant pts
    '''Add in support for interpolation'''
    elev_refs, interpol_refs, used_cons = Elevator.getInterpolations(routes, final_inter, Console) #connections used in interpolation harvested to use in energy calculation
    final_refs = elev_refs + [ref for ref, ref1, ref2 in interpol_refs]
    ref_chunks = Overpasser.chunk(pts, final_refs)
    pts = Overpasser.overpass(pts, final_refs, ref_chunks, bounds, Console)
    pts, elev_queries, success = Elevator.elevation(pts, elev_refs, interpol_refs, Console)

    #calculate energy requirements
    ComputeEnergy(final_inter, used_cons, vehicle)
    recalc = OptimalEnergy(final_inter, routes, args['routes'], vehicle, Console)
    recom = Micropath(recom, vehicle)
    recom_distance = sum([pt.pt.distanceTo(pt.next.pt) for pt in recom[:-1]])
    recom_instructions = Longpath(recom, vehicle, ('energy', recom.energy), ('distance', recom_distance), ('time', recom.time))

    #output instructions to files
    '''Output to JSON and HTML'''
    ecio.JSON(args['id']+'/output.json',recalc,recom_instructions)
    ecio.HTML(args['id']+'/output.html',recalc,recom_instructions)
    Console.add('Finished',error=': '+str(time.time()-start_time))
    """routes, recom = EcoCartographer(args)"""

else: #called by command line or PHP
    args = {
        'start':sys.argv[1].replace('+',' '),
        'end':sys.argv[2].replace('+',' '),
        'mass':int(sys.argv[3]),
        'cd':float(sys.argv[4]),
        'area':float(sys.argv[5]),
        'disp':float(sys.argv[6])/1000000, #input is in cm^3, not m^3
        'routes':int(sys.argv[7]),
        'id':'routes/'+sys.argv[8]
    }
    print args
    try:
        routes = EcoCartographer(args)
    except:
        print sys.exc_info()
