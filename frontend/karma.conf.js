// karma.conf.js
module.exports = function (config) {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Frameworks to use
    // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    // List of plugins to load
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-spec-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    // Client configuration
    client: {
      jasmine: {
        // Jasmine configuration
        random: true,
        seed: '4321',
        stopSpecOnExpectationFailure: false,
        failSpecWithNoExpectations: false,
        throwFailures: true,
        oneFailurePerSpec: false,
        timeoutInterval: 5000
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },

    // Jasmine HTML Reporter configuration
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },

    // Coverage reporter configuration
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/notes-sharing-frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'cobertura' },
        { type: 'json' }
      ],
      // Coverage thresholds
      check: {
        global: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80
        },
        each: {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60
        }
      },
      // Watermarks for coverage colors
      watermarks: {
        statements: [50, 75],
        functions: [50, 75],
        branches: [50, 75],
        lines: [50, 75]
      },
      // Include all source files for accurate coverage reporting
      includeAllSources: true
    },

    // Spec reporter configuration (for better console output)
    specReporter: {
      maxLogLines: 5,
      suppressErrorSummary: true,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: true,
      failFast: false
    },

    // List of reporters to use
    // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'kjhtml', 'coverage', 'spec'],

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Custom browser configurations
    customLaunchers: {
      // Chrome Headless for CI
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--remote-debugging-port=9222',
          '--disable-background-timer-throttling',
          '--disable-background-networking',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection'
        ]
      },

      // Chrome Headless for local development
      ChromeHeadlessLocal: {
        base: 'ChromeHeadless',
        flags: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--remote-debugging-port=9222'
        ]
      },

      // Chrome with debugging enabled
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333',
          '--disable-web-security'
        ]
      },

      // Firefox for cross-browser testing
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless']
      }
    },

    // Browser console log level
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },

    // Browser no activity timeout (in ms)
    browserNoActivityTimeout: 60000,

    // Browser disconnect timeout (in ms)
    browserDisconnectTimeout: 10000,

    // Browser disconnect tolerance (number of disconnects tolerated)
    browserDisconnectTolerance: 3,

    // Capture timeout (in ms)
    captureTimeout: 60000,

    // Continuous Integration mode
    // If true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Restart when file changes
    restartOnFileChange: true,

    // Concurrency level
    // How many browser instances should be started simultaneously
    concurrency: 1,

    // Preprocess matching files before serving them to the browser
    // Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // Source files for coverage (handled by Angular CLI)
    },

    // Test results processor
    // This is used to format the output of the test results
    junitReporter: {
      outputDir: 'coverage/',
      outputFile: 'test-results.xml',
      useBrowserName: false
    },

    // Webpack configuration
    webpack: {
      // Webpack config for tests (handled by Angular CLI)
    },

    // Files to serve but not include in tests
    files: [
      // Test assets
      { pattern: 'src/assets/**/*', watched: false, included: false, served: true }
    ],

    // Files to exclude
    exclude: [
      'src/test.ts',
      '**/*.e2e-spec.ts'
    ],

    // Mime type settings
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    }
  });

  // Environment-specific configurations
  if (process.env.NODE_ENV === 'ci') {
    // CI-specific configuration
    config.set({
      browsers: ['ChromeHeadlessCI'],
      singleRun: true,
      autoWatch: false,
      reporters: ['progress', 'coverage', 'junit'],
      coverageReporter: {
        ...config.coverageReporter,
        reporters: [
          { type: 'lcov' },
          { type: 'text-summary' },
          { type: 'cobertura' }
        ]
      }
    });
  }

  // Docker environment configuration
  if (process.env.DOCKER === 'true') {
    config.set({
      browsers: ['ChromeHeadlessCI'],
      hostname: '0.0.0.0',
      port: 9876
    });
  }

  // Windows-specific configuration
  if (process.platform === 'win32') {
    config.set({
      browsers: ['Chrome'],
      // Increase timeouts for Windows
      browserNoActivityTimeout: 100000,
      captureTimeout: 100000
    });
  }

  // Debug mode configuration
  if (config.debug) {
    config.set({
      browsers: ['ChromeDebugging'],
      singleRun: false,
      logLevel: config.LOG_DEBUG
    });
  }

  // Performance optimization for large projects
  config.set({
    // Increase memory limit
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,
    
    // Optimize file watching
    files: [
      ...config.files || [],
      { pattern: 'src/**/*.spec.ts', watched: true }
    ],
    
    // Exclude large files from watching
    exclude: [
      ...config.exclude || [],
      'src/**/*.integration.spec.ts',
      'node_modules/**/*'
    ]
  });
};