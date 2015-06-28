<html>
  <head>
    <title>EcoCartographer</title>
    <script src="javascript/jquery-1.11.2.js"></script>
    
    <script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?libraries=geometry&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE"></script>
    <script src="javascript/google-maps-init.js"></script>
    <script>
      google.maps.event.addDomListener(window,'load',function(){initialize('map-canvas')});
    </script>
    
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <script src="javascript/main.js"></script>
    
    <script src="javascript/unit-widget.js"></script>
    <link rel="stylesheet" type="text/css" href="css/unit-widget.css">
    
    <link rel="stylesheet" type="text/css" href="css/console.css">
    <link rel="stylesheet" type="text/css" href="css/output.css">
  </head>
  
  <body>
    <div id="sidebar">
      <div id="logo">
        <div id="nav">
          <a href="index.php">
            <div id="back">
              <img src="images/back.png" width="32px"/>
              Go to Home
            </div>
          </a>
        <img src="images/ecologo.png" width="100%"/>
        </div>
      </div>
      <div id="input">
        <div>
          <div id="label">Input data here:</div>
          <div id="close-toggle" class="button" onclick="toggle('#input-nonessential',this)">[hide]</div>
        </div>
        <div id="unit-widget">
          <form id="main-input" action="shell.php" method="post" target="_blank">
            <div id="start-div" class="item">
              Start Location: 
              <input type="text" name="start" id="start-input" oninput="updateTime('start',this)" onchange="updateAddress(this,'start',this.value)" required>
              <span id="start-help" class="help">
                <a href="end-user.php#start-input">Help?</a>
              </span>
            </div>
            <div id="end-div" class="item">
              End Location: 
              <input type="text" name="end" id="end-input" oninput="updateTime('end',this)" onchange="updateAddress(this,'end',this.value)" required>
              <span id="end-help" class="help">
                <a href="end-user.php#end-input">Help?</a>
              </span>
            </div>
            <div id="input-nonessential">
              <div id="vehicle-div" class="item">
                Vehicle:
                <select id="vehicle-input" name="vehicle" onchange="updateSpecs($(this))">
                <!--http://ecomodder.com/wiki/index.php/Vehicle_Coefficient_of_Drag_List-->
                  <option value="" id="__blank__"></option>
                  <option value="-acura--cl-" cd="0.34" area="2.01" mass="1440" disp="2300"> Acura Cl 1997-1999</option>
                  <option value="-acura--cl-" cd="0.32" area="2.04" mass="1361" disp="3200"> Acura Cl 2000-2003</option>
                  <option value="-acura--integra-" cd="0.32" area="1.81" mass="" disp=""> Acura Integra 1994-2001</option>
                  <option value="-acura--nsx-" cd="0.32" area="1.78" mass="" disp=""> Acura Nsx 1995-2005</option>
                  <option value="-acura--rsx-" cd="0.32" area="1.93" mass="" disp=""> Acura Rsx 2002-2004</option>
                  <option value="-alfa-romeo--145-" cd="0.32" area="2.08" mass="" disp=""> Alfa Romeo 145 1994-2001</option>
                  <option value="-aptera--2e-" cd="0.15" area="1.85" mass="" disp=""> Aptera 2E prototype</option>
                  <option value="-audi--a3-" cd="0.31" area="2.08" mass="" disp=""> Audi A3 1996-2003</option>
                  <option value="-audi--a4-" cd="0.29" area="2.03" mass="" disp=""> Audi A4 1994-2001</option>
                  <option value="-audi--a6-" cd="0.29" area="2.12" mass="" disp=""> Audi A6 1997-2004</option>
                  <option value="-audi--a8-" cd="0.28" area="2.25" mass="" disp=""> Audi A8 1994-2002</option>
                  <option value="-audi--tt-" cd="0.34" area="1.99" mass="" disp=""> Audi Tt 1998-2006</option>
                  <option value="-audi--tt-" cd="0.30" area="2.09" mass="" disp=""> Audi Tt 2006-</option>
                  <option value="-bmw--compact-" cd="0.31" area="1.95" mass="" disp=""> Bmw Compact 1993-2000</option>
                  <option value="-bmw--3-series-" cd="0.30" area="1.96" mass="" disp=""> Bmw 3-Series 1990-1999</option>
                  <option value="-bmw--5-series-" cd="0.27" area="2.17" mass="" disp=""> Bmw 5-Series 1995-2003</option>
                  <option value="-bmw--7-series-" cd="0.30" area="2.21" mass="" disp=""> Bmw 7-Series 1994-2001</option>
                  <option value="-buick--lesabre-" cd="0.36" area="2.25" mass="" disp=""> Buick Lesabre 1991</option>
                  <option value="-buick--park-avenue-" cd="0.31" area="2.25" mass="" disp=""> Buick Park Avenue 1991-1993</option>
                  <option value="-buick--park-avenue-" cd="0.31" area="2.19" mass="" disp=""> Buick Park Avenue 1994-1996</option>
                  <option value="-buick--regal-gs-" cd="0.36" area="2.08" mass="" disp=""> Buick Regal Gs 1991</option>
                  <option value="-chevrolet--astro-van-" cd="0.40" area="3.17" mass="" disp=""> Chevrolet Astro Van 1995-2005</option>
                  <option value="-chevrolet--aveo-" cd="0.35" area="2.16" mass="" disp=""> Chevrolet Aveo 2004-2008</option>
                  <option value="-chevrolet--aveo-hatchback-" cd="0.32" area="2.13" mass="" disp=""> Chevrolet Aveo Hatchback 2009</option>
                  <option value="-chevrolet--aveo-sedan-" cd="0.32" area="2.14" mass="" disp=""> Chevrolet Aveo Sedan 2009</option>
                  <option value="-chevrolet--camaro-" cd="0.34" area="2.04" mass="" disp=""> Chevrolet Camaro 1993-2002</option>
                  <option value="-chevrolet--cavalier-" cd="0.36" area="1.88" mass="" disp=""> Chevrolet Cavalier 1995-2005</option>
                  <option value="-chevrolet--monte-carlo-" cd="0.36" area="2.1" mass="" disp=""> Chevrolet Monte Carlo 1995-2000</option>
                  <option value="-chevrolet--volt-" cd="0.28" area="2.16" mass="" disp=""> Chevrolet Volt 2011</option>
                  <option value="-chrysler--pt-cruiser-" cd="0.40" area="2.21" mass="" disp=""> Chrysler Pt Cruiser 2000-2006</option>
                  <option value="-chrysler--sebring-" cd="0.32" area="1.93" mass="" disp=""> Chrysler Sebring 1995-2000</option>
                  <option value="-chrysler--sebring-convertible-" cd="0.36" area="2.03" mass="" disp=""> Chrysler Sebring Convertible 1996-2000</option>
                  <option value="-chrysler--voyager-" cd="0.37" area="2.8" mass="" disp=""> Chrysler Voyager 1996-2000</option>
                  <option value="-daewoo--espero-" cd="0.32" area="2.02" mass="" disp=""> Daewoo Espero 1990-1997</option>
                  <option value="-daewoo--nexia-" cd="0.34" area="1.95" mass="" disp=""> Daewoo Nexia 1994-1997</option>
                  <option value="-dodge--avenger-" cd="0.326" area="2.34" mass="" disp=""> Dodge Avenger 2008-2009</option>
                  <option value="-dodge--caravan-" cd="0.35" area="2.85" mass="" disp=""> Dodge Caravan 1996-2000</option>
                  <option value="-dodge--magnum-(rwd)-se-" cd="0.337" area="2.36" mass="" disp=""> Dodge Magnum (Rwd) Se 2005-2007</option>
                  <option value="-dodge--magnum-(rwd)-sxt-" cd="0.346" area="2.36" mass="" disp=""> Dodge Magnum (Rwd) Sxt 2005-2007</option>
                  <option value="-dodge--magnum-(rwd)-r/t-" cd="0.355" area="2.36" mass="" disp=""> Dodge Magnum (Rwd) R/T 2005-2007</option>
                  <option value="-dodge--magnum-(awd)-sxt,-r/t-" cd="0.365" area="2.36" mass="" disp=""> Dodge Magnum (Awd) Sxt, R/T 2005-2007</option>
                  <option value="-dodge--neon-" cd="0.33" area="2.01" mass="" disp=""> Dodge Neon 1995-1999</option>
                  <option value="-dodge--ram-1500-qc" cd="0.52" area="3.26" mass="" disp=""> Dodge Ram 1500 Qc2002-2008</option>
                  <option value="-dodge--ram-srt10-" cd="0.45" area="3.21" mass="" disp=""> Dodge Ram Srt10 2004-2006</option>
                  <option value="-dodge--shadow-" cd="0.42" area="1.95" mass="" disp=""> Dodge Shadow 1991-1994</option>
                  <option value="-fiat--bravo-" cd="0.32" area="2.05" mass="" disp=""> Fiat Bravo 1995-2001</option>
                  <option value="-fiat--cinquecento-" cd="0.33" area="1.8" mass="" disp=""> Fiat Cinquecento 1991-1998</option>
                  <option value="-fiat--punto-" cd="0.30" area="1.95" mass="" disp=""> Fiat Punto 1993-1999</option>
                  <option value="-fiat--ulysse-" cd="0.34" area="2.69" mass="" disp=""> Fiat Ulysse 1994-2003</option>
                  <option value="-ford--aspire-" cd="0.36" area="1.97" mass="" disp=""> Ford Aspire 1994-1997</option>
                  <option value="-ford--escort-(euro)-" cd="0.32" area="1.94" mass="" disp=""> Ford Escort (Euro) 1995-2000</option>
                  <option value="-ford--escort-" cd="0.36" area="1.84" mass="" disp=""> Ford Escort 1997-2002</option>
                  <option value="-ford--explorer-ii-" cd="0.43" area="3.06" mass="" disp=""> Ford Explorer Ii 1995-2001</option>
                  <option value="-ford--f-150-lightning-" cd="0.36" area="2.93" mass="2120" disp="5410"> Ford F-150 Lightning 1999-2004</option>
                  <option value="-ford--fiesta-" cd="0.36" area="1.84" mass="" disp=""> Ford Fiesta 1995-2002</option>
                  <option value="-ford--fiesta-" cd="0.33" area="2.13" mass="" disp=""> Ford Fiesta 2011-</option>
                  <option value="-ford--galaxy-" cd="0.32" area="2.68" mass="" disp=""> Ford Galaxy 1995-2000</option>
                  <option value="-ford--ka-" cd="0.35" area="1.88" mass="" disp=""> Ford Ka 1996-2008</option>
                  <option value="-ford--maverick-" cd="0.52" area="2.71" mass="" disp=""> Ford Maverick 1988-1994</option>
                  <option value="-ford--mondeo-" cd="0.31" area="2.05" mass="" disp=""> Ford Mondeo 1996-2000</option>
                  <option value="-ford--mondeo-turnier-" cd="0.32" area="2.06" mass="" disp=""> Ford Mondeo Turnier 1996-2000</option>
                  <option value="-ford--ranger-" cd="0.49" area="2.41" mass="" disp=""> Ford Ranger 2001</option>
                  <option value="-ford--scorpio-" cd="0.32" area="2.05" mass="" disp=""> Ford Scorpio 1985-1998</option>
                  <option value="-ford--svt-mustang-cobra-" cd="0.37" area="2.01" mass="" disp=""> Ford Svt Mustang Cobra 1994-2004</option>
                  <option value="-ford--thunderbird-" cd="0.31" area="1.99" mass="" disp=""> Ford Thunderbird 1989-1997</option>
                  <option value="-ford--windstar-i-" cd="0.35" area="2.79" mass="" disp=""> Ford Windstar I 1994-1998</option>
                  <option value="-geo--metro-4dr-" cd="0.32" area="1.81" mass="" disp=""> Geo Metro 4Dr 1995-1997</option>
                  <option value="-geo--metro-2dr-hatch-" cd="0.34" area="1.86" mass="" disp=""> Geo Metro 2Dr Hatch 1995-1997</option>
                  <option value="-gmc--sierra-xfe-" cd="0.412" area="3.19" mass="" disp=""> Gmc Sierra Xfe 2009</option>
                  <option value="-honda--accord-ex-coupe-" cd="0.34" area="2.03" mass="" disp=""> Honda Accord Ex Coupe 1998-2002</option>
                  <option value="-honda--civic-hatch" cd="0.33" area="1.87" mass="" disp=""> Honda Civic Hatch 1988-1991</option>
                  <option value="-honda--civic-coupe-" cd="0.32" area="1.85" mass="" disp=""> Honda Civic Coupe 1992-1995</option>
                  <option value="-honda--civic-coupe-" cd="0.29" area="2.03" mass="" disp=""> Honda Civic Coupe 2006-</option>
                  <option value="-honda--civic-del-sol-" cd="0.35" area="1.72" mass="" disp=""> Honda Civic Del Sol 1992-1997</option>
                  <option value="-honda--civic-hatch-" cd="0.31" area="1.85" mass="" disp=""> Honda Civic Hatch 1992-1995</option>
                  <option value="-honda--civic-hatch-" cd="0.36" area="2.03" mass="" disp=""> Honda Civic Hatch 1996-2000</option>
                  <option value="-honda--civic-sedan-" cd="0.32" area="1.99" mass="" disp=""> Honda Civic Sedan 1996-2000</option>
                  <option value="-honda--civic-hybrid-" cd="0.28" area="1.99" mass="" disp=""> Honda Civic Hybrid 2003-2005</option>
                  <option value="-honda--civic-hybrid-" cd="0.27" area="2.03" mass="" disp=""> Honda Civic Hybrid 2005-</option>
                  <option value="-honda--civic-si-" cd="0.34" area="1.9" mass="" disp=""> Honda Civic Si 1996-2000</option>
                  <option value="-honda--crx-" cd="0.32" area="1.7" mass="" disp=""> Honda Crx 1984-1987</option>
                  <option value="-honda--crx-" cd="0.30" area="1.73" mass="" disp=""> Honda Crx 1988-1991</option>
                  <option value="-honda--crx-hf-" cd="0.29" area="1.73" mass="" disp=""> Honda Crx Hf 1988-1991</option>
                  <option value="-honda--insight-" cd="0.25" area="1.86" mass="" disp=""> Honda Insight 2000-2006</option>
                  <option value="-honda--insight-" cd="0.28" area="2.03" mass="" disp=""> Honda Insight 2010-</option>
                  <option value="-honda--fit-" cd="0.35" area="2.15" mass="" disp=""> Honda Fit 2006-2008</option>
                  <option value="-honda--prelude-" cd="0.32" area="1.87" mass="" disp=""> Honda Prelude 1997-2001</option>
                  <option value="-honda--s2000-" cd="0.33" area="1.82" mass="" disp=""> Honda S2000 2000-</option>
                  <option value="-hyundai--accent/pony/excel-" cd="0.31" area="1.91" mass="" disp=""> Hyundai Accent/Pony/Excel 1994-1999</option>
                  <option value="-hyundai--elantra-" cd="0.33" area="1.92" mass="" disp=""> Hyundai Elantra 1996-2000</option>
                  <option value="-hyundai--elantra-" cd="0.34" area="1.99" mass="" disp=""> Hyundai Elantra 2001-2006</option>
                  <option value="-hyundai--elantra-" cd="0.32" area="2.13" mass="" disp=""> Hyundai Elantra 2007-</option>
                  <option value="-hyundai--elantra-touring-" cd="0.33" area="2.17" mass="" disp=""> Hyundai Elantra Touring 2007-</option>
                  <option value="-hyundai--elantra-wagon-" cd="0.33" area="2.01" mass="" disp=""> Hyundai Elantra Wagon 1996-1997</option>
                  <option value="-hyundai--elantra-wagon-" cd="0.33" area="2.05" mass="" disp=""> Hyundai Elantra Wagon 1998-2000</option>
                  <option value="-hyundai--sonata-" cd="0.32" area="2.18" mass="" disp=""> Hyundai Sonata 2006-</option>
                  <option value="-hyundai--tiburon-gt" cd="0.32" area="1.9" mass="" disp=""> Hyundai Tiburon Gt2002-</option>
                  <option value="infiniti-g20------" cd="0.30" area="1.98" mass="" disp="">InfinitiG20      1991-1996</option>
                  <option value="infiniti-g20------" cd="0.30" area="1.99" mass="" disp="">InfinitiG20      1999-2002</option>
                  <option value="infiniti-q45------" cd="0.30" area="2.31" mass="" disp="">InfinitiQ45      2002-2006</option>
                  <option value="-jeep--cherokee--" cd="0.52" area="2.28" mass="" disp=""> Jeep Cherokee  1984-2001</option>
                  <option value="-jeep--grand-cherokee--" cd="0.42" area="2.41" mass="" disp=""> Jeep Grand Cherokee  1993-1998</option>
                  <option value="-jeep--liberty--" cd="0.394" area="2.81" mass="" disp=""> Jeep Liberty  2012</option>
                  <option value="-jeep--wrangler-tj-hardtop" cd="0.55" area="2.58" mass="" disp=""> Jeep Wrangler Tj-Hardtop1997-2005</option>
                  <option value="-jeep--wrangler-tj-soft-top-" cd="0.58" area="2.64" mass="" disp=""> Jeep Wrangler Tj-Soft Top 1997-2005</option>
                  <option value="-lancia--delta-hpe-(3-door)-" cd="0.33" area="2.09" mass="" disp=""> Lancia Delta Hpe (3-Door) 1993-1999</option>
                  <option value="-lexus--ls-400-" cd="0.27" area="2.23" mass="" disp=""> Lexus Ls 400 1994-2000</option>
                  <option value="-mazda--323-c-" cd="0.33" area="1.98" mass="" disp=""> Mazda 323 C 1994-1998</option>
                  <option value="-mazda--626-" cd="0.29" area="2.01" mass="" disp=""> Mazda 626 1992-1997</option>
                  <option value="-mazda--miata-" cd="0.38" area="1.64" mass="" disp=""> Mazda Miata 1998-2005</option>
                  <option value="-mazda--mx-3-" cd="0.32" area="1.8" mass="" disp=""> Mazda Mx-3 1992-1995</option>
                  <option value="-mazda--rx-7-" cd="0.33" area="1.75" mass="" disp=""> Mazda Rx-7 1992-2002</option>
                  <option value="-mazda--xedos-6-" cd="0.31" area="1.89" mass="" disp=""> Mazda Xedos 6 1992-1999</option>
                  <option value="-mazda--xedos-9/millenia-" cd="0.28" area="2.18" mass="" disp=""> Mazda Xedos 9/Millenia 1993-2003</option>
                  <option value="-mercedes-benz--c-class-" cd="0.30" area="2.05" mass="" disp=""> Mercedes-Benz C-Class 1993-2000</option>
                  <option value="-mercedes--cl500-" cd="0.28" area="2.22" mass="" disp=""> Mercedes Cl500 1998-2000</option>
                  <option value="-mercedes-benz--e-class-" cd="0.27" area="2.16" mass="" disp=""> Mercedes-Benz E-Class 1995-2002</option>
                  <option value="-mercedes-benz--g-class-" cd="0.53" area="2.94" mass="" disp=""> Mercedes-Benz G-Class 1990-</option>
                  <option value="-mercedes-benz--s-class-" cd="0.31" area="2.38" mass="" disp=""> Mercedes-Benz S-Class 1991-1999</option>
                  <option value="-mercedes--sl600-" cd="0.45" area="1.97" mass="" disp=""> Mercedes Sl600 1989-2002</option>
                  <option value="-mercedes-benz--vito-" cd="0.34" area="3.18" mass="" disp=""> Mercedes-Benz Vito 1996-2003</option>
                  <option value="-mercury--cougar-" cd="0.31" area="1.9" mass="" disp=""> Mercury Cougar 1999-2002</option>
                  <option value="-mini--mini-cooper-s-" cd="0.33" area="1.98" mass="" disp=""> Mini Mini Cooper S 2001-2006</option>
                  <option value="-mitsubishi--colt-" cd="0.30" area="2.0" mass="" disp=""> Mitsubishi Colt 1995-2002</option>
                  <option value="-mitsubishi--eclipse-gs-t-" cd="0.29" area="1.9" mass="" disp=""> Mitsubishi Eclipse Gs-T 1995-1999</option>
                  <option value="-mitsubishi--eclipse-gts-" cd="0.35" area="1.9" mass="" disp=""> Mitsubishi Eclipse Gts 2000-2005</option>
                  <option value="-mitsubishi--i-" cd="0.35" area="2.16" mass="" disp=""> Mitsubishi I 2012-</option>
                  <option value="-mitsubishi--lancer-" cd="0.30" area="1.95" mass="" disp=""> Mitsubishi Lancer 2000-2007</option>
                  <option value="-mitsubishi--mirage-coupe" cd="0.32" area="1.78" mass="" disp=""> Mitsubishi Mirage Coupe1991-1996</option>
                  <option value="-mitsubishi--mirage-hatch" cd="0.28" area="2.04" mass="" disp=""> Mitsubishi Mirage Hatch2014-</option>
                  <option value="-mitsubishi--pajero-" cd="0.49" area="2.53" mass="" disp=""> Mitsubishi Pajero 1991-1999</option>
                  <option value="-nissan--200sx-se-" cd="0.30" area="1.77" mass="" disp=""> Nissan 200Sx Se 1991-1994</option>
                  <option value="-nissan--200sx-se-r-" cd="0.34" area="1.89" mass="" disp=""> Nissan 200Sx Se-R 1995-1999</option>
                  <option value="-nissan--300zx-turbo" cd="0.31" area="1.81" mass="" disp=""> Nissan 300Zx Turbo1990-1996</option>
                  <option value="-nissan--350z-" cd="0.31" area="1.94" mass="" disp=""> Nissan 350Z 2002-</option>
                  <option value="-nissan--almera-" cd="0.30" area="1.9" mass="" disp=""> Nissan Almera 1995-2000</option>
                  <option value="-nissan--altima-" cd="0.34" area="1.96" mass="" disp=""> Nissan Altima 1993-1997</option>
                  <option value="-nissan--altima-" cd="0.32" area="2.02" mass="" disp=""> Nissan Altima 1998-2001</option>
                  <option value="-nissan--altima-" cd="0.32" area="2.13" mass="" disp=""> Nissan Altima 2002-2006</option>
                  <option value="-nissan--altima-coupe-" cd="0.31" area="2.04" mass="" disp=""> Nissan Altima Coupe 2007-</option>
                  <option value="-nissan--altima-hybrid-" cd="0.30" area="2.11" mass="" disp=""> Nissan Altima Hybrid 2007-</option>
                  <option value="-nissan--altima-sedan-" cd="0.31" area="2.14" mass="" disp=""> Nissan Altima Sedan 2007-</option>
                  <option value="-nissan--cube------" cd="0.35" area="2.35" mass="" disp=""> Nissan Cube      2008-</option>
                  <option value="-nissan--leaf-" cd="0.28" area="2.3" mass="" disp=""> Nissan Leaf 2011-</option>
                  <option value="-nissan--maxima-----" cd="0.32" area="2.09" mass="" disp=""> Nissan Maxima     1995-1999</option>
                  <option value="-nissan--micra-" cd="0.35" area="1.82" mass="" disp=""> Nissan Micra 1992-2003</option>
                  <option value="-nissan--murano-" cd="0.39" area="2.67" mass="" disp=""> Nissan Murano 2003-2007</option>
                  <option value="-nissan--murano-" cd="0.39" area="2.7" mass="" disp=""> Nissan Murano 2008-</option>
                  <option value="-nissan--nx2000-" cd="0.32" area="1.86" mass="" disp=""> Nissan Nx2000 1991-1993</option>
                  <option value="-nissan--patrol-gr-" cd="0.52" area="2.71" mass="" disp=""> Nissan Patrol Gr 1987-1998</option>
                  <option value="-nissan--primera-" cd="0.29" area="1.96" mass="" disp=""> Nissan Primera 1995-1999</option>
                  <option value="-nissan--sentra-" cd="0.35" area="1.82" mass="" disp=""> Nissan Sentra 1991-1994</option>
                  <option value="-nissan--sentra-" cd="0.33" area="1.9" mass="" disp=""> Nissan Sentra 1995-1999</option>
                  <option value="-nissan--sentra-" cd="0.33" area="1.95" mass="" disp=""> Nissan Sentra 2000-2006</option>
                  <option value="-nissan--sentra-" cd="0.35" area="2.19" mass="" disp=""> Nissan Sentra 2007-</option>
                  <option value="-nissan--terrano-ii-" cd="0.44" area="2.73" mass="" disp=""> Nissan Terrano Ii 1996-2004</option>
                  <option value="-nissan--versa-" cd="0.31" area="2.11" mass="" disp=""> Nissan Versa 2004-</option>
                  <option value="-opel--astra-" cd="0.32" area="1.97" mass="" disp=""> Opel Astra 1991-1998</option>
                  <option value="-opel--astra-caravan-" cd="0.33" area="2.02" mass="" disp=""> Opel Astra Caravan 1991-1998</option>
                  <option value="-opel--corsa-b-" cd="0.36" area="1.88" mass="" disp=""> Opel Corsa B 1992-2000</option>
                  <option value="-opel--corsa-c-" cd="0.32" area="1.96" mass="" disp=""> Opel Corsa C 2000-2006</option>
                  <option value="-opel--calibra-2.0i-" cd="0.26" area="1.93" mass="" disp=""> Opel Calibra 2.0I 1989-1997</option>
                  <option value="-opel--omega-b-" cd="0.29" area="2.15" mass="" disp=""> Opel Omega B 1994-1999</option>
                  <option value="-opel--sintra-" cd="0.34" area="2.8" mass="" disp=""> Opel Sintra 1996-1999</option>
                  <option value="-opel--tigra-" cd="0.31" area="1.78" mass="" disp=""> Opel Tigra 1994-2001</option>
                  <option value="-opel--vectra-a-" cd="0.29" area="2.03" mass="" disp=""> Opel Vectra A 1988-1995</option>
                  <option value="-opel--vectra-b-" cd="0.28" area="2.02" mass="" disp=""> Opel Vectra B 1995-2002</option>
                  <option value="-peugeot--106-" cd="0.32" area="1.81" mass="" disp=""> Peugeot 106 1991-2004</option>
                  <option value="-peugeot--306-" cd="0.32" area="1.92" mass="" disp=""> Peugeot 306 1993-2002</option>
                  <option value="-peugeot--307-sw-" cd="0.33" area="2.55" mass="" disp=""> Peugeot 307 Sw 2001-2008</option>
                  <option value="-peugeot--406-" cd="0.31" area="2.05" mass="" disp=""> Peugeot 406 1995-2004</option>
                  <option value="-peugeot--806-" cd="0.34" area="2.69" mass="" disp=""> Peugeot 806 1994-2002</option>
                  <option value="-pontiac--bonneville-" cd="0.36" area="2.26" mass="" disp=""> Pontiac Bonneville 1992-1997</option>
                  <option value="-pontiac--fiero-" cd="0.36" area="1.74" mass="" disp=""> Pontiac Fiero 1986</option>
                  <option value="-pontiac--grand-am-gt-" cd="0.34" area="1.96" mass="" disp=""> Pontiac Grand Am Gt 1992</option>
                  <option value="-pontiac--grand-am-se-" cd="0.34" area="1.93" mass="" disp=""> Pontiac Grand Am Se 1992</option>
                  <option value="-pontiac--grand-prix-" cd="0.34" area="2.07" mass="" disp=""> Pontiac Grand Prix 1991</option>
                  <option value="-pontiac--firebird-trans-am-" cd="0.34" area="2.04" mass="" disp=""> Pontiac Firebird Trans Am 1993-2002</option>
                  <option value="-pontiac--trans-sport-" cd="0.30" area="2.66" mass="" disp=""> Pontiac Trans Sport 1990-1996</option>
                  <option value="-porsche--914-" cd="0.36" area="1.6" mass="" disp=""> Porsche 914 1969-1976</option>
                  <option value="-renault--clio-" cd="0.33" area="1.86" mass="" disp=""> Renault Clio 1990-1998</option>
                  <option value="-renault--espace-ii-" cd="0.32" area="2.59" mass="" disp=""> Renault Espace Ii 1991-1997</option>
                  <option value="-renault--espace-iii-" cd="0.31" area="2.58" mass="" disp=""> Renault Espace Iii 1997-2003</option>
                  <option value="-renault--laguna-" cd="0.30" area="2.07" mass="" disp=""> Renault Laguna 1993-2001</option>
                  <option value="-renault--megane-" cd="0.32" area="1.99" mass="" disp=""> Renault Megane 1995-2002</option>
                  <option value="-renault--twingo-" cd="0.35" area="1.95" mass="" disp=""> Renault Twingo 1992-2007</option>
                  <option value="-rover--214-" cd="0.33" area="2.0" mass="" disp=""> Rover 214 1995-1999</option>
                  <option value="-saab--900-(classic)-" cd="0.34" area="2.03" mass="" disp=""> Saab 900 (Classic) 1979-1993</option>
                  <option value="-saab--9000-cs-" cd="0.32" area="2.08" mass="" disp=""> Saab 9000 Cs 1992-1998</option>
                  <option value="-saab--sonett-iii-(model-97)-" cd="0.31" area="1.41" mass="" disp=""> Saab Sonett Iii (Model 97) 1970-1974</option>
                  <option value="-saturn--sc-" cd="0.32" area="1.86" mass="" disp=""> Saturn Sc 1991-1996</option>
                  <option value="-saturn--sc-" cd="0.31" area="1.93" mass="" disp=""> Saturn Sc 1996-2002</option>
                  <option value="-saturn--sc2-" cd="0.33" area="1.94" mass="" disp=""> Saturn Sc2 1997-2002</option>
                  <option value="-saturn--sl-" cd="0.34" area="1.92" mass="" disp=""> Saturn Sl 1991-1995</option>
                  <option value="-saturn--sl-" cd="0.32" area="1.98" mass="" disp=""> Saturn Sl 1996-2002</option>
                  <option value="-saturn--sw-" cd="0.36" area="1.98" mass="" disp=""> Saturn Sw 1996-2001</option>
                  <option value="-scion--tc-" cd="0.32" area="2.01" mass="" disp=""> Scion Tc 2005-</option>
                  <option value="-scion--xa-" cd="0.31" area="2.1" mass="" disp=""> Scion Xa 2004-2007</option>
                  <option value="-scion--xb-" cd="0.35" area="2.25" mass="" disp=""> Scion Xb 2004-2007</option>
                  <option value="-scion--xb-" cd="0.32" area="2.34" mass="" disp=""> Scion Xb 2008-</option>
                  <option value="-scion--xd-" cd="0.32" area="2.13" mass="" disp=""> Scion Xd 2008-</option>
                  <option value="-seat--cordoba-" cd="0.32" area="1.95" mass="" disp=""> Seat Cordoba 1993-2002</option>
                  <option value="-seat--ibiza-" cd="0.33" area="1.94" mass="" disp=""> Seat Ibiza 1993-1999</option>
                  <option value="-seat--toledo-" cd="0.32" area="1.96" mass="" disp=""> Seat Toledo 1991-1998</option>
                  <option value="-subaru--impreza-2.5rs-" cd="0.36" area="1.94" mass="" disp=""> Subaru Impreza 2.5Rs 1993-2001</option>
                  <option value="-subaru--impreza-wrx-" cd="0.33" area="2.1" mass="" disp=""> Subaru Impreza Wrx 2002-2007</option>
                  <option value="-subaru--legacy-" cd="0.35" area="2.16" mass="" disp=""> Subaru Legacy 1994-1999</option>
                  <option value="-subaru--legacy-" cd="0.31" area="2.08" mass="" disp=""> Subaru Legacy 2009</option>
                  <option value="-subaru--legacy-wagon-" cd="0.32" area="2.09" mass="" disp=""> Subaru Legacy Wagon 1995-1999</option>
                  <option value="-subaru--legacy-outback-wagon-" cd="0.32" area="2.29" mass="" disp=""> Subaru Legacy Outback Wagon 1995-1999</option>
                  <option value="-subaru--legacy-outback-wagon-" cd="0.32" area="2.17" mass="" disp=""> Subaru Legacy Outback Wagon 2000-2004</option>
                  <option value="-subaru--outback-wagon-" cd="0.31" area="2.15" mass="" disp=""> Subaru Outback Wagon 2005-2009</option>
                  <option value="-subaru--outback-wagon-" cd="0.37" area="2.55" mass="" disp=""> Subaru Outback Wagon 2010-</option>
                  <option value="-subaru--loyale-wagon-" cd="0.38" area="1.83" mass="" disp=""> Subaru Loyale Wagon 1988-1994</option>
                  <option value="-toyota--camry-" cd="0.31" area="2.05" mass="" disp=""> Toyota Camry 1991-1996</option>
                  <option value="-toyota--camry-solara-" cd="0.36" area="2.04" mass="" disp=""> Toyota Camry Solara 1999-2003</option>
                  <option value="-toyota--carina-" cd="0.30" area="1.95" mass="" disp=""> Toyota Carina 1996-2001</option>
                  <option value="-toyota--celica-gt-s-" cd="0.34" area="1.78" mass="" disp=""> Toyota Celica Gt-S 1994-1999</option>
                  <option value="-toyota--celica-gt-" cd="0.32" area="1.9" mass="" disp=""> Toyota Celica Gt 2000-2006</option>
                  <option value="-toyota--corolla-" cd="0.33" area="1.86" mass="" disp=""> Toyota Corolla 1993-1997</option>
                  <option value="-toyota--corolla-" cd="0.31" area="1.9" mass="" disp=""> Toyota Corolla 1998-2002</option>
                  <option value="-toyota--corolla" cd="0.30" area="2.04" mass="" disp=""> Toyota Corolla2003-2008</option>
                  <option value="-toyota--corolla-" cd="0.29" area="2.09" mass="" disp=""> Toyota Corolla 2009-</option>
                  <option value="-toyota--echo-" cd="0.29" area="2.03" mass="" disp=""> Toyota Echo 2000-2005</option>
                  <option value="-toyota--iq-3dr" cd="0.299" area="2.15" mass="" disp=""> Toyota Iq 3Dr2010-</option>
                  <option value="-toyota--matrix-" cd="0.32" area="2.25" mass="" disp=""> Toyota Matrix 2003-2008</option>
                  <option value="-toyota--matrix-" cd="0.33" area="2.21" mass="" disp=""> Toyota Matrix 2009-</option>
                  <option value="-toyota--mr2-" cd="0.32" area="1.68" mass="" disp=""> Toyota Mr2 1985-1989</option>
                  <option value="-toyota--mr2-" cd="0.31" area="1.7" mass="" disp=""> Toyota Mr2 1991-1995</option>
                  <option value="-toyota--mr-spyder-" cd="0.31" area="1.7" mass="" disp=""> Toyota Mr-Spyder 1999-2007</option>
                  <option value="-toyota--paseo-" cd="0.32" area="1.72" mass="" disp=""> Toyota Paseo 1992-1995</option>
                  <option value="-toyota--paseo-" cd="0.32" area="1.75" mass="" disp=""> Toyota Paseo 1996-1998</option>
                  <option value="-toyota--previa-" cd="0.33" area="2.65" mass="" disp=""> Toyota Previa 1990-2000</option>
                  <option value="-toyota--prius-" cd="0.29" area="2.01" mass="" disp=""> Toyota Prius 2000-2003</option>
                  <option value="-toyota--prius-" cd="0.26" area="2.08" mass="" disp=""> Toyota Prius 2004-2009</option>
                  <option value="-toyota--prius-" cd="0.25" area="2.17" mass="" disp=""> Toyota Prius 2010-</option>
                  <option value="-toyota--supra-" cd="0.32" area="1.87" mass="" disp=""> Toyota Supra 1993-2002</option>
                  <option value="-toyota--tercel-" cd="0.36" area="1.8" mass="" disp=""> Toyota Tercel 1991-1994</option>
                  <option value="-toyota--tercel-" cd="0.32" area="1.82" mass="" disp=""> Toyota Tercel 1995-1999</option>
                  <option value="-toyota--yaris-" cd="0.29" area="1.96" mass="" disp=""> Toyota Yaris 2007-</option>
                  <option value="-volkswagen--1l-concept-" cd="0.15" area="1.02" mass="" disp=""> Volkswagen 1L Concept </option>
                  <option value="-volkswagen--xl1-" cd="0.189" area="1.47" mass="" disp=""> Volkswagen Xl1 2014-</option>
                  <option value="-volkswagen--beetle-" cd="0.38" area="2.11" mass="1230" disp="1900"> Volkswagen Beetle 1998-</option>
                  <option value="-volkswagen--beetle-" cd="0.48" area="0.0" mass="790" disp="1300"> Volkswagen Beetle 1959-1979</option>
                  <option value="-volkswagen--caravelle/transporter-" cd="0.37" area="3.1" mass="" disp=""> Volkswagen Caravelle/Transporter 1990-2003</option>
                  <option value="-volkswagen--golf-" cd="0.32" area="1.98" mass="" disp=""> Volkswagen Golf 1997-2003</option>
                  <option value="-volkswagen--golf-variant-" cd="0.34" area="2.05" mass="" disp=""> Volkswagen Golf Variant 1997-2003</option>
                  <option value="-volkswagen--jetta-" cd="0.30" area="1.95" mass="" disp=""> Volkswagen Jetta 1993-1999</option>
                  <option value="-volkswagen--jetta-" cd="0.36" area="2.02" mass="" disp=""> Volkswagen Jetta 1986-1992</option>
                  <option value="-volkswagen--jetta-sedan-" cd="0.30" area="2.03" mass="" disp=""> Volkswagen Jetta Sedan 2000-2005</option>
                  <option value="-volkswagen--jetta--" cd="0.31" area="2.1" mass="" disp=""> Volkswagen Jetta  2006-</option>
                  <option value="-volkswagen--jetta-wagon-" cd="0.30" area="2.09" mass="" disp=""> Volkswagen Jetta Wagon 2000-2005</option>
                  <option value="-volkswagen--passat-" cd="0.31" area="1.99" mass="" disp=""> Volkswagen Passat 1995-1997</option>
                  <option value="-volkswagen--passat-wagon-" cd="0.33" area="2.07" mass="" disp=""> Volkswagen Passat Wagon 1995-1997</option>
                  <option value="-volkswagen--passat-wagon-b5-" cd="0.27" area="2.13" mass="" disp=""> Volkswagen Passat Wagon B5 2000</option>
                  <option value="-volkswagen--polo-" cd="0.33" area="1.9" mass="" disp=""> Volkswagen Polo 1994-2002</option>
                  <option value="-volkswagen--sharan-" cd="0.32" area="2.68" mass="" disp=""> Volkswagen Sharan 1995-2000</option>
                  <option value="-volkswagen--vento/jetta-" cd="0.32" area="1.99" mass="" disp=""> Volkswagen Vento/Jetta 1992-1999</option>
                  <option value="-volvo--850-" cd="0.32" area="2.14" mass="" disp=""> Volvo 850 1992-1997</option>
                  <option value="-volvo--940-" cd="0.34" area="2.15" mass="" disp=""> Volvo 940 1990-1998</option>
                  <option value="-volvo--c70-coupe-" cd="0.32" area="2.07" mass="" disp=""> Volvo C70 Coupe 1997-2005</option>
                  <option value="-volvo--v70/v70xc-" cd="0.32" area="2.11" mass="" disp=""> Volvo V70/V70Xc 1996-2000</option>
                  <option value="-volvo--v70/v70xc-" cd="0.30" area="2.23" mass="" disp=""> Volvo V70/V70Xc 2001-2009</option>
                </select>
                <span id="vehicle-help" class="help">
                  <a href="end-user.php#vehicle-input">Can't find your vehicle?</a>
                </span>
              </div>
              <div id="mass-div" class="item">
                Mass: 
                <input type="number" class="number" name="mass" id="mass-input" min="50" step="1" size="5" value="2000">
                <span id="mass-help" class="help">
                  <a href="end-user.php#mass-input">Help?</a>
                </span>
                <div class="radio-container">
                  <input type="radio" name="mass-unit" value="kg" onchange="changeUnit('mass',1,0)" checked>Kilograms
                  <input type="radio" name="mass-unit" value="lb" onchange="changeUnit('mass',2.20462,0)">Pounds
                </div>
              </div>
              <div id="drag-div" class="item">
                Drag Coefficient: 
                <input type="number" class="number" name="drag" id="drag-input" min="0" step="0.01" value="0.35">
                <span id="drag-help" class="help">
                  <a href="end-user.php#drag-input">Help?</a>
                </span>
              </div>
              <div id="area-div" class="item">
                Frontal Surface Area: 
                <input type="number" class="number" name="area" id="area-input" min="0" step="0.01" size="5" value="2.00">
                <span id="area-help" class="help">
                  <a href="end-user.php#area-input">Help?</a>
                </span>
                <div class="radio-container">
                  <input type="radio" name="area-unit" value="m^2" onchange="changeUnit('area',1,2)" checked>Square meters
                  <input type="radio" name="area-unit" value="ft^2" onchange="changeUnit('area',10.7639,2)">Square feet
                </div>
              </div>
              <div id="disp-div" class="item">
                Engine Displacement:
                <input type="number" class="number" name="disp" id="disp-input" min="0" step="1" size="5" value="2000">
                <span id="disp-help" class="help">
                  <a href="end-user.php#disp-input">Help?</a>
                </span>
                <div class="radio-container">
                  <input type="radio" name="disp-unit" value="cm^3" onchange="changeUnit('disp',1,0)" checked>Cubic centimeters
                  <input type="radio" name="disp-unit" value="in^3" onchange="changeUnit('disp',1/16.387064,0)">Cubic inches
                </div>
              </div>
              <div id="routes-div" class="item">
                Number of Routes:
                <input type="number" class="range" name="routes" id="routes-input" min="1" max="5" step="1" value="3">
                <span id="area-help" class="help">
                  <a href="end-user.php#route-input">Help?</a>
                </span>
              </div>
            </div>
            <div id="id-div" class="item">
              Query ID:
              <input id="id-input" type="text" name="id" readonly>
              <span id="area-help" class="help">
                <a href="end-user.php#query-id-input">Help?</a>
              </span>
            </div>
            <input type="submit" value="Submit" onclick="cont()">
          </form>
        </div>
      </div>
      <div id="console">
      </div>
      <div id="output">
      </div>
    </div>
    <div id="map-canvas"></div>
    <iframe id="php" name="shell"></iframe>
  </body>
</html>