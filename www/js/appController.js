angular.module('app', ['onsen', 'ngSanitize']);

angular.module('app').controller('LoginController', function ($scope, $window) {
  $scope.init = function() {
    if(!$window.app.bbsCore)
      $window.app.bbsCore = new BBSCore();
    $scope.bbsCore = $window.app.bbsCore;
    $scope.errorMessage = '';
    $scope.sitename = 'PTT';
    $scope.filterResult = [];
    
    $scope.username = $scope.bbsCore.prefs.username;
    $scope.password = $scope.bbsCore.prefs.password;
    $scope.savePassword = $scope.bbsCore.prefs.savePassword;

    $scope.bbsCore.regConnectionStatusEvent($scope.updateMainUI);
  };

  $scope.login = function () {
    console.log('login');
    $scope.bbsCore.login($scope.sitename, $scope.username, $scope.password, $scope.savePassword);
  };

  $scope.updateMainUI = function (status, message) {
    switch (status){
      case "logout":
        mainNavigator.popPage('mainUI.html');
        $scope.errorMessage = '';
        break;
      case "login-success":
        mainNavigator.pushPage('mainUI.html');
        loginModal.hide();
        $scope.errorMessage = '';
        break;
      case "login-failed":
        //show error message
        loginModal.hide();
        $scope.errorMessage = message;
        $scope.$apply();
      case "disconnect":
        break;
      default:
        break;
    }
  };
  
});

angular.module('app').controller('AppController', ['$scope', '$window', '$q', '$sce', function ($scope, $window, $q, $sce) {
  $scope.bbsCore = null;
  $scope.nickname = '';
  $scope.currentBoardName = '';


  $scope.boardListStack = [];
  $scope.currentBoard = {};
  $scope.currentBoard.articleList = [];
  $scope.currentBoard.highlightList = [];
  
  $scope.currentDirectory = {};
  $scope.currentDirectory.subBoardList = [];
  
  $scope.currentArticle = {};
  $scope.currentArticle.lines = [];
  $scope.rootMenu = 'mainUI.html';
 
  $scope.init = function() {
    if(!$window.app.bbsCore)
      $window.app.bbsCore = new BBSCore();
    $scope.bbsCore = $window.app.bbsCore;
    $scope.bbsCore.regConnectionStatusEvent($scope.updateMainUI);    
    $scope.bbsCore.setApplyDataEvent($scope.applyDataEvent);
    $scope.favorites = $scope.bbsCore.getFavorite();
    $scope.classBoards = $scope.bbsCore.getClassBoardDirectories();
    $scope.mailBox = $scope.bbsCore.getMailBox();
  };

  $scope.applyDataEvent = function(subject, obj) {
    if(subject == 'updateArticleContent') {
      if(obj !== $scope.currentArticle)
        return;

      $scope.currentArticle.lines = [];
      for(var i=0;i<obj.content.lines.length;++i) {
        $scope.currentArticle.lines.push({sn: i, html: $sce.trustAsHtml(obj.content.lines[i])});
      }
    }
    $scope.$apply();
  },

  $scope.enterBoard = function (board) {
    if(!board.enter())
      return;

    if(board.isDirectory) {
      if(board.boardName == 'favorite') {
        $scope.boardListStack.push($scope.favorites);
        $scope.currentDirectory = $scope.favorites;
      } else {
        //$scope.boardList = board.subBoardList;
        if($scope.rootMenu == 'mainUI.html')
          homeNavigator.pushPage('boardList.html');
        else if($scope.rootMenu == 'favorite.html')
          favoriteNavigator.pushPage('boardList.html');
        $scope.boardListStack.push(board);
        //$scope.boardList = board.subBoardList;
        $scope.currentDirectory = board;
      }
    } else {
      $scope.currentBoardName = board.boardName;
      $scope.currentBoard = board;
      $scope.$apply();
      if($scope.rootMenu == 'mainUI.html')
        homeNavigator.pushPage('article.html');
      else if($scope.rootMenu == 'favorite.html')
        favoriteNavigator.pushPage('article.html');
      $scope.boardListStack.push({});
      $scope.currentDirectory = {};
      $scope.currentDirectory.subBoardList = [];
    }
  };

  $scope.exitBoard = function () {
    console.log('exitBoard');
    $scope.boardListStack.pop();
    if($scope.boardListStack.length > 0)
      $scope.currentDirectory = $scope.boardListStack[$scope.boardListStack.length-1];
    else
      $scope.currentDirectory = {};
  };

  $scope.enterClassBoard = function () {
    homeNavigator.pushPage('classBoard.html');
  };

  $scope.enterMailBox = function () {
    $scope.mailBox.enter();
    homeNavigator.pushPage('mailList.html');
  };

  $scope.logout = function () {
    $scope.bbsCore.logout();
  };
  
  $scope.onArticleListScrollTop = function () {
    //let robot crawl more list
    $scope.currentBoard.getOldData(15);
  };

  $scope.refresh = function() {
    console.log('refresh');
    $scope.currentBoard.refresh();
  };

  $scope.replyArticle = function (article) {

  };

  $scope.readArticle = function (article) {
    if(!article.read())
      return;

    $scope.currentArticle = article;
    if($scope.rootMenu == 'mainUI.html')
      homeNavigator.pushPage('reading.html');
    else if($scope.rootMenu == 'favorite.html')
      favoriteNavigator.pushPage('reading.html');
    $scope.boardListStack.push({});
    $scope.currentDirectory = {};
    $scope.currentDirectory.subBoardList = [];
  };
  
  $scope.createNewArticle = function () {
    $scope.newArticle = $scope.bbsCore.createNewArticle($scope.currentBoard);
    if($scope.rootMenu == 'mainUI.html')
      homeNavigator.pushPage('postArticle.html');
    else if($scope.rootMenu == 'favorite.html')
      favoriteNavigator.pushPage('postArticle.html');
    $scope.boardListStack.push({});
    $scope.currentDirectory = {};
    $scope.currentDirectory.subBoardList = [];
  };
  
  $scope.postArticle = function () {
    $scope.newArticle.post();
    if($scope.rootMenu == 'mainUI.html')
      homeNavigator.popPage();
    else if($scope.rootMenu == 'favorite.html')
      favoriteNavigator.popPage();
  };
  
  $scope.setArticleClass = function (articleClass) {
    var regex = new RegExp(/(\[.{1,4}\] ?).*/g);
    var result = regex.exec($scope.newArticle.title);
    if(result) {
      $scope.newArticle.title = '['+articleClass+']' + $scope.newArticle.title.substr(result[1].length -1);
    } else {
      $scope.newArticle.title = '['+articleClass+'] ' + $scope.newArticle.title;
    }
  };

  $scope.switchTab = function (tab) {
    $scope.rootMenu=tab;
    switch (tab){
      case "mainUI.html":
        break;
      case "favorite.html":
        $scope.enterBoard($scope.favorites);
        break;
      case "settings.html":
        break;
      default:
        break;
    }
  };
  
  $scope.updateMainUI = function (status) {
    switch (status){
      case "logout":
        $scope.$apply();
        break;
      case "login-success":
        break;
      case "disconnect":
        break;
      default:
        break;
    }
  };
  
  $scope.switchChange = function (itemName) {
    switch (itemName){
      case "deleteDuplicate":
        $scope.bbsCore.prefs.savePrefsValue(itemName, !$scope.deleteDuplicate);
        break;
      case "savePassword":
        var spTmp = !$scope.savePassword;
        $scope.bbsCore.prefs.savePrefsValue(itemName, spTmp);
        if(!spTmp) {
          $scope.bbsCore.prefs.savePrefsValue('username', '');
          $scope.bbsCore.prefs.savePrefsValue('password', '');
        }
        break;
      default:
        break;
    }
  };

}]);
