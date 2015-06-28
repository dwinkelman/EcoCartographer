MILETOMETER = 1609.34

def flatten(a):
    '''http://stackoverflow.com/questions/406121/flattening-a-shallow-list-in-python'''
    return reduce(list.__add__, (list(mi) for mi in a))

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
    parts = html.split('\u003cb\u003e')
    parts = flatten(map(lambda a: a.split('\\u003c/b\\u003e'), parts))
    parts = parts[1:-1]
    roadnames = filter(lambda a: a[0].isupper(), parts)
    for i in roadnames:
        if i != 'U-turn':
            return i

def jouleFormat(joules):
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
    if meters:
        miles = meters / MILETOMETER
    return str(round(miles, 1)) + ' miles'
