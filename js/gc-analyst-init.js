/*
 Vue.js Geocledian Analyst's Dashboard
 
 init script
 
 created: 2019-11-04, jsommer
 updated: 2022-04-22, jsommer
 version: 0.9.5
*/

// root Vue instance
var vmRoot;

// global gc locale object
// every component may append its data to this
var gcLocales = {
  en: {},
  de: {},
  lt: {}
};

// global i18n object
var i18n;

// init dependent javascript libs
const libs = ['https://unpkg.com/vue@2.6.14/dist/vue.min.js',
  'https://unpkg.com/vue-i18n@8.17.5/dist/vue-i18n.js',
  'https://unpkg.com/split.js@1.6.0/dist/split.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',
  // Google API Key - uncomment the following two lines and enter your valid API Key here
  // 'https://maps.googleapis.com/maps/api/js?key=YOUR_VALID_API_KEY_FROM_GOOGLE', 
  // 'https://unpkg.com/leaflet.gridlayer.googlemutant@0.11.2/dist/Leaflet.GoogleMutant.js',
  'https://unpkg.com/leaflet-geosearch@3.1.0/dist/bundle.min.js',
  'https://unpkg.com/vis-timeline@7.1.2/standalone/umd/vis-timeline-graph2d.min.js',
  // full screen
  'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js',
  '../gc-styles/bulma/0.6.2/bulma-ext/bulma-calendar/v1/bulma-calendar.min.js',
  '../gc-chart/js/d3.v6.min.js', // v6.7.0
  '../gc-chart/js/billboard.min.js', // v3.1.5
  '../gc-map/js/gc-map.min.js',
  '../gc-chart/js/gc-chart.min.js',
  '../gc-filter/js/gc-filter.min.js',
  '../gc-parceldata/js/gc-parceldata.min.js',
  '../gc-timeslider/js/gc-timeslider.min.js',
  '../gc-datasource/js/gc-datasource.min.js',
  '../gc-messages/js/gc-messages.min.js',
  '../gc-phenology-control/js/gc-phenology-control.min.js',
];

function gcGetBaseURL() {
  //get the base URL relative to the current script - regardless from where it was called
  // js files are loaded relative to the page
  // css files are loaded relative to its file
  let scriptURL = document.getElementById("gc-analyst-init");
  let url = new URL(scriptURL.src);
  let basename = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
  return url.href.split('/js/' + basename)[0];
}

function loadJSscriptDeps(url_list, final_callback) {
  /* 
    loads dependent javascript libraries async but in order as given in the url_list. 
    thanks to 
    https://stackoverflow.com/questions/7718935/load-scripts-asynchronously
  */
  function scriptExists(url_to_check) {

    let found = false;

    for (var i = 0; i < document.head.children.length; i++) {
      const script = document.head.children[i];

      // only scripts or links (css) are of interest
      if (!["SCRIPT", "LINK"].includes(script.tagName)) {
        continue;
      }

      if (script.src === url_to_check) {
        found = true;
        //console.error("Script already loaded: "+ url_to_check)
        break;
      }
    }
    return found;
  }

  function loadNext() {
    //console.debug("length of URLs: "+ url_list.length);
    if (!url_list.length) {
      console.debug("READY loading dependent libs");
      final_callback();
    }

    let url = url_list.shift();
    //console.debug("current URL: "+ url);

    if (url && !url.includes('http')) {
      url = gcGetBaseURL() + "/" + url;
      console.debug('loadNext()');
      console.debug(url);
    }

    // check google URL for valid key
    if (url && url.includes("YOUR_VALID_API_KEY_FROM_GOOGLE")) {
      console.error("Change the Google Maps API Key!");
      return;
    }

    // prevent multiple loading of same script urls
    if (url && !scriptExists(url)) {
      let script = document.createElement("script"); // create a script DOM node
      script.type = 'text/javascript';
      script.src = url; // set its src to the provided URL
      script.async = true;
      // if ready, load the next on in queue
      script.onload = script.onreadystatechange = function () {
        loadNext();
      };
      // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
      document.head.appendChild(script);
    } else {
      console.warn("URL already loaded - skipping: " + url);
    }
  }
  //first call
  loadNext();

}

function initComponent() {
  /* 
    inits component
  */
  i18n = new VueI18n({
    locale: 'en', // set locale
    fallbackLocale: 'en',
    messages: gcLocales, // set locale messages
  })

  // bind index locales to global locales
  gcLocales.de.indexLocales = indexLocales.de;
  gcLocales.en.indexLocales = indexLocales.en;
  gcLocales.lt.indexLocales = indexLocales.lt;

  /* when ready, init global vue root instance */
  vmRoot = new Vue({
    el: "#gc-app",
    data: {
      parcels: [],
      selectedParcelId: -1,
      visibleParcelIds: [], //updated from map!
      selectedProduct: "ndvi", //default preselected product is ndvi
      queryDate: "", //new Date().simpleDate(),
      dataSource: "",
      filterString: "",
      limit: 250,
      offset: 0,
      language: "en",
      // cropstatusCollapsed: true, //unused currently
      currentTimeseries: [],
      chartMode: "one-index", //"many-indices"
      // full chart zoom or full map zoom
      chartActive: false,
      mapActive: false,
      // visibility of tab components
      analyticsActive: true,
      messagesActive: true,
      timesliderActive: true,
      containerSplitSize: [65, 35],
      leftColumnShow: true,
      rightColumnShow: true,
      split: null,
      phStartdate: '',
      phEnddate: ''
    },
    i18n: i18n,
    created() {
      console.debug("gc-analyst-init created!");
      this.selectedParcelId = this.gcParcelId;
      i18n.locale = this.language;
      //i18n for index page
      this.setLocaleForIndexPage();
      //adds the query parameters of the current app to the link of each other app 
      this.addQueryParamsForNewApp();
    },
    mounted: function () {
      console.debug("root mounted!");

      // splitter functionality for dynamic resize between chart & map
      this.split = Split(['#leftColumn', '#rightColumn'], {
        sizes: this.containerSplitSize,
        gutterSize: 6,
        dragInterval: 6,
        cursor: 'col-resize',
        minSize: 0,
        onDrag: function () {
          // onDrag does not have current size
          this.$root.$emit("containerSizeChange", undefined);
        }.bind(this),
        // onDragEnd: function(sizes) {
        //   // onDrag does not have current size
        //   this.$root.$emit("containerSizeChange", sizes);
        // }.bind(this),
      });

      //set up listener for changes from child components
      this.$on('filterStringChange', this.filterStringChange);
      this.$on('limitChange', this.limitChange);
      this.$on('offsetChange', this.offsetChange);
      this.$on('parcelsChange', this.parcelsChange);
      this.$on('selectedParcelIdChange', this.selectedParcelIdChange);
      this.$on('selectedProductChange', this.selectedProductChange);
      this.$on('visibleParcelIdsChange', this.visibleParcelIdsChange);
      this.$on('queryDateChange', this.queryDateChange);
      this.$on('dataSourceChange', this.dataSourceChange);
      this.$on('timeseriesChange', this.timeseriesChange);
      this.$on('chartModeChange', this.chartModeChange);
      this.$on('phStartdateChange', this.phStartdateChange);
      this.$on('phEnddateChange', this.phEnddateChange);
      this.$on('getPhenology', this.getPhenology);
      this.$on('resetPhenology', this.resetPhenology);
      this.$on('newParcelAdded', this.newParcelAdded);

      this.containerSplitSize = [65, 35];

      //trigger apply filter
      for (var i = 0; i < this.$children.length; i++) {
        if (this.$children[i].gcWidgetId.includes("filter")) {
          this.$children[i].applyFilter();
        }
      }
    },
    watch: {
      parcels: function (newValue, oldValue) {
        console.debug("root parcels changed!");
      },
      filterString: function (newValue, oldValue) {
        console.debug("root filterString changed!");
      },
      language(newValue, oldValue) {
        i18n.locale = newValue;
        //i18n for index page
        this.setLocaleForIndexPage();
      },
      selectedParcelId(newValue, oldValue) {
        console.debug("root selectedParcelId changed!");
      },
      currentTimeseries(newValue, oldValue) {
        console.debug("root timeseries changed!");
      },
      containerSplitSize(newValue, oldValue) {
        console.debug("root containerSplitSize changed!");

        this.split.setSizes(newValue);

        // delegate container size change event
        this.$root.$emit("containerSizeChange", newValue);
      }
    },
    computed: {
      gcApikey: {
        get: function () {
          let key = this.getQueryVariable(window.location.search.substring(1), "key");
          return (key ? key : '39553fb7-7f6f-4945-9b84-a4c8745bdbec')
        }
      },
      gcHost: {
        get: function () {
          let host = this.getQueryVariable(window.location.search.substring(1), "host");
          return (host ? host : 'geocledian.com');
        }
      },
      gcParcelId: {
        get: function () {
          let parcel_id = parseInt(this.getQueryVariable(window.location.search.substring(1), "parcel_id"));
          console.debug("root - gcParcelId: " + parcel_id);
          return parcel_id;
        }
      },
      gcApiBaseUrl: {
        get() {
          return "/agknow/api/v4"
        }
      }
    },
    methods: {
      /* events for listening on child events */
      filterStringChange: function (filterString) {
        this.filterString = filterString;
      },
      limitChange: function (limit) {
        this.limit = limit;
      },
      offsetChange: function (offset) {
        this.offset = offset;
      },
      parcelsChange: function (parcels) {
        this.parcels = parcels;
        this.centroids = parcels;
        //TODO workaround as map does not filter parcels yet
        this.visibleParcelIds = this.parcels.map(p => p.parcel_id);
      },
      selectedParcelIdChange: function (selectedParcelId) {
        this.selectedParcelId = selectedParcelId;
        // reset timeseries & queryDate also, otherwise the current index will be set
        // from old timeseries
        this.currentTimeseries = [];
        this.queryDate = "";
      },
      selectedProductChange: function (product) {
        console.debug("root - selectedProduct setter - " + product);
        this.selectedProduct = product;
      },
      dataSourceChange: function (source) {
        this.dataSource = source;
      },
      visibleParcelIdsChange: function (visibleParcelIds) {
        this.visibleParcelIds = visibleParcelIds;
      },
      queryDateChange: function (queryDate) {
        // set only if changed, otherwise setter fires every time in children's queryDate properties!
        if (queryDate != this.queryDate)
          this.queryDate = queryDate;
      },
      phStartdateChange: function (phStartdate) {
        this.phStartdate = phStartdate;
      },
      phEnddateChange: function (phEnddate) {
        this.phEnddate = phEnddate;
      },
      timeseriesChange: function (value) {
        this.currentTimeseries = value;
      },
      chartModeChange: function (value) {
        this.chartMode = value;
      },
      getPhenology: function () {
        for (let i = 0; i < this.$children.length; i++) {
          if (this.$children[i].gcWidgetId.includes("chart")) {
            this.$children[i].getPhenology();
          }
        }
      },
      resetPhenology: function () {
        for (let i = 0; i < this.$children.length; i++) {
          if (this.$children[i].gcWidgetId.includes("chart")) {
            this.$children[i].phenology = [];
            this.$children[i].sos = [];
            this.$children[i].pos = [];
            this.$children[i].eos = [];
          }
        }
      },
      //https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
      getQueryVariable: function (query, variable) {
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
          }
        }
        console.log('Query variable %s not found', variable);
      },
      getAnalystsDashboardLink: function () {
        /* returns a dynamic link to the Analyst's Dashboard */

        let apiKey = "";
        let host = "";
        if (this.gcApikey) {
          apiKey = this.gcApikey;
        }
        if (this.gcHost) {
          host = this.gcHost;
        }
        return "https://geocledian.com/agclient/analyst/?key=" + apiKey + "&host=" + host;
      },
      setLocaleForIndexPage() {
        document.getElementById("navbarProductOverview").innerHTML = i18n.t("indexLocales.navbar.productOverview")
        document.getElementById("navbarAboutUs").innerHTML = i18n.t("indexLocales.navbar.about");
        document.getElementById("navbarCropPerformance").innerHTML = i18n.t("indexLocales.navbar.cropPerformance");
        document.getElementById("navbarDataValidation").innerHTML = i18n.t("indexLocales.navbar.validation");
        document.getElementById("navbarPortfolio").innerHTML = i18n.t("indexLocales.navbar.portfolio");
        document.getElementById("navbarZones").innerHTML = i18n.t("indexLocales.navbar.zones");
        document.getElementById("navbarHarvest").innerHTML = i18n.t("indexLocales.navbar.harvest");
        document.getElementById("allRightsReserved").innerHTML = i18n.t("indexLocales.footer.allRightsReserved");
        document.getElementById("tabSplitView").innerHTML = i18n.t("indexLocales.headings.splitview");
        document.getElementById("tabGraph").innerHTML = i18n.t("indexLocales.headings.graph");
        document.getElementById("tabMap").innerHTML = i18n.t("indexLocales.headings.map");
        document.getElementById("menuUtilities").innerHTML = i18n.t("indexLocales.headings.utilities");
        document.getElementById("menuSearch").innerHTML = i18n.t("indexLocales.headings.filter");
        document.getElementById("menuDetails").innerHTML = i18n.t("indexLocales.headings.details");
        document.getElementById("menuAnalytics").innerHTML = i18n.t("indexLocales.headings.analytics");
      },
      addQueryParamsForNewApp() {
        /* adds the query parameters of the current app to the link of each other app */
        let queryParams = window.location.search.substring(1);
        console.debug("QUERY PARAMS: " + queryParams);

        document.getElementById("navbarCropPerformance").href += "?" + queryParams;
        document.getElementById("navbarDataValidation").href += "?" + queryParams;
        document.getElementById("navbarPortfolio").href += "?" + queryParams;
        document.getElementById("navbarZones").href += "?" + queryParams;
        document.getElementById("navbarHarvest").href += "?" + queryParams;

      },
      async newParcelAdded(newParcelId) {
        for (var i = 0; i < this.$children.length; i++) {
          if (this.$children[i].gcWidgetId.includes("parceldata")) {

            await this.$children[i].getParcelTotalCount(this.filterString)
              .then(this.$children[i].setPaginationEnd())
              .then(this.selectedParcelId = newParcelId);

          }
        }
      }
    }
  });
}

function loadJSscript(url, callback) {
  /* 
    loads javascript library async and appends it to the DOM
    */
  let script = document.createElement("script"); // create a script DOM node
  script.type = 'text/javascript';
  script.src = gcGetBaseURL() + "/" + url; // set its src to the provided URL
  script.async = true;
  document.head.appendChild(script); // add it to the end of the head section of the page
  //if ready, call the callback function 
  script.onload = script.onreadystatechanged = function () {
    if (callback) {
      callback();
    }
  };
}

// async loading dependencies and init the component
loadJSscriptDeps(libs, initComponent);


Date.prototype.simpleDate = function () {
  var a = this.getFullYear(),
    b = this.getMonth() + 1,
    c = this.getDate();
  return a + "-" + (1 === b.toString().length ? "0" + b : b) + "-" + (1 === c.toString().length ? "0" + c : c)
}