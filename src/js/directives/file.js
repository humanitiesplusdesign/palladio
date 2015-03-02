angular.module('palladio.directives.file', [])
.directive('file', function ($rootScope, parseService, dataService) {
  var directiveDefObj = {

    link: function (scope, element, attrs) {

      // EXPERIMENTAL

      scope.currentFieldView = 'field-view-list';

      scope.setView = function(v){

        if (v === scope.currentFieldView) return;

        var current = element.find('.' + scope.currentFieldView);

        element
          .find('.field-view')
          .off('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend');

        current
        .addClass('pt-page-moveToLeft')
        .on('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend',
          function(e) {

            $(this)
              .removeClass('pt-page-current')
              .removeClass('pt-page-moveToLeft')
              .removeClass('pt-page-moveFromRight')
              .off('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend');
        });

        element.find('.' + v)
        .addClass('pt-page-current pt-page-moveFromRight')
        .on('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend',
          function(e) {
            $(e.currentTarget)
            .removeClass('pt-page-moveToLeft')
            .removeClass('pt-page-moveFromRight');

            /*element.find('.field-view')
            .off('webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend');*/
        });


        scope.currentFieldView = v;

      }


    }
  };

  return directiveDefObj;
});
