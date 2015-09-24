'use strict';

module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    htmlmin: {
      build: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'tmp/index.html': 'client/index.html'
        }
      },
    },
    cssmin: {
      build: {
        src: ['node_modules/bootstrap/dist/css/bootstrap.css', 'client/stylesheets/*.css'],
        dest: 'client/bundle.css'
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      files: ['Gruntfile.js', 'main.js', 'chat-api.js', 'client/**/*.js', '!client/bundle.js']
    },
    browserify: {
      build: {
        src: ['client/app.js'],
        dest: 'client/bundle.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'client/bundle.js',
        dest: 'tmp/bundle.js'
      }
    },
    copy: {
      prebuild: {
        src: 'client/bundle.css',
        dest: 'tmp/bundle.css'
      },
      build: {
        expand: true,
        cwd: 'tmp/',
        src: '**',
        dest: 'dist/',
        flatten: true,
        filter: 'isFile'
      },
    },
    clean: {
      css: ['client/bundle.css'],
      dist: ['dist'],
      tmp: ['tmp']
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Define build task
  grunt.registerTask('build', ['jshint', 'clean:tmp', 'browserify', 'uglify', 'htmlmin', 'clean:css', 'cssmin', 'clean:dist', 'copy', 'clean:tmp']);
};