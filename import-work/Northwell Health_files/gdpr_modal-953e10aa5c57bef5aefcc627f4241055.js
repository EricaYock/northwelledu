(function footerBannerWarning($, Drupal) {
  // turn js on or off
  // if(window) return;
  Drupal.behaviors.footerBannerWarning = {
    // NOTE: IMPORTANT READ THE FOLLOWING
    // Please be aware the gpdr notice is delivered by a drupal module and as such its javascript does not get filtered through babel or compilers
    // that are available on PL.  Any code edited in the js-inject module have to not include some es6 and some methods that are not available in IE11.
    // If working on the javascript for that notice, or any js delivered via the js-inject module be sure to test your js in IE11 and notify EDU devs and QA.
    attach: function (context) {
      const body = context.querySelector('body');
      const footerBannerHtml = `
            <nwhlit-gdpr-banner>
                <div class="nwh_footer_banner--inner-cont">
                    <div class="nwh_footer_banner--shield">
                        <nwhlit-fontawesome-icon icon-prefix="fa-light" icon-name="shield-check" color="booking"></nwhlit-fontawesome-icon>
                    </div>
                    <div class="nwh_footer_banner--left">
                        <nwhlit-typography variant="body-sm" weight="light">
                            <p>
                                We use cookies to give you the best experience. By using our site,
                                you agree to our use of cookies. Please review our
                                <nwhlit-link>
                                    <a href="https://www.northwell.edu/privacy-policies-disclaimers" target="_blank">
                                        privacy policy
                                    </a>
                                </nwhlit-link
                                >
                                to learn more.<br />
                            </p>
                        </nwhlit-typography>
                    </div>
                    <div class="nwh_footer_banner--right">
                        <nwhlit-button class="nwh_footer_banner--button">
                            <button>Accept</button>
                        </nwhlit-button>
                    </div>
                </div>
            </nwhlit-gdpr-banner>
        `;
        document.body.insertAdjacentHTML('afterbegin', footerBannerHtml);
    },
  };
})(jQuery, Drupal);
