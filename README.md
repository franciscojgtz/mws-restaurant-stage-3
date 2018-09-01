# Restaurant Reviews Stage 3
This is the final stage for the Restaurant Reviews project.  
You can see [stage 1](https://github.com/franciscojgtz/mws-restaurant-stage-1) and [stage 2](https://github.com/franciscojgtz/mws-restaurant-stage-2) to appreciate the whole project.

### Client and Server
---

This repository contains two directories:
1) client: interacts with the server managing the data
2) sever: runs on sails.js and its needed to get the restaurants as json.

## Instructions
Inside the client and server directories, you will find the information need it to run each one individually.
The server must be running in order to get the data.

## My role in this project

For this project I was aked to implement the following:

### Functionality

#### User Interface
Users are able to mark a restaurant as a favorite, this toggle is visible in the application. A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database.

#### Offline Use
The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline. User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.

### Responsive Design and Accessibility

#### Responsive Design
The application maintains a responsive design on mobile, tablet and desktop viewports. All new features are responsive, including the form to add a review and the control for marking a restaurant as a favorite.

#### Accessibility
The application retains accessibility features from the previous projects. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly. Roles are correctly defined for all elements of the review form.

### Performance

#### Site Performance
Lighthouse targets for each category exceed:

Progressive Web App: >90  
Performance: >90  
Accessibility: >90  
