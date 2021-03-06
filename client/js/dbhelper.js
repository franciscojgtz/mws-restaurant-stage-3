'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
     * Fetch all restaurants. Get restaurants from cache and/or network
     * @param {function} callback
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
    /**
     * Get Restaurants from Network
     * @param {function} callback 
     */

  }, {
    key: 'getRestaurantsFromNetwork',
    value: function getRestaurantsFromNetwork(callback) {
      fetch(DBHelper.DATABASE_URL + 'restaurants').then(function (response) {
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
     * @param {number} restaurantID 
     * @param {function} callback 
     */

  }, {
    key: 'fetchReviewsByRestaurantID',
    value: function fetchReviewsByRestaurantID(restaurantID, callback) {
      var _this2 = this;

      // We have the latest reviews from the network
      if (this.getReviewsSource === 'network') {
        return;
      }

      // Get Reviews from network
      this.getReviewsFromNetwork(restaurantID, callback);

      if (this.getReviewsSource === 'cache') {
        return;
      }

      // Get restaurant reviews from cache
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

    /**
     * Get reviews from network and delete defered reviews
     * @param {number} restaurantID 
     * @param {function} callback 
     */

  }, {
    key: 'getReviewsFromNetwork',
    value: function getReviewsFromNetwork(restaurantID, callback) {
      var _this3 = this;

      this.getDeferedReviews().then(function (deferedReviews) {
        deferedReviews.forEach(function (deferedReview) {
          _this3.postReview(deferedReview, function (error, reviewResponse) {
            // delete review from defered-reviews store
            if (error) {
              console.log(error);
            } else {
              _this3.deleteDeferedReviewByRestaurantID(reviewResponse.restaurant_id);
            }
          });
        });
      });

      // fetch reviews from network
      fetch(DBHelper.DATABASE_URL + 'reviews/?restaurant_id=' + restaurantID).then(function (response) {
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
     * @param {object} review
     */

  }, {
    key: 'postReview',
    value: function postReview(review, callback) {
      var _this4 = this;

      fetch(DBHelper.DATABASE_URL + 'reviews/', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(review)
      }).then(function (res) {
        return res.json();
      }).then(function (response) {
        console.log('Success:', response);
        // TODO: add review to indexDB
        callback(null, response);
      }).catch(function (error) {
        console.error('Error:', error);
        var timeStamp = Date.now();
        review.createdAt = timeStamp;
        review.updatedAt = timeStamp;
        _this4.placedeferedReviewsIntoIDB(review);
        callback(error, review);
      });
    }

    /**
     * Delete review
     * @param {number} id
     */

  }, {
    key: 'deleteReview',
    value: function deleteReview(id) {
      fetch(DBHelper.DATABASE_URL + 'reviews/' + id, {
        method: 'delete'
      }).then(function (res) {
        console.log(res);
      });
    }

    /**
     * Update review
     * @param {number} id
     * @param {object} review
     */

  }, {
    key: 'updateReview',
    value: function updateReview(id, review) {
      fetch(DBHelper.DATABASE_URL + 'reviews/' + id, {
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
     * 
     * @param {number} id 
     * @param {boolean} state 
     * @param {function} callback 
     */

  }, {
    key: 'updateIsFavortie',
    value: function updateIsFavortie(id, state, callback) {
      fetch(DBHelper.DATABASE_URL + 'restaurants/' + id + '/', {
        method: 'put',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ is_favorite: state })
      }).then(function (res) {
        return res.json();
      }).catch(function (error) {
        console.error('Error:', error);
        callback(error, null);
      }).then(function (response) {
        console.log('Success:', response);
        DBHelper.placeRestaurantIntoIDB(response);
        callback(null, response);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     * @param {number} id 
     * @param {function} callback 
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

    /**
     * Get restaurant from network
     * @param {number} id 
     * @param {function} callback 
     */

  }, {
    key: 'getRestaurantFromNetwork',
    value: function getRestaurantFromNetwork(id, callback) {
      console.log(DBHelper.DATABASE_URL + 'restaurants/' + id);
      fetch(DBHelper.DATABASE_URL + 'restaurants/' + id).then(function (response) {
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
     * @param {string} cuisine 
     * @param {function} callback 
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
     * @param {string} neighborhood 
     * @param {function} callback 
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
     * @param {string} cuisine 
     * @param {string} neighborhood 
     * @param {function} callback 
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
     * @param {function} callback 
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
     * @param {function} callback 
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
     * @param {object} restaurant 
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     * @param {object} restaurant 
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      // added .jpg so it looks for a jpg image
      return '/img/' + restaurant.photograph + '.jpg';
    }

    /**
     * Map marker for a restaurant.
     * @param {object} restaurant 
     * @param {object} _map 
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
     * @returns {promise} IDB
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
     * @param {array} restaurants
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
     * @param {array} restaurants
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
     * @param {array} reviews
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
     * @param {array} reviews
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
     * @returns {promise array} restaurants
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
     * @param {number} id 
     * @returns {promise object} restaurant
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
     * @param {number} restaurantID 
     * @returns {promise array} reviews
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
     * Get defered reviews
     * @returns {promise array} reviews
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
     * Delete defered review
     * @param {number} restaurantID 
     */

  }, {
    key: 'deleteDeferedReviewByRestaurantID',
    value: function deleteDeferedReviewByRestaurantID(restaurantID) {
      var dbPromise = DBHelper.openIDB();
      return dbPromise.then(function (db) {
        if (!db) return Promise.resolve();
        var tx = db.transaction('defered-reviews', 'readwrite');
        var reviewsStore = tx.objectStore('defered-reviews');
        reviewsStore.delete(restaurantID);
        return tx.complete;
      }).then(function () {
        console.log('Deffered Review deleted from restaurant ' + restaurantID);
      });
    }
  }, {
    key: 'getReviewsSource',

    /**
     * Get Reviews Source
     */
    get: function get() {
      return reviewsSource;
    }

    /**
     * Set Reviews Source
     */

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
      // const baseURL = `http://localhost:${port}/`;
      var baseURL = 'https://desolate-mesa-90835.herokuapp.com/';
      return baseURL;
    }
  }]);

  return DBHelper;
}();