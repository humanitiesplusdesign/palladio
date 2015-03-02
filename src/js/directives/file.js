angular.module('palladio.directives.file', [])
.directive('file', function ($rootScope, parseService, dataService) {
  var directiveDefObj = {

    link: function (scope, element, attrs) {

      // EXPERIMENTAL

      scope.currentFieldView = 'field-view-list';

      scope.setView = function(v){

        if (v === scope.currentFieldView) return;

        var current = element.find('.' + scope.currentFieldView);

        var animationIn = 'pt-page-moveFromRight',
            animationOut = 'pt-page-moveToRight';

        element
          .find('.field-view')
          .off('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend');

        current
        .addClass(animationOut)
        .on('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend',
          function(e) {
            $(this)
              .removeClass('pt-page-current')
              .removeClass(animationOut)
              .removeClass(animationIn)
              .off('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend');
        });

        element.find('.' + v)
        .addClass('pt-page-current')
        .addClass(animationIn)
        .on('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend',
          function(e) {
            $(e.currentTarget)
            .removeClass(animationOut)
            .removeClass(animationIn);
        });


        scope.currentFieldView = v;

      }


    }
  };

  return directiveDefObj;
});
