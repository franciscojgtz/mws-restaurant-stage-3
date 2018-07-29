'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import idb from 'idb';
// const idb = require('idb');
/**
 * Common database helper functions.
 */
var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'fetchRestaurants',


    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants(callback) {
      this.showCachedRestaurants().then(function (cachedRestaurants) {
        if (cachedRestaurants === undefined || cachedRestaurants.length === 0) {
          // array empty or does not exist
          fetch(DBHelper.DATABASE_URL).then(function (response) {
            return response.json();
          }).then(function (fetchedRestaurants) {
            DBHelper.placeRestaurantsIntoIDB(fetchedRestaurants);
            console.log('restaurants from fetch');
            callback(null, fetchedRestaurants);
          });
        } else {
          console.log('restaurants from cache');
          callback(null, cachedRestaurants);
        }
      }).catch(function (err) {
        var error = 'Request failed. Returned status of ' + err;
        callback(error, null);
      });
    }

    /**
     * Fetch reviews by restaurant ID
     */

  }, {
    key: 'fetchReviewsByRestaurantID',
    value: function fetchReviewsByRestaurantID(restaurantID, callback) {
      var _this = this;

      this.showCachedReviewsByRestaurantID(restaurantID).then(function (cachedReviews) {
        if (cachedReviews === undefined || cachedReviews.length === 0) {
          // array empty or does not exist
          _this.getReviewsFromNetwork(restaurantID).then(function (fetchedReviews) {
            callback(null, fetchedReviews);
          });
        } else {
          console.log('reviews from cache');
          console.log(cachedReviews);
          callback(null, cachedReviews);
          _this.getReviewsFromNetwork(restaurantID).then(function (fetchedReviews) {
            callback(null, fetchedReviews);
          });
        }
      });
    }
  }, {
    key: 'getReviewsFromNetwork',
    value: function getReviewsFromNetwork(restaurantID) {
      return fetch('http://localhost:1337/reviews/?restaurant_id=' + restaurantID).then(function (response) {
        return response.json();
      }).then(function (fetchedReviews) {
        DBHelper.placeReviewsIntoIDB(fetchedReviews);
        console.log('reviews from fetch');
        console.log(fetchedReviews);
        return fetchedReviews;
      });
    }

    /**
     * post review
     * @param {review object} review
     */

  }, {
    key: 'postReview',
    value: function postReview(review) {
      fetch('http://localhost:1337/reviews/', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(review)
      }).then(function (res) {
        return res.json();
      }).catch(function (error) {
        return console.error('Error:', error);
      }).then(function (response) {
        return console.log('Success:', response);
      });
    }

    /**
     * Delete review
     * @param {Review ID} id
     */

  }, {
    key: 'deleteReview',
    value: function deleteReview(id) {
      fetch('http://localhost:1337/reviews/' + id, {
        method: 'delete'
      }).then(function (res) {
        console.log(res);
      });
    }

    /**
     * Update review
     * @param {Review ID} id
     * @param {Review object} review
     */

  }, {
    key: 'updateReview',
    value: function updateReview(id, review) {
      fetch('http://localhost:1337/reviews/' + id, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(review)
      }).then(function (res) {
        return res.json();
      }).catch(function (error) {
        return console.error('Error:', error);
      }).then(function (response) {
        return console.log('Success:', response);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.find(function (r) {
            return r.id == id;
          });
          if (restaurant) {
            // Got the restaurant
            callback(null, restaurant);
          } else {
            // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      // added .jpg so it looks for a jpg image
      return '/img/' + restaurant.photograph + '.jpg';
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      // https://leafletjs.com/reference-1.3.0.html#marker
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(newMap);
      return marker;
    }

    /**
     * Open IDB
     */

  }, {
    key: 'openIDB',
    value: function openIDB() {
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }
      return idb.open('restaurants-reviews', 2, function (upgradeDb) {
        switch (upgradeDb.oldVersion) {
          case 0:
            var store = upgradeDb.createObjectStore('restaurants', {
              keyPath: 'id'
            });
          case 1:
            var reviewsStore = upgradeDb.createObjectStore('reviews', {
              keyPath: 'id'
            });
            reviewsStore.createIndex('restaurant', 'restaurant_id');
        }
      });
    }

    /**
     * Place Restaurants in IDB
     * @param {*} restaurants
     */

  }, {
    key: 'placeRestaurantsIntoIDB',
    value: function placeRestaurantsIntoIDB(restaurants) {
      var dbPromise = DBHelper.openIDB();
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var restaurantsStore = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          restaurantsStore.put(restaurant);
        });
      });
    }

    /**
     * Place Reviews in IDB
     * @param {*} reviews
     */

  }, {
    key: 'placeReviewsIntoIDB',
    value: function placeReviewsIntoIDB(reviews) {
      var dbPromise = DBHelper.openIDB();
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('reviews', 'readwrite');
        var reviewsStore = tx.objectStore('reviews');
        reviews.forEach(function (reviews) {
          reviewsStore.put(reviews);
        });
      });
    }

    /**
     * Show Cached Restaurants
     */

  }, {
    key: 'showCachedRestaurants',
    value: function showCachedRestaurants() {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var data = db.transaction('restaurants').objectStore('restaurants');
        return data.getAll().then(function (restaurants) {
          return restaurants;
        });
      });
    }

    /**
     * Show Cached Reviews By Restaurant ID
     */

  }, {
    key: 'showCachedReviewsByRestaurantID',
    value: function showCachedReviewsByRestaurantID(restaurantID) {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var data = db.transaction('reviews').objectStore('reviews');
        var restaurantIndex = data.index('restaurant');
        return restaurantIndex.getAll(restaurantID).then(function (reviews) {
          return reviews;
        });
      });
    }
  }, {
    key: 'DATABASE_URL',

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    get: function get() {
      var port = 1337; // Change this to your server port
      return 'http://localhost:1337/restaurants';
    }
  }]);

  return DBHelper;
}();