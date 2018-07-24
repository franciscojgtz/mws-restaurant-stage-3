const gulp = require('gulp');
const browserSync = require('browser-sync').create();

gulp.task('default', defaultTask);

function defaultTask(done) {
  // place code for your default task here
  console.log('testing RR');
  done();
}

browserSync.init({
  server: './',
});
browserSync.stream();
