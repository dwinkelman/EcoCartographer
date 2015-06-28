----------------------------------------
--PROBLEMS?-----------------------------
----------------------------------------

If you are having problems with the application, please call 336-403-7607

----------------------------------------
--HOW TO USE----------------------------
----------------------------------------

--Option A:-----------------------------
  1. Please copy and paste the src folder onto your laptop.
     This is necessary because of the need to write temporary files, which is not possible on a CD. 
     This program is self contained and will not write files outside of the src/routes folder.
     This application can be simply deleted once finished with.
  2. Navigate to /src/dist, and execute shell.exe.

  3. This will initialize the localhost powered by bottle.py.

  4. Please open http://localhost:8080/main.php to view the application, or click on "EcoCartographer (local)".
     The main page can be opened at http://localhost:8080/index.php, or by clicking on "Homepage (local)".
     Similarly, the online version's application can be opened at http://www.devtano.com/software/eco/main.php, or by clicking on "EcoCartographer (online)".
     The online main page can be open at http://www.devtano.com/software/eco/index.php, or by clicking on "Homepage (online)".

  5. Resources like End-User Documentation can be found on the link bar at the top of the front page.

  6. When the form is submitted on the main application, please make sure no pop ups were blocked. 
     If so, please allow pop ups.

  7. Unfortunately, the console cannot be updated continuously in this version. 
     It will load when the query is finished. 
     A typical query takes 15 seconds to a minute. 
     To see this in action, please visit the online site.

  8. IMPORTANT: after 2 to 3 queries, please shut down and restart shell.exe AND your web browser.
     This is important to website stability.
     Outputs may not display if otherwise.
     This problem does not exist on the web server.

  9. If this option fails, and if possible, please use Option B


--Option B:-----------------------------
  1. Open the "EcoCartographer (online)" shortcut.

  2. This will open a browser tab of the application. 

  3. The main page can be accessed by clicking the Go to Home button of the top of the side panel, or by opening the "Homepage (online)" shortcut.


--General Steps:------------------------
  1. To make a new query, please refresh the page.
  2. A quick summary of usage is found under "Quick Reference" on the link bar. 
  3. The application is similar to Google Maps, and there are hyperlinks for End-User Documentation in the input section.

----------------------------------------
--PROJECT REQUIREMENTS------------------
----------------------------------------

--OPERATING SYSTEM - WINDOWS------------
    (The scripting language of this program is Python.
     Since computers do not have Python installed, by default, it is necessary to have a .exe (and other files) substitute.
     Since these files are specific to Windows, Windows must be used to execute them.)

--INTERNET - YES------------------------
    (Since this project uses Google Maps data, it is necessary for there to be an Internet connection)

--BROWSER - GOOGLE CHROME, FIREFOX or INTERNET EXPLORER [modern versions of]
    (Since a number of advanced CSS techniques and HTML5 elements were used, a modern browser is needed. Preferably not Internet Explorer, though IE11 works)
    (Please do NOT use Safari)

**As this program was designed for use online to fulfill its design goal of being ubiquitously available, this adapted version is a bit unstable.
**Please be patient with it.
**For full capability, please visit http://www.devtano.com/software/eco/main.php, or click on the hyperlink in the CD's root directory.

----------------------------------------
--DIRECTORIES---------------------------
----------------------------------------

src: contains all final source code; essentially a mirror of devtano.com/software/eco
	css: contains all CSS styles used on the site.
		console.css: console displayed in application
		content.css: used for all pages except main.php, header.php, and footer.php
		docs.css: deprecated; used to be used for end-user documentation, but replaced by content.css
		footer.css: used for footer.php
		header.css: used for header.php
		main.css: used for main.php
		output.css: used for outputs displayed in application
		style.css: deprecated in favor of content; template
		unit-widget.css: specific to input section in main.php

	dist: .exe version of Python, compiled using py2exe
		shell.exe: executable to run
	
	fonts: fonts used on website

	images: images used in all aspects of the application, including logo, map icons and documentation examples
		old: deprecated images that are no longer used
		stupid: other deprecated images

	javascript: all the javascript used on the website
		google-maps-init.js: initizalizes the Google Map. Similar code is found in the Google Maps Javascript API v3 documentation.
		jquery-1.11.2.js: jQuery version downloaded from www.jquery.com
		main.js: JavaScript concerning primarily map functionality on the application page. Refers a little bit to unit-widget.js
		output.js: used for a test
		unit-widget.js: JavaScript controlling the input form.

	python: all the current python used on the localhost, along with compiled .pycs
		broken: contains files that used to work, but got broken in development
		__init__.py: indicator to Python to import from current directory
		bottle.py: source code for the Bottle module used to create localhost, taken from www.bottlepy.org
		classes.py: contains data types used in the algorithm
		ecio.py: output flow for the program. Writes console and output data to files
		main.py: main entry point for algorithm. Contains functions that drive algorithm
		network.py: new classes introduced during 4.3. Override many in classes.py
		polyline.py: Google Maps Encoded Polyline Algorithm encoder/decoder downloaded from pypi.python.org
		query.py: contains classes that regulate API queries
		setup.py: compiles program into .exe, taken from http://stackoverflow.com/questions/21321700/15-python-scripts-into-one-executable
		shell.py: runs localhost server
		six.py: module that polyline.py requires, downloaded from pypi.python.org
		util.py: contains miscellaneous functions

	routes: archive of routes calculated. Full archive can be found in /docs/notes/routes
		<routeName>:
			console.html: real-time console display
			output.json: JSON-formatted data of output, similar to Google Maps API output
			output.html: displayed output with instructions

	states: old States TSA 2015 Conference version of the application

	PHP FILES: main content of website
        index.php: homepage
        main.php: main application page
        shell.php: pops up when the form in main.php submitted
        header.php: header
        footer.php: footer
        etc....


websrc: Very similar to src. This is the current source code of the website at www.devtano.com

docs: Old Code/Outputs/Notes

Presentation

Binder

Ecocartographer (local): hyperlink to respective places, as described in number 4 of Option A.
Homepage (local):
EcoCartographer (online):
Homepage (online):

README.txt: what you are reading now