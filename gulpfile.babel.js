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

//Convert ES6 code in all js files in src/js folder and copy to
//build folder as bundle.js
function build() {
  // body omitted
  return browserify({
      entries: ["./src/js/index.mjs"]
  })
  .transform(babelify.configure({
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

exports.build = series(copyHTMLFiles, build, startServer);
exports.default = series(copyHTMLFiles, build, startServer);
