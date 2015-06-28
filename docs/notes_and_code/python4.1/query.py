from ecocartographer.classes import LatLng
from ecocartographer import polyline
from urllib import urlopen, quote
import time

Polyline = polyline.PolylineCodec()

class Geocoder(object):
    def __init__(self):
        self.next_query_time = time.time()

    def geocode(self, address):
        '''Returns LatLng of Geocoding API'''
        url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+address.replace(' ','+',len(address))+'&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'

        current_time = time.time()
        if current_time < self.next_query_time: #before earliest possible query time
            time.sleep(self.next_query_time - current_time) #wait until next query time
            
        try:
            data = eval(urlopen(url).read())
            self.next_query_time = current_time + 0.2
            if data['status'] == 'OK':
                print 'Geocode:',address
                return LatLng(float(data['results'][0]['geometry']['location']['lat']), float(data['results'][0]['geometry']['location']['lng']))
            else:
                print 'Geocode Failed (if).',address
                return self.geocode(address)
        except:
            print 'Geocode Failed (except).',address
            return self.geocode(address)

    def reverseGeocode(self,latlng):
        '''Returns address components of Geocoding API from LatLng'''
        url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latlng.toStringURL()+'&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'

        current_time = time.time()
        if current_time < self.next_query_time: #before earliest possible query time
            time.sleep(self.next_query_time - current_time) #wait until next query time
            
        try:
            data = eval(urlopen(url).read())
            self.next_query_time = current_time + 0.2
            if data['status'] == 'OK':
                print 'Reverse Geocode:',latlng.toStringURL()
                return data['results'][0]['address_components']
            else:
                print 'Reverse Geocode Failed (if).',latlng.toStringURL()
                return self.reverseGeocode(latlng)
        except:
            print 'Reverse Geocode Failed (except).',latlng.toStringURL()
            return self.reverseGeocode(latlng)

class Director(object):
    def __init__(self):
        self.next_query_time = time.time()

    def directions(self, url):
        '''Returns JSON of Google Directions API request'''
        current_time = time.time()
        if current_time < self.next_query_time:
            time.sleep(self.next_query_time - current_time)

        try:
            data = eval(urlopen(url).read())
            self.next_query_time = current_time + 0.5
            if data['status'] == 'OK':
                print 'Directions:',url
                return data
            else:
                print 'Directions Failed (if):',url
                return self.directions(url)
        except:
            print 'Directions Failed (except):',url
            return self.directions(url)

class Elevator(object):
    def __init__(self):
        self.next_query_time = time.time()

    def elevation(self, pts, references):
        '''Gets elevation from reference data.'''

        def ElevationURL(url):
            '''Get Elevation data from a url.'''
            
            current_time = time.time()
            if current_time < self.next_query_time: #before earliest possible query time
                time.sleep(self.next_query_time - current_time) #wait until next query time

            self.next_query_time = current_time + 0.2 #set the next time a query can be fired to 0.2 seconds from now
            
            try: #a ton of things can go wrong!  
                data = urlopen(url).read()
                data = eval(data)
                if data['status'] == 'OK': #nothing wrong with query
                    return data
                else: #if an error, pass it on
                    print 'Elevation Error.'
                    return ElevationURL(url)
            except: #if an error, pass it on
                print 'Elevation Error.'
                return ElevationURL(url)

        
        api_url = 'https://maps.googleapis.com/maps/api/elevation/json?locations=enc:'
        requests = []
        refiter = 0 #counter for references
        while refiter < len(references): #loop until finished (break statement in if statement)
            new = ['', []]
            while len(new[0]) < 1870 and len(new[1])<300:
                additional = int((1870 - len(new[0]))/10) + 1
                new[1] += references[refiter:min(refiter + additional, len(references))]
                new[0] += Polyline.encode('|'.join(map(lambda a: pts[a[0]].pt.toStringURL(), references[refiter:min(refiter + additional, len(references))])))
                refiter += additional
                if refiter >= len(references): break
            requests.append((new[0], new[1], api_url + new[0] + '&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE'))

        output = []
        for poly, refs_list, url in requests:
            print 'Elevation.'
            data = ElevationURL(url)
            output.append(data)
            for res, refs in zip(data['results'], refs_list):
                for ref in refs:
                    pts[ref].elevation = res['elevation']
        return pts, output
