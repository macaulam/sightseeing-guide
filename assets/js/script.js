// store places in local storage using this key
const APP_ID = "sightseeing-guide";
// store wikipedia pages in order to find the match of the clicked item
// and store the item in local storage
let wikipediaPages = null;

//--------------------------------------------------------  Functions  --------------------------------------------------------//
// bind input field to google search and listen to changes
function initGoogleSearch() {
  const inputEl = $("#place-search")[0];
  const searchBox = new google.maps.places.SearchBox(inputEl);

  searchBox.addListener("places_changed", async () => {
    const places = searchBox.getPlaces();

    if (places && places.length > 0) {
      // get the places that has geometry from the result
      const placesHasGeometry = places.filter(
        (place) => place.geometry && place.geometry.location
      );

      if (placesHasGeometry && placesHasGeometry.length > 0) {
        // get the lat and lng of the most accurate place from the search
        const lat = placesHasGeometry[0].geometry.location.lat();
        const lng = placesHasGeometry[0].geometry.location.lng();

        await showNearbyPlaces(lat, lng);
      } else {
        showModal(
          "No Places Found",
          "No nearby places can't be found. Please try again!"
        );
      }
    } else {
      showModal(
        "No Places Found",
        "No nearby places can't be found. Please try again!"
      );
    }
  });
}

// get the user current location
async function getCurrentLocationCallback(position) {
  if (position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    await showNearbyPlaces(lat, lng);
  } else {
    showModal(
      "Can't Locate You",
      "Your current position can't be retrieved. Please try again!"
    );
  }
}

// tell user that you've already rejected the permission to get your current location
function currentLocationRejectCallback() {
  showModal(
    "Geolocation Denied",
    "You need to enable Geolocation on your brwoser."
  );
}

// trigger google search when the search button is clicked
function triggerGoogleSearch(event) {
  event.preventDefault();

  const inputEl = $("#place-search")[0];
  google.maps.event.trigger(inputEl, "focus", {});
  google.maps.event.trigger(inputEl, "keydown", { keyCode: 13 });
  google.maps.event.trigger(this, "focus", {});
}

// ask user for getting the current location permission
function getGeolocationAtCurrentPosition(event) {
  event.preventDefault();

  if (window.navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      getCurrentLocationCallback,
      currentLocationRejectCallback
    );
  } else {
    showModal(
      "Unavailable Geolocation",
      "Geolocation isn't supported in this browser"
    );
  }
}

// show the selected location on the map
function showLocation(el) {
  // get the latitude and longitude of select place
  const lat = $(el).attr("data-lat");
  const lng = $(el).attr("data-lng");

  if (lat !== "" && lng !== "") {
    const location = { lat: Number(lat), lng: Number(lng) };
    // The map, centered at the selected location
    const map = new google.maps.Map($("#map")[0], {
      zoom: 15,
      center: location
    });
    // The marker, positioned at the selected location
    new google.maps.Marker({
      position: location,
      map: map
    });
  } else {
    $("#map").html(
      "<p class='text-light'>This place can't be located in the map.</p>"
    );
    showModal(
      "Couldn't show this place",
      "The latitude and the longitude of the selected place can't be found. Please try again!"
    );
  }
}

// initialise google map
function googleMapScriptCallback() {
  initGoogleSearch();
}

// expose googleMapScriptCallback function to google map script in HTML
window.googleMapScriptCallback = googleMapScriptCallback;

// get data from localStorage
function getLocalStorage() {
  return JSON.parse(
    JSON.stringify(
      localStorage.getItem(APP_ID)
        ? JSON.parse(localStorage.getItem(APP_ID))
        : []
    )
  );
}

// store nearby place in local storage
function storeNearbyPlace(place) {
  // get local storage, if it's null then create a new object
  let storageArr = getLocalStorage();

  const placeIndex = storageArr.findIndex(
    (item) => item.pageid === place.pageid
  );

  if (placeIndex < 0) {
    // store the place as the first item
    storageArr.unshift(place);
  } else if (placeIndex > 0) {
    // if the item exists, bring it to the front of the array
    storageArr.unshift(storageArr.splice(placeIndex, 1)[0]);
  }

  // only storage 10 places in local storage
  if (storageArr.length > 10) {
    storageArr.splice(10);
  }
  // save an event into local storage
  localStorage.setItem(APP_ID, JSON.stringify(storageArr));
}

// show places to the DOM from local storage
function showLocalStorageHistory() {
  // clear histroy in the DOM
  $("#recent-search").empty();
  // get local storage, if it's null then create a new object
  let storageArr = getLocalStorage();

  if (storageArr && storageArr.length > 0) {
    storageArr.forEach((place) => {
      const placeEl = $(`
        <div class="card history-item" 
             data-id="${place.pageid}"
             data-lat="${place.coordinates[0].lat}"
             data-lng="${place.coordinates[0].lon}"
             data-url="${place.fullurl}"
        >
          <img class="card-img-top history-item__img" src="${
            place.thumbnail && place.thumbnail.source
              ? place.thumbnail.source
              : "./assets/img/application/image_not_available.png"
          }" alt="${place.title}">
          <div class="card-body">
            <h5 class="card-title">${place.title}</h5>
          </div>
        </div>
      `);
      $("#recent-search").append(placeEl);
    });
  } else {
    $("#recent-search").html(
      "<h4 class='text-light mt-2'>You haven't look at any places in recent.</h4>"
    );
  }
}

// fetch nearby places using wikipedia api
async function showNearbyPlaces(lat, lng) {
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    // get nearby locations from wiki
    const nearbyLocationsResp = await $.ajax({
      method: "GET",
      url: `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=coordinates|pageimages|description|info&inprop=url&pithumbsize=144&generator=geosearch&ggsradius=10000&ggslimit=10&ggscoord=${lat}|${lng}&format=json`
    });

    if (
      nearbyLocationsResp &&
      nearbyLocationsResp.query &&
      nearbyLocationsResp.query.pages &&
      !$.isEmptyObject(nearbyLocationsResp.query.pages)
    ) {
      $("#nearby-section").empty();
      wikipediaPages = nearbyLocationsResp.query.pages;
      // create an array to hold the html for each nearby place
      let nearbyPlacesHTML = [
        '<h3 class="nearby-places-header">View Nearby Places</h3>'
      ];

      // loop through the nearby locations and create the HTML for each one
      for (const key in wikipediaPages) {
        if (wikipediaPages.hasOwnProperty(key)) {
          const place = wikipediaPages[key];
          nearbyPlacesHTML.push(`
        <div class="card nearby-item" 
             data-id="${key}"
             data-lat="${place.coordinates[0].lat}"
             data-lng="${place.coordinates[0].lon}"
             data-url="${place.fullurl}"
        >
          <img class="card-img-top nearby-item__img" src="${
            place.thumbnail && place.thumbnail.source
              ? place.thumbnail.source
              : "./assets/img/application/image_not_available.png"
          }" alt="${place.title}">
          <div class="card-body">
            <h5 class="card-title">${place.title}</h5>
            <p class="card-text">${place.description || ""}</p>
          </div>
        </div>
      `);
        }
      }

      // join the array of HTML into a single string
      const nearbyPlacesHTMLString = nearbyPlacesHTML.join("");

      // add the HTML string to the nearby-section div
      $("#nearby-section").html(nearbyPlacesHTMLString);
    } else {
      $("#nearby-section").html(
        "<p class='text-light'>No nearby places found!</p>"
      );
    }
  } else {
    $("#nearby-section").html(
      "<p class='text-light'>No nearby places found!</p>"
    );
    showModal(
      "Couldn't find this place",
      "The latitude and the longitude of the place can't be found. Please try again!"
    );
  }
}

// show wikipedia page and map of the item and store it in local storage
function placeOnClick(placeToFind, event) {
  // show wikipedia of the clicked item in iframe
  const url = $(event.currentTarget).attr("data-url");
  const infoHtml = url
    ? `<iframe class="w-100 h-100" src="${url}">`
    : "<p class='text-light'>Can't find the Wikipedia about this place</p>";
  $("#info").html(infoHtml);

  // show location of the clicked item in google map
  showLocation(event.currentTarget);

  // store item in local storage
  if (placeToFind === "wikipediaPages") {
    const place = wikipediaPages[$(event.currentTarget).attr("data-id")];
    place ? storeNearbyPlace(place) : null;
  } else {
    // localStorage
    const place = getLocalStorage().find(
      (item) => item.pageid === $(event.currentTarget).attr("data-id")
    );
    place ? storeNearbyPlace(place) : null;
  }

  // update history in the DOM
  showLocalStorageHistory();
}

// modal to show user if things go wrong
function showModal(title, body) {
  $("#app-modal-title").text(title);
  $("#app-modal-body").text(body);
  $("#app-modal").modal("show");
}

// function to run when application is loaded
function start() {
  // show stored places in the DOM
  showLocalStorageHistory();
}

//--------------------------------------------------------  Event Liteners  --------------------------------------------------------//
$("#get-current-location-btn").on("click", getGeolocationAtCurrentPosition);
$("#search-btn").on("click", triggerGoogleSearch);
$("#nearby-section").on(
  "click",
  ".nearby-item",
  placeOnClick.bind(this, "wikipediaPages")
);
$("#recent-search").on(
  "click",
  ".history-item",
  placeOnClick.bind(this, "localStorage")
);

//--------------------------------------------------------  Application Start  --------------------------------------------------------//
start();
