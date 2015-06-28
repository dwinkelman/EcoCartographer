<?php $titleText="End-User Documentation"; include_once "header.php"?>

<div id="contents">
  <h1>End-User Documentation</h1>
  
  <h2>Steps of Usage</h2>
  
  <h3>Getting Started</h3>
  <p>
    EcoCartographer is used very similarly to Google Maps, in that one types an address into a search bar, and a route is returned. EcoCartographer is different from Google Maps, because instead of returning the shortest or fastest route, it returns the most fuel-efficient one. This is a unique product at the forefront of this type of program: when this project was started in August of 2014, there was no existing program to do what this program can do.
  </p>
  <p>
    EcoCartographer is good for short- to mid-range routes (about 50 miles). Since the algorithm needs to collect and parse a lot of data, it can take a good deal of time to complete the search. However, even the recommended distance limit of 50 miles is drastically better than the limit of 10-15 mile limit of the version which was presented at the 2015 NCTSA Conference.
  </p>
  
  <h3>Data Entry</h3>
  <p>
    Just like Google Maps, one needs to enter a <a href="#start-input">start and end location</a>. You can scroll and zoom just like any Google Map. Then, a vehicle can be selected, or raw data can be put in the various boxes. The drop-down menu with the vehicles will not include everything. However, there will be a variety of vehicle types that are similar enough to most other vehicles. In other words, a close vehicle can be chosen, and the algorithm will not be drastically affected.
  </p>
  <p>
    Write down or copy-and-paste the contents of the box "Query ID". This will be needed later on to retrieve old results without redoing the search. Queries can be accessed later on by typing <code>http://www.devtano.com/software/eco/routes/YOUR_QUERY_ID/output.html</code> into your web browser.
  </p>
  
  <h3>Submitting</h3>
  <div>
    <img src="images/console.png" style="float:left; margin-right:50px;">
    <p>
      Then click "Submit". This will open another blank page. Do not close this page; it contains the PHP shell running the program. Watch the console bar on the right side of the application.
    </p>
    <p>
      If your browser blocks pop-ups, please change that setting, refresh the page, and re-submit your query.
    </p>
    <img src="images/shell.png" style="float:right; margin-left:50px">
    <p>
      The console will have the progress of the algorithm printed on it. This is so that you can make sure there aren't problems with the query, and also know that the algorithm is working.
    </p>
  </div>
  
  <h3>Instructions</h3>
  <img src="images/route_header.png" style="float:right; margin-left:50px">
  <p>
    When the script completes, there will be a set of instructions that are written directly under the console. The instructions will be grouped, so that the first given instructions are the ones the algorithm generated. These will be followed by the default Google Maps route. Under each route will be the gasoline, distance and time of the route, as well as the potential gasoline savings over the default route.
  </p>
  <img src="images/output.png" style="width:100%; float:right; margin-left:50px">
  <p>
    Additionally, each route will be drawn on the map, in different colors. All the routes will appear on the map initially, including the default route. Next to the headings for each set of instructions, there are check boxes. If the check box is checked, the route will show on the map, and the detailed instructions will be shown. Both the route on the map and the instruction set in the panel will disappear when the check box is unchecked, and they will reappear when it is re-checked.
  </p>
  <p>
  <img src="images/route_click.png" style="float:left; margin-right:50px">
  <img src="images/icon_click.png" style="float:left; margin-right:50px">
    On the map, there is a line with icons along it. The icons tell you where stoplights are, and also where you need to turn. When the mouse hovers over an icon, the corresponding instruction text will pop up beside it. Similarly, clicking a line will cause a pop up to give you quick information about it.
  </p>
  
  <h3>Re-Access Routes</h3>
  <p>
    In the input panel, there is a <a href="query-id-input">text box that contains a randomly-generated key</a>. This can be used to go back to the instructions created for the query, so that you do not need to search again.
  </p>
  
  <h2>Input Help</h2>
  
  <a name="start-input">
  <a name="end-input">
    <h3>Start and End Queries</h3>
    <img src="images/input.png" style="float:right;margin-left:50px">
    <p>
      Similarly to Google Maps, one should input an address to go to. However, it is recommended that the address be as specific as possible, so that correct results are given the first time. Addresses should include as many as possible of the following: street address, cities, states, zip codes. Business names are acceptable, given a city or zipcode, but without such information, it is possible that the wrong business will be found. This is especially true with chains.
    </p>
    <ul>
      <h4>Examples of good queries:</h4>
      <li><code>Carnegie Hall, New York City, NY</code></li>
      <li><code>567 Main Street, Houston, TX</code></li>
      <li><code>Starbucks, East 7th Street, Charlotte, NC</code></li>
    </ul>
    <ul>
      <h4>Examples of bad queries:</h4>
      <li><code>North High School</code>
      <li><code>1900 Broad Street</code>
      <li><code>Springfield</code></li>
    </ul>
    <p>
      When an address is typed in, a marker will be placed, and the map will scroll to include one or both markers. Invalid addresses will not be mapped, and you will be alerted. Also, a similar message will appear for addresses that are more than 50 miles apart. However, instead of being automatically deleted, you will still be permitted to use it.
    </p>
    <p>
      Unfortunately, queries should be limited to about 50 miles or so. This is primarily because of query limits imposed by Google on elevation data. One can try farther distances, but there is no guarantee that results will be returned in a timely manner. There is also a risk for server overload.
    </p>
  </a>
  </a>
    
  <a name="vehicle-input">
    <h3>Vehicle</h3>
    <p>
      There is a drop-down menu of possible vehicles. There is a limited number of vehicles, so if you cannot find your vehicle, try to find a vehicle that is similar. Values for drag coefficient and surface area will be updated when a vehicle is selected. There may or may not be data available for mass or engine displacement. All unit options for metric will be selected.
    </p>
  </a>

  <a name="mass-input">
    <h3>Mass</h3>
    <p>
      Mass is the weight of your vehicle. This information is probably in the vehicle specifications on the manufacturer's website, or your manual. First, try to a <a class="ref" href="#vehicle-input">vehicle</a> that is close to your vehicle. If your vehicle is not there, try to find a similar vehicle in the list. Also, if you cannot find a suitable vehicle or the vehicle you choose has no mass content, you will need to look it up.
    </p>
    <p>
      To input a mass, either type the mass (in numbers) or use the click-able arrows in the right of the box. Next to the input box, there are radio buttons that indicate the unit of the number. Changing the selected radio button will convert the number inside the box at the same time. Be sure the proper radio button is selected before inputting the mass.
    </p>
  </a>

  <a name="drag-input">
    <h3>Drag Coefficient</h3>
    <p>
      This is a number which describes how the force of drag acts upon your vehicle. This information is not widely available, so it is highly recommended that you use your <a class="ref" href="#vehicle-input">vehicle</a> or a vehicle similar to it to ensure the most accurate results. This information is available for all vehicles.
    </p>
    <p>
      To input a drag coefficient, either type the drag coefficient (in numbers) or use the click-able arrows in the right of the box.
    </p>
  </a>

  <a name="area-input">
    <h3>Frontal Surface Area</h3>
    <p>
      This is the surface area of your vehicle when viewed head-on. Similarly to drag coefficient, this information is not widely available, so it is highly recommended that you use your <a class="ref" href="#vehicle-input">vehicle</a> or a vehicle similar to it to ensure the most accurate results. This information is available for all vehicles.
    </p>
    <p>
      To input a frontal surface area, either type the frontal surface area (in numbers) or use the click-able arrows in the right of the box. Next to the input box, there are radio buttons that indicate the unit of the number. Changing the selected radio button will convert the number inside the box at the same time. Be sure the proper radio button is selected before inputting the frontal surface area.
    </p>
  </a>

  <a name="disp-input">
    <h3>Engine Displacement</h3>
    <p>
      This is the amount of volume your engine has. This can be found on the sites of most manufacturers or your manual. If you do not have this information, please find your <a class="ref" href="#vehicle-input">vehicle</a> or a vehicle similar to it in the drop-down menu to ensure the most accurate results. This information is not available for all vehicles, so if the vehicle you select does not have it, you need to look it up on the manufacturer's website or in the manual. Also, since displacement tends to vary significantly over a model of vehicle with upgrades and so on, it is recommended to look up the actual displacement for your vehicle.
    </p>
    <p>
      To input a engine displacement, either type the engine displacement (in numbers) or use the click-able arrows in the right of the box. Next to the input box, there are radio buttons that indicate the unit of the number. Changing the selected radio button will convert the number inside the box at the same time. Be sure the proper radio button is selected before inputting the engine displacement.
    </p>
  </a>
  
  <a name="route-input">
    <h3>Number of Routes</h3>
    <p>
      There is an option for the number of routes to display. The minimum is 1, the maximum is 5, and the default is 3. In addition to these, there will also be the default Google Maps route, so that you can compare the route(s) given, and see how much fuel you save. In some cases, the Google Maps route will be the most fuel efficient.
    </p>
  </a>
  
  <a name="query-id-input">
    <h3>Query ID</h3>
    <p>
      This input is not set, but rather randomly generated. The text contained in this box is the key to recover that query. For instance, if the input says <code>a1b2c3</code>, the data returned for this query will be stored under the name <code>a1b2c3</code>. The instructions generated for a route can be found by visiting <code>http://devtano.com/software/eco/routes/</code>Query ID<code>/output.html</code>. The URL is case-sensitive, so only lower-case letters can be used. Keys will typically contain between 3 to 8 lower-case letters and/or numbers.
    </p>
    <p>
      It is recommended that this key be written down or otherwise saved somehow, to avoid re-searching.
    </p>
  </a>
  
  <h2>Disclaimers</h2>
  <ul>
    <li>There may be incorrect written instructions.</li>
    <li>The instructions may call for illegal turns or go on the wrong sides of roads or on non-existent roads.</li>
    <li>The given stop signs or traffic signals may be wrong.</li>
    <li>There may be extensions to routes that are illogical. Simply choose the most logical alternative in this case.</li>
    <li>Routes may take longer (or shorter) to travel than advertised, due to traffic volume, incorrect speed limits, an unusual amount of red or green lights, and the aforementioned flaws.</li>
    <li>The algorithm has a tendency to choose low-speed roads.</li>
    <li>While the concepts underlying this program are sound, there may be calibration issues arising from assumptions that had to be made.</li>
  </ul>
</div>

<?php include_once "footer.php"?>