<?php $titleText="Technical Summary"; require_once "header.php";?>

<div id="contents">
  <div id="tagline" class="clearfix">    
    <h1>Technical Explanation</h1>
    <h2>Version 2 (NCTSA 2015)</h2>
    <p>
      The first iteration of this program was a simple HTML shell similar to the current one, but the entire calculation was made using JavaScript. Google Maps data was collected using Ajax, as well as the Overpass traffic signals. All of this information was parsed down into a network made up of intersections (nodes) and connections (edges). This was then traversed recursively to create a list of most feasible routes. Finally, a series of energy-cost analyses were made on the routes.<p>
    </p>
    
    <p>
      This was a good starting point in which to develop key concepts, like the network, the recursive function to develop routes, and the energy analyses. However, there were problems with collecting enough data quickly enough using the Google Maps Services, as well as general computation time issues as well. Over the course of Version 3, changes were made to the algorithm to increase speed and decrease needed external data.
    </p>
    
    <h2>Version 4 (TSA Nationals 2015)</h2>
    <p>
      Since JavaScript simply was not powerful enough for this amount of data-crunching, the decision was made to re-write the algorithm in Python. The goals to be accomplished by this were to speed up computation and increase available memory, and gather Google API data instead of Maps Service data, which is faster and less limited in frequencies and amounts.
    </p>
    
    <p>
      Many of the concepts developed in Versions 1, 2 and 3 were applied, as well as several other optimizations. A degree of Object-Oriented Programming was intentionally used in Python to simplify operations. Additionally, Python's inherent utility for lists was good, since the data is primarily lists.
    </p>
    
    <p>
      An HTML shell is used to input data. This data is sent to a PHP script, which runs a command on command line of the server devtano.com is hosted on. During the Python script's execution, an HTML console is built up in real-time, and is displayed in the HTML shell. Once the Python finishes, output files are saved, and the outputs are displayed.
    </p>
  </div>
</div>

<?php require_once "footer.php"?>