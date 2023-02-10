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
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    await showNearbyPlaces(lat, lng);
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
      // TODO: show items on the left panel
    } else {
      // TODO: show model saying that no nearby places found!
    }
  } else {
    // TODO: show a modal saying that the lat and lng of the place can't be found, try again!
  }
}

//--------------------------------------------------------  Event Liteners  --------------------------------------------------------//
$("#get-current-location-btn").on("click", getGeolocationAtCurrentPosition);
$("#search-btn").on("click", triggerGoogleSearch);

// <!-- jQuery -->
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
