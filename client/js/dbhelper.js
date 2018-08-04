'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import idb from 'idb';
// const idb = require('idb');

var reviewsSource = null;
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
      var _this = this;

      this.showCachedRestaurants().then(function (cachedRestaurants) {
        if (cachedRestaurants === undefined || cachedRestaurants.length === 0) {
          // array empty or does not exist
          _this.getRestaurantsFromNetwork(callback);
        } else {
          cachedRestaurants.map(function (restaurant) {
            restaurant.source = 'cache';
            return restaurant;
          });
          console.log('restaurants from cache');
          callback(null, cachedRestaurants);
          _this.getRestaurantsFromNetwork(callback);
        }
      }).catch(function (err) {
        var error = 'Request failed. Returned status of ' + err;
        callback(error, null);
      });
    }
  }, {
    key: 'getRestaurantsFromNetwork',
    value: function getRestaurantsFromNetwork(callback) {
      fetch(DBHelper.DATABASE_URL).then(function (response) {
        return response.json();
      }).then(function (fetchedRestaurants) {
        DBHelper.placeRestaurantsIntoIDB(fetchedRestaurants);
        fetchedRestaurants.map(function (restaurant) {
          restaurant.source = 'network';
          return restaurant;
        });
        console.log('restaurants from network');
        callback(null, fetchedRestaurants);
      });
    }

    /**
     * Fetch reviews by restaurant ID
     */

  }, {
    key: 'fetchReviewsByRestaurantID',
    value: function fetchReviewsByRestaurantID(restaurantID, callback) {
      var _this2 = this;

      if (this.getReviewsSource === 'network') {
        return;
      }

      // Get Reviews from network
      this.getReviewsFromNetwork(restaurantID, callback);

      if (this.getReviewsSource === 'cache') {
        return;
      }

      this.showCachedReviewsByRestaurantID(restaurantID).then(function (cachedReviews) {
        _this2.getDeferedReviews().then(function (deferedReviews) {
          deferedReviews.forEach(function (deferedReview) {
            if (restaurantID === deferedReview.restaurant_id) {
              cachedReviews.push(deferedReview);
            }
          });
          if (cachedReviews === undefined || cachedReviews.length === 0) {
            // array empty or does not exist
            // this.getReviewsFromNetwork(restaurantID, callback);
          } else {
            console.log('reviews from cache');
            cachedReviews.map(function (review) {
              review.source = 'cache';
              return review;
            });
            if (cachedReviews.length > 0) {
              _this2.setReviewsSource = 'cache';
            }
            callback(null, cachedReviews);
          }
        });
      });
    }
  }, {
    key: 'getReviewsFromNetwork',
    value: function getReviewsFromNetwork(restaurantID, callback) {
      var _this3 = this;

      this.getDeferedReviews().then(function (deferedReviews) {
        deferedReviews.forEach(function (deferedReview) {
          _this3.postReview(deferedReview, function (error, reviewResponse) {
            // delete review from defered-reviews store
            console.log(reviewResponse.restaurant_id);
            if (error) {
              console.log(error);
            } else {
              _this3.deleteDeferedReviewByRestaurantID(reviewResponse.restaurant_id);
            }
          });
        });
      });

      fetch('http://localhost:1337/reviews/?restaurant_id=' + restaurantID).then(function (response) {
        return response.json();
      }).then(function (fetchedReviews) {
        DBHelper.placeReviewsIntoIDB(fetchedReviews);
        console.log('reviews from network');
        if (fetchedReviews.length > 0) {
          _this3.setReviewsSource = 'network';
        }
        fetchedReviews.map(function (review) {
          review.source = 'network';
          return review;
        });
        callback(null, fetchedReviews);
      });
    }

    /**
     * post review
     * @param {review object} review
     */

  }, {
    key: 'postReview',
    value: function postReview(review, callback) {
      var _this4 = this;

      fetch('http://localhost:1337/reviews/', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(review)
      }).then(function (res) {
        return res.json();
      }).then(function (response) {
        console.log('Success:', response);
        // TO DO add review to indexDB
        callback(null, response);
      }).catch(function (error) {
        console.error('Error:', error);
        // To do defer review
        var timeStamp = Date.now();
        review.createdAt = timeStamp;
        review.updatedAt = timeStamp;
        _this4.placedeferedReviewsIntoIDB(review);
        callback(error, review);
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
  }, {
    key: 'updateIsFavortie',
    value: function updateIsFavortie(id, state, callback) {
      console.log(typeof state === 'undefined' ? 'undefined' : _typeof(state));
      console.log('http://localhost:1337/restaurants/' + id + '/?is_favorite=' + state);
      fetch('http://localhost:1337/restaurants/' + id + '/?is_favorite=' + state, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }).then(function (res) {
        return res.json();
      }).catch(function (error) {
        console.error('Error:', error);
        callback(error, null);
      }).then(function (response) {
        console.log('Success:', response);
        callback(null, response);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      var _this5 = this;

      this.showCachedRestaurantByID(id).then(function (cachedRestaurant) {
        if (cachedRestaurant === undefined || cachedRestaurant.length === 0) {
          _this5.getRestaurantFromNetwork(id, callback);
        } else {
          console.log('restaurant from cache');
          cachedRestaurant.source = 'cache';
          callback(null, cachedRestaurant);
          _this5.getRestaurantFromNetwork(id, callback);
        }
      });
    }
  }, {
    key: 'getRestaurantFromNetwork',
    value: function getRestaurantFromNetwork(id, callback) {
      fetch('http://localhost:1337/restaurants/' + id).then(function (response) {
        return response.json();
      }).then(function (fetchedRestaurant) {
        DBHelper.placeRestaurantIntoIDB(fetchedRestaurant);
        fetchedRestaurant.source = 'network';
        console.log('restaurant from network');
        callback(null, fetchedRestaurant);
      }).catch(function (err) {
        return err;
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
          var neighborhoods = restaurants.map(function (_v, i) {
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
          var cuisines = restaurants.map(function (_v, i) {
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
    value: function mapMarkerForRestaurant(restaurant, _map) {
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
      return idb.open('restaurants-reviews', 3, function (upgradeDb) {
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
          case 2:
            var deferedReviewsStore = upgradeDb.createObjectStore('defered-reviews', {
              keyPath: 'restaurant_id'
            });
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
     * Place Restaurant in IDB
     * @param {*} restaurants
     */

  }, {
    key: 'placeRestaurantIntoIDB',
    value: function placeRestaurantIntoIDB(restaurant) {
      var dbPromise = DBHelper.openIDB();
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var restaurantsStore = tx.objectStore('restaurants');
        restaurantsStore.put(restaurant);
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
        reviews.forEach(function (review) {
          reviewsStore.put(review);
        });
      });
    }

    /**
     * Place defered Reviews in IDB
     * @param {*} reviews
     */

  }, {
    key: 'placedeferedReviewsIntoIDB',
    value: function placedeferedReviewsIntoIDB(review) {
      var dbPromise = DBHelper.openIDB();
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('defered-reviews', 'readwrite');
        var reviewsStore = tx.objectStore('defered-reviews');
        reviewsStore.put(review);
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
     * Show Cached Restaurants
     */

  }, {
    key: 'showCachedRestaurantByID',
    value: function showCachedRestaurantByID(id) {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var data = db.transaction('restaurants').objectStore('restaurants');
        return data.get(parseInt(id)).then(function (restaurant) {
          return restaurant;
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

    /**
     * Get Defered
     */

  }, {
    key: 'getDeferedReviews',
    value: function getDeferedReviews() {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var data = db.transaction('defered-reviews').objectStore('defered-reviews');
        return data.getAll().then(function (reviews) {
          return reviews;
        });
      });
    }

    /**
     *
     */

  }, {
    key: 'deleteDeferedReviewByRestaurantID',
    value: function deleteDeferedReviewByRestaurantID(restaurantID) {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var tx = db.transaction('defered-reviews', 'readwrite');
        var reviewsStore = tx.objectStore('defered-reviews');
        console.log(restaurantID);
        reviewsStore.delete(restaurantID);
        return tx.complete;
      }).then(function () {
        console.log('Deffered Review deleted from restaurant ' + restaurantID);
      });
    }
  }, {
    key: 'getReviewsSource',
    get: function get() {
      return reviewsSource;
    }
  }, {
    key: 'setReviewsSource',
    set: function set(source) {
      reviewsSource = source;
    }
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */

  }, {
    key: 'DATABASE_URL',
    get: function get() {
      var port = 1337; // Change this to your server port
      return 'http://localhost:1337/restaurants';
    }
  }]);

  return DBHelper;
}();