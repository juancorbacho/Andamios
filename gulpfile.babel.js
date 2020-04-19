import gulp from "gulp"
import browserSync from "browser-sync"
import babel from "gulp-babel"
import cachebust from 'gulp-cache-bust'
import concat from "gulp-concat"
import imagemin from "gulp-imagemin"
import notify from "gulp-notify"
import plumber from "gulp-plumber"
import pug from "gulp-pug"
import sass from "gulp-sass"
import sitemap from "gulp-sitemap"
import sourcemaps from "gulp-sourcemaps"
import uglify from "gulp-uglify"

import postcss from "gulp-postcss"
import autoprefixer from "autoprefixer"
import zIndex from "postcss-zindex"
import pseudoelements from "postcss-pseudoelements"
import nthChild from "postcss-nth-child-fix"

const serve = browserSync.create()

// const browserSync = require('browserSync').create();

const reload = serve.reload

const sassOptionsDev = {
    includePaths: ['node_modules'],
    sourceComments: true,
    outputStyle: 'expanded' 
};

const sassOptionsProd = {
    includePaths: ['node_modules'],
    outputStyle: 'compressed'   
};

const postCssPlugins = [
    autoprefixer({
        browsers: ['last 3 versions'],
    }),
    zIndex(),
    pseudoelements(),
    nthChild()
];

function errorAlertJS(error) {
    //Aquí configuramos el título y subtítulo del mensaje de error, también el sonido.
    notify.onError({
        title: "Gulp JavaScript",
        subtitle: "Algo esta mal en tu JavaScript!",
        sound: "Basso"
    })(error);
    //También podemos pintar el error en el terminal
    console.log(error.toString());
    this.emit("end");
};

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
    gulp.watch('./src/scss/*/*.scss', gulp.series('stylesDev'));
// Listen to change events on HTML and reload 
    gulp.watch('src/pug/**/*.pug', gulp.series('pug')).on('change', reload);
// Listen to change events on JS and reload
    gulp.watch('./src/js/*.js', gulp.series('scriptsDev')).on('change', reload);
// Listen to change events on IMAGES and reload
    gulp.watch("./src/img/**/**", gulp.series('imagesDev')).on("change", reload);
});

/**
* STYLES COMPILATION
*/

gulp.task('stylesDev', ()=>{
    return gulp.src('./src/scss/styles.scss')
        .pipe(sourcemaps.init({ loadMaps : true}))
        .pipe(plumber())
        .pipe(sass(sassOptionsDev).on("error", sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(serve.stream({match: '**/*.css'}))
});

gulp.task('stylesProd', ()=>{
    return gulp.src('./src/scss/styles.scss')
        .pipe(plumber())
        .pipe(sass(sassOptionsProd))
        .pipe(postcss(postCssPlugins))
        .pipe(concat("styles-min.css"))
        .pipe(gulp.dest('./public/css'))
        .pipe(
            notify({
              message: "CSS complete",
            })
          )
});

// **
// HTML COMPILATION
// *

gulp.task('pug', ()=>{
    return gulp.src('./src/pug/pages/*.pug')
        .pipe(plumber())
        .pipe(pug({
            basedir: './src/pug'
        }))
        .pipe(gulp.dest('./public/'))
});

/**
* SCRIPTS COMPILATION
*/

gulp.task('scriptsDev', ()=>{
    return gulp.src('./src/js/*.js')
        .pipe(plumber())
        .pipe(babel({
            presets:['@babel/env']
        }))
        .on('error', function (err) {
            console.error(err)
            this.emit('end')
          })
        .pipe(concat('scripts-min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js/'))
});

gulp.task('scriptsProd', ()=>{
    return gulp.src('./src/js/*.js')
        .pipe(plumber())
        .pipe(babel({
            presets:['@babel/env']
        }))
        .on("error", errorAlertJS)
        .pipe(concat('scripts-min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js/'))
        .pipe(
            notify({
              message: "JavaScript complete",
            })
          )
});

/**
* Copy Images to the public folder and minify
*/

gulp.task('imagesDev', ()=>{
    return gulp.src('./src/img/*')
        .pipe(gulp.dest('./public/img'))
});

gulp.task('imagesProd', ()=>{
    return gulp.src('./src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./public/img'))
        .pipe(
            notify({
              message: "Images complete",
            })
          );
});

gulp.task('sitemap', ()=>{
    return gulp.src('./public/**/*.html', {
            read: false
        })
        .pipe(sitemap({
            siteUrl: 'http://www.example.com'
        }))
        .pipe(gulp.dest('./public'))
        .pipe(
            notify({
              message: "Sitemap complete",
            })
          )
});

gulp.task('cache', ()=>{
    return gulp.src('./public/**/*.html')
      .pipe(cachebust({
        type: 'timestamp'
      }))
      .pipe(gulp.dest('./public'))
  });

gulp.task("dev", gulp.parallel("serve", gulp.series([
        "stylesDev",
        "pug",
        "scriptsDev",
        "imagesDev"
      ])
));

gulp.task("prod", gulp.parallel([
        "stylesProd",
        "pug",
        "scriptsProd",
        "imagesProd",
        "cache",
        "sitemap"
      ])
);

