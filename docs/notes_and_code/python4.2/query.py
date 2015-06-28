from classes import LatLng
import polyline, util
from urllib import urlopen, quote
import xml.etree.ElementTree as ET
import time
import sys
import traceback
import json

Polyline = polyline.PolylineCodec()

class Geocoder(object):
    def __init__(self):
        self.next_query_time = time.time()
        self.max_failed_queries = 3

    def geocode(self, address, console, num, outof, attempt):
        '''Returns LatLng of Geocoding API'''
        if attempt == self.max_failed_queries:
            console.add('elevation', num, outof, False, 'Quitting this query. Data will be inaccurate')
            return None, False

        url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+address.replace(' ','+',len(address))+'&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'

        current_time = time.time()
        if current_time < self.next_query_time: #before earliest possible query time
            time.sleep(self.next_query_time - current_time) #wait until next query time
            
        try:
            data = json.load(urlopen(url))
            self.next_query_time = current_time + 0.2
            if data['status'] == 'OK':
                console.add('geocode', num, outof)
                return LatLng(float(data['results'][0]['geometry']['location']['lat']), float(data['results'][0]['geometry']['location']['lng'])), True
            else:
                console.add('geocode', num, outof, False, 'Problem with query or data: '+data['status'])
                return self.geocode(address, console, num, outof, attempt+1)
        except:
            type_, value_, traceback_ = sys.exc_info()
            console.add('geocode', num, outof, False, str(traceback.format_exception(type_, value_, traceback_)))
            return self.geocode(address, console, num, outof, attempt+1)

    def reverseGeocode(self, latlng, console, num, outof, attempt):
        '''Returns address components of Geocoding API from LatLng'''
        if attempt == self.max_failed_queries:
            console.add('reverse geocode', num, outof, False, 'Quitting this query. Data will be inaccurate')
            return None, False
        
        url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latlng.toStringURL()+'&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'

        current_time = time.time()
        if current_time < self.next_query_time: #before earliest possible query time
            time.sleep(self.next_query_time - current_time) #wait until next query time
            
        try:
            data = json.load(urlopen(url))
            self.next_query_time = current_time + 0.2
            if data['status'] == 'OK':
                console.add('reverse geocode', num, outof)
                return data['results'][0]['address_components'], True
            else:
                console.add('reverse geocode', num, outof, False, 'Problem with query or data: '+data['status'])
                return self.reverseGeocode(latlng, console, num, outof, attempt+1)
        except:
            console.add('reverse geocode', num, outof, False, 'Problem with connection')
            return self.reverseGeocode(latlng, console, num, outof, attempt+1)

class Director(object):
    def __init__(self):
        self.next_query_time = time.time()
        self.max_failed_queries = 3

    def directions(self, url, console, num, outof, attempt):
        if attempt == self.max_failed_queries:
            console.add('directions', num, outof, False, 'Quitting this query. Data will be inaccurate')
            return None, False
            
        '''Returns JSON of Google Directions API request'''
        current_time = time.time()
        if current_time < self.next_query_time:
            time.sleep(self.next_query_time - current_time)

        try:
            data = json.load(urlopen(url))
            self.next_query_time = current_time + 0.5
            if data['status'] == 'OK':
                console.add('directions', num, outof)
                return data, True
            else:
                console.add('directions', num, outof, False, 'Problem with query or data: '+data['status'])
                return self.directions(url, console, num, outof, attempt+1)
        except:
            console.add('directions', num, outof, False, 'Problem with connection')
            return self.directions(url, console, num, outof, attempt+1)

class Elevator(object):
    def __init__(self):
        self.next_query_time = time.time()
        self.max_failed_queries = 3

    def getInterpolations(self, routes, intersections, console):
        t0 = time.time()
        pairs = set()
        elevation_out = set([tuple(inter.references[0].references) for inter in intersections.values()]) #references to get elevation for
        interpolate_out = set() #references to interpolate for. Format: (references, left_references, right_references)
        for route, dist in routes:
            for int1, int2 in zip(route[:-1], route[1:]):
                if not ((int1, int2)) in pairs:
                    pairs.add((int1, int2))

        for index, con in list(pairs):
            path = intersections[index][con]
            path_len = len(path)
            for pt_index, pt in enumerate(path[1:-1]):
                if (pt_index % 2):
                    elevation_out.add(tuple(pt.references))
                else:
                    interpolate_out.add((tuple(pt.references), tuple(path[pt_index].references), tuple(path[pt_index+2].references)))
        console.add('Interpolations', error=': '+str(time.time()-t0))
        return list(elevation_out), list(interpolate_out)

    def elevation(self, pts, elevation_refs, interpolation_refs, console):
        '''Gets elevation from reference data.'''

        def ElevationURL(url, num, outof, attempt):
            '''Get Elevation data from a url.'''
            if attempt == self.max_failed_queries:
                console.add('elevation', num, outof, False, 'Quitting this query. Data will be inaccurate')
                return None, False
            
            current_time = time.time()
            if current_time < self.next_query_time: #before earliest possible query time
                time.sleep(self.next_query_time - current_time) #wait until next query time

            self.next_query_time = current_time + 0.2 #set the next time a query can be fired to 0.2 seconds from now
            
            try: #a ton of things can go wrong!  
                data = json.load(urlopen(url))
                if data['status'] == 'OK': #nothing wrong with query
                    console.add('elevation', num, outof)
                    return data, True
                else: #if an error, pass it on
                    console.add('elevation', num, outof, False, 'Problem with query or data: '+data['status'])
                    print 'Elevation Error (if)'
                    return ElevationURL(url, num, outof, attempt+1)
            except: #if an error, pass it on
                console.add('elevation', num, outof, False, 'Problem with connection')
                print 'Elevation Error'
                return ElevationURL(url, num, outof, attempt+1)

        
        api_url = 'https://maps.googleapis.com/maps/api/elevation/json?locations=enc:'
        requests = []
        chunks = list(util.chunkify(elevation_refs, 200))
        for chunk in chunks:
            '''polyline = Polyline.encode('|'.join(map(lambda a: pts[a[0]].string, chunk)))'''
            polyline = Polyline.encode('|'.join([pts[a[0]].string for a in chunk]))
            requests.append((polyline, chunk, api_url + polyline + '&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'))

        request_num = 1
        for poly, refs_list, url in requests:
            data, success = ElevationURL(url, request_num, len(requests), 0)
            if not success:
                return None, None, False
            request_num += 1
            if data:
                for res, refs in zip(data['results'], refs_list):
                    for ref in refs:
                        pts[ref].elevation = res['elevation']

        for to_int, ref1, ref2 in interpolation_refs:
            pt = pts[to_int[0]]
            pt1 = pts[ref1[0]]
            pt2 = pts[ref2[0]]
            dist1 = pt.pt.distanceTo(pt1.pt)
            dist2 = pt.pt.distanceTo(pt2.pt)
            total = dist1 + dist2
            slope = (pt2.elevation - pt1.elevation)/total
            elevation = pt1.elevation + dist1 * slope
            for pt in to_int:
                pts[pt].elevation = elevation
                
        return pts, requests, True

class Overpasser(object):
    def __init__(self):
        None

    def chunk(self, pts, references):
        t0 = time.time()
        chunks = {}
        for ref in references:
            chunk = str(round(pts[ref[0]].pt.lat, 1)) + ',' + str(round(pts[ref[0]].pt.lng, 1))
            if not chunk in chunks:
                chunks[chunk] = []
            chunks[chunk].append(ref)
        print time.time()-t0
        return chunks
        
    def overpass(self, pts, references, chunks, bounds, console):
        #make url
        t0 = time.time()
        beginning = 'http://overpass-api.de/api/interpreter?data='
        query = quote('node["highway"="traffic_signals"]'+bounds.toOverpassString()+';out;')
        data = None
        while data == None: #get Overpass API data until successful
            try:
                data = urlopen(beginning + query).read()
                console.add('overpass', 1, 1)
            except: console.add('overpass', 1, 1, False, 'Problem with connection')
        data = ET.fromstring(data)
        t1 = time.time()

        #iterate through nodes, and make some temporary data objects for them to speed things up
        for node in data.findall('node'):
            lat, lng = float(node.attrib['lat']), float(node.attrib['lon'])
            chunk = str(round(lat, 1)) + ',' + str(round(lng, 1))
            if chunk in chunks:
                pt = LatLng(lat, lng)
                closest = None
                for ref in chunks[chunk]:
                    if 0.0005 > abs(pts[ref[0]].pt.lat - lat):
                        if 0.0005 > abs(pts[ref[0]].pt.lng - lng): #in reasonable range
                            d0 = pts[ref[0]].pt.distanceTo(pt)
                            d1 = pts[min(ref[0]+1,len(pts)-1)].pt.distanceTo(pt)
                            d2 = pts[max(ref[0]-1,0)].pt.distanceTo(pt)
                            if d0 > d1 and d0 > d2:
                                closest = ref
                            elif d1 > d2:
                                closest = pts[min(ref[0]+1,len(pts)-1)].references
                            else:
                                closest = pts[max(ref[0]-1,0)].references
                            break
                if closest != None: #sometimes pts don't match
                    for ref in closest: #assign isStoplight to true for all references for closest point
                        pts[ref].isStoplight = True
        t2 = time.time()

        #update stopsign
        for ref in references:
            for index in ref:
                if pts[index].isStopsign:
                    for index in ref:
                        pts[index].isStopsign = True
                    break
        t3 = time.time()
        console.add('Overpass (query)', error=': '+str(t1-t0))
        console.add('Overpass (add to points)', error=': '+str(t2-t1))
        console.add('Overpass (add to references)', error=': '+str(t3-t2))
        return pts
