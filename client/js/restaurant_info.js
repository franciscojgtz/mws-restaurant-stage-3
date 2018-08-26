'use strict';

var restaurant = void 0;
var newMap = void 0;
var reviews = void 0;
var cacheRestaurant = void 0;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
  window.initMap();
});

/**
 * Initialize Google map, called from HTML.
 */
var initMap = function initMap() {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiZnJhbmNpc2Nvamd0eiIsImEiOiJjamlzOHRncjEwbHU4M3ByeTdpenN5M3YwIn0.y1U7z4RQa0J58bhLtiYlqg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      // TODO: Refactor using requestAnimationFrame
      // requestAnimationFrame(() => { newMap.invalidateSize(); });
      setTimeout(function () {
        newMap.invalidateSize();
      }, 400);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 * @param {function} callback 
 */
var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  var id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    var error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      // check if we got restaurant from network and we already
      // have restaurants from cache.
      // THIS COULD ALSO BE CHECKED IN DBHELPER.JS
      if (self.restaurant !== 'undefined' && restaurant.source === 'network') {
        self.cacheRestaurant = self.restaurant;
      }

      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }

      // If we already got the reviews from the network, exit
      if (self.reviews !== undefined) {
        if (self.reviews[0].source === 'network') {
          return;
        }
      }

      // fetch the reviews from the network
      fetchReviewsByRestaurantID(restaurant.id, function (error, reviews) {
        if (error) {
          console.log(error);
          return;
        }
        // if the restaurant has alredy been painted return.
        if (self.reviews !== undefined) {
          if (self.reviews[0].source === 'cache') {
            return;
          }
        }
        self.reviews = reviews;
        fillRestaurantHTML();
      });
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 * @param {object} restaurant 
 */
var fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  var favButton = document.getElementById('button-favorite');
  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    favButton.innerHTML = '★';
    favButton.classList.add('button-favorite--favorite');
  } else {
    favButton.innerHTML = '☆';
    favButton.classList.add('button-favorite--not-favorite');
  }

  var address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  if (restaurant.photograph) {
    createResponsiveImage(restaurant);
  }

  var cuisine = document.getElementById('restaurant-cuisine');
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
 * @param {object} operatingHours 
 */
var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

  var hours = document.getElementById('restaurant-hours');
  /* TO DO: This could be a paint issue */
  hours.innerHTML = '';
  for (var key in operatingHours) {
    var row = document.createElement('tr');

    var day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    var time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Fetch Reviews by restaurant id from network
 */
/**
 * 
 * @param {number} restaurantID 
 * @param {function} callback 
 */
var fetchReviewsByRestaurantID = function fetchReviewsByRestaurantID(restaurantID, callback) {
  DBHelper.fetchReviewsByRestaurantID(restaurantID, function (error, reviews) {
    if (error) {
      // error
      console.log(error);
      return;
    }
    callback(null, reviews);
  });
};

/**
 * Handle review form on submit
 */
document.getElementById('reviews-form').addEventListener('submit', function (event) {
  event.preventDefault();
  var reviewsForm = document.getElementById('reviews-form');
  var name = reviewsForm.elements.name.value.trim();
  var rating = reviewsForm.elements.rating.value;
  var comments = reviewsForm.elements['reviews-form__comments-textarea'].value;

  var review = {
    restaurant_id: restaurant.id,
    name: name,
    rating: rating,
    comments: comments
  };

  DBHelper.postReview(review, function (error, reviewResponse) {
    // what do i want to happen after review is in database

    document.getElementById('reviews-form').reset();

    // add review with others
    var container = document.getElementById('reviews-container');
    var ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(reviewResponse));
    container.appendChild(ul);
    document.getElementById('reviews-form-container').innerHTML = '<h3 class="review-form-container__message--sucess">Thank you for adding a review!</h3>';
  });
}, false);

/**
 * Delete review
 * @param {number} id 
 */
var deleteReview = function deleteReview(id) {
  DBHelper.deleteReview(id);
};

/**
 * Update review
 * @param {number} id 
 * @param {object} review 
 */
var updateReview = function updateReview(id, review) {
  DBHelper.updateReview(id, review);
};

/**
 * Handle an offline event
 */
window.addEventListener('offline', function (e) {
  console.log('offline');
});

/**
 * Handle an online event
 */
window.addEventListener('online', function (e) {
  console.log('online');
});

/**
 * Create all reviews HTML and add them to the webpage.
 * @param {object} reviews 
 */
var fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.reviews;

  var container = document.getElementById('reviews-container');

  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById('reviews-list');
  // TO DO: this could result in a paint issue
  ul.innerHTML = '';
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 * @param {object} review 
 * @returns {object} li element
 */
var createReviewHTML = function createReviewHTML(review) {
  var li = document.createElement('li');
  var name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  var date = document.createElement('p');
  var updatedAt = review.updatedAt;
  var updatedDate = timeConverter(updatedAt);
  date.innerHTML = updatedDate;
  li.appendChild(date);

  var rating = document.createElement('p');
  rating.innerHTML = 'Rating: ' + review.rating;
  li.appendChild(rating);

  var comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * convert 13 digit timestamp into month day, year
 * @param {13 digittimestamp} timeStamp
 * @returns {month day, year}
 */
var timeConverter = function timeConverter(timeStamp) {
  var a = new Date(timeStamp);
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septemeber', 'October', 'November', 'December'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();

  return month + ' ' + date + ', ' + year;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 * @param {object} restaurant 
 */
var fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var breadcrumb = document.getElementById('breadcrumb');
  var li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 * @param {string} name 
 * @param {string} url 
 */
var getParameterByName = function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get image alt
 * @param {string or number} photograph 
 */
var getPhotoDescription = function getPhotoDescription(photograph) {
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
var createResponsiveImage = function createResponsiveImage(restaurant) {
  var image = document.createElement('img');
  var pictureElement = document.getElementById('restaurant-img');
  var webPSource = document.createElement('source');
  var jpgSource = document.createElement('source');
  image.className = 'restaurant-img';
  image.className = 'lazyload';
  image.setAttribute('data-sizes', 'auto');
  image.alt = restaurant.name + ' restaurant, ' + getPhotoDescription(restaurant.photograph);
  var restImg = DBHelper.imageUrlForRestaurant(restaurant).slice(0, -4);
  var imgSizes = '(max-width: 779px) calc(100vw - 4rem), (min-width: 800px) and (max-width: 1023px) calc(60vw - 4rem), (min-width: 1024px) calc(50vw - 4rem), (min-width: 1600px) 760px, calc(100vw - 4rem)';
  image.setAttribute('data-src', '' + DBHelper.imageUrlForRestaurant(restaurant));
  webPSource.setAttribute('data-srcset', restImg + '_300.webp 300w, ' + restImg + '_350.webp 350w, ' + restImg + '_400.webp 400w, ' + restImg + '_450.webp 450w, ' + restImg + '_500.webp 500w, ' + restImg + '_550.webp 550w, ' + restImg + '_600.webp 600w, ' + restImg + '_700.webp 700w, ' + restImg + '_800.webp 800w');
  webPSource.type = 'image/webp';
  webPSource.sizes = imgSizes;

  jpgSource.setAttribute('data-srcset', restImg + '_300.jpg 300w, ' + restImg + '_350.jpg 350w, ' + restImg + '_400.jpg 400w, ' + restImg + '_450.jpg 450w, ' + restImg + '_500.jpg 500w, ' + restImg + '_550.jpg 550w, ' + restImg + '_600.jpg 600w, ' + restImg + '_700.jpg 700w, ' + restImg + '_800.jpg 800w');
  jpgSource.type = 'image/jpg';
  jpgSource.sizes = imgSizes;

  pictureElement.append(webPSource);
  pictureElement.append(jpgSource);
  pictureElement.append(image);
};

/**
 * listen for click events on button-favorite
 */
document.getElementById('button-favorite').addEventListener('click', function () {
  var restaurant = self.restaurant;
  var state = false;
  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    state = true;
  }

  DBHelper.updateIsFavortie(restaurant.id, !state, function (error, responseRestaurant) {
    // reset link
    self.restaurant = responseRestaurant;
    var favButton = document.getElementById('button-favorite');
    if (responseRestaurant.is_favorite === 'true' || responseRestaurant.is_favorite === true) {
      favButton.innerHTML = '★';
      favButton.classList.add('button-favorite--favorite');
      favButton.classList.remove('button-favorite--not-favorite');
    } else {
      favButton.innerHTML = '☆';
      favButton.classList.add('button-favorite--not-favorite');
      favButton.classList.remove('button-favorite--favorite');
    }
  });
});