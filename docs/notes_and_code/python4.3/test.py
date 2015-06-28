import sys
import time

variables = sys.argv
path = 'test.txt'
def write(text):
    f = file(path, 'a')
    f.write(text)
    f.close()

for i in range(50):
    time.sleep(0.5)
    write(str(i)+'\n')
