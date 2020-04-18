import gulp from "gulp"
import browserSync from "browser-sync"
import babel from "gulp-babel"
import concat from "gulp-concat"
import plumber from "gulp-plumber"
import pug from "gulp-pug"
import sass from "gulp-sass"
import uglify from "gulp-uglify"

import postcss from "gulp-postcss"
import autoprefixer from "autoprefixer"
import zIndex from "postcss-zindex"
import pseudoelements from "postcss-pseudoelements"
import nthChild from "postcss-nth-child-fix"

const serve = browserSync.create()

// const browserSync = require('browserSync').create();

const reload = browserSync.reload

const sassOptionsDev = {
    includePaths: ['node_modules'],
    sourceComments: true,
    outputStyle: 'expanded' 
}

const sassOptionsProd = {
    includePaths: ['node_modules'],
    outputStyle: 'compressed'   
}

const postCssPlugins = [
    autoprefixer({
        browsers: ['last 3 versions'],
    }),
    zIndex(),
    pseudoelements(),
    nthChild()
]

// Starts a BrowerSync instance and init the Browsersync
// Static Server + watching scss/html files

gulp.task('serve', function() {
    serve.init({
        server: {
            watch: true,
            baseDir: "./public"
        }
    });
// // Provide a callback to capture ALL events to CSS
// // files - then filter for 'change' and reload all
// // css files on the page.
    gulp.watch('./src/scss/*.scss', gulp.series('stylesDev'));
// Listen to change events on HTML and reload 
    gulp.watch('src/pug/**/*.pug', gulp.series('pug')).on('change', reload);
// Listen to change events on JS and reload
    gulp.watch('./src/js/*.js', gulp.series('babel')).on('change', reload);
});


gulp.task('stylesDev', ()=>{
    return gulp.src('./src/scss/styles.scss')
        .pipe(plumber())
        .pipe(sass(sassOptionsDev))
        .pipe(gulp.dest('./public/css'))
        .pipe(serve.stream())
})

gulp.task('stylesProd', ()=>{
    return gulp.src('./src/scss/styles.scss')
        .pipe(plumber())
        .pipe(sass(sassOptionsProd))
        .pipe(postcss(postCssPlugins))
        .pipe(concat("styles-min.css"))
        .pipe(gulp.dest('./public/css'))
        .pipe(serve.stream())
})

gulp.task('pug', ()=>{
    return gulp.src('./src/pug/*.pug')
        .pipe(plumber())
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
})

gulp.task('babel', ()=>{
    return gulp.src('./src/js/*.js')
        .pipe(plumber())
        .pipe(babel({
            presets:['@babel/env']
        }))
        .pipe(concat('scripts-min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/js/'))
})

gulp.task("dev",gulp.series([
        "stylesDev",
        "pug",
        "babel",
        "serve"
      ])
);

gulp.task("prod",gulp.series([
        "stylesProd",
        "pug",
        "babel"
      ])
);

