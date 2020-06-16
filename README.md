# gc-analyst dashboard
## Description
gc-analyst is an JavaScript/HTML app for visualizing the outputs of the ag|knowledge REST API from [geocledian](https://www.geocledian.com).
It is composed of various [Vue.js](https://www.vuejs.org) components from geocledian.

## Purpose
With this application you have an interactive map widget for visualizing outputs from the REST API of ag|knowledge from geocledian.com. gc-analyst may load one parcel and analyze this parcel in depth by a selected agknowledge product (e.g. ndvi) both with a chart and a map.

## Integration
For the integration of the application you'll have to run the application with the provided init script `gc-analyst-init.js` which cares of loading dependent libraries like Vue, Leaflet, etc. **This is the recommended way!**

You have to add some dependencies in the head tag of the container website.
>Please ensure, that you load Vue.js (v.2.6.x) before loading the component first!
Also note that <a href="www.bulma.org">bulma.css</a> and <a href="www.fontawesome.org">Font awesome</a> wll be loaded through gc-analyst.css.


```html
<html>
  <head>

    <!--GC component begin -->

    <!-- loads also dependent css files via @import -->
    <link href="css/gc-analyst.css" rel="stylesheet">
    <!-- init script for components -->
    <script id="gc-analyst-init" type="text/javascript" src="js/gc-analyst-init.js" async></script>

    <!--GC component end -->
  </head>
```

Then you may create the widget(s) that build the whole application with custom HTML tags anywhere in the body section of the website. Make sure to use an unique identifier for each component. 

```html
<div id="gc-app">
  <gc-parcel-data 
    gc-widget-id="parceldata1"
    :gc-apikey="$root.gcApikey" 
    :gc-host="$root.gcHost"
    :gc-selected-parcel-id="$root.selectedParcelId"
    :gc-language="$root.language"
    gc-available-fields="parcelId,name,crop,entity,planting,harvest,area,promotion"
    gc-layout="horizontal">
  </gc-parcel-data>  

  <gc-timeslider
    gc-widget-id="timeslider1" 
    :gc-timeseries="$root.currentTimeseries"
    :gc-selected-date="$root.queryDate"
    gc-image-change-interval="1200"
    gc-available-options=""
    :gc-language="$root.language" >

  <gc-map       
      gc-widget-id="map1" 
      :gc-api-key="$root.gcApikey" 
      :gc-host="$root.gcHost"
      gc-basemap="osm"
      gc-available-tools="productSelector,queryIndexValue" 
      gc-available-products="ndvi,cire"
      :gc-selected-product="$root.selectedProduct"
      :gc-current-parcel-id="$root.selectedParcelId"
      :gc-parcels="$root.parcels"
      :gc-filter-string="$root.filterString"
      :gc-limit="$root.limit"
      :gc-offset="$root.offset"
      :gc-language="$root.language">
  </gc-map>

    <gc-chart 
      gc-widget-id="chart1"
        :gc-api-key="$root.gcApikey" 
        :gc-host="$root.gcHost"
        gc-mode="one-index"
        gc-available-products="ndvi,cire"
        :gc-selected-product="$root.selectedProduct"
        :gc-parcel-ids="$root.selectedParcelIds.join(',')"
        :gc-parcels="$root.parcels"
        :gc-zoom-startdate="$root.phStartdate"
        :gc-zoom-enddate="$root.phEnddate"
        :gc-selected-parcel-id="$root.selectedParcelId"
        :gc-options-collapsed="false"
        gc-available-options="dateZoom,legend"
        :gc-initial-loading="false"
        gc-datezoom-layout="horizontal"
        :gc-data-source="$root.selectedSource"
        :gc-language="$root.language"
        class="tile is-child">
    </gc-chart>

  
</div>
```

## Support
Please contact [us](mailto:info@geocledian.com) from geocledian.com if you have troubles using the application!

## Used Libraries
- [Vue.js](https://www.vuejs.org)
- [Vue I18n](https://kazupon.github.io/vue-i18n/)
- [Split.js](https://split.js.org/)
- [c3.js](https://c3js.org/)
- [Leaflet](https://leafletjs.com/)
- [Leaflet Draw Plugin](http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html)
- [Leaflet GeoSearch Plugin](https://github.com/smeijer/leaflet-geosearch)

## Legal: Terms of use from third party data providers
- You have to add the copyright information of the used data. At the time of writing the following text has to be visible for [Landsat](https://www.usgs.gov/information-policies-and-instructions/crediting-usgs) and [Sentinel](https://scihub.copernicus.eu/twiki/pub/SciHubWebPortal/TermsConditions/TC_Sentinel_Data_31072014.pdf) data:

```html
 contains Copernicus data 2020.
 U.S. Geological Service Landsat 8 used in compiling this information.
```

**geocledian is not responsible for illegal use of third party services.**