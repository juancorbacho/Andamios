import gulp from "gulp"
import babelify from "babelify"
import browserify from "browserify"
import browserSync from "browser-sync"
import cssnano from "cssnano"
import cachebust from 'gulp-cache-bust'
import gzip from "gulp-gzip"
import imagemin from "gulp-imagemin"
import notify from "gulp-notify"
import plumber from "gulp-plumber"
import pug from "gulp-pug"
import sass from "gulp-sass"
import sizereport from "gulp-sizereport"
import sitemap from "gulp-sitemap"
import sourcemaps from "gulp-sourcemaps"
import tar from "gulp-tar"
import uglify from "gulp-uglify"
import buffer from "vinyl-buffer"
import source from "vinyl-source-stream"
/* Imports postcss */
import postcss from "gulp-postcss"
import autoprefixer from "autoprefixer"
import zIndex from "postcss-zindex"
import pseudoelements from "postcss-pseudoelements"
import nthChild from "postcss-nth-child-fix"

import del from "del"

const serve = browserSync.create()
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
    autoprefixer(),
    zIndex(),
    pseudoelements(),
    nthChild(),
    cssnano()
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
    gulp.watch('src/pug/**/*.pug', gulp.series('htmlDev')).on('change', reload);
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
        .pipe(sass(sassOptionsDev)
        .on("error", sass.logError))                    
        .pipe(sourcemaps.write('.'))              
        .pipe(gulp.dest('./public/css'))
        .pipe(serve.stream({match: '**/*.css'}))        
});

gulp.task('stylesProd', ()=>{
    return gulp.src('./src/scss/styles.scss')           
        .pipe(plumber())
        .pipe(sass(sassOptionsProd))                    
        .pipe(postcss(postCssPlugins))
        .pipe(gulp.dest('./dist/css'))
        .pipe(
            notify({
              message: "CSS complete",
            })
          )
});

/**
 * HTML COMPILATION
 */

gulp.task('htmlDev', ()=>{
    return gulp.src('./src/pug/pages/*.pug')
        .pipe(plumber())
        .pipe(pug({
            basedir: './src/pug'
        }))
        .pipe(gulp.dest('./public/'))
});

gulp.task('htmlProd', ()=>{
    return gulp.src('./src/pug/pages/*.pug')
        .pipe(plumber())
        .pipe(pug({
            basedir: './src/pug'
        }))
        .pipe(gulp.dest('./dist/'))
});

/**
* SCRIPTS COMPILATION
*/

gulp.task('scriptsDev', ()=>{
    return browserify('./src/js/index.js')              
        .transform(babelify, {
        global: true // permite importar desde afuera (como node_modules)
         })
        .bundle()                                      
        .on('error', function (err) {
            console.error(err)
            this.emit('end')
         })
        .pipe(source('scripts.js'))
        .pipe(buffer())                                      
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js/'))          
});

gulp.task('scriptsProd', ()=>{
    return browserify('./src/js/index.js')
        .transform(babelify, {
        global: true // permite importar desde afuera (como node_modules)
         })
        .bundle()  
        .on("error", errorAlertJS)
        .pipe(source('scripts-min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/js/'))
        .pipe(
            notify({
              message: "JavaScript complete",
            })
          )
});

/**
* COPY IMAGES TO THE PUBLIC FOLDER ANS MINIFY
*/

gulp.task('imagesDev', ()=>{
    return gulp.src('./src/img/*')
        .pipe(gulp.dest('./public/img'))
});

gulp.task('imagesProd', ()=>{
    return gulp.src('./src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/img'))
        .pipe(
            notify({
              message: "Images complete",
            })
          );
});

/** 
 * CREATE SITEMAP 
 */

gulp.task('sitemap', ()=>{
    return gulp.src('./public/**/*.html', {
            read: false
        })
        .pipe(sitemap({
            siteUrl: 'http://www.example.com'
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(
            notify({
              message: "Sitemap complete",
            })
          )
});

/**
 * CACHE BUSTER
 */

gulp.task('cache', ()=>{
    return gulp.src('./public/**/*.html')
      .pipe(cachebust({
        type: 'timestamp'
      }))
      .pipe(gulp.dest('./dist'))
  });

  /**
   * COMPRESS FILES FOR PRODUCTION
   */

  gulp.task('compress', () =>
  gulp.src('./dist/**/**')
    .pipe(tar('code.tar'))   // Pack all the files together
    .pipe(gzip())            // Compress the package using gzip
    .pipe(gulp.dest('.'))
    .pipe(notify('Compressed package generated!'))
);

/**
 * SIZE OF FILES
 */

gulp.task('size', () =>
  gulp.src('dist/**/**')     // Select all the files recursively in dist
    .pipe(sizereport({
      gzip: true,         // Show the plain size and the compressed size
    }))
);

/** 
 * TASK TO DELETE TARGET BUILD FOLDER
 */

gulp.task('clean', ()=>{
    return del(['public/**', '!public']);
  });

gulp.task("dev", gulp.parallel("serve", gulp.series([
        "stylesDev",
        "htmlDev", 
        "scriptsDev",
        "imagesDev",
      ])
));

gulp.task("build", gulp.series(gulp.parallel([
        "stylesProd", 
        "htmlProd", 
        "scriptsProd", 
        "imagesProd", 
        "cache", 
        "sitemap",
      ]), 
        "compress",
        "size"
));