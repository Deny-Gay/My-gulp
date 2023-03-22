const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs');
const del = require('del');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const image = require('gulp-image');
const avif = require('gulp-avif');
const webp = require('gulp-webp');
const htmlmin = require('gulp-htmlmin');
const {
  readFileSync
} = require('fs');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revDel = require('gulp-rev-delete-original');

const fonts = () => {
  return src('./src/fonts/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./app/fonts/'))
}

const checkWeight = (fontname) => {
  let weight = 400;
  switch (true) {
    case /Thin/.test(fontname):
      weight = 100;
      break;
    case /ExtraLight/.test(fontname):
      weight = 200;
      break;
    case /Light/.test(fontname):
      weight = 300;
      break;
    case /Regular/.test(fontname):
      weight = 400;
      break;
    case /Medium/.test(fontname):
      weight = 500;
      break;
    case /SemiBold/.test(fontname):
      weight = 600;
      break;
    case /Semi/.test(fontname):
      weight = 600;
      break;
    case /Bold/.test(fontname):
      weight = 700;
      break;
    case /ExtraBold/.test(fontname):
      weight = 800;
      break;
    case /Heavy/.test(fontname):
      weight = 700;
      break;
    case /Black/.test(fontname):
      weight = 900;
      break;
    default:
      weight = 400;
  }
  return weight;
}

const cb = () => {}

let srcFonts = './src/scss/_fonts.scss';
let appFonts = './app/fonts/';

const fontsStyle = (done) => {
	let file_content = fs.readFileSync(srcFonts);

	fs.writeFile(srcFonts, '', cb);
	fs.readdir(appFonts, function (err, items) {

		if (items) {
			let c_fontname;

			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				fontname = fontname[0];
        let font = fontname.split('-')[0];
        let weight = checkWeight(fontname);

				if (c_fontname != fontname) {
					fs.appendFile(srcFonts, '@include font-face("' + font + '", "' + fontname + '", ' + weight +');\r\n', cb);
				}
				c_fontname = fontname;
			}
		}
	})

	done();
}

const svgSprites = () => {
  return src('./src/img/svg/**.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: "../sprite.svg"
        }
      },
    }))
    .pipe(dest('./app/img'))
}

const styles = () => {
  return src(['./src/scss/**/*.scss', './src/scss/**/*.css'])
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream());
}

const htmlInclude = () => {
  return src(['./src/*.html'])
  .pipe(fileinclude({
    prefix: '@',
    basepath: '@file'
  }))
  .pipe(dest('./app'))
  .pipe(browserSync.stream()); 
}

const avifImages = () => {
  return src(['./src/img/**.jpg',
              './src/img/**.png',
              './src/img/**.jpeg'])
      .pipe(avif())
      .pipe(dest('./app/img'));
};

const webpImages = () => {
  return src(['./src/img/**.jpg',
              './src/img/**.png',
              './src/img/**.jpeg'])
      .pipe(webp())
      .pipe(dest('./app/img'))
};

const imgToApp = () => {
  return src(['./src/img/**.jpg',
              './src/img/**.png',
              './src/img/**.svg',
              './src/img/**.jpeg',
              './src/img/**.webp',
              './src/img/**.avif'])
    .pipe(dest('./app/img'))
}

const resources = () => {
  return src(['./src/resources/**',
              './src/resources/**'])
    .pipe(dest('./app/resources/'))
}

const phpMailer = () => {
  return src('./src/phpmailer/**')
    .pipe(dest('./app/phpmailer'))
}

const clean = () => {
	return del(['app/*'])
}

const scripts = () => {
  src('./src/js/libs-js/*.js')
  .pipe(dest('./app/js/libs-js/'))

  return src('./src/js/*.js')
    .pipe(webpackStream({
      output: {
        filename: '[name].js',
      },
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: "defaults" }]
                ]
              }
            }
          }
        ]
      }
    }))
    .on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end');
		})
    .pipe(sourcemaps.init())
    .pipe(uglify().on('error', notify.onError()))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/js/'))
    .pipe(browserSync.stream());  
}

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./app"
    }
  });

  watch('./src/scss/**/*.scss', styles);
  watch('./src/html/*.html', htmlInclude);
  watch('./src/*.html', htmlInclude);
  watch('./src/img/**.jpg', avifImages);
  watch('./src/img/**.png', avifImages);
  watch('./src/img/**.jpeg', avifImages);
  watch('./src/img/**.jpg', webpImages);
  watch('./src/img/**.png', webpImages);
  watch('./src/img/**.jpeg', webpImages);
  watch('./src/img/**.jpg', imgToApp);
  watch('./src/img/**.png', imgToApp);
  watch('./src/img/**.jpeg', imgToApp);
  watch('./src/img/**.webp', imgToApp);
  watch('./src/img/**.avif', imgToApp);
  watch('./src/img/*.svg', imgToApp);
  watch('./src/img/svg/**.svg', svgSprites);
  watch('./src/resources/**', resources);
  watch('./src/phpmailer/**', phpMailer);
  watch('./src/fonts/**.ttf', fonts);
  watch('./src/fonts/**.ttf', fontsStyle);
  watch('./src/js/**/*.js', scripts);
}

exports.clean = clean;
exports.styles = styles;
exports.watchFiles = watchFiles;
exports.fileinclude = htmlInclude;

exports.default = series(clean, parallel(htmlInclude, scripts, fonts, resources, phpMailer, imgToApp, avifImages, webpImages, svgSprites), fontsStyle, styles, watchFiles);

const imagesBuild = () => {
  return src([
    'src/img/**.jpg',
    'src/img/**.png',
    'src/img/**.jpeg',
    'src/img/**.svg'
  ])
  .pipe(image())
  .pipe(dest('./app/img'))
}

const stylesBuild = () => {
  return src(['./src/scss/**/*.scss', './src/scss/**/*.css'])
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(dest('./app/css/'))
}

const scriptsBuild = () => {
  src('./src/js/libs-js/*.js')
  .pipe(dest('./app/js/libs-js/'))

  return src('./src/js/main.js')
    .pipe(webpackStream({
      output: {
        filename: 'main.js',
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: "defaults" }]
                ]
              }
            }
          }
        ]
      }
    }))
    .on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end');
		})
    .pipe(uglify().on('error', notify.onError()))
    .pipe(dest('./app/js'))
}

const htmlMinify = () => {
  return src('app/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(dest('app'));
}

const cache = () => {
  return src('app/**/*.{css,js,svg,png,jpg,jpeg,webp,avif,woff,woff2}', {
    base: 'app'})
    .pipe(rev())
    .pipe(revDel())
    .pipe(dest('app'))
    .pipe(rev.manifest('rev.json'))
    .pipe(dest('app'));
};

const rewrite = () => {
  const manifest = readFileSync('app/rev.json');

  src('app/css/*.css')
    .pipe(revRewrite({
      manifest
    }))
    .pipe(dest('app/css'))

  src('app/js/*.js')
    .pipe(revRewrite({
      manifest
    }))
    .pipe(dest('app/js'))

  return src('app/**/*.html',)
    .pipe(revRewrite({
      manifest
    }))
    .pipe(dest('app'));
}

exports.build = series(clean, parallel(htmlInclude, scriptsBuild, fonts, resources, phpMailer, imgToApp, svgSprites), fontsStyle, stylesBuild, htmlMinify, imagesBuild, cache, rewrite);