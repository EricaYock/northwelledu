(function browserWarning($, Drupal) {
  Drupal.behaviors.browserWarning = {
    attach: function (context) {
      function detectIE() {
          var ua = window.navigator.userAgent;

          var msie = ua.indexOf('MSIE ');
          if (msie > 0) {
              // IE 10 or older => return version number
              return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
          }

          var trident = ua.indexOf('Trident/');
          if (trident > 0) {
              // IE 11 => return version number
              var rv = ua.indexOf('rv:');
              return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
          }

          var edge = ua.indexOf('Edge/');
          if (edge > 0) {
             // Edge (IE 12+) => return version number
             return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
          }

          // other browser
          return false;
      }
      const isIE = detectIE();
      if (!isIE) return;
      const $body = $('body', context);
      const $browserWarningHtml = '<style>\n' +
      '#nwh_browser_warning { transition:bottom 1s ease; width: 100%; font-size: 14px; line-height: 20px; color: #34383C; padding: 20px 0; text-align: center; display: none; z-index: 9999; position: relative; border-top: 2px solid #dddddd; background-color: white; z-index: 99999; position: fixed; bottom: 0 }\n' +
      '#nwh_browser_warning i { font-size: 35px; }\n' +
      '#nwh_browser_warning .nwh-browser-warning--button { display: flex; }\n' +
      '#nwh_browser_warning button { line-height: 16px; width: 150px; font-size: 16px; padding: 10px; min-height: 40px; z-index: 2;}\n' +
      '#nwh_browser_warning span { padding: 0 10px 0 0; text-align: left; margin: 0 auto 0 15px}\n' +
      '#nwh_browser_warning .nwh-browser-warning--cont { posiiton:relative; max-width: 1380px; margin: 0 auto; }\n' +
      '#nwh_browser_warning .nwh-browser-warning--inner-cont { flex-wrap: nowrap; display: flex; flex-direction: row; justify-content: space-between; margin: 0 auto; align-items: center; max-width: 1140px}\n' +
      
      '@media only screen and (min-width:1px) and (max-width: 767px) {\n' +
      '#nwh_browser_warning span { display: block; padding: 0; text-align: center; }\n' +
      '#nwh_browser_warning i { display: none; }\n' +
      '#nwh_browser_warning .nwh-browser-warning--inner-cont { display: block; }\n' +
      '#nwh_browser_warning button { width: 100px; display: block; margin: 20px auto 0; }\n' +
      '}\n' +
      '</style>\n' +
      '<div id="nwh_browser_warning" class="nwh-browser-warning">\n' +
          '<div class="container">\n' +
            '<div class="row">\n' +
              '<div class="col-sm-12">\n' +
                '<div class="nwh-browser-warning--cont">\n' +
                  '<div class="nwh-browser-warning--inner-cont">\n' +
                    '<i class="fab fa-internet-explorer"></i>\n' +
                    '<span>Our website no longer supports Internet Explorer 11. For an optimal experience please switch to a supported browser, like Chrome, Firefox or Microsoft Edge.</span>\n' +
                    '<div class="nwh-browser-warning--button">\n' +
                      '<button id="nwh_browser_warning_accept" class="button">Accept</button>\n' +
                    '</div>\n' +
                  '</div>\n' +
                '</div>\n' +
              '</div>\n' +
            '</div>\n' +
          '</div>\n' +
        '</div>';
      const key = 'nwh_browser_warning';
      // look for cookie of already accepting iewarning
      // if the user previously set the cookie then do nothing
      // if cookie is not present show ie warning
      const agreement_accepted = nwdsi.getCookie(key);
      const $warning = $('#' + key);
      // if no cookie show ie11 warning and set click event
      if (!agreement_accepted) {
          $body.prepend($browserWarningHtml);
          const $warning = $('#' + key);
          $warning.fadeIn('slow');
          $warning.on('click', 'button', function (e) {
            $warning.remove();
            nwdsi.setCookie(key);
            return;
          });
        }
    },
    setBottomOffset: function() {
      // if the gdpr is present as well as the ie warning place the ie warning above the gdpr
      const bottomOffset = $('#nwh_footer_banner_legal').outerHeight() + 'px';
      $('#nwh_browser_warning').css('bottom', bottomOffset); 
    }
  };
})(jQuery, Drupal);