var myApp = angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap']);
angular.module('myApp.controllers', []);

/*-CONFIG -*/

myApp.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {

        $routeProvider
            .when('/login', {
                controller: 'loginCtrl',
                templateUrl: './templates/login.html'
            })
        .when('/', {
            templateUrl: './templates/home.html',
            controller: 'homeCtrl'
        })
        .when('/home', {
            templateUrl: './templates/home.html',
            controller: 'homeCtrl'
        })
        .when("/about", {
            templateUrl: "./templates/about.html",
            controller: 'aboutCtrl'
        })
        .when("/categories", {
            templateUrl: "./templates/categories.html",
            controller: 'categoriesCtrl'
        })
        .when("/list", {
            templateUrl: "./templates/list.html",
            controller: 'listCtrl'
        })
        .when('/messages', {
            templateUrl: './templates/messages.html',
            controller: 'messagesCtrl'
        })
        .when("/newsfeed", {
            templateUrl: "./templates/newsfeed.html",
            controller: 'newsfeedCtrl'
        })
        .when("/perspectives", {
            templateUrl: "./templates/perspectives.html",
            controller: 'perspectivesCtrl'
        })
        .when("/profile", {
            templateUrl: "./templates/profile.html",
            controller: 'profileCtrl'
        })
        .when("/sections", {
            templateUrl: "./templates/sections.html",
            controller: 'sectionsCtrl'
        })
        .when("/settings", {
            templateUrl: "./templates/settings.html",
            controller: 'settingsCtrl'
        })
        // For any unmatched url, redirect to /login
        .otherwise({ redirectTo: '/login' });

        $locationProvider.html5Mode(true);

    }
]);

myApp.run(['$rootScope', '$location', '$http', '$cookies',  'getMessages', //inject all services/factories here
function ($rootScope, $location, $http, $cookies, getMessages) { //inject all services/factories here
   
    //get user's stylesheet preference or default to colors.css
    $rootScope.filename = $.jStorage.get('myStyle', '') || 'colors';
    // keep user logged in after page refresh
    // $rootScope.globals = $cookies.get('globals') || {};
    $rootScope.globals = $.jStorage.get('globals', '') || {};
    if ($rootScope.globals.currentUser) {
        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.token; // jshint ignore:line
        $location.path('/');
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });

    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        $rootScope.hideOverlay = true;
        $rootScope.hideMenuPanel = true;
        //reset all the services to null
        getMessages.reset(null);
        //etc
    });

}]);

/* source: http://jasonwatmore.com/post/2014/05/26/angularjs-basic-http-authentication-example */

/* SERVICES */

myApp.factory('AuthenticationService',
       ['$http', '$cookies', '$rootScope', '$timeout', '$log',
       function ($http, $cookies, $rootScope, $timeout, $log) {
           var service = {};

           service.Login = function (username, password, callback) {

               //$log.info('Login function called');

               if ((username.length && password.length) && (username !== '' && password != '')) {

                   var loginUrl = '<your_moodle_instance>/local/obu_login/token.php';

                   // use $.param jQuery function to serialize data from JSON
                   var data = $.param({
                       username: username,
                       password: password,
                       service: 'local_ws'
                   });
                   var config = {
                       headers: {
                           'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                       }
                   }

                   $http.post(loginUrl, data, config)
                           .success(function (data, status, headers, config) {
                               //$log.info(data.token);
                               myToken = data.token;
                               dataString = JSON.stringify(data);
                               if (dataString.indexOf('error') > 0) {

                                   $rootScope.className = 'error';
                                   $rootScope.PostDataResponse = 'Invalid user credentials, please try again';
                                   $rootScope.isAuthenticated = false;
                                   $rootScope.dataLoading = false;
                               }
                               else {
                                   $.jStorage.set('session', myToken, { TTL: 28800000 });
                                   //$cookies.put('session', myToken);
                               }

                               $rootScope.isAuthenticated = true;
                               // $log.info('isAuthenticated = true');
                               callback(dataString);
                           })
                           .error(function (data, status, header, config) {
                               $rootScope.isAuthenticated = false;
                               $rootScope.ResponseDetails = "data: " + data +
                                       "<br />status: " + status +
                                       "<br />headers: " + header +
                                       "<br />config: " + config;
                               responsedata = JSON.stringify(data);
                               callback(responsedata);
                           });
               } else {

                   $rootScope.className = 'error';
                   $rootScope.isAuthenticated = false;
                   $rootScope.PostDataResponse = 'Please enter a username and password';
               }

           };

           service.SetCredentials = function (sessionToken) {

               var JSONObject = JSON.parse(sessionToken);
               var key = 'token';
               myToken = JSONObject[key];

               $rootScope.globals = {
                   currentUser: {
                       token: myToken
                   }
               };

               $http.defaults.headers.common['Authorization'] = 'Basic ' + sessionToken; // jshint ignore:line

               //retrieve last login date and then update it
               $rootScope.lastLogin = $.jStorage.get('lastLogin', '');
               var today = new Date();
               epochToday = Math.round(today.getTime() / 1000);
               $.jStorage.set('lastLogin', epochToday, { TTL: 28800000 });
               // $log.info('Rootscope Last Login: '+$rootScope.lastLogin);

               $.jStorage.set('globals', $rootScope.globals, { TTL: 28800000 });
               $.jStorage.set('session', myToken, { TTL: 28800000 });
               $.jStorage.set('loginStatus', 'logged in', { TTL: 28800000 });
               //$cookies.put('globals', $rootScope.globals);
               //$cookies.put('session', myToken);
               //$cookies.put('loginStatus', 'logged in');

               //alert('fetched from jstorage ' + $.jStorage.get('session', ''));
           };

           service.ClearCredentials = function () {
               $rootScope.globals = {};
               //$cookies.remove('globals');
               //$cookies.remove('session');
               $.jStorage.deleteKey('globals');
               $.jStorage.deleteKey('session');
               $http.defaults.headers.common.Authorization = 'Basic ';
           };

           return service;
       }])


/* get messages service */
myApp.factory('getMessages', ['$http', '$cookies', '$log', function ($http, $cookies, $log) {

    var service = {};

    service.fetch = function (callback) {
        var session = $.jStorage.get('session', '');
        //var session = $cookies.get('session');
        var url = '<your_moodle_instance>/webservice/rest/server.php?moodlewsrestformat=json&wstoken=' + session + '&wsfunction=local_ws_get_email';

        $http.get(url)
            .success(callback)
            .error(callback);
    }

    service.reset = function () {
        return [];
    }
    return service;

}])
    .factory('updateMessages', ['$http', '$cookies', '$rootScope', '$timeout', function ($http, $cookies, $rootScope, $timeout) {
        return {
            sendit: function (data, callback) {
                //alert(data);
                var session = $.jStorage.get('session', '');
                //var session = $cookies.get('session');
                var updateUrl = '<your_moodle_instance>/webservice/rest/server.php?moodlewsrestformat=json&wstoken=' + session + '&wsfunction=local_ws_set_message_read';

                var config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                    }
                }
                $http.post(updateUrl, data, config)
              .success(function (data, status, headers, config) {
                  responsedata = JSON.stringify(data);
                  /* error handling*/
                  if (responsedata.indexOf('error') > 0 || responsedata.indexOf('invalid') > 0) {

                      $rootScope.className = 'error';
                      $rootScope.PostDataResponse = data.message;
                      //$('.response').fadeOut(4000);
                     
                      $timeout(function () {
                          $scope.hideMe = true;
                      }, 4000);
                  }
                  else {

                      $rootScope.className = 'success';
                      
                      //silent success
                      $rootScope.$emit('refresh_messages', data);
                  }
                  callback;
              })
              .error(function (data, status, header, config) {
                  //responsedata = JSON.stringify(data);
                  callback;
                  $rootScope.PostDataResponse = "Unexpected error";
              });
            }
        };
    }]);

/* CONTROLLERS */

myApp.controller('loginCtrl',
    ['$scope', '$rootScope', '$location', 'AuthenticationService', '$routeParams', '$http',
    function ($scope, $rootScope, $location, AuthenticationService, $routeParams, $http) {
        // reset login status
        //AuthenticationService.ClearCredentials();

        //hide menu button and panel initially
        $rootScope.hideMenuButton = true;
        $rootScope.hideMenuPanel = true;

        $scope.login = function () {
            $scope.dataLoading = true;
            AuthenticationService.Login($scope.username, $scope.password, function (response) {
                responsedata = JSON.stringify(response);
                /* error handling*/
                if (responsedata.indexOf('error') > 0 || responsedata.indexOf('invalid') > 0) {
                    $scope.error = response.message;  
                    $rootScope.className = 'error';
                    $rootScope.dataLoading = false;
                    $rootScope.hideMenuButton = true;
                     
                } else {
                    AuthenticationService.SetCredentials(response);
                    $location.path('/home');
                    $rootScope.hideMenuButton = false;
                };

            });
        };

        $scope.logout = function () {
            
            $rootScope.hideMenuButton = true;
            $rootScope.hideMenuPanel = true;
            $scope.hideMenuPanel = true;
            $rootScope.dataLoading = false;
            $rootScope.hideMe = true;
            $rootScope.PostDataResponse = '';
            $rootScope.ResponseDetails = '';
            //alert('logging out');
            AuthenticationService.ClearCredentials();
        };

        $scope.showMenuPanel = function () {
            $scope.hideMenuPanel = false;
        };

        $scope.doHideMenuPanel = function () {
            $scope.hideMenuPanel = true;
            $rootScope.PostDataResponse = '';
        };
    }])

    .controller('homeCtrl',
       ['$scope', '$rootScope', '$route', '$location', '$log', '$routeParams', '$uibModal',
       function ($scope, $rootScope, $route, $location, $log, $routeParams, $uibModal) {
           //$log.info('you are at ' + $location.path());
           $rootScope.hideMenuPanel = true;
           $rootScope.hideMenuButton = false;

           //$scope.showModal = false;
           $scope.showPopup = function () {
                
               $rootScope.hideOverlay = false;
               var modalInstance = $uibModal.open({
                   controller: 'exampleModalInstanceCtrl',
                   templateUrl: './modals/exampleModal.html'
               });
           };

       }])

/* modal instance - popup window */
.controller('exampleModalInstanceCtrl', ['$scope', '$rootScope', '$routeParams', '$http', '$timeout', '$uibModalInstance',
   function ($scope, $rootScope, $routeParams, $http, $timeout, $uibModalInstance) {

       $scope.cancel = function () {

           $uibModalInstance.close({});
           $rootScope.hideOverlay = true;

       };

   }])


/* main controller - messages */
 .controller('messagesCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {

        $scope.loadMessageData = function () {
            $scope.emails = [];
            // call the getMessages service to load the data
            var myMessages = getMessages.fetch(function (emails) {
                $scope.emails = emails;
                $scope.loadingFinished = true;
            });

            $scope.openMsg = function (email) {
                
                $rootScope.hideOverlay = false;
                var modalInstance = $uibModal.open({
                    controller: "messagesModalInstanceCtrl",
                    templateUrl: './modals/emailModal.html',
                    resolve: {
                        email: function () {
                            return email;
                        }
                    }
                });
            };

        }
        //initial load
        $scope.loadMessageData();
        $rootScope.hideMenuPanel = true;

        $rootScope.$on('refresh_messages', function (event, data) {
            $scope.loadMessageData(data);
            $rootScope.hideMenuPanel = true;
        });
    }])

/* modal instance - messages */
.controller('messagesModalInstanceCtrl', ['$scope', '$rootScope', '$routeParams', '$http', '$timeout', '$uibModalInstance', 'updateMessages', 'email',
    function ($scope, $rootScope, $routeParams, $http, $timeout, $uibModalInstance, updateMessages, email) {
        $scope.email = email;

        $scope.Math = window.Math;
        $scope.date = new Date();
        $scope.epoch = Math.round($scope.date.getTime() / 1000);

        $scope.cancel = function () {
            var read_message_id = $scope.email.message_id;
            var time_message_read = $scope.epoch;

            var postdata = 'messageid=' + read_message_id + '&timeread=' + time_message_read;

            var readMyMessages = updateMessages.sendit(postdata);

            $uibModalInstance.close({});

            $scope.$emit('refresh_messages');
            $rootScope.hideOverlay = true;
        };

    }])

   /*  Empty controllers - you will need to adapt these to collect your data,           *
    *  and build services to fetch the data from the web service - see getMessages      *
    *  service & controller for a working example. Note separation of http functions    *
    *  into a service. You will need to replace the injection of the getMessages        *
    *  service with the relevant service for this controller.                           */


     .controller('aboutCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.aboutItems = [];
    }])

         .controller('settingsCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http) {
        $scope.settings = [];
        $rootScope.filename = $.jStorage.get('myStyle', '') || 'colors';
        $scope.changeStyle = function (stylesheet) {
            $rootScope.filename = stylesheet;
            $log.info(stylesheet);
            $.jStorage.set('myStyle', stylesheet, { TTL: 28800000 });
        };
    }])

     .controller('categoriesCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.categories = [];
    }])

     .controller('listCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.listItems = [];
    }])

     .controller('newsfeedCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.newsItems = [];
    }])

     .controller('profileCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.profileDetails = [];
    }])

     .controller('perspectivesCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
       
        $scope.tabs = [{
            title: 'One',
            url: 'one.tpl.html'
        }, {
            title: 'Two',
            url: 'two.tpl.html'
        }, {
            title: 'Three',
            url: 'three.tpl.html'
        }];

        $scope.currentTab = 'one.tpl.html';

        $scope.onClickTab = function (tab) {
            $scope.currentTab = tab.url;
        }

        $scope.isActiveTab = function (tabUrl) {
            return tabUrl == $scope.currentTab;
        }
    }])

     .controller('sectionsCtrl',
['$rootScope', '$scope', '$uibModal', '$routeParams', '$log', '$timeout', '$http', 'getMessages',
    function ($rootScope, $scope, $uibModal, $routeParams, $log, $timeout, $http, getMessages) {
        $scope.section1open = true;
        $scope.section1Toggle = function () {
            $scope.section1open = $scope.section1open === false ? true : false;
        }
        $scope.section2open = true;
        $scope.section2Toggle = function () {
            $scope.section2open = $scope.section2open === false ? true : false;
        }
        $scope.section3open = true;
        $scope.section3Toggle = function () {
            $scope.section3open = $scope.section3open === false ? true : false;
        }
        $scope.section4open = true;
        $scope.section4Toggle = function () {
            $scope.section4open = $scope.section4open === false ? true : false;
        }

    }])


/***
  * FILTERS
  ***/

    .filter('split', function () {
        return function (input, splitChar, splitIndex) {
            // do some bounds checking here to ensure it has that index
            return input.split(splitChar)[splitIndex];
        }
    })

    .filter('isTruthy', function () {
        return function (input) {
            // Add here, as many 'true' values as you want, this is not case sensitive...
            var truffies = [1, '1', true, 'true', 'yes', 'y'];

            if (typeof input == 'String')
                input = input.toLowerCase();

            return truffies.indexOf(input) > -1;
        };
    })

    .filter('htmlToPlainText', function () {
        return function (text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });
