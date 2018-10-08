let reviewsSource = null;
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Get Reviews Source
   */
  static get getReviewsSource() {
    return reviewsSource;
  }

  /**
   * Set Reviews Source
   */
  static set setReviewsSource(source) {
    reviewsSource = source;
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    // const baseURL = `http://localhost:${port}/`;
    const baseURL = 'https://desolate-mesa-90835.herokuapp.com/';
    return baseURL;
  }

  /**
   * Fetch all restaurants. Get restaurants from cache and/or network
   * @param {function} callback
   */
  static fetchRestaurants(callback) {
    this.showCachedRestaurants().then((cachedRestaurants) => {
      if (cachedRestaurants === undefined || cachedRestaurants.length === 0) {
        // array empty or does not exist
        this.getRestaurantsFromNetwork(callback);
      } else {
        cachedRestaurants.map((restaurant) => {
          restaurant.source = 'cache';
          return restaurant;
        });
        console.log('restaurants from cache');
        callback(null, cachedRestaurants);
        this.getRestaurantsFromNetwork(callback);
      }
    })
      .catch((err) => {
        const error = (`Request failed. Returned status of ${err}`);
        callback(error, null);
      });
  }
  /**
   * Get Restaurants from Network
   * @param {function} callback 
   */
  static getRestaurantsFromNetwork(callback) {
    fetch(`${DBHelper.DATABASE_URL}restaurants`)
      .then(response => response.json())
      .then((fetchedRestaurants) => {
        DBHelper.placeRestaurantsIntoIDB(fetchedRestaurants);
        fetchedRestaurants.map((restaurant) => {
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
  static fetchReviewsByRestaurantID(restaurantID, callback) {
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
    this.showCachedReviewsByRestaurantID(restaurantID).then((cachedReviews) => {
      this.getDeferedReviews().then((deferedReviews) => {
        deferedReviews.forEach((deferedReview) => {
          if (restaurantID === deferedReview.restaurant_id) {
            cachedReviews.push(deferedReview);
          }
        });
        if (cachedReviews === undefined || cachedReviews.length === 0) {
          // array empty or does not exist
          // this.getReviewsFromNetwork(restaurantID, callback);
        } else {
          console.log('reviews from cache');
          cachedReviews.map((review) => {
            review.source = 'cache';
            return review;
          });
          if (cachedReviews.length > 0) {
            this.setReviewsSource = 'cache';
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
  static getReviewsFromNetwork(restaurantID, callback) {
    this.getDeferedReviews().then((deferedReviews) => {
      deferedReviews.forEach((deferedReview) => {
        this.postReview(deferedReview, (error, reviewResponse) => {
          // delete review from defered-reviews store
          if (error) {
            console.log(error);
          } else {
            this.deleteDeferedReviewByRestaurantID(reviewResponse.restaurant_id);
          }
        });
      });
    });

    // fetch reviews from network
    fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${restaurantID}`)
      .then(response => response.json())
      .then((fetchedReviews) => {
        DBHelper.placeReviewsIntoIDB(fetchedReviews);
        console.log('reviews from network');
        if (fetchedReviews.length > 0) {
          this.setReviewsSource = 'network';
        }
        fetchedReviews.map((review) => {
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
  static postReview(review, callback) {
    fetch(`${DBHelper.DATABASE_URL}reviews/`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(review),
    })
      .then(res => res.json())
      .then((response) => {
        console.log('Success:', response);
        // TODO: add review to indexDB
        callback(null, response);
      })
      .catch((error) => {
        console.error('Error:', error);
        const timeStamp = Date.now();
        review.createdAt = timeStamp;
        review.updatedAt = timeStamp;
        this.placedeferedReviewsIntoIDB(review);
        callback(error, review);
      });
  }

  /**
   * Delete review
   * @param {number} id
   */
  static deleteReview(id) {
    fetch(`${DBHelper.DATABASE_URL}reviews/${id}`, {
      method: 'delete',
    })
      .then((res) => { console.log(res); });
  }

  /**
   * Update review
   * @param {number} id
   * @param {object} review
   */
  static updateReview(id, review) {
    fetch(`${DBHelper.DATABASE_URL}reviews/${id}`, {
      method: 'put',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(review),
    })
      .then(res => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => console.log('Success:', response));
  }

  /**
   * 
   * @param {number} id 
   * @param {boolean} state 
   * @param {function} callback 
   */
  static updateIsFavortie(id, state, callback) {
    fetch(`${DBHelper.DATABASE_URL}restaurants/${id}/`, {
      method: 'put',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ is_favorite: state }),
    })
      .then(res => res.json())
      .catch((error) => {
        console.error('Error:', error);
        callback(error, null);
      })
      .then((response) => {
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
  static fetchRestaurantById(id, callback) {
    this.showCachedRestaurantByID(id)
      .then((cachedRestaurant) => {
        if (cachedRestaurant === undefined || cachedRestaurant.length === 0) {
          this.getRestaurantFromNetwork(id, callback);
        } else {
          console.log('restaurant from cache');
          cachedRestaurant.source = 'cache';
          callback(null, cachedRestaurant);
          this.getRestaurantFromNetwork(id, callback);
        }
      });
  }

  /**
   * Get restaurant from network
   * @param {number} id 
   * @param {function} callback 
   */
  static getRestaurantFromNetwork(id, callback) {
    console.log(`${DBHelper.DATABASE_URL}restaurants/${id}`);
    fetch(`${DBHelper.DATABASE_URL}restaurants/${id}`)
      .then(response => response.json())
      .then((fetchedRestaurant) => {
        DBHelper.placeRestaurantIntoIDB(fetchedRestaurant);
        fetchedRestaurant.source = 'network';
        console.log('restaurant from network');
        callback(null, fetchedRestaurant);
      })
      .catch(err => err);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   * @param {string} cuisine 
   * @param {function} callback 
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   * @param {string} neighborhood 
   * @param {function} callback 
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   * @param {function} callback 
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((_v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   * @param {function} callback 
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((_v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   * @param {object} restaurant 
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   * @param {object} restaurant 
   */
  static imageUrlForRestaurant(restaurant) {
    // added .jpg so it looks for a jpg image
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   * @param {object} restaurant 
   * @param {object} _map 
   */
  static mapMarkerForRestaurant(restaurant, _map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
      },
    );
    marker.addTo(newMap);
    return marker;
  }

  /**
   * Open IDB
   * @returns {promise} IDB
   */
  static openIDB() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open('restaurants-reviews', 3, (upgradeDb) => {
      switch (upgradeDb.oldVersion) {
        case 0:
          const store = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id',
          });
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id',
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
        case 2:
          const deferedReviewsStore = upgradeDb.createObjectStore('defered-reviews', {
            keyPath: 'restaurant_id',
          });
      }
    });
  }

  /**
   * Place Restaurants in IDB
   * @param {array} restaurants
   */
  static placeRestaurantsIntoIDB(restaurants) {
    const dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');
      restaurants.forEach((restaurant) => {
        restaurantsStore.put(restaurant);
      });
    });
  }

  /**
   * Place Restaurant in IDB
   * @param {array} restaurants
   */
  static placeRestaurantIntoIDB(restaurant) {
    const dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');
      restaurantsStore.put(restaurant);
    });
  }

  /**
   * Place Reviews in IDB
   * @param {array} reviews
   */
  static placeReviewsIntoIDB(reviews) {
    const dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('reviews', 'readwrite');
      const reviewsStore = tx.objectStore('reviews');
      reviews.forEach((review) => {
        reviewsStore.put(review);
      });
    });
  }

  /**
   * Place defered Reviews in IDB
   * @param {array} reviews
   */
  static placedeferedReviewsIntoIDB(review) {
    const dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('defered-reviews', 'readwrite');
      const reviewsStore = tx.objectStore('defered-reviews');
      reviewsStore.put(review);
    });
  }

  /**
   * Show Cached Restaurants
   * @returns {promise array} restaurants
   */
  static showCachedRestaurants() {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if (!db) return Promise.resolve();
      const data = db.transaction('restaurants').objectStore('restaurants');
      return data.getAll().then(restaurants => restaurants);
    });
  }

  /**
   * Show Cached Restaurants
   * @param {number} id 
   * @returns {promise object} restaurant
   */
  static showCachedRestaurantByID(id) {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if (!db) return Promise.resolve();
      const data = db.transaction('restaurants').objectStore('restaurants');
      return data.get(parseInt(id)).then(restaurant => restaurant);
    });
  }

  /**
   * Show Cached Reviews By Restaurant ID
   * @param {number} restaurantID 
   * @returns {promise array} reviews
   */
  static showCachedReviewsByRestaurantID(restaurantID) {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if (!db) return Promise.resolve();
      const data = db.transaction('reviews').objectStore('reviews');
      const restaurantIndex = data.index('restaurant');
      return restaurantIndex.getAll(restaurantID).then(reviews => reviews);
    });
  }

  /**
   * Get defered reviews
   * @returns {promise array} reviews
   */
  static getDeferedReviews() {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if (!db) return Promise.resolve();
      const data = db.transaction('defered-reviews').objectStore('defered-reviews');
      return data.getAll().then(reviews => reviews);
    });
  }

  /**
   * Delete defered review
   * @param {number} restaurantID 
   */
  static deleteDeferedReviewByRestaurantID(restaurantID) {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if (!db) return Promise.resolve();
      const tx = db.transaction('defered-reviews', 'readwrite');
      const reviewsStore = tx.objectStore('defered-reviews');
      reviewsStore.delete(restaurantID);
      return tx.complete;
    }).then(() => {
      console.log(`Deffered Review deleted from restaurant ${restaurantID}`);
    });
  }
}
