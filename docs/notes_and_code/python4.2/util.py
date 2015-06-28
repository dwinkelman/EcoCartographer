import os, errno, math

MILETOMETER = 1609.34

def flatten(a):
    '''http://stackoverflow.com/questions/406121/flattening-a-shallow-list-in-python'''
    return reduce(list.__add__, (list(mi) for mi in a))

def chunkify(array, size):
    for i in range(0, len(array), size):
        yield array[i:i+size]

def uniquify(seq):
    '''http://stackoverflow.com/questions/89178/in-python-what-is-the-fastest-algorithm-for-removing-duplicates-from-a-list-so'''
    if type(seq[0]) in (str, int, float, bool):
        seen = set()
        seen_add = seen.add
        return [x for x in seq if x not in seen and not seen_add(x)]
    else:
        raise TypeError('Sequence in uniquify must be composed of strings, integers, floats, or booleans.')

def uniquifyTuples(seq):
    '''Uniquify tuples based on first value in each.'''
    seen = set()
    seen_add = seen.add
    return [x for x in seq if x[0] not in seen and not seen_add(x[0])]

def roadFormat(html):
    '''Format road name from Google Maps Directions API instructions.'''
    parts = html.split('<b>')
    parts = flatten(map(lambda a: a.split('</b>'), parts))
    parts = parts[1:-1]
    roadnames = filter(lambda a: a[0].isupper(), parts)
    for i in roadnames:
        if i != 'U-turn':
            return i
    return 'Unnamed Road'

def jouleFormat(joules):
    '''Format joules with unit attached.'''
    joules = float(joules)
    if joules < 1000:
        return str(int(joules)) + ' J'
    elif joules < 1000000:
        return str(round(joules/1000, 1)) + ' KJ'
    elif joules < 1000000000:
        return str(round(joules/1000000, 1)) + ' MJ'
    elif joules < 1000000000000:
        return str(round(joules/1000000000, 1)) + ' GJ'

def mileFormat(meters=0, miles=0):
    '''Format to instructions output. Accepts meters OR miles (must be specified)'''
    if meters:
        miles = meters / MILETOMETER
    return str(math.ceil(miles*10)/10) + ' miles'

def mkdir(path):
    '''http://stackoverflow.com/questions/600268/mkdir-p-functionality-in-python'''
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise

def cluster(sets):
    difs = [[len(a.difference(b))+len(b.difference(a)) for a in sets] for b in sets]
    mean = int(sum([sum(i) for i in difs])/len(sets)**2)
    groups = set()
    for i in difs:
        new = []
        for jindex, j in enumerate(i):
                if j < mean:
                        new.append(jindex)
        groups.add(tuple(new))
    return groups

def filterRoutes(r, f=4):
    sr = [set(i) for i, d in r]
    removed = set()
    for index, i in enumerate(sr):
        if not index in removed:
            difs = [len(i.difference(j))+len(j.difference(i)) for j in sr]
            for index2, j in enumerate(difs):
                if j<f and j>0 and index2>index:
                    removed.add(index2)
    return [r[index] for index in range(len(r)) if not index in removed]
