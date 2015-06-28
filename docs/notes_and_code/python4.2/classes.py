from polyline import PolylineCodec
import util
import math
from copy import copy

Polyline = PolylineCodec()

DIAMETER = float(40075000)/360
GRAVITY = 9.81 #acceleration of gravity, m/s^2
ROLLINGRESISTANCE = 0.03 #coefficient of rolling resistance of car tires on asphalt
AIRDENSITY = 1.225 #density of air, kg/m^3
GASOLINESPECIFICENERGY = 44400000
ACCELERATIONRATE = 2.5
MILETOMETER = 1609.34

class Vehicle(object):
    '''Container for values of the vehicle'''
    def __init__(self, mass, drag_coefficient, area, cycles=350, volumetric_efficiency=0.65, displacement=0.0020):
        self.mass = mass
        self.cd = drag_coefficient
        self.area = area
        '''http://www.quora.com/How-much-gas-does-a-car-burn-per-hour-while-idling'''
        self.idle = displacement * volumetric_efficiency * cycles * AIRDENSITY * 0.25 / 14.7 * GASOLINESPECIFICENERGY / 60

class Instruction(object):
    def __init__(self, path, command, feature, vehicle):
        self.path = path
        self.polyline = Polyline.encode('|'.join([a.string for a in path]))
        self.distance = sum([a.pt.distanceTo(a.next.pt) for a in path[:-1]])
        self.energy = sum([a.getEnergyNext(vehicle) for a in path[:1]])
        self.command = command
        self.feature = feature
        self.start = path[0]
        self.end = path[-1]

        if command == 'north' or command == 'south' or command == 'east' or command == 'west':
            self.string = 'Head ' + command + ' on ' + path[0].roadname + ' and continue for ' + util.mileFormat(meters=self.distance)
        elif command == 'right' or command == 'left':
            self.string = 'Turn ' + command + ' onto ' + path[0].roadname + ' and continue for ' + util.mileFormat(meters=self.distance)
        elif command == 'straight':
            self.string = 'Continue straight onto ' + path[0].roadname + ' and continue for ' + util.mileFormat(meters=self.distance)
        self.energy_used_string = 'You used ' + util.jouleFormat(self.energy)

class Path(list):
    def __init__(self, pts, vehicle):
        list.__init__(self, map(copy, pts))
        for i, j in zip(pts[:-1], pts[1:]):
            i.next, j.next = j, i #update next/last for solve()
        self.energy, self.distance, self.time, self.penalties = self.solve(vehicle)
        self.polyline = Polyline.encode('|'.join(map(lambda a: a.string, self)))

    def getInstructions(self, vehicle):
        self.instructions = []

        slice_start = 0
        slice_end = 0
        for pt in self[0:-2]:
            slice_end += 1
            if pt.roadname != pt.next.roadname or pt.next.isStoplight:
                self.instructions.append(
                    Instruction(
                        self[:slice_end],
                        self[0].pt.bearing(self[1].pt),
                        'start',
                        vehicle
                    )
                )
                slice_start = slice_end
                break
        
        for pt in self[slice_start:-2]:
            slice_end += 1
            if pt.roadname != pt.next.roadname or pt.next.isStoplight:
                feature = 'turn'
                if self[slice_start].isStopsign: feature = 'stopsign'
                if self[slice_start].isStoplight: feature = 'stoplight'
                self.instructions.append(
                    Instruction(
                        self[slice_start:slice_end],
                        self[slice_start].pt.directionAngle(self[slice_start-1].pt, self[slice_start+1].pt),
                        feature,
                        vehicle
                    )
                )
                slice_start = slice_end
        
        feature = 'turn'
        if self[slice_start].isStopsign: feature = 'stopsign'
        if self[slice_start].isStoplight: feature = 'stoplight'
        self.instructions.append(
            Instruction(
                self[slice_start:],
                self[slice_start].pt.directionAngle(self[slice_start-1].pt, self[slice_start+1].pt),
                feature,
                vehicle
            )
        )

    def solve(self, vehicle):
        '''Changes Pt.temp_speed based on turn angle and traffic features'''
        MPH15 = 6.7056 #15 mph in m/s
        MASS = vehicle.mass
        
        penalties = 0
        energy = 0
        distance = 0
        time = 0
        
        #manipulate speeds
        self[0].temp_speed = 0
        self[0].features = ('start')
        self[-1].temp_speed = 0
        self[-1].features = ('end')
        
        for pt in self[1:-1]:
            if not pt.isStoplight:
                if not pt.isIntersection:
                    pt.temp_speed = pt.speed #reset temp_speed to original speed
                else:
                    schange = pt.next.speed - pt.speed #positive: accel, negative: decel, 0: same
                    angle = pt.pt.directionAngle(pt.last.pt, pt.next.pt) #returns angle of turn as 'right', 'left' or 'straight'
                    if angle == 'right':
                        if schange <= 0:
                            pt.temp_speed = MPH15
                        else:
                            pt.temp_speed = 0
                            penalties += 10
                            pt.isStopsign = True
                    elif angle == 'left':
                        if schange == 0:
                            pt.temp_speed = MPH15
                        else:
                            pt.temp_speed = 0
                            penalties += 15
                            pt.isStopsign = True
                    else:
                        pt.temp_speed = pt.speed
            else:
                pt.temp_speed = 0
                penalties += 20
            energy += max(0, pt.last.getEnergyNext(vehicle) + MASS*(pt.temp_speed-pt.last.temp_speed)**2) #changed for loop compatibility
            dist = pt.last.pt.distanceTo(pt.pt)
            distance += dist

            low, high = min(pt.last.temp_speed, pt.temp_speed), max(pt.last.temp_speed, pt.temp_speed)
            time_to_accel = (high - low) / ACCELERATIONRATE
            dist_to_accel = low*time_to_accel + 0.5*ACCELERATIONRATE*time_to_accel**2
            time += time_to_accel + (dist-dist_to_accel)/high
        return energy, distance, time, penalties

class Intersection(dict):
    '''Used as nodes in the network'''
    def __init__(self, references, pt, isStart=False, isEnd=False):
        '''References is a list of points; connections are a list of Connections; pt is a LatLng'''
        dict.__init__(self,{})
        self.references = references
        self.pt = pt
        self.isStart = isStart
        self.isEnd = isEnd
        self.key = pt.toStringURL()

class TempIntersection(dict):
    def __init__(self, content, isStart=False, isEnd=False):
        '''Modified dict to hold boolean value for isStart or isEnd. Used for trimming.'''
        dict.__init__(self, content)
        self.isStart = isStart
        self.isEnd = isEnd

class Connection(list):
    '''Used as edges in the network. Bound to Intersections by weak references'''
    def __init__(self, path, start, end):
        '''Path is list of Pts; start and end are intersections'''
        '''Path should contain all points including start and end'''
        list.__init__(self, path)
        self.path = path
        self.start = start
        self.end = end

        self.energy = None
        self.distance = self.Distance()
        self.time = self.Time()

    def Distance(self):
        '''Gets total distance of connection'''
        '''return sum(map(lambda a: a.pt.distanceTo(a.next.pt), self.path[:-1]))'''
        total = 0
        for pt in self[:-1]:
            total += pt.pt.distanceTo(pt.next.pt)
        return total

    def Time(self):
        '''Gets total time of connection'''
        '''return sum(map(lambda a: a.pt.distanceTo(a.next.pt)/a.speed, self.path[:-1]))'''
        total = 0
        for pt in self[:-1]:
            total += pt.pt.distanceTo(pt.next.pt)
        return total

    def Energy(self, vehicle):
        '''Gets total force of connection'''
        '''return self.distance * sum(map(lambda a: max(0, a.getEnergyNext(vehicle)), self.path[:-1]))''' #proven to be inefficient
        total = 0
        for pt in self[:-1]:
            total += max(0, pt.getEnergyNext(vehicle))
        return total

class Pt(object):
    '''Used for operations of coordinates in the network'''
    def __init__(self, latLng, index, speed, roadname, isIntersection=False):
        '''Used for operations of coordinates in the network. Accepts LatLng object, integer and boolean reflecting status in the initial network returned'''
        self.pt = latLng
        self.index = index
        self.isIntersection = isIntersection
        self.string = latLng.toStringURL()
        self.isStoplight = False
        self.isStopsign = False
        self.roadname = roadname

        self.elevation = 0
        self.speed = speed
        self.references = None
        self.next = None
        self.last = None
        self.temp_speed = speed

    def getEnergyNext(self, vehicle):
        '''Get force to another Pt. Recommend adjacent.'''
        angle = math.atan((self.next.elevation - self.elevation)/self.pt.distanceTo(self.next.pt)) #positive angle is a rise
        Fpar = GRAVITY * vehicle.mass * math.sin(angle) #force of moving the vehicle up/down elevations
        Ffriction = GRAVITY * vehicle.mass * math.cos(angle) * ROLLINGRESISTANCE #force of rolling resistance
        Fdrag = 0.5 * vehicle.cd * AIRDENSITY * vehicle.area * self.speed**2 #force of drag
        return (Fpar + Ffriction + Fdrag) * self.pt.distanceTo(self.next.pt) #total energy to go length of road, maintaining velocity in Joules

class Bounds(object):
    '''Used to create a box from coordinates'''
    def __init__(self,north,south,east,west):
        self.north = north
        self.south = south
        self.west = west
        self.east = east

    def isIn(self,latLng):
        '''Checks if LatLng is inside bounds'''
        if self.north >= latLng.lat >= self.south and self.east >= self.lng >= self.west:
            return True
        else:
            return False

    def toOverpassString(self):
        '''Returns a string to be used in Overpass API query'''
        return '(%f,%f,%f,%f)' % (self.south,self.west,self.north,self.east)

class LatLng(object):
    '''Used for mathemetical representation of latitude-longitude coordinates'''
    def __init__(self,lat,lng):
        '''Used for mathemetical representation of latitude-longitude coordinates'''
        self.lat = float(lat)
        self.lng = float(lng)
        
    def toStringURL(self):
        '''Returns string used for Google Maps URLs'''
        return str(round(self.lat,5)) + ',' + str(round(self.lng,5))
    
    def toStringParenth(self):
        '''Returns string like toStringURL with parenthesis'''
        return '(' + self.toStringURL() + ')'
    
    def distanceTo(self,a):
        '''Returns the distance between LatLng used to call operation, and another LatLng, in meters'''
        '''http://www.movable-type.co.uk/scripts/latlong.html (More accurate, spherical representation).'''
        R = 6371000;
        phi1 = math.radians(self.lat)
        phi2 = math.radians(a.lat)
        deltaphi = math.radians(a.lat - self.lat)
        deltalam = math.radians(a.lng - self.lng)
        b = math.sin(deltaphi/2) * math.sin(deltaphi/2) + math.cos(phi1) * math.cos(phi2) * math.sin(deltalam/2) * math.sin(deltalam/2)
        c = 2 * math.atan2(math.sqrt(b), math.sqrt(1-b))
        return R * c
    
    def angleAsCenter(self,a,b):
        '''Returns the degree angle between 2 LatLngs and the LatLng used to call operation, with the caller in the middle'''
        lat1, lat2 = a.lat-self.lat, b.lat-self.lat
        lng1, lng2 = a.lng-self.lng, b.lng-self.lng
        dns1, dns2 = lat1 * DIAMETER, lat2 * DIAMETER
        dew1 = lng1 * abs(math.cos(math.radians( (a.lat + self.lat)/2 ))) * DIAMETER
        dew2 = lng2 * abs(math.cos(math.radians( (b.lat + self.lat)/2 ))) * DIAMETER
        angle1, angle2 = math.degrees(math.atan2(dns1,dew1)), math.degrees(math.atan2(dns2,dew2))
        if dns1 < 0: angle1 += 360
        if dns2 < 0: angle2 += 360
        return angle2 - angle1

    def directionAngle(self,a,b):
        '''Returns text direction of angle between self and 2 LatLngs'''
        angle = self.angleAsCenter(a,b)
        if angle < -225 or 0 < angle < 135:
            return 'right'
        elif -135 < angle < 0 or 225 < angle:
            return 'left'
        else:
            return 'straight'

    def bearing(self, a):
        '''Returns south/north/east/west of line, based on linear distance'''
        lat = a.lat - self.lat
        lng = a.lng - self.lng
        dns = lat * DIAMETER
        dew = lng * abs(math.cos(math.radians( (a.lat + self.lat)/2 ))) * DIAMETER
        angle = math.degrees(math.atan2(dns, dew))
        if 135 >= angle > 45: return 'north'
        elif 45 >= angle > -45: return 'east'
        elif -45 >= angle > -135: return 'south'
        else: return 'west'
