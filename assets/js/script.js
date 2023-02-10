//--------------------------------------------------------  Functions  --------------------------------------------------------//
// bind input field to google search and listen to changes
function initGoogleSearch() {
  const inputEl = $("#place-search")[0];
  const searchBox = new google.maps.places.SearchBox(inputEl);

  searchBox.addListener("places_changed", async () => {
    const places = searchBox.getPlaces();
    console.log("places: ", places);

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
function showLocation(event) {
  // get the latitude and longitude of select place
  const lat = $(event.target).attr("data-lat");
  const lng = $(event.target).attr("data-lng");

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
      const pages = nearbyLocationsResp.query.pages;

      console.log("pages: ", pages);
      // create an array to hold the html for each nearby place
      let nearbyPlacesHTML = [];

      // loop through the nearby locations and create the HTML for each one
      for (const key in pages) {
        if (pages.hasOwnProperty(key)) {
          const place = pages[key];
          nearbyPlacesHTML.push(`
        <div class="nearby-item" data-lat="${
          place.coordinates[0].lat
        }" data-lng="${place.coordinates[0].lon}">
        <img src="${
          place.thumbnail && place.thumbnail.source
            ? place.thumbnail.source
            : ""
        }" />     
        <h3 class="nearby-item-title">${place.title}</h3>
          <p class="nearby-item-description">${place.description || ""}</p>
        </div>
      `);
        }
      }

      // join the array of HTML into a single string
      const nearbyPlacesHTMLString = nearbyPlacesHTML.join("");

      // add the HTML string to the nearby-section div
      $("#nearby-section").html(nearbyPlacesHTMLString);
    } else {
      $("#nearby-section").html("<p>No nearby places found!</p>");
    }
  } else {
    showModal(
      "Couldn't find this place",
      "The latitude and the longitude of the place can't be found. Please try again!"
    );
  }
}

function showModal(title, body) {
  $("#app-modal-title").text(title);
  $("#app-modal-body").text(body);
  $("#app-modal").modal("show");
}

//--------------------------------------------------------  Event Liteners  --------------------------------------------------------//
$("#get-current-location-btn").on("click", getGeolocationAtCurrentPosition);
$("#search-btn").on("click", triggerGoogleSearch);
