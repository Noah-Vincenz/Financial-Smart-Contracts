//Include required modules
var gulp = require("gulp"),
    babelify = require('babelify'),
    browserify = require("browserify"),
    connect = require("gulp-connect"),
    source = require("vinyl-source-stream")
;

// version 4
const { series } = require('gulp');

//Copy static files from html folder to build folder
function copyHTMLFiles() {
  return gulp.src("./src/html/*.*")
  .pipe(gulp.dest("./build"));
}

//Copy static files from html folder to build folder
function copyJSFiles() {
  return gulp.src("./src/js/*.js")
  .pipe(gulp.dest("./build"));
}

//Copy static files from html folder to build folder
function copyResources() {
  return gulp.src("./src/js/resources.mjs")
  .pipe(gulp.dest("./build"));
}

//Convert ES6 ode in all js files in src/js folder and copy to
//build folder as bundle.js
function build() {
  // body omitted
  return browserify({
      entries: ["./src/js/deploy.mjs"]
  })
  .transform(babelify.configure({
      //presets : ["es2015"]
      presets: ["@babel/env"]
  }))
  .bundle()
  .pipe(source("bundle.js"))
  .pipe(gulp.dest("./build"))
  ;
}

//Start a test server with doc root at build folder and
//listening to 9001 port. Home page = http://localhost:9001
function startServer() {
  connect.server({
      root : "./build",
      livereload : true,
      port : 9001
  });
}

exports.build = series(copyHTMLFiles, copyJSFiles, copyResources, build, startServer);
exports.default = series(copyHTMLFiles, copyJSFiles, copyResources, build, startServer);
