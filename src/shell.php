<html>
  <head>
    <title>Do Not Close - PHP Shell - EcoCartographer</title>
  </head>
  <body>
    <?php
      $handle = popen('python python/main.py' . ' ' . str_replace(' ','+',$_POST['start']) . ' ' . str_replace(' ','+',$_POST['end']) . ' ' . $_POST['mass'] . ' ' . ' ' . $_POST['drag'] . ' ' . $_POST['area'] . ' ' . $_POST['disp'] . ' ' . $_POST['routes'] . ' ' . $_POST['id'], 'r');
      $read = fread($handle, 2096);
      echo $read;
      pclose($handle);
      echo "<h1 style='color:#f00; text-align:center'> This query is over, and this tab may be closed now. </h1>";
    ?>
  </body>
</html>