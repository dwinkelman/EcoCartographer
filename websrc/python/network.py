from polyline import PolylineCodec
from classes import Instruction
import util
import math
from copy import copy

ALTTRAFFICSIGNAL = False #to not be completely pessimistic :)
ACCELERATIONRATE = 2.5 #m/s^2 acceleration/deceleration

Polyline = PolylineCodec()

def calcAccel(startSpeed, endSpeed, dist, mass):
    '''Returns total time for distance and additional energy for accel/decel'''
    low, high = min(startSpeed, endSpeed), max(startSpeed, endSpeed)
    time_to_accel = (high - low) / ACCELERATIONRATE
    dist_to_accel = low*time_to_accel + 0.5*ACCELERATIONRATE*time_to_accel**2
    return time_to_accel + (dist-dist_to_accel)/high, 0.5*mass*(high**2 - low**2)

class Intersection(dict):
    def __init__(self, references, isStart=False, isEnd=False):
        '''Takes list of Pts as references'''
        dict.__init__(self,())
        self.references = references
        self.isStart = isStart
        self.isEnd = isEnd
        self.key = references[0].string
        self.pt = references[0].pt
        for pt in references:
            pt.isIntersection = True

class Connection(dict):
    def __init__(self, path, start, end):
        '''Takes list of Pts and path; start/end are Intersections'''
        dict.__init__(self,())
        self.path = path
        self.start = start
        self.end = end
        self.distance = sum([pt.pt.distanceTo(pt.next.pt) for pt in path[:-1]])

    def extend(self, key, vehicle):
        if not self.end.isEnd: #is a regular intersection
            self[key] = Micropath(copy(self.path + [self.end[key].path[1]]), vehicle)
        else:
            self.micropath = Micropath(copy(self.path), vehicle)
            print 'at end'

class Micropath(list):
    def __init__(self, path, vehicle):
        '''Similar to path, but different methods'''
        list.__init__(self, path)
        self.calc(vehicle)

    def calc(self, vehicle):
        global ALTTRAFFICSIGNAL
        MPH15 = 6.7056 #15 mph in m/s
        mass = vehicle.mass
        time = 0
        penalties = 0
        energy = 0
        #assign speeds based on road features
        for pt in self[1:-2]:
            if pt.isStoplight:
                if ALTTRAFFICSIGNAL:
                    penalties += 30
                    pt.speed = 0
                ALTTRAFFICSIGNAL^=1
            elif pt.isIntersection:
                schange = pt.next.speed - pt.speed #positive: accel, negative: decel, 0: same
                angle = pt.pt.directionAngle(pt.last.pt, pt.next.pt) #returns angle of turn as 'right', 'left' or 'straight'
                if angle == 'right':
                    if schange <= 0:
                        pt.speed = MPH15
                    else:
                        pt.speed = 0
                        penalties += 10
                        pt.isStopsign = True
                elif angle == 'left':
                    if schange == 0:
                        pt.speed = MPH15
                    else:
                        pt.speed = 0
                        penalties += 15
                        pt.isStopsign = True
        #calculate force and time from path speeds
        for pt in self[1:-2]:
            new_time, add_energy = calcAccel(pt.speed, pt.next.speed, pt.pt.distanceTo(pt.next.pt), mass)
            time += new_time
            energy += max(0, pt.getEnergyNext(vehicle)+add_energy)

        self.energy = energy + penalties*vehicle.idle
        self.time = time + penalties

class Longpath(list):
    def __init__(self, path, vehicle, *args):
        '''Makes a path with instructions. args are (key, value)'''
        list.__init__(self, path)
        self.getInstructions(vehicle)
        for key, value in args:
            self.__setattr__(key, value)
        self.polyline = Polyline.encode([a.pt for a in path])

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

'''class Connection(list):
    def __init__(self, path, start, end):
        list.__init__(self, path)
        self.start = start
        self.end = end

    def getTails(self):
        self.afterKeys = end.keys().remove(start.keys) #exclude start from keys (redundant)
        self.afterPts = {key: self.end[key][1] for key in self.afterKeys}

    def getDistances(self):
        sub = sum([pt.pt.distanceTo(pt.next.pt) for pt in self[:-1]])
        return {key: sub + pt.pt.distanceTo(pt.last.pt) for key, pt in self.afterPts.values()}

    def getTimesAndEnergy(self, vehicle):
        #conditions that require complex check
        #change in road speed
        #change in road name
        #stoplight
        MASS = vehicle.mass
        penalties = 0
        time = 0
        energy = 0
        for pt in self[:-1]:
            energy_pt = pt.getEnergyNext(vehicle)
            if pt.speed != pt.next.speed:
                time, energy_add = calcAccel(pt.speed, pt.next.speed, pt.pt.distanceTo(pt.next.pt), MASS)
                time += time
                energy += max(0, energy_pt+energy_add)
            if pt.roadname != pt.next.roadname:
                
            else:
                energy += max(0, energy_pt)'''
                
