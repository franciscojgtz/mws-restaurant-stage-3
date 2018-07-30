// import idb from 'idb';
// const idb = require('idb');
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return 'http://localhost:1337/restaurants';
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    this.showCachedRestaurants().then((cachedRestaurants) => {
      if (cachedRestaurants === undefined || cachedRestaurants.length === 0) {
        // array empty or does not exist
        fetch(DBHelper.DATABASE_URL)
          .then(response => response.json())
          .then((fetchedRestaurants) => {
            DBHelper.placeRestaurantsIntoIDB(fetchedRestaurants);
            console.log('restaurants from fetch');
            callback(null, fetchedRestaurants);
          });
      } else {
        console.log('restaurants from cache');
        callback(null, cachedRestaurants);
      }
    })
      .catch((err) => {
        const error = (`Request failed. Returned status of ${err}`);
        callback(error, null);
      });
  }

  /**
   * Fetch reviews by restaurant ID
   */
  static fetchReviewsByRestaurantID(restaurantID, callback) {
    this.showCachedReviewsByRestaurantID(restaurantID).then((cachedReviews) => {
      if (cachedReviews === undefined || cachedReviews.length === 0) {
        // array empty or does not exist
        this.getReviewsFromNetwork(restaurantID).then((fetchedReviews) => {
          callback(null, fetchedReviews);
        });
      } else {
        console.log('reviews from cache');
        console.log(cachedReviews);
        callback(null, cachedReviews);
        this.getReviewsFromNetwork(restaurantID).then((fetchedReviews) => {
          callback(null, fetchedReviews);
        });
      }
    });
  }

  static getReviewsFromNetwork(restaurantID) {
    return fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurantID}`)
      .then(response => response.json())
      .then((fetchedReviews) => {
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
  static postReview(review, callback) {
    fetch('http://localhost:1337/reviews/', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(review),
    })
      .then(res => res.json())
      .then((response) => {
        console.log('Success:', response);
        // TO DO add review to indexDB
        callback(null, response);
      })
      .catch((error) => {
        console.error('Error:', error);
        // To do defer review
        const timeStamp = Date.now();
        review.createdAt = timeStamp;
        review.updatedAt = timeStamp;
        console.log(review);
        this.placeDefferedReviewsIntoIDB(review);
        callback(error, review);
      });
  }

  /**
   * Delete review
   * @param {Review ID} id
   */
  static deleteReview(id) {
    fetch(`http://localhost:1337/reviews/${id}`, {
      method: 'delete',
    })
      .then((res) => { console.log(res); });
  }

  /**
   * Update review
   * @param {Review ID} id
   * @param {Review object} review
   */
  static updateReview(id, review) {
    fetch(`http://localhost:1337/reviews/${id}`, {
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
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
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
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // added .jpg so it looks for a jpg image
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
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
          const defferedReviewsStore = upgradeDb.createObjectStore('deffered-reviews', {
            keyPath: 'restaurant_id',
          });
      }
    });
  }

  /**
   * Place Restaurants in IDB
   * @param {*} restaurants
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
   * Place Reviews in IDB
   * @param {*} reviews
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
   * Place Deffered Reviews in IDB
   * @param {*} reviews
   */
  static placeDefferedReviewsIntoIDB(review) {
    const dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('deffered-reviews', 'readwrite');
      const reviewsStore = tx.objectStore('deffered-reviews');
      reviewsStore.put(review);
    });
  }

  /**
   * Show Cached Restaurants
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
   * Show Cached Reviews By Restaurant ID
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
}
