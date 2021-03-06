// restaurants holds the current restaurants
// allRestaurants holds all the restaurants in the app
let restaurants;
let neighborhoods;
let cuisines;
let newMap;
let allRestaurants;
const markers = [];

/**
 * Inititate map and Fetch restaurants as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZnJhbmNpc2Nvamd0eiIsImEiOiJjamlzOHRncjEwbHU4M3ByeTdpenN5M3YwIn0.y1U7z4RQa0J58bhLtiYlqg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets',
  }).addTo(newMap);
  // TODO: setTimeout makes our app not work at 60fps. Refactor using requestAnimationFrame();
  // requestAnimationFrame(() => { newMap.invalidateSize(); });
  setTimeout(() => { newMap.invalidateSize(); }, 400);

  // get all restaurants
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      console.log(error);
    } else {
      if (self.allRestaurants !== undefined) {
        // TODO: check if there are more restaurants fetched than in chache.
        //  If so, display the restaurants from the network
        // We already got the restaurants either from cache or network
        self.allRestaurants = restaurants;
        return;
      }
      self.allRestaurants = restaurants;
      self.restaurants = restaurants;

      updateRestaurants();
    }
  });
};

/**
 * Get all restaurants neighborhoods from restaurants
 * @param {Array} restaurants 
 */
const getNeighborhoods = (restaurants) => {
  // Get all neighborhoods from all restaurants
  const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
  // Remove duplicates from neighborhoods
  const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
  self.neighborhoods = uniqueNeighborhoods;
  fillNeighborhoodsHTML();
};

/**
 * Get all cuisines from restaurants
 * @param {Array} restaurants 
 */
const getCuisnes = (restaurants) => {
  // Get all cuisines from all restaurants
  const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
  // Remove duplicates from cuisines
  const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
  self.cuisines = uniqueCuisines;
  fillCuisinesHTML();
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      console.log(neighborhoods);
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Get neighborhoods 
 * @param {string} cuisine 
 * @param {string} neighborhood 
 * @param {function} callback 
 */
const getRestaurantByCuisineAndNeighborhood = (cuisine, neighborhood, callback) => {
  let results = self.allRestaurants;
  if (cuisine !== 'all') { // filter by cuisine
    results = results.filter(r => r.cuisine_type === cuisine);
  }
  if (neighborhood !== 'all') { // filter by neighborhood
    results = results.filter(r => r.neighborhood === neighborhood);
  }
  callback(null, results);
};

/**
 * Set neighborhoods HTML.
 * @param {Array} neighborhoods 
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');

  // TODO: CHECK COULD CAUSE A PAINT ISSUE
  select.innerHTML = '';
  const optionAll = document.createElement('option');
  optionAll.innerHTML = 'All Neighborhoods';
  optionAll.value = 'all';
  select.append(optionAll);


  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      console.log(cuisines);
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 * @param {Array} cuisines 
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  // TODO: CHECK COULD CAUSE A PAINT ISSUE
  select.innerHTML = '';

  // TODO: CHECK COULD CAUSE A PAINT ISSUE
  select.innerHTML = '';
  const optionAll = document.createElement('option');
  optionAll.innerHTML = 'All Cuisines';
  optionAll.value = 'all';
  select.append(optionAll);

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  getRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (cuisine === 'all' && neighborhood === 'all') {
      getNeighborhoods(restaurants);
      getCuisnes(restaurants);
    }
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 * @param {Array} restaurants 
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};


/**
 * Create all restaurants HTML and add them to the webpage.
 * @param {Array} restaurants 
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 * @param {Array} restaurant 
 * @returns {Object} li element
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    const favorite = document.createElement('p');
    favorite.classList.add('favorite-icon');
    favorite.innerHTML = '★';
    li.append(favorite);
  }

  if (restaurant.photograph) {
    const pictureElement = createResponsiveImage(restaurant);
    li.append(pictureElement);
  }

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'Restaurant details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 * @param {Array} restaurants 
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

/**
 * Get image alt
 * @param {string or number} photograph 
 */
const getPhotoDescription = (photograph) => {
  switch (parseInt(photograph, 10)) {
    case 1:
      return 'classical indoor decoration';
    case 2:
      return 'hand-made cheese pizza';
    case 3:
      return 'modern dining atmosphere';
    case 4:
      return 'colorful and dynamic entrance';
    case 5:
      return 'popular friendly environment';
    case 6:
      return 'patriotic and popular diner';
    case 7:
      return 'cozy welcoming entrance';
    case 8:
      return 'daytime clean entrance';
    case 9:
      return 'customers enjoying their meal';
    case 10:
      return 'very clean modern-mexican environment';
    default:
      return 'error';
  }
};

/**
 * Create Responsive image
 * @param {Object} restaurant
 * @returns {Object} pictureElement
 */
const createResponsiveImage = (restaurant) => {
  const image = document.createElement('img');
  const pictureElement = document.createElement('picture');
  const webPSource = document.createElement('source');
  const jpgSource = document.createElement('source');

  image.className = 'restaurant-img';
  image.className = 'lazyload';
  image.setAttribute('data-sizes', 'auto');
  image.alt = `${restaurant.name} restaurant, ${getPhotoDescription(restaurant.photograph)}`;
  const restImg = DBHelper.imageUrlForRestaurant(restaurant).slice(0, -4);
  const imgSizes = '(max-width: 559px) calc(100vw - 4rem - 4px), (min-width: 560px) and (max-width: 1023px) calc(0.5 * 100vw - 5rem - 2px), (min-width: 1023px) calc(0.333 * 100vw - 5rem - 2px), calc(100vw - 6rem - 2px)';
  image.setAttribute('data-src', `${DBHelper.imageUrlForRestaurant(restaurant)}`);
  webPSource.setAttribute('data-srcset', `${restImg}_300.webp 300w, ${restImg}_350.webp 350w, ${restImg}_400.webp 400w, ${restImg}_450.webp 450w, ${restImg}_500.webp 500w, ${restImg}_550.webp 550w, ${restImg}_600.webp 600w, ${restImg}_700.webp 700w, ${restImg}_800.webp 800w`);
  webPSource.type = 'image/webp';
  webPSource.sizes = imgSizes;

  jpgSource.setAttribute('data-srcset', `${restImg}_300.jpg 300w, ${restImg}_350.jpg 350w, ${restImg}_400.jpg 400w, ${restImg}_450.jpg 450w, ${restImg}_500.jpg 500w, ${restImg}_550.jpg 550w, ${restImg}_600.jpg 600w, ${restImg}_700.jpg 700w, ${restImg}_800.jpg 800w`);
  jpgSource.type = 'image/jpg';
  jpgSource.sizes = imgSizes;

  pictureElement.append(webPSource);
  pictureElement.append(jpgSource);
  pictureElement.append(image);

  return pictureElement;
};
