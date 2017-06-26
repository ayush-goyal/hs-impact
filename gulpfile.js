var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var changed = require('gulp-changed');
var htmlmin = require('gulp-htmlmin');
var ghpages = require('gulp-gh-pages');


function onError(error) {
	console.log(error);
	this.emit('end');
}

gulp.task('clean', function() {
	return del([
		'public/**/*'
	]);
});

gulp.task('sass', function() {
	return gulp.src(['src/sass/main.scss', 'src/sass/ie8.scss', 'src/sass/top.scss'])
		.pipe(changed('public/css/'))
		.pipe(sourcemaps.init())
		.pipe(sass())
		.on('error', onError)
		.pipe(autoprefixer())
		.pipe(cleanCSS())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest('public/css/'))
});

gulp.task('js', function() {
	return gulp.src('src/js/**/*.js')
		.pipe(changed('public/js/'))
		.pipe(uglify())
		.on('error', onError)
		.pipe(gulp.dest('public/js/'))
})

gulp.task('css', function() {
	return gulp.src('src/css/*')
		.pipe(gulp.dest('public/css/'))
})

gulp.task('img', function() {
	return gulp.src(['src/img/**/*.+(png|jpg|svg)', '!src/img/**/other/**'])
		.pipe(changed('public/img/'))
		.pipe(imagemin({
			verbose: true
		}))
		.pipe(gulp.dest('public/img/'))
})

gulp.task('fonts', function() {
	return gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('public/fonts/'))
})

gulp.task('watch', function() {
	gulp.watch('src/sass/*.scss', ['sass']);
	gulp.watch('src/img/**', ['img']);
	gulp.watch('src/js/**', ['js']);
});

gulp.task('default', ['sass', 'img', 'js', 'css', 'fonts'], function() {
	console.log('Building public folder...');
});