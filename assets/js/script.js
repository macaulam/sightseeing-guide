//--------------------------------------------------------  Functions  --------------------------------------------------------//
// bind input field to google search and listen to changes
function initGoogleSearch() {
  const inputEl = $("#place-search")[0];
  const searchBox = new google.maps.places.SearchBox(inputEl);

  searchBox.addListener("places_changed", () => {
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

        console.log("lat: ", lat);
        console.log("lng: ", lng);

        // TODO: call wikipedia api get get nearby places
        console.log("get nearby places from wikipedia.......");
      } else {
        console.log("the places don't have geometry, try again!");
        // TODO: show a modal saying that the places don't have geometry, try again!
      }
    } else {
      // TODO: show a modal saying that the places isn't found!
      console.log("the places isn't found!");
    }
  });
}

// get the user current location
async function getCurrentLocationCallback(position) {
  if (position) {
    console.log("position: ", position);
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    console.log("lat: ", lat);
    console.log("lon: ", lon);

    // TODO: call wikipedia api get get nearby places
    console.log("get nearby places from wikipedia.......");
  } else {
    // TODO: show a modal saying that your current position can't be found, try again!
    console.log("your current position can't be found, try again!");
  }
}

function triggerGoogleSearch(event) {
  // console.log("hell");
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
    navigator.geolocation.getCurrentPosition(getCurrentLocationCallback);
  } else {
    // TODO: show a modal saying Geolocation isn't supported in this browser
    console.log("Geolocation isn't supported in this browser");
  }
}

// initialise google map
function initMap() {
  initGoogleSearch();
}

// expose initMap function to google map script in HTML
window.initMap = initMap;

//--------------------------------------------------------  Event Liteners  --------------------------------------------------------//
$("#get-current-location-btn").on("click", getGeolocationAtCurrentPosition);
$("#search-btn").on("click", triggerGoogleSearch);
