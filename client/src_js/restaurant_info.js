let restaurant;
let newMap;
let reviews;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  window.initMap();
});

/**
 * Initialize Google map, called from HTML.
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      requestAnimationFrame(() => { newMap.invalidateSize(); });
      // setTimeout(() => { newMap.invalidateSize(); }, 400);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      // fetch the reviews from the network
      fetchReviewsByRestaurantID(restaurant.id, (error, reviews) => {
        self.reviews = reviews;
        fillRestaurantHTML();
      });
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  if (restaurant.photograph) {
    createResponsiveImage(restaurant);
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  /* TO DO: This could be a paint issue */
  hours.innerHTML = '';
  for (const key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Fetch Reviews by restaurant id from network
 */
const fetchReviewsByRestaurantID = (restaurantID, callback) => {
  DBHelper.fetchReviewsByRestaurantID(restaurantID, (error, reviews) => {
    callback(null, reviews);
  });
};

/**
 * Handle review form
 */
document.getElementById('reviewForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.reviewForm.name.value.trim();
  const rating = document.reviewForm.rating.value;
  const comments = document.reviewForm.comments.value;

  const review = {
    restaurant_id: restaurant.id,
    name,
    rating,
    comments,
  };

  DBHelper.postReview(review, (error, reviewResponse) => {
    // what do i want to happen after review is in database

    document.getElementById('reviewForm').reset();

    // add review with others
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(reviewResponse));
    container.appendChild(ul);
  });
}, false);

const deleteReview = (id) => {
  DBHelper.deleteReview(id);
};

const updateReview = (id) => {
  const opts = {
    name: 'Juan',
    rating: 5,
    comments: 'delicious!',
  };
  DBHelper.updateReview(id, opts);
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  // TO DO: this could result in a paint issue
  ul.innerHTML = '';
  reviews.forEach((review) => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const updatedAt = review.updatedAt;
  const updatedDate = timeConverter(updatedAt);
  date.innerHTML = updatedDate;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};


/**
 * convert 13 digit timestamp into month day, year
 * @param {13 digittimestamp} t
 * @returns {month day, year}
 */
const timeConverter = (t) => {
  const a = new Date(t);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septemeber', 'October', 'November', 'December'];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();

  return `${month} ${date}, ${year}`;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) { url = window.location.href; }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) { return null; }
  if (!results[2]) { return ''; }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get image alt
 */
function getPhotoDescription(photograph) {
  switch (parseInt(photograph)) {
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
}

/**
 * Create Responsive image
 */
function createResponsiveImage(restaurant) {
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant, ${getPhotoDescription(restaurant.photograph)}`;

  const restImg = DBHelper.imageUrlForRestaurant(restaurant).slice(0, -4);
  image.srcset = `${restImg}_300.webp 300w, ${restImg}_350.webp 350w, ${restImg}_400.webp 400w, ${restImg}_450.webp 450w, ${restImg}_500.webp 500w, ${restImg}_550.webp 550w, ${restImg}_600.webp 600w, ${restImg}_700.webp 700w, ${restImg}_800.webp 800w`;
  image.sizes = '(max-width: 779px) calc(100vw - 4rem), (min-width: 800px) and (max-width: 1023px) calc(60vw - 4rem), (min-width: 1024px) calc(50vw - 4rem), (min-width: 1600px) 760px, calc(100vw - 4rem)';
}


function notifySWUpdates(reg) {
  console.log('There is a new Service Worker available');
  // create button
  const buttonSW = document.createElement('button');
  buttonSW.classList.add('sw-button');
  buttonSW.innerHTML = 'Update Available';
  // append button
  const docBody = document.getElementsByTagName('body')[0];
  docBody.appendChild(buttonSW);
  // onclick, post message
  buttonSW.addEventListener('click', () => {
    reg.postMessage({ activate: 'true' });
  });
}

function trackSWStates(reg) {
  reg.addEventListener('statechange', () => {
    if (this.state == 'installed') {
      notifySWUpdates(reg);
    }
  });
}

/**
 * This function registers the service worker
*/
function registerServiceWorker() {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // refers to the SW that controls this page
    if (!navigator.serviceWorker.controller) {
      // page didn't load using a SW
      // loaded from the network
      return;
    }

    if (reg.waiting) {
      // there's an update ready!
      notifySWUpdates(reg.waiting);
    }

    if (reg.installing) {
      // there's an update in progress
      trackSWStates(reg.installing);
    }

    reg.addEventListener('updatefound', () => {
      trackSWStates(reg.installing);
    });

    let reloading;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      window.location.reload();
      reloading = true;
    });
  }).catch((err) => {
    console.log('SW failed: ', err);
  });
}

/**
 * Add service worker.
 */
registerServiceWorker();
