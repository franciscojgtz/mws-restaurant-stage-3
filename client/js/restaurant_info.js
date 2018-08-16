"use strict";var restaurant=void 0,newMap=void 0,reviews=void 0,cacheRestaurant=void 0;document.addEventListener("DOMContentLoaded",function(e){window.initMap()});var initMap=function(){fetchRestaurantFromURL(function(e,t){e?console.error(e):(self.newMap=L.map("map",{center:[t.latlng.lat,t.latlng.lng],zoom:16,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",{mapboxToken:"pk.eyJ1IjoiZnJhbmNpc2Nvamd0eiIsImEiOiJjamlzOHRncjEwbHU4M3ByeTdpenN5M3YwIn0.y1U7z4RQa0J58bhLtiYlqg",maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',id:"mapbox.streets"}).addTo(newMap),setTimeout(function(){newMap.invalidateSize()},400),fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.newMap))})},fetchRestaurantFromURL=function(n){if(self.restaurant)n(null,self.restaurant);else{var e=getParameterByName("id");if(e)DBHelper.fetchRestaurantById(e,function(e,t){console.log(t),"undefined"!==self.restaurant&&"network"===t.source&&(self.cacheRestaurant=self.restaurant),(self.restaurant=t)?void 0!==self.reviews&&"network"===self.reviews[0].source||(fetchReviewsByRestaurantID(t.id,function(e,t){console.log(t),void 0!==self.reviews&&"cache"===self.reviews[0].source||(self.reviews=t,fillRestaurantHTML())}),n(null,t)):console.error(e)});else{n("No restaurant id in URL",null)}}},fillRestaurantHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant;document.getElementById("restaurant-name").innerHTML=e.name;var t=document.getElementById("button-favorite");"true"===e.is_favorite||!0===e.is_favorite?(t.innerHTML="★",t.classList.add("button-favorite--favorite")):(t.innerHTML="☆",t.classList.add("button-favorite--not-favorite")),document.getElementById("restaurant-address").innerHTML=e.address,e.photograph&&createResponsiveImage(e),document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&fillRestaurantHoursHTML(),fillReviewsHTML()},fillRestaurantHoursHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant.operating_hours,t=document.getElementById("restaurant-hours");for(var n in t.innerHTML="",e){var r=document.createElement("tr"),a=document.createElement("td");a.innerHTML=n,r.appendChild(a);var i=document.createElement("td");i.innerHTML=e[n],r.appendChild(i),t.appendChild(r)}},fetchReviewsByRestaurantID=function(e,n){DBHelper.fetchReviewsByRestaurantID(e,function(e,t){n(null,t)})};document.getElementById("reviews-form").addEventListener("submit",function(e){e.preventDefault();var t=document.getElementById("reviews-form"),n=t.elements.name.value.trim(),r=t.elements.rating.value,a=t.elements["reviews-form__comments-textarea"].value,i={restaurant_id:restaurant.id,name:n,rating:r,comments:a};DBHelper.postReview(i,function(e,t){document.getElementById("reviews-form").reset();var n=document.getElementById("reviews-container"),r=document.getElementById("reviews-list");r.appendChild(createReviewHTML(t)),n.appendChild(r),document.getElementById("reviews-form-container").innerHTML='<h3 class="review-form-container__message--sucess">Thank you for adding a review!</h3>'})},!1);var deleteReview=function(e){DBHelper.deleteReview(e)},updateReview=function(e,t){DBHelper.updateReview(e,t)};window.addEventListener("offline",function(e){console.log("offline")}),window.addEventListener("online",function(e){console.log("online")});var fillReviewsHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.reviews,t=document.getElementById("reviews-container");if(!e){var n=document.createElement("p");return n.innerHTML="No reviews yet!",void t.appendChild(n)}var r=document.getElementById("reviews-list");r.innerHTML="",e.forEach(function(e){r.appendChild(createReviewHTML(e))}),t.appendChild(r)},createReviewHTML=function(e){var t=document.createElement("li"),n=document.createElement("p");n.innerHTML=e.name,t.appendChild(n);var r=document.createElement("p"),a=e.updatedAt,i=timeConverter(a);r.innerHTML=i,t.appendChild(r);var o=document.createElement("p");o.innerHTML="Rating: "+e.rating,t.appendChild(o);var s=document.createElement("p");return s.innerHTML=e.comments,t.appendChild(s),t},timeConverter=function(e){var t=new Date(e),n=t.getFullYear();return["January","February","March","April","May","June","July","August","Septemeber","October","November","December"][t.getMonth()]+" "+t.getDate()+", "+n},fillBreadcrumb=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant,t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)},getParameterByName=function(e,t){t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");var n=new RegExp("[?&]"+e+"(=([^&#]*)|&|#|$)").exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null};function getPhotoDescription(e){switch(parseInt(e)){case 1:return"classical indoor decoration";case 2:return"hand-made cheese pizza";case 3:return"modern dining atmosphere";case 4:return"colorful and dynamic entrance";case 5:return"popular friendly environment";case 6:return"patriotic and popular diner";case 7:return"cozy welcoming entrance";case 8:return"daytime clean entrance";case 9:return"customers enjoying their meal";case 10:return"very clean modern-mexican environment";default:return"error"}}function createResponsiveImage(e){var t=document.createElement("img"),n=document.getElementById("restaurant-img"),r=document.createElement("source"),a=document.createElement("source");t.className="restaurant-img",t.className="lazyload",t.setAttribute("data-sizes","auto"),t.alt=e.name+" restaurant, "+getPhotoDescription(e.photograph);var i=DBHelper.imageUrlForRestaurant(e).slice(0,-4),o="(max-width: 779px) calc(100vw - 4rem), (min-width: 800px) and (max-width: 1023px) calc(60vw - 4rem), (min-width: 1024px) calc(50vw - 4rem), (min-width: 1600px) 760px, calc(100vw - 4rem)";t.setAttribute("data-src",""+DBHelper.imageUrlForRestaurant(e)),r.setAttribute("data-srcset",i+"_300.webp 300w, "+i+"_350.webp 350w, "+i+"_400.webp 400w, "+i+"_450.webp 450w, "+i+"_500.webp 500w, "+i+"_550.webp 550w, "+i+"_600.webp 600w, "+i+"_700.webp 700w, "+i+"_800.webp 800w"),r.type="image/webp",r.sizes=o,a.setAttribute("data-srcset",i+"_300.jpg 300w, "+i+"_350.jpg 350w, "+i+"_400.jpg 400w, "+i+"_450.jpg 450w, "+i+"_500.jpg 500w, "+i+"_550.jpg 550w, "+i+"_600.jpg 600w, "+i+"_700.jpg 700w, "+i+"_800.jpg 800w"),a.type="image/jpg",a.sizes=o,n.append(r),n.append(a),n.append(t)}document.getElementById("button-favorite").addEventListener("click",function(){var e=self.restaurant;console.log(e);var t=!1;"true"!==e.is_favorite&&!0!==e.is_favorite||(console.log(e.is_favorite),t=!0),DBHelper.updateIsFavortie(e.id,!t,function(e,t){self.restaurant=t;var n=document.getElementById("button-favorite");"true"===t.is_favorite||!0===t.is_favorite?(n.innerHTML="★",n.classList.add("button-favorite--favorite"),n.classList.remove("button-favorite--not-favorite")):(n.innerHTML="☆",n.classList.add("button-favorite--not-favorite"),n.classList.remove("button-favorite--favorite"))})});