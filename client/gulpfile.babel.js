import babelRegister from 'babel-register';
import gulp from 'gulp';
import browserSync from 'browser-sync';
import del from 'del';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import plumber from 'gulp-plumber';
import webp from 'gulp-webp';
import imageresize from 'gulp-image-resize';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';

const server = browserSync.create();

function clean(done) {
  del(['css']);
  del(['js']);
  done();
}

function cleanImages(done) {
  del(['img']);
  done();
}

const paths = {
  styles: {
    src: 'sass/**/*.scss',
    dest: 'css',
  },

  scripts: {
    src: 'src_js/**/*.js',
    dest: 'js',
  },

  images: {
    src: 'src_img/**/*',
    dest: 'img',
  },
};

function styles() {
  const plugins = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    cssnano({ zindex: false }),
  ];
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.reload({
      stream: true,
    }));
}

function scripts() {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(babel({
      presets: ['es2015'],
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
}

function webPImages(done) {
  const imgSizes = ['300', '350', '400', '450', '500', '550', '600', '700', '800'];
  return imgSizes.forEach(size =>
    gulp.src(`${paths.images.src}.jpg`)
      .pipe(plumber())
      .pipe(webp())
      .pipe(imageresize({ width: size }))
      .pipe(rename({ suffix: `_${size}` }))
      .pipe(gulp.dest(paths.images.dest))
      .on('finish', done));
}

function jpgImages(done) {
  const imgSizes = ['300', '350', '400', '450', '500', '550', '600', '700', '800'];
  return imgSizes.forEach(size =>
    gulp.src(`${paths.images.src}.jpg`)
      .pipe(plumber())
      .pipe(imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            { removeViewBox: true },
            { cleanupIDs: false },
          ],
        }),
      ]))
      .pipe(imageresize({ width: size }))
      .pipe(rename({ suffix: `_${size}` }))
      .pipe(gulp.dest(paths.images.dest))
      .on('finish', done));
}

function optimizeImages(done) {
  return gulp.src(`${paths.images.src}.jpg`)
    .pipe(plumber())
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false },
        ],
      }),
    ]))
    .pipe(gulp.dest(paths.images.dest))
    .on('finish', done);
}

function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: {
      baseDir: './',
    },
  });
  done();
}

function watch() {
  gulp.watch(paths.styles.src, gulp.series(styles, reload));
  gulp.watch(paths.scripts.src, gulp.series(scripts, reload));
  gulp.watch('*.html', reload);
}


const dev = gulp.series(clean, styles, scripts, serve, watch);

export { optimizeImages };
export { webPImages };
export { jpgImages };
export { cleanImages };
export default dev;
