"use strict";

/* global window, document */
var nwdsi = {};

(function mainThemeScript($, Drupal) {
  /**
   * Settings.
   * Theme specific settings to be used in js functions and allow for values to
   * be set once and allow for consistency.
   *
   * breakpoints (sm,md,lg) - these should match breakpoints set in scss.
   */
  nwdsi.settings = {
    transitions: {
      duration: 200
    },
    breakpoints: {
      sm: 768,
      md: 992,
      lg: 1200
    }
  };

  var focus_first_field_timer = 0;

  /**
   * Focus on first field
   *
   * Activating a tab panel whose sole purpose is to provide the user with
   * search options should automatically focus on the first input field if it
   * is not a dropdown.
   *
   * @param  {jQuery element} $root The root element from which to find a first field
   */
  nwdsi.focus_first_field = function ($root) {
    clearTimeout(focus_first_field_timer);
    if (arguments.length && $root.length) {
      // Look for only a single form field.
      // Exclude:
      // - hidden inputs
      // - Typeahead clone of text input, used for predictions/autocomplete
      var $input = $root.find("select, input").not(":hidden, .tt-hint").first();
      // if ($input.is('select.js-select2')) { // pre-dsi version
      if ($input.is("select.select2-hidden-accessible")) {
        // DSI version once select2 is applied
        // $input.select2('open'); // We decided against doing this to dropdowns. See DIS-434 and DIS-827.
      } else {
        // console.log('input focus! ', $input);
        $input.focus();

        // Sometimes typeaheads don't properly receive focus,
        // even if they do the active event isn't triggered.
        // Needs moar hax.
        //
        // Even then, sometimes it does receive focus, triggers typeahead
        // activate/active, then somehow loses focus (along with typeahead focus
        // class) while remaining as activeElement. Wat.
        // Needs moar hax, part deuce.
        //
        // It seems with a brief timeout the focus is lost altogether, so we can
        // re-focus, and if things go wonky again just force typeahead.
        //
        var $typeahead = $input.parents(".twitter-typeahead");
        // console.log(' conditions pre timeout: ', $input.hasClass('typeahead'), $typeahead, ! $typeahead.hasClass('twitter-typeahead--focus'), document.activeElement)

        focus_first_field_timer = setTimeout(function () {
          // console.log(' conditions timeout: ', $input.hasClass('typeahead'), $typeahead, ! $typeahead.hasClass('twitter-typeahead--focus'), document.activeElement)
          if ($input.get(0) !== document.activeElement) {
            $input.focus();
          }
          if ($input.hasClass("typeahead") && !$typeahead.hasClass("twitter-typeahead--focus")) {
            // console.log('dat typeahead!');
            $input.data("tt-typeahead").eventBus.trigger("active"); // h4x0r!!!1one1eleven!1!!!!!!!
          }
        }, 10);
      }
    }
  };
  /**
   *  isIE checks if broswer is ie.
   * @returns {bool}
   */
  nwdsi.isIE = function isIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    var trident = ua.indexOf("Trident/");

    if (msie > 0 || trident > 0) {
      // IE or edge => return true
      return true;
    }

    // other browser
    return false;
  };

  /**
   * isMobile checks window width.
   * @returns {boolean}
   */
  nwdsi.isMobile = function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  };

  if (typeof window.require_map === "function") {
    $.getScript("https://www.northwell.edu/sites/northwell/modules/custom/nslij3_custom_search/theme/js/northwell.map.js", window.require_map);
  }

  Drupal.behaviors.plStarter = {
    attach: function attach(context) {
      $("html", context).toggleClass("no-js", false).toggleClass("js", true);
    }
  };
  Drupal.behaviors.formStyles = {
    attach: function attach(context) {
      // Set Select2 theme to add class to select2 wrapper.
      $.fn.select2.defaults.set("theme", "nwdsi");

      // Enable Select2 without search.
      var $select2_basic = $("select", context).not(".select2-exclude, .select2-search, .multiselect, .select2-hidden-accessible, .nwh-marketo-form select");

      if (!nwdsi.doneFlag) {
        nwdsi.doneFlag = 1;
      } else {
        return;
      }
      $select2_basic.select2({
        minimumResultsForSearch: -1
      });

      // Enable select2.
      var $select2_search = $("select.select2-search", context);
      $select2_search.select2();
      // On select2 dropdown open look for style alternate styles and assign them to dropdown.
      $select2_search.on("select2:open", function select2Open() {
        if ($(this).parents(".style-alternate-form").length === 1) {
          $(".select2-container--open").addClass("style-alternate-form");
        }
        if ($(this).parents(".style-alternate").length === 1) {
          $(".select2-container--open").addClass("style-alternate");
        }
      });

      var $select2s = $select2_basic.add($select2_search);

      // taken from statics
      $select2s.find("+ .select2-container .select2-selection__arrow").on("click", function (e) {
        var $select2 = $(this).parents(".select2-container").prev();

        // simulate allowClear

        // If they click the "x" icon to clear/remove their current option
        // then reset the dropdown.

        // Since the icon is changed via pseudo-content there is no way to detect it via JavaScript
        // therefore we check if the container has the .select2-container--selected class
        if ($select2.find("+ .select2-container").hasClass("select2-container--selected")) {
          // console.log('clicked x!');
          // $select2.val('').trigger('change');

          // the value reset thing to isolate placeholder didn't work
          // // Presuming the first option is the default, return its value attribute
          // // so that it properly disappears.
          // //$select2.find('option').first().attr('value', '').prop('value', '');
          $select2.find(":selected").prop("selected", false).trigger("change");
          $select2.select2("close");
          $select2.select2("open");
        }

        // was testing their allowClear feature, what if I had their 'x' and click it?
        // too much of a pain to figure out
        // console.log('doh!');
        // //e.preventDefault();
        // var $clear = $select2.find('+ .select2-container .select2-selection__clear');
        // if ($clear.length) {
        //    console.log('I FOUND YE');
        //    $clear.trigger('mousedown'); // https://github.com/select2/select2/blob/master/src/js/select2/selection/allowClear.js
        // }
      });

      // Provide a way to determine if a selection has been made
      // we can use this to swap the icon for example
      $select2s.on("change", function (e, obj) {
        var $this = $(this);
        var option = $this.prop("selectedIndex");
        var $select2_container = $this.next(".select2-container");

        // If it's the first (presumed default) option that's selected then who cares
        if (option === 0) {
          $select2_container.removeClass("select2-container--selected");

          // If it's not the first option, then we provide a class so we can do stuff, e.g. convert the down arrow icon to a remove icon
        } else {
          // the value reset thing to isolate placeholder didn't work
          // // If this has the placeholder feature,
          // // we presume we still want the first option viewable,
          // // to do that we remove its value attribute.
          // if (Boolean($this.attr('placeholder'))) {
          //    console.log('hi');
          //    $this.find('option').first().removeAttr('value');
          // }
          $select2_container.toggleClass("select2-container--selected", true);
        }
      }).change();

      $select2s.filter(".js-submit-on-change").each(function (i, select2) {
        var $select2 = $(this);
        var name = $select2.attr("name");
        var form_selector = $select2.attr("data-form");
        var $form = false;
        var $matching_field = false;

        // Update/add equivalent form field to external form if any
        if (form_selector && name) {
          $form = $(form_selector);
          if ($form.length) {
            $matching_field = $form.find("[name=" + name + "]");
            if ($matching_field.length) {
              $matching_field.val($select2.val());
            } else {
              $matching_field = $("<input type=\"hidden\" name=\"" + name + "\"/>").val($select2.val()).appendTo($form);
            }
          } else {
            $form = false;
          }
        }

        $select2.on("change", function (e) {
          var $form = false;
          var $matching_field = false;

          // Update external form if any.
          // Repeat of the above in case the selector leads to a different or
          // multiple forms.
          if (form_selector && name) {
            $form = $(form_selector);
            if ($form.length) {
              $matching_field = $form.find("[name=" + name + "]");
              if ($matching_field.length) {
                $matching_field.val($select2.val());
              } else {
                $matching_field = $("<input type=\"hidden\" name=\"" + name + "\"/>").val($select2.val()).appendTo($form);
              }
            } else {
              $form = false;
            }
          }

          if (!$form) {
            $form = $select2.parents("form");
          }

          // In the case of multiple applicable forms, pick the first one that's visible.
          $form = $form.filter(":visible").first();

          // console.log('form.submit ', $form);
          $form.get(0).submit();
        });
      });
    }
  };

  /**
   * Drupal creates a unique hash for select2 form elements on each submit, which
   * results in abandoned dropdowns. This function removes them after ajax call
   * is complete.
   */
  Drupal.behaviors.ajaxCompleteFixFoundation = {
    attach: function attach(context) {
      $(context).ajaxComplete(function (event, xhr, settings) {
        if ($("body > .select2-container--open").length) {
          $("body > .select2-container--open").remove();
        }
      });
    }
  };
  /**
   * FRB-387
   * For Foundation staff listing filters we need to re-initiate select2 after ajax runs. If
   * we don't selec2 disappears from the select dropdown and the styling is incorrect.
   */
  Drupal.behaviors.selectFieldFixStaffFilter = {
    attach: function attach(context) {
      $(context).ajaxComplete(function (event, xhr, settings) {
        var $staff_filter = $(".support-filter__filter select", context).not(".select2-exclude, .select2-search, .multiselect");
        $staff_filter.select2({
          minimumResultsForSearch: -1
        });
      });
    }
  };
  Drupal.behaviors.formDatepicker = {
    attach: function attach(context) {
      $(".input-group.date", context).datepicker({
        autoclose: true
      });
    }
  };
  Drupal.behaviors.popover = {
    attach: function attach(context) {
      var $popovers = $("[data-toggle=popover]", context).not("[data-trigger=click]");
      $popovers.popover({
        trigger: "hover"
        //trigger: nwdsi.isMobile() ? 'notanevent' : 'hover', // any non-click and non-hover trigger should add focusin/out events.
        //trigger: 'click' // for testing purposes
      });
      var $popoversClick = $("[data-toggle=popover][data-trigger=click]", context);
      $popoversClick.popover({
        trigger: "click"
      });
      // From the source of tooltip
      // var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
      // var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'
      //
      // this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
      // this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))

      // On mobile the mouseenter accidentally works
      if (nwdsi.isMobile()) {
        var $body = $(document.body);
        $popovers.on("mouseenter.popover", function () {
          // console.log('popoverd');
          var $popover = $(this);
          $body.off("touchend.popover"); // prevent adding click event over and over, but then what about other popovers? This is a temp solution. We care not.
          // ^answer is trigger this instead of offing it since off will off it!
          // $body.trigger('click.popover'); // Well it would be the answer if it was more precise. in desktop pretending to be mobile, hover: opens, mouseout: closes, hover: opens/closes.
          $body.on("touchend.popover", function () {
            // click event doesn't work on mobile for some reason, perhaps something is preventing propagation?
            // console.log('touchend.popover!');
            $popover.trigger("mouseleave.popover");
            $popovers.not($popover).each(function (i, popover) {
              var $other_popover = $(popover);
              var popover_data = $other_popover.data("bs.popover");
              if (popover_data.isInStateTrue()) {
                popover_data.inState.hover = false;
                popover_data.leave.bind(popover_data)(popover_data);
              }
            });
            $body.off("touchend.popover");
          });
        });
      }
    }
  };
  /**
   * Converts foundation SVG images into XML for CSS alterations.
   * @type {{attach: Drupal.behaviors.svgMarkupConverter.attach, convert: Drupal.behaviors.svgMarkupConverter.convert}}
   */
  Drupal.behaviors.svgMarkupConverter = {
    attach: function attach(context) {
      var elements = ".support-full-width-factoid, .support-my-northwell, .card-group--support-factoid";
      Drupal.behaviors.svgMarkupConverter.convert(context, elements);
    },
    convert: function convert(context, elements) {
      $(context).find('img[src$=".svg"]').once("convertSVGPaths").each(function () {
        var $img = $(this);
        var imgURL = $img.attr("src");
        var attributes = $img.prop("attributes");
        $.get(imgURL, function (data) {
          // Get the SVG tag, ignore the rest
          var $svg = $(data).find("svg");
          // Remove any invalid XML tags
          $svg = $svg.removeAttr("xmlns:a");
          // Loop through IMG attributes and apply on SVG
          $.each(attributes, function () {
            $svg.attr(this.name, this.value);
          });
          // Replace IMG with SVG
          $img.replaceWith($svg);
        }, "xml");
      });
    }
  };
  /**
   * Open foundation external links in a new window.
   * @type {{attach: Drupal.behaviors.externalLinksModifier.attach}}
   */
  Drupal.behaviors.externalLinksModifier = {
    attach: function attach(context) {
      // Find all links on the Foundation site.
      $(context).find(".support.region-content a, .support-site-header a, .support.region-footer a").once("external-link").each(function () {
        if (Drupal.theme("externalLinks", this)) {
          $(this).attr("target", "_blank");
        }
      });
    }
  };
  /**
   * Verifies external link for externalLinksModifier
   * @param link_element
   * @returns {boolean}
   */
  Drupal.theme.externalLinks = function (link_element) {
    return window.location.hostname !== link_element.hostname;
  };

  /**
   * Correct inconsistencies with foundation card group heights.
   * @type {{attach: Drupal.behaviors.setCardHeights.attach}}
   */
  Drupal.behaviors.setCardHeights = {
    attach: function attach(context) {
      $(context).find(".card-group--support").each(function () {
        var setHeights = function setHeights(selector) {
          var elementHeights = selector.map(function () {
            return $(this).height();
          }).get();
          // Math.max takes a variable number of arguments.
          // `apply` is equivalent to passing each height as an argument.
          var maxHeight = Math.max.apply(null, elementHeights);
          // Set each height to the max height.
          selector.height(maxHeight);
        };
        // Select elements.
        var cardContainers = [];
        cardContainers.push($(".card-group--support-teasers .card__content"), $(".card-group--my-northwell .card__title"));
        // Perform height adjustments.
        if (cardContainers.length !== 0) {
          $.each(cardContainers, function (i, elm) {
            setHeights(elm);
          });
          // Listen for change in window size so heights are dynamic.
          window.addEventListener("resize", function resizeHeights() {
            $.each(cardContainers, function (i, elm) {
              elm.removeAttr("style").delay(800);
              setHeights(elm);
            });
          });
        }
      });
    }
  };

  /**
   * Handle clicks outside the utility menu to close it
   * @type {{attach: Drupal.behaviors.toggleGigyaDropdown.attach}}
   */
  Drupal.behaviors.toggleGigyaDropdown = {
    attach: function attach() {
      $(document).once('closeDropdown').on('click', function (e) {
        if (!$(e.target).closest('.utility-nav__gigya').length) {
          $('.gigya-nav__logged-in.gigya-nav__menu--open').removeClass('gigya-nav__menu--open');
        }
      });
    }
  };

  /** handle the people grid component */
  Drupal.behaviors.animatePeopleComponent = {
    attach: function attach() {
      var components = document.querySelectorAll('.people-grid-component.details-fade');
      if (!components.length) return;

      var _loop = function _loop(i) {
        var component = components[i];
        var detail_section = component.querySelector('section');
        var summary = component.querySelector('.people-grid-component__summary');
        var box = detail_section.getBoundingClientRect();
        var realHeight = box.height;
        var collapsed_height = nwdsi.isMobile() ? '860px' : '740px';
        detail_section.style.maxHeight = collapsed_height;

        summary.addEventListener("click", function (e) {
          if (component.classList.contains("open")) {
            // since it's not closed yet, it's open!
            component.classList.remove("open");
            component.classList.add("closed");
            detail_section.style.maxHeight = collapsed_height;
          } else if (component.classList.contains("closed")) {
            component.classList.add("open"); // add a class which applies the animation in CSS
            component.classList.remove("closed");
            detail_section.style.maxHeight = realHeight + 'px';
          } else {
            component.classList.add("open");
            detail_section.style.maxHeight = realHeight + 'px';
          }
        });
      };

      for (var i = 0; i < components.length; i++) {
        _loop(i);
      }
    }
  };

  /**
   *  set cookie on the northwell.edu domain
   * provides a console error if the cookie is attempted to be set on another domain
   * @returns nothing
   * @param key = cookie name
   * @param duration = number of years in the future, default to 10
   */
  nwdsi.setCookie = function setCookie(key, duration, value) {
    var cookieDate = new Date();
    var cookieValue = value ? value : 'agreement_accepted';
    var cookieUrl = window.location.hostname === "edu.drupal.northwell.docksal" ? "edu.drupal.northwell.docksal" : "northwell.edu";
    cookieDate = duration ? duration : cookieDate.setFullYear(cookieDate.getFullYear() + 10);
    document.cookie = key + '=' + cookieValue + '; expires=' + cookieDate + '; domain=' + cookieUrl + '; path=/';
    var isCookieSet = this.getCookie(key);
    if (!isCookieSet) {
      console.log('cookie is not set');
    }
    return;
  };

  nwdsi.deleteCookie = function deleteCookie(key, value) {
    value = value ? value : '';
    document.cookie = key + '=' + value + '; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=northwell.edu; path=/';
  };
  /**
   *  gets cookie by name
   * @returns nothing
   * @param key = cookie name
   */
  nwdsi.getCookie = function getCookie(key) {
    var b = document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
  };

  // added to facilitate setting a flag on the click of profile cards for campaigns that tells the resulting profile page
  // that it is to display the campaign experience
  Drupal.behaviors.setCampaignExpCookie = {
    attach: function attach(context) {
      // for testing, set default to 291
      var gid = 291;
      if (drupalSettings && drupalSettings.site && drupalSettings.site.gid) {
        gid = drupalSettings.site.gid;
      }
      var campaignGidArr = [1301, 1241, 1236, 1311, 1256, 1266, 1191, 1271, 1231, 1251, 1281, 1146, 1296, 291, 1286, 1226, 1261, 1276, 1306, 1291, 1221, 1246];

      if (campaignGidArr.indexOf(gid) !== -1) {
        var campaignPhysicianLinks = context.querySelectorAll("[href*='find-care/find-a-doctor']");
        if (!campaignPhysicianLinks.length) return;

        for (var i = 0; i < campaignPhysicianLinks.length; i++) {
          campaignPhysicianLinks[i].addEventListener("click", function () {
            var date = new Date(new Date().getTime() + 86400000); // 1 day
            document.cookie = "nwh_campaign_token=true; domain=northwell.edu; expires=" + date.toUTCString() + "; path=/";
          });
        }
      }
    }
  };

  /**
   * WCAG 2.4.3 Focus Order fix for login/bill pay pages.
   *
   * On dedicated login-style pages, removes the primary header navigation
   * from the keyboard focus order so that tab focus goes directly to the
   * login/bill pay form. This is a temporary fix — pattern lab is being
   * deprecated.
   *
   * Targets:
   *   /login
   *   /manage-your-care/billpay
   */
  Drupal.behaviors.loginPageFocusOrder = {
    attach: function attach(context) {
      if (context !== document) return;

      var loginPaths = ['/login', '/manage-your-care/billpay'];
      var currentPath = window.location.pathname.replace(/\/+$/, '');

      if (loginPaths.indexOf(currentPath) === -1) return;

      var headerEl = document.querySelector('.site-header.root-site-header');
      if (!headerEl) return;

      var focusableSelectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      var focusableEls = headerEl.querySelectorAll(focusableSelectors);

      for (var i = 0; i < focusableEls.length; i++) {
        focusableEls[i].setAttribute('tabindex', '-1');
      }

      headerEl.setAttribute('aria-hidden', 'true');
    }
  };
})(jQuery, Drupal);
'use strict';

(function secondaryThemeScript($, Drupal) {
  Drupal.behaviors.demo2 = {
    attach: function attach(context) {
      $('html', context).addClass('js2');
    }
  };
})(jQuery, Drupal);
'use strict';

// Application Insights JS that allows us to track unique analytics events
// Call this function in other JS files using Drupal behaviors
// e.g. Drupal.behaviors.applicationInsights.appInsightsTrackEvent()
// The Application Insights SDK is loaded in the <head> in both PL and Drupal using the snippet method
(function gigyaScript($, Drupal) {
  Drupal.behaviors.applicationInsights = {
    /**
     * Fire appInsights.trackEvent()
     *
     * @param eventName String - The event name
     * @param finalizedProperties Object - Combined properties ready to send
     */
    sendAnalyticEvent: function sendAnalyticEvent(eventName, finalizedProperties) {
      appInsights.trackEvent({
        name: eventName,
        properties: {
          Properties: finalizedProperties
        }
      });
    },

    /**
     * This will also set common properties like the channel, screenTitle, and pageUrl.
     *
     * It will also accept a customProperties object for additional properties.
     *
     * @param eventName String - The event name
     * @param customProperties Object - Additional analytic data
     * @param customScreenTitle String - Used to manually set a screen title
     * @param skipUidCheck Boolean - Toggle for skipping UID check
     */
    setupAnalyticsEvent: function setupAnalyticsEvent(eventName, customProperties, customScreenTitle, skipUidCheck) {
      var defaultProperties = {
        channel: 'EDU',
        pageUrl: window.location.href,
        screenTitle: customScreenTitle ? customScreenTitle : document.title
      };
      // jQuery way of merging two objects together.
      var combinedProperties = $.extend({}, defaultProperties, customProperties);
      // One more merging of objects for the conditional gigyaUID value.
      var finalizedProperties = void 0;
      if (skipUidCheck) {
        if (!combinedProperties.hasOwnProperty('gigyaUID')) {
          finalizedProperties = $.extend({}, combinedProperties, { gigyaUID: 'NULL' });
        } else {
          finalizedProperties = combinedProperties;
        }
        // sendAnalyticsEvent call is needed in both scenarios.
        Drupal.behaviors.applicationInsights.sendAnalyticEvent(eventName, finalizedProperties);
      } else {
        /*Drupal.behaviors.gigya.hasCurrentUid((gigyaUID) => {
          finalizedProperties =  $.extend({}, combinedProperties, { gigyaUID });
          // This function call needs to be called within hasCurrentUid
          // otherwise when we finally send the Properties object, it is
          // "undefined".
          Drupal.behaviors.applicationInsights.sendAnalyticEvent(eventName, finalizedProperties);
        });*/
      }
    },

    /**
     * @param customProperties Object - Additional analytic data
     * @param skipUidCheck Boolean - Toggle for skipping UID check
     * @param customScreenTitle String - Used to manually set a screen title
     */
    tabClicked: function tabClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Tab Clicked', customProperties, customScreenTitle, skipUidCheck);
    },
    cardClicked: function cardClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Card Clicked', customProperties, customScreenTitle, skipUidCheck);
    },
    tileClicked: function tileClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Tile Clicked', customProperties, customScreenTitle, skipUidCheck);
    },
    buttonClicked: function buttonClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Button Clicked', customProperties, customScreenTitle, skipUidCheck);
    },
    navigationClicked: function navigationClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Navigation Clicked', customProperties, customScreenTitle, skipUidCheck);
    },
    linkClicked: function linkClicked() {
      var customProperties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var skipUidCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var customScreenTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      Drupal.behaviors.applicationInsights.setupAnalyticsEvent('Link Clicked', customProperties, customScreenTitle, skipUidCheck);
    },

    // Using code for taken getElementXPath() and getElementTreeXPath() from
    // https://gist.github.com/prayashm/cc9e3a7f99f064d51754dad01354a791
    getElementXPath: function getElementXPath(element) {
      if (element && element.id) {
        return '//*[@id="' + element.id + '"]';
      } else {
        return Drupal.behaviors.applicationInsights.getElementTreeXPath(element);
      }
    },
    getElementTreeXPath: function getElementTreeXPath(element) {
      var paths = []; // Use nodeName (instead of localName)
      // so namespace prefix is included (if any).
      for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode) {
        var index = 0;
        var hasFollowingSiblings = false;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
          // Ignore document type declaration.
          if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
            continue;
          }
          if (sibling.nodeName == element.nodeName) {
            ++index;
          }
        }
        for (var sibling = element.nextSibling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
          if (sibling.nodeName == element.nodeName) {
            hasFollowingSiblings = true;
          }
        }
        var tagName = element.localName;
        if (element.prefix) {
          tagName = element.prefix + ':' + element.localName;
        }
        var pathIndex = index || hasFollowingSiblings ? '[' + (index + 1) + ']' : '';
        paths.splice(0, 0, tagName + pathIndex);
      }
      return paths.length ? '/' + paths.join('/') : null;
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * nslij3-statics/js/globals/_smooth-links.js
 */

(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.smoothLinks = {
    attach: function attach(context) {
      /** !Add Easing Animation to All Anchor Tags - KC */
      var $domProps = $('html, body');
      var $hashed_anchors = $('a[href*="#"]').not('[href="#"]').not('.js-dont-scroll').not('[data-toggle="tab"]');

      var hashed_anchors_scroll_to = function hashed_anchors_scroll_to(event) {
        // Compare the path and hostname to ensure we're operating within the same page.
        // If not, the 'click' should function like a normal link.
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {

          // Convert the DOM element into a jQuery object to extract the hash, then construct a selector with it.
          var target = $($(this.hash));

          // Does the selector find an element? If not, try selecting a name attribute based on the hash.
          target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

          if (target.length === 0) {
            // You shall not animate.
            return false;
          } else {

            var offsetHeight = $("#slidenav_sticky").height();
            var dataOffsetElement = $(this).parents('[data-smooth-links-offset]');

            // Data attribute attached to markup for overriding offsetHeight if it's necessary
            if (dataOffsetElement.length > 0) {
              offsetHeight = dataOffsetElement.eq(0).attr('data-smooth-links-offset');
            }

            // Consider hash links from Foundation's megamenu and close the nav panel.
            if ($('.support-site-header').length && offsetHeight == null) {
              Drupal.behaviors.supportnavigation.closeMenu(context);
            }

            // Some browsers like *coughvomit*Firefox*cough* keep prior links active while going back/forth
            $hashed_anchors.not(this).blur();

            // Avoid conflicting with user's manual movement
            // @link http://stackoverflow.com/questions/18445590/jquery-animate-stop-scrolling-when-user-scrolls-manually
            $domProps.bind('scroll mousedown DOMMouseScroll mousewheel keyup', function (event) {
              // do nothing if the key pressed was the enter key for clicking on a link
              if (typeof event.keyCode === 'undefined' || event.keyCode !== 13) {
                $domProps.stop();
              }
            });

            // in some cases the offsetHeight is returned as undefined instead of null causing the smoothscroll to fail
            if (offsetHeight === undefined) offsetHeight = null;

            $domProps.stop().animate({
              scrollTop: target.offset().top - offsetHeight - 10
            },
            //1600,
            //"easeOutQuint",  // requires jQuery UI
            500, "swing", function () {
              $domProps.unbind('scroll mousedown DOMMouseScroll mousewheel keyup');
            });
            event.preventDefault();
          }
        }
      };

      $hashed_anchors.each(function (i, ahref) {
        var $ahref = $(ahref);
        $ahref.once('smooth-links').on('click', hashed_anchors_scroll_to);
      });
    }
  };
})(jQuery, Drupal);
'use strict';

nwdsi || (nwdsi = {});

nwdsi.allImagesLoaded = function (images, callback) {
  $ = jQuery;
  var imagesLength = images.length;
  if (!(images instanceof jQuery)) {
    images = $(images);
  }
  var allImagesLoaded = function allImagesLoaded() {
    // Run onload code.
    return callback();
  };
  images.each(function (i, el) {
    if (imagesLength - 1 === i) {
      var tmpImg = new Image();
      tmpImg.onload = allImagesLoaded;
      tmpImg.src = $(this).attr('src');
    }
  });
};
'use strict';

navigator.browserSpecs = function () {
    var ua = navigator.userAgent,
        tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE', version: tem[1] || '' };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return { name: M[0], version: M[1] };
}();
"use strict";

nwdsi || (nwdsi = {});

nwdsi.convertMonthNumber = function (month, format) {
    if (format === 'short') {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    } else if (format === 'long') {
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    }

    month = months[month - 1];

    return month;
};
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

nwdsi || (nwdsi = {});

nwdsi.convertTimeFrom12to24 = function (time12h) {
  var _time12h$split = time12h.split(' '),
      _time12h$split2 = _slicedToArray(_time12h$split, 2),
      time = _time12h$split2[0],
      modifier = _time12h$split2[1];

  var _time$split = time.split(':'),
      _time$split2 = _slicedToArray(_time$split, 2),
      hours = _time$split2[0],
      minutes = _time$split2[1];

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  return hours + ':' + minutes;
};
"use strict";

// a class to count the number of decimal places
if (!nwdsi) nwdsi = {};

nwdsi.countDecimals = function (value) {
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
};
'use strict';

nwdsi || (nwdsi = {});

nwdsi.generateUniqueId = function () {
  var d = new Date().valueOf();
  var n = d.toString();
  var uniqueId = '';
  var length = 32;
  var p = 0;
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (var i = length; i > 0; --i) {
    uniqueId += i & 1 && n.charAt(p) + chars[Math.floor(Math.random() * chars.length)];
    if (i & 1) p++;
  };

  return uniqueId;
};
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
*  Ajax Autocomplete for jQuery, version 1.4.10
*  (c) 2017 Tomas Kirda
*
*  Ajax Autocomplete for jQuery is freely distributable under the terms of an MIT-style license.
*  For details, see the web site: https://github.com/devbridge/jQuery-Autocomplete
*/
!function (a) {
  "use strict";
  "function" == typeof define && define.amd ? define(["jquery"], a) : a("object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "function" == typeof require ? require("jquery") : jQuery);
}(function (a) {
  "use strict";
  function b(c, d) {
    var e = this;e.element = c, e.el = a(c), e.suggestions = [], e.badQueries = [], e.selectedIndex = -1, e.currentValue = e.element.value, e.timeoutId = null, e.cachedResponse = {}, e.onChangeTimeout = null, e.onChange = null, e.isLocal = !1, e.suggestionsContainer = null, e.noSuggestionsContainer = null, e.options = a.extend(!0, {}, b.defaults, d), e.classes = { selected: "autocomplete-selected", suggestion: "autocomplete-suggestion" }, e.hint = null, e.hintValue = "", e.selection = null, e.initialize(), e.setOptions(d);
  }function c(a, b, c) {
    return a.value.toLowerCase().indexOf(c) !== -1;
  }function d(b) {
    return "string" == typeof b ? a.parseJSON(b) : b;
  }function e(a, b) {
    if (!b) return a.value;var c = "(" + g.escapeRegExChars(b) + ")";return a.value.replace(new RegExp(c, "gi"), "<strong>$1</strong>").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/&lt;(\/?strong)&gt;/g, "<$1>");
  }function f(a, b) {
    return '<div class="autocomplete-group">' + b + "</div>";
  }var g = function () {
    return { escapeRegExChars: function escapeRegExChars(a) {
        return a.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      }, createNode: function createNode(a) {
        var b = document.createElement("div");return b.className = a, b.style.position = "absolute", b.style.display = "none", b;
      } };
  }(),
      h = { ESC: 27, TAB: 9, RETURN: 13, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 },
      i = a.noop;b.utils = g, a.Autocomplete = b, b.defaults = { ajaxSettings: {}, autoSelectFirst: !1, appendTo: "body", serviceUrl: null, lookup: null, onSelect: null, width: "auto", minChars: 1, maxHeight: 300, deferRequestBy: 0, params: {}, formatResult: e, formatGroup: f, delimiter: null, zIndex: 9999, type: "GET", noCache: !1, onSearchStart: i, onSearchComplete: i, onSearchError: i, preserveInput: !1, containerClass: "autocomplete-suggestions", tabDisabled: !1, dataType: "text", currentRequest: null, triggerSelectOnValidInput: !0, preventBadQueries: !0, lookupFilter: c, paramName: "query", transformResult: d, showNoSuggestionNotice: !1, noSuggestionNotice: "No results", orientation: "bottom", forceFixPosition: !1 }, b.prototype = { initialize: function initialize() {
      var c,
          d = this,
          e = "." + d.classes.suggestion,
          f = d.classes.selected,
          g = d.options;d.element.setAttribute("autocomplete", "off"), d.noSuggestionsContainer = a('<div class="autocomplete-no-suggestion"></div>').html(this.options.noSuggestionNotice).get(0), d.suggestionsContainer = b.utils.createNode(g.containerClass), c = a(d.suggestionsContainer), c.appendTo(g.appendTo || "body"), "auto" !== g.width && c.css("width", g.width), c.on("mouseover.autocomplete", e, function () {
        d.activate(a(this).data("index"));
      }), c.on("mouseout.autocomplete", function () {
        d.selectedIndex = -1, c.children("." + f).removeClass(f);
      }), c.on("click.autocomplete", e, function () {
        d.select(a(this).data("index"));
      }), c.on("click.autocomplete", function () {
        clearTimeout(d.blurTimeoutId);
      }), d.fixPositionCapture = function () {
        d.visible && d.fixPosition();
      }, a(window).on("resize.autocomplete", d.fixPositionCapture), d.el.on("keydown.autocomplete", function (a) {
        d.onKeyPress(a);
      }), d.el.on("keyup.autocomplete", function (a) {
        d.onKeyUp(a);
      }), d.el.on("blur.autocomplete", function () {
        d.onBlur();
      }), d.el.on("focus.autocomplete", function () {
        d.onFocus();
      }), d.el.on("change.autocomplete", function (a) {
        d.onKeyUp(a);
      }), d.el.on("input.autocomplete", function (a) {
        d.onKeyUp(a);
      });
    }, onFocus: function onFocus() {
      var a = this;a.fixPosition(), a.el.val().length >= a.options.minChars && a.onValueChange();
    }, onBlur: function onBlur() {
      var b = this,
          c = b.options,
          d = b.el.val(),
          e = b.getQuery(d);b.blurTimeoutId = setTimeout(function () {
        b.hide(), b.selection && b.currentValue !== e && (c.onInvalidateSelection || a.noop).call(b.element);
      }, 200);
    }, abortAjax: function abortAjax() {
      var a = this;a.currentRequest && (a.currentRequest.abort(), a.currentRequest = null);
    }, setOptions: function setOptions(b) {
      var c = this,
          d = a.extend({}, c.options, b);c.isLocal = Array.isArray(d.lookup), c.isLocal && (d.lookup = c.verifySuggestionsFormat(d.lookup)), d.orientation = c.validateOrientation(d.orientation, "bottom"), a(c.suggestionsContainer).css({ "max-height": d.maxHeight + "px", width: d.width + "px", "z-index": d.zIndex }), this.options = d;
    }, clearCache: function clearCache() {
      this.cachedResponse = {}, this.badQueries = [];
    }, clear: function clear() {
      this.clearCache(), this.currentValue = "", this.suggestions = [];
    }, disable: function disable() {
      var a = this;a.disabled = !0, clearTimeout(a.onChangeTimeout), a.abortAjax();
    }, enable: function enable() {
      this.disabled = !1;
    }, fixPosition: function fixPosition() {
      var b = this,
          c = a(b.suggestionsContainer),
          d = c.parent().get(0);if (d === document.body || b.options.forceFixPosition) {
        var e = b.options.orientation,
            f = c.outerHeight(),
            g = b.el.outerHeight(),
            h = b.el.offset(),
            i = { top: h.top, left: h.left };if ("auto" === e) {
          var j = a(window).height(),
              k = a(window).scrollTop(),
              l = -k + h.top - f,
              m = k + j - (h.top + g + f);e = Math.max(l, m) === l ? "top" : "bottom";
        }if ("top" === e ? i.top += -f : i.top += g, d !== document.body) {
          var n,
              o = c.css("opacity");b.visible || c.css("opacity", 0).show(), n = c.offsetParent().offset(), i.top -= n.top, i.top += d.scrollTop, i.left -= n.left, b.visible || c.css("opacity", o).hide();
        }"auto" === b.options.width && (i.width = b.el.outerWidth() + "px"), c.css(i);
      }
    }, isCursorAtEnd: function isCursorAtEnd() {
      var a,
          b = this,
          c = b.el.val().length,
          d = b.element.selectionStart;return "number" == typeof d ? d === c : !document.selection || (a = document.selection.createRange(), a.moveStart("character", -c), c === a.text.length);
    }, onKeyPress: function onKeyPress(a) {
      var b = this;if (!b.disabled && !b.visible && a.which === h.DOWN && b.currentValue) return void b.suggest();if (!b.disabled && b.visible) {
        switch (a.which) {case h.ESC:
            b.el.val(b.currentValue), b.hide();break;case h.RIGHT:
            if (b.hint && b.options.onHint && b.isCursorAtEnd()) {
              b.selectHint();break;
            }return;case h.TAB:
            if (b.hint && b.options.onHint) return void b.selectHint();if (b.selectedIndex === -1) return void b.hide();if (b.select(b.selectedIndex), b.options.tabDisabled === !1) return;break;case h.RETURN:
            if (b.selectedIndex === -1) return void b.hide();b.select(b.selectedIndex);break;case h.UP:
            b.moveUp();break;case h.DOWN:
            b.moveDown();break;default:
            return;}a.stopImmediatePropagation(), a.preventDefault();
      }
    }, onKeyUp: function onKeyUp(a) {
      var b = this;if (!b.disabled) {
        switch (a.which) {case h.UP:case h.DOWN:
            return;}clearTimeout(b.onChangeTimeout), b.currentValue !== b.el.val() && (b.findBestHint(), b.options.deferRequestBy > 0 ? b.onChangeTimeout = setTimeout(function () {
          b.onValueChange();
        }, b.options.deferRequestBy) : b.onValueChange());
      }
    }, onValueChange: function onValueChange() {
      if (this.ignoreValueChange) return void (this.ignoreValueChange = !1);var b = this,
          c = b.options,
          d = b.el.val(),
          e = b.getQuery(d);return b.selection && b.currentValue !== e && (b.selection = null, (c.onInvalidateSelection || a.noop).call(b.element)), clearTimeout(b.onChangeTimeout), b.currentValue = d, b.selectedIndex = -1, c.triggerSelectOnValidInput && b.isExactMatch(e) ? void b.select(0) : void (e.length < c.minChars ? b.hide() : b.getSuggestions(e));
    }, isExactMatch: function isExactMatch(a) {
      var b = this.suggestions;return 1 === b.length && b[0].value.toLowerCase() === a.toLowerCase();
    }, getQuery: function getQuery(b) {
      var c,
          d = this.options.delimiter;return d ? (c = b.split(d), a.trim(c[c.length - 1])) : b;
    }, getSuggestionsLocal: function getSuggestionsLocal(b) {
      var c,
          d = this,
          e = d.options,
          f = b.toLowerCase(),
          g = e.lookupFilter,
          h = parseInt(e.lookupLimit, 10);return c = { suggestions: a.grep(e.lookup, function (a) {
          return g(a, b, f);
        }) }, h && c.suggestions.length > h && (c.suggestions = c.suggestions.slice(0, h)), c;
    }, getSuggestions: function getSuggestions(b) {
      var c,
          d,
          e,
          f,
          g = this,
          h = g.options,
          i = h.serviceUrl;if (h.params[h.paramName] = b, h.onSearchStart.call(g.element, h.params) !== !1) {
        if (d = h.ignoreParams ? null : h.params, a.isFunction(h.lookup)) return void h.lookup(b, function (a) {
          g.suggestions = a.suggestions, g.suggest(), h.onSearchComplete.call(g.element, b, a.suggestions);
        });g.isLocal ? c = g.getSuggestionsLocal(b) : (a.isFunction(i) && (i = i.call(g.element, b)), e = i + "?" + a.param(d || {}), c = g.cachedResponse[e]), c && Array.isArray(c.suggestions) ? (g.suggestions = c.suggestions, g.suggest(), h.onSearchComplete.call(g.element, b, c.suggestions)) : g.isBadQuery(b) ? h.onSearchComplete.call(g.element, b, []) : (g.abortAjax(), f = { url: i, data: d, type: h.type, dataType: h.dataType }, a.extend(f, h.ajaxSettings), g.currentRequest = a.ajax(f).done(function (a) {
          var c;g.currentRequest = null, c = h.transformResult(a, b), g.processResponse(c, b, e), h.onSearchComplete.call(g.element, b, c.suggestions);
        }).fail(function (a, c, d) {
          h.onSearchError.call(g.element, b, a, c, d);
        }));
      }
    }, isBadQuery: function isBadQuery(a) {
      if (!this.options.preventBadQueries) return !1;for (var b = this.badQueries, c = b.length; c--;) {
        if (0 === a.indexOf(b[c])) return !0;
      }return !1;
    }, hide: function hide() {
      var b = this,
          c = a(b.suggestionsContainer);a.isFunction(b.options.onHide) && b.visible && b.options.onHide.call(b.element, c), b.visible = !1, b.selectedIndex = -1, clearTimeout(b.onChangeTimeout), a(b.suggestionsContainer).hide(), b.signalHint(null);
    }, suggest: function suggest() {
      if (!this.suggestions.length) return void (this.options.showNoSuggestionNotice ? this.noSuggestions() : this.hide());var b,
          c = this,
          d = c.options,
          e = d.groupBy,
          f = d.formatResult,
          g = c.getQuery(c.currentValue),
          h = c.classes.suggestion,
          i = c.classes.selected,
          j = a(c.suggestionsContainer),
          k = a(c.noSuggestionsContainer),
          l = d.beforeRender,
          m = "",
          n = function n(a, c) {
        var f = a.data[e];return b === f ? "" : (b = f, d.formatGroup(a, b));
      };return d.triggerSelectOnValidInput && c.isExactMatch(g) ? void c.select(0) : (a.each(c.suggestions, function (a, b) {
        e && (m += n(b, g, a)), m += '<div class="' + h + '" data-index="' + a + '">' + f(b, g, a) + "</div>";
      }), this.adjustContainerWidth(), k.detach(), j.html(m), a.isFunction(l) && l.call(c.element, j, c.suggestions), c.fixPosition(), j.show(), d.autoSelectFirst && (c.selectedIndex = 0, j.scrollTop(0), j.children("." + h).first().addClass(i)), c.visible = !0, void c.findBestHint());
    }, noSuggestions: function noSuggestions() {
      var b = this,
          c = b.options.beforeRender,
          d = a(b.suggestionsContainer),
          e = a(b.noSuggestionsContainer);this.adjustContainerWidth(), e.detach(), d.empty(), d.append(e), a.isFunction(c) && c.call(b.element, d, b.suggestions), b.fixPosition(), d.show(), b.visible = !0;
    }, adjustContainerWidth: function adjustContainerWidth() {
      var b,
          c = this,
          d = c.options,
          e = a(c.suggestionsContainer);"auto" === d.width ? (b = c.el.outerWidth(), e.css("width", b > 0 ? b : 300)) : "flex" === d.width && e.css("width", "");
    }, findBestHint: function findBestHint() {
      var b = this,
          c = b.el.val().toLowerCase(),
          d = null;c && (a.each(b.suggestions, function (a, b) {
        var e = 0 === b.value.toLowerCase().indexOf(c);return e && (d = b), !e;
      }), b.signalHint(d));
    }, signalHint: function signalHint(b) {
      var c = "",
          d = this;b && (c = d.currentValue + b.value.substr(d.currentValue.length)), d.hintValue !== c && (d.hintValue = c, d.hint = b, (this.options.onHint || a.noop)(c));
    }, verifySuggestionsFormat: function verifySuggestionsFormat(b) {
      return b.length && "string" == typeof b[0] ? a.map(b, function (a) {
        return { value: a, data: null };
      }) : b;
    }, validateOrientation: function validateOrientation(b, c) {
      return b = a.trim(b || "").toLowerCase(), a.inArray(b, ["auto", "bottom", "top"]) === -1 && (b = c), b;
    }, processResponse: function processResponse(a, b, c) {
      var d = this,
          e = d.options;a.suggestions = d.verifySuggestionsFormat(a.suggestions), e.noCache || (d.cachedResponse[c] = a, e.preventBadQueries && !a.suggestions.length && d.badQueries.push(b)), b === d.getQuery(d.currentValue) && (d.suggestions = a.suggestions, d.suggest());
    }, activate: function activate(b) {
      var c,
          d = this,
          e = d.classes.selected,
          f = a(d.suggestionsContainer),
          g = f.find("." + d.classes.suggestion);return f.find("." + e).removeClass(e), d.selectedIndex = b, d.selectedIndex !== -1 && g.length > d.selectedIndex ? (c = g.get(d.selectedIndex), a(c).addClass(e), c) : null;
    }, selectHint: function selectHint() {
      var b = this,
          c = a.inArray(b.hint, b.suggestions);b.select(c);
    }, select: function select(a) {
      var b = this;b.hide(), b.onSelect(a);
    }, moveUp: function moveUp() {
      var b = this;if (b.selectedIndex !== -1) return 0 === b.selectedIndex ? (a(b.suggestionsContainer).children("." + b.classes.suggestion).first().removeClass(b.classes.selected), b.selectedIndex = -1, b.ignoreValueChange = !1, b.el.val(b.currentValue), void b.findBestHint()) : void b.adjustScroll(b.selectedIndex - 1);
    }, moveDown: function moveDown() {
      var a = this;a.selectedIndex !== a.suggestions.length - 1 && a.adjustScroll(a.selectedIndex + 1);
    }, adjustScroll: function adjustScroll(b) {
      var c = this,
          d = c.activate(b);if (d) {
        var e,
            f,
            g,
            h = a(d).outerHeight();e = d.offsetTop, f = a(c.suggestionsContainer).scrollTop(), g = f + c.options.maxHeight - h, e < f ? a(c.suggestionsContainer).scrollTop(e) : e > g && a(c.suggestionsContainer).scrollTop(e - c.options.maxHeight + h), c.options.preserveInput || (c.ignoreValueChange = !0, c.el.val(c.getValue(c.suggestions[b].value))), c.signalHint(null);
      }
    }, onSelect: function onSelect(b) {
      var c = this,
          d = c.options.onSelect,
          e = c.suggestions[b];c.currentValue = c.getValue(e.value), c.currentValue === c.el.val() || c.options.preserveInput || c.el.val(c.currentValue), c.signalHint(null), c.suggestions = [], c.selection = e, a.isFunction(d) && d.call(c.element, e);
    }, getValue: function getValue(a) {
      var b,
          c,
          d = this,
          e = d.options.delimiter;return e ? (b = d.currentValue, c = b.split(e), 1 === c.length ? a : b.substr(0, b.length - c[c.length - 1].length) + a) : a;
    }, dispose: function dispose() {
      var b = this;b.el.off(".autocomplete").removeData("autocomplete"), a(window).off("resize.autocomplete", b.fixPositionCapture), a(b.suggestionsContainer).remove();
    } }, a.fn.devbridgeAutocomplete = function (c, d) {
    var e = "autocomplete";return arguments.length ? this.each(function () {
      var f = a(this),
          g = f.data(e);"string" == typeof c ? g && "function" == typeof g[c] && g[c](d) : (g && g.dispose && g.dispose(), g = new b(this, c), f.data(e, g));
    }) : this.first().data(e);
  }, a.fn.autocomplete || (a.fn.autocomplete = a.fn.devbridgeAutocomplete);
});
'use strict';

// first we need to add a polyfill for IE and older versions of browsers
/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

(function (window, document) {
  'use strict';

  // Exits early if all IntersectionObserver and IntersectionObserverEntry
  // features are natively supported.

  if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
        get: function get() {
          return this.intersectionRatio > 0;
        }
      });
    }
    return;
  }

  /**
   * An IntersectionObserver registry. This registry exists to hold a strong
   * reference to IntersectionObserver instances currently observing a target
   * element. Without this registry, instances without another reference may be
   * garbage collected.
   */
  var registry = [];

  /**
   * Creates the global IntersectionObserverEntry constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
   * @param {Object} entry A dictionary of instance properties.
   * @constructor
   */
  function IntersectionObserverEntry(entry) {
    this.time = entry.time;
    this.target = entry.target;
    this.rootBounds = entry.rootBounds;
    this.boundingClientRect = entry.boundingClientRect;
    this.intersectionRect = entry.intersectionRect || getEmptyRect();
    this.isIntersecting = !!entry.intersectionRect;

    // Calculates the intersection ratio.
    var targetRect = this.boundingClientRect;
    var targetArea = targetRect.width * targetRect.height;
    var intersectionRect = this.intersectionRect;
    var intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
      // Round the intersection ratio to avoid floating point math issues:
      // https://github.com/w3c/IntersectionObserver/issues/324
      this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
    } else {
      // If area is zero and is intersecting, sets to 1, otherwise to 0
      this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
  }

  /**
   * Creates the global IntersectionObserver constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
   * @param {Function} callback The function to be invoked after intersection
   *     changes have queued. The function is not invoked if the queue has
   *     been emptied by calling the `takeRecords` method.
   * @param {Object=} opt_options Optional configuration options.
   * @constructor
   */
  function IntersectionObserver(callback, opt_options) {

    var options = opt_options || {};

    if (typeof callback != 'function') {
      throw new Error('callback must be a function');
    }

    if (options.root && options.root.nodeType != 1) {
      throw new Error('root must be an Element');
    }

    // Binds and throttles `this._checkForIntersections`.
    this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

    // Private properties.
    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin);

    // Public properties.
    this.thresholds = this._initThresholds(options.threshold);
    this.root = options.root || null;
    this.rootMargin = this._rootMarginValues.map(function (margin) {
      return margin.value + margin.unit;
    }).join(' ');
  }

  /**
   * The minimum interval within which the document will be checked for
   * intersection changes.
   */
  IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;

  /**
   * The frequency in which the polyfill polls for intersection changes.
   * this can be updated on a per instance basis and must be set prior to
   * calling `observe` on the first target.
   */
  IntersectionObserver.prototype.POLL_INTERVAL = null;

  /**
   * Use a mutation observer on the root element
   * to detect intersection changes.
   */
  IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

  /**
   * Starts observing a target element for intersection changes based on
   * the thresholds values.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.observe = function (target) {
    var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
      return item.element == target;
    });

    if (isTargetAlreadyObserved) {
      return;
    }

    if (!(target && target.nodeType == 1)) {
      throw new Error('target must be an Element');
    }

    this._registerInstance();
    this._observationTargets.push({ element: target, entry: null });
    this._monitorIntersections();
    this._checkForIntersections();
  };

  /**
   * Stops observing a target element for intersection changes.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.unobserve = function (target) {
    this._observationTargets = this._observationTargets.filter(function (item) {

      return item.element != target;
    });
    if (!this._observationTargets.length) {
      this._unmonitorIntersections();
      this._unregisterInstance();
    }
  };

  /**
   * Stops observing all target elements for intersection changes.
   */
  IntersectionObserver.prototype.disconnect = function () {
    this._observationTargets = [];
    this._unmonitorIntersections();
    this._unregisterInstance();
  };

  /**
   * Returns any queue entries that have not yet been reported to the
   * callback and clears the queue. This can be used in conjunction with the
   * callback to obtain the absolute most up-to-date intersection information.
   * @return {Array} The currently queued entries.
   */
  IntersectionObserver.prototype.takeRecords = function () {
    var records = this._queuedEntries.slice();
    this._queuedEntries = [];
    return records;
  };

  /**
   * Accepts the threshold value from the user configuration object and
   * returns a sorted array of unique threshold values. If a value is not
   * between 0 and 1 and error is thrown.
   * @private
   * @param {Array|number=} opt_threshold An optional threshold value or
   *     a list of threshold values, defaulting to [0].
   * @return {Array} A sorted list of unique and valid threshold values.
   */
  IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
    var threshold = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];

    return threshold.sort().filter(function (t, i, a) {
      if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
        throw new Error('threshold must be a number between 0 and 1 inclusively');
      }
      return t !== a[i - 1];
    });
  };

  /**
   * Accepts the rootMargin value from the user configuration object
   * and returns an array of the four margin values as an object containing
   * the value and unit properties. If any of the values are not properly
   * formatted or use a unit other than px or %, and error is thrown.
   * @private
   * @param {string=} opt_rootMargin An optional rootMargin value,
   *     defaulting to '0px'.
   * @return {Array<Object>} An array of margin objects with the keys
   *     value and unit.
   */
  IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
    var marginString = opt_rootMargin || '0px';
    var margins = marginString.split(/\s+/).map(function (margin) {
      var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
      if (!parts) {
        throw new Error('rootMargin must be specified in pixels or percent');
      }
      return { value: parseFloat(parts[1]), unit: parts[2] };
    });

    // Handles shorthand.
    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];

    return margins;
  };

  /**
   * Starts polling for intersection changes if the polling is not already
   * happening, and if the page's visibility state is visible.
   * @private
   */
  IntersectionObserver.prototype._monitorIntersections = function () {
    if (!this._monitoringIntersections) {
      this._monitoringIntersections = true;

      // If a poll interval is set, use polling instead of listening to
      // resize and scroll events or DOM mutations.
      if (this.POLL_INTERVAL) {
        this._monitoringInterval = setInterval(this._checkForIntersections, this.POLL_INTERVAL);
      } else {
        addEvent(window, 'resize', this._checkForIntersections, true);
        addEvent(document, 'scroll', this._checkForIntersections, true);

        if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
          this._domObserver = new MutationObserver(this._checkForIntersections);
          this._domObserver.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      }
    }
  };

  /**
   * Stops polling for intersection changes.
   * @private
   */
  IntersectionObserver.prototype._unmonitorIntersections = function () {
    if (this._monitoringIntersections) {
      this._monitoringIntersections = false;

      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;

      removeEvent(window, 'resize', this._checkForIntersections, true);
      removeEvent(document, 'scroll', this._checkForIntersections, true);

      if (this._domObserver) {
        this._domObserver.disconnect();
        this._domObserver = null;
      }
    }
  };

  /**
   * Scans each observation target for intersection changes and adds them
   * to the internal entries queue. If new entries are found, it
   * schedules the callback to be invoked.
   * @private
   */
  IntersectionObserver.prototype._checkForIntersections = function () {
    var rootIsInDom = this._rootIsInDom();
    var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    // Array.prototype.forEach.call(this._observationTargets, function() {
    var targetArr = this._observationTargets;
    for (var i = 0; i < targetArr.length; i++) {
      // this._observationTargets.forEach(function(item) {
      // removed above becasue getQuerySelectorAll does not produce a usable array
      var target = targetArr[i].element;
      var targetRect = getBoundingClientRect(target);
      var rootContainsTarget = this._rootContainsTarget(target);
      var oldEntry = targetArr[i].entry;
      var intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, rootRect);

      var newEntry = targetArr[i].entry = new IntersectionObserverEntry({
        time: now(),
        target: target,
        boundingClientRect: targetRect,
        rootBounds: rootRect,
        intersectionRect: intersectionRect
      });

      if (!oldEntry) {
        this._queuedEntries.push(newEntry);
      } else if (rootIsInDom && rootContainsTarget) {
        // If the new entry intersection ratio has crossed any of the
        // thresholds, add a new entry.
        if (this._hasCrossedThreshold(oldEntry, newEntry)) {
          this._queuedEntries.push(newEntry);
        }
      } else {
        // If the root is not in the DOM or target is not contained within
        // root but the previous entry for this target had an intersection,
        // add a new record indicating removal.
        if (oldEntry && oldEntry.isIntersecting) {
          this._queuedEntries.push(newEntry);
        }
      }
      // }, this);
    }

    if (this._queuedEntries.length) {
      this._callback(this.takeRecords(), this);
    }
  };

  /**
   * Accepts a target and root rect computes the intersection between then
   * following the algorithm in the spec.
   * TODO(philipwalton): at this time clip-path is not considered.
   * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
   * @param {Element} target The target DOM element
   * @param {Object} rootRect The bounding rect of the root after being
   *     expanded by the rootMargin value.
   * @return {?Object} The final intersection rect object or undefined if no
   *     intersection is found.
   * @private
   */
  IntersectionObserver.prototype._computeTargetAndRootIntersection = function (target, rootRect) {

    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display == 'none') return;

    var targetRect = getBoundingClientRect(target);
    var intersectionRect = targetRect;
    var parent = getParentNode(target);
    var atRoot = false;

    while (!atRoot) {
      var parentRect = null;
      var parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {};

      // If the parent isn't displayed, an intersection can't happen.
      if (parentComputedStyle.display == 'none') return;

      if (parent == this.root || parent == document) {
        atRoot = true;
        parentRect = rootRect;
      } else {
        // If the element has a non-visible overflow, and it's not the <body>
        // or <html> element, update the intersection rect.
        // Note: <body> and <html> cannot be clipped to a rect that's not also
        // the document rect, so no need to compute a new intersection.
        if (parent != document.body && parent != document.documentElement && parentComputedStyle.overflow != 'visible') {
          parentRect = getBoundingClientRect(parent);
        }
      }

      // If either of the above conditionals set a new parentRect,
      // calculate new intersection data.
      if (parentRect) {
        intersectionRect = computeRectIntersection(parentRect, intersectionRect);

        if (!intersectionRect) break;
      }
      parent = getParentNode(parent);
    }
    return intersectionRect;
  };

  /**
   * Returns the root rect after being expanded by the rootMargin value.
   * @return {Object} The expanded root rect.
   * @private
   */
  IntersectionObserver.prototype._getRootRect = function () {
    var rootRect;
    if (this.root) {
      rootRect = getBoundingClientRect(this.root);
    } else {
      // Use <html>/<body> instead of window since scroll bars affect size.
      var html = document.documentElement;
      var body = document.body;
      rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight
      };
    }
    return this._expandRectByRootMargin(rootRect);
  };

  /**
   * Accepts a rect and expands it by the rootMargin value.
   * @param {Object} rect The rect object to expand.
   * @return {Object} The expanded rect.
   * @private
   */
  IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
    var margins = this._rootMarginValues.map(function (margin, i) {
      return margin.unit == 'px' ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100;
    });
    var newRect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3]
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
  };

  /**
   * Accepts an old and new entry and returns true if at least one of the
   * threshold values has been crossed.
   * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
   *    particular target element or null if no previous entry exists.
   * @param {IntersectionObserverEntry} newEntry The current entry for a
   *    particular target element.
   * @return {boolean} Returns true if a any threshold has been crossed.
   * @private
   */
  IntersectionObserver.prototype._hasCrossedThreshold = function (oldEntry, newEntry) {

    // To make comparing easier, an entry that has a ratio of 0
    // but does not actually intersect is given a value of -1
    var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
    var newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

    // Ignore unchanged ratios
    if (oldRatio === newRatio) return;

    for (var i = 0; i < this.thresholds.length; i++) {
      var threshold = this.thresholds[i];

      // Return true if an entry matches a threshold or if the new ratio
      // and the old ratio are on the opposite sides of a threshold.
      if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
        return true;
      }
    }
  };

  /**
   * Returns whether or not the root element is an element and is in the DOM.
   * @return {boolean} True if the root element is an element and is in the DOM.
   * @private
   */
  IntersectionObserver.prototype._rootIsInDom = function () {
    return !this.root || containsDeep(document, this.root);
  };

  /**
   * Returns whether or not the target element is a child of root.
   * @param {Element} target The target element to check.
   * @return {boolean} True if the target element is a child of root.
   * @private
   */
  IntersectionObserver.prototype._rootContainsTarget = function (target) {
    return containsDeep(this.root || document, target);
  };

  /**
   * Adds the instance to the global IntersectionObserver registry if it isn't
   * already present.
   * @private
   */
  IntersectionObserver.prototype._registerInstance = function () {
    if (registry.indexOf(this) < 0) {
      registry.push(this);
    }
  };

  /**
   * Removes the instance from the global IntersectionObserver registry.
   * @private
   */
  IntersectionObserver.prototype._unregisterInstance = function () {
    var index = registry.indexOf(this);
    if (index != -1) registry.splice(index, 1);
  };

  /**
   * Returns the result of the performance.now() method or null in browsers
   * that don't support the API.
   * @return {number} The elapsed time since the page was requested.
   */
  function now() {
    return window.performance && performance.now && performance.now();
  }

  /**
   * Throttles a function and delays its execution, so it's only called at most
   * once within a given time period.
   * @param {Function} fn The function to throttle.
   * @param {number} timeout The amount of time that must pass before the
   *     function can be called again.
   * @return {Function} The throttled function.
   */
  function throttle(fn, timeout) {
    var timer = null;
    return function () {
      if (!timer) {
        timer = setTimeout(function () {
          fn();
          timer = null;
        }, timeout);
      }
    };
  }

  /**
   * Adds an event handler to a DOM node ensuring cross-browser compatibility.
   * @param {Node} node The DOM node to add the event handler to.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to add.
   * @param {boolean} opt_useCapture Optionally adds the even to the capture
   *     phase. Note: this only works in modern browsers.
   */
  function addEvent(node, event, fn, opt_useCapture) {
    if (typeof node.addEventListener == 'function') {
      node.addEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.attachEvent == 'function') {
      node.attachEvent('on' + event, fn);
    }
  }

  /**
   * Removes a previously added event handler from a DOM node.
   * @param {Node} node The DOM node to remove the event handler from.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to remove.
   * @param {boolean} opt_useCapture If the event handler was added with this
   *     flag set to true, it should be set to true here in order to remove it.
   */
  function removeEvent(node, event, fn, opt_useCapture) {
    if (typeof node.removeEventListener == 'function') {
      node.removeEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.detatchEvent == 'function') {
      node.detatchEvent('on' + event, fn);
    }
  }

  /**
   * Returns the intersection between two rect objects.
   * @param {Object} rect1 The first rect.
   * @param {Object} rect2 The second rect.
   * @return {?Object} The intersection rect or undefined if no intersection
   *     is found.
   */
  function computeRectIntersection(rect1, rect2) {
    var top = Math.max(rect1.top, rect2.top);
    var bottom = Math.min(rect1.bottom, rect2.bottom);
    var left = Math.max(rect1.left, rect2.left);
    var right = Math.min(rect1.right, rect2.right);
    var width = right - left;
    var height = bottom - top;

    return width >= 0 && height >= 0 && {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: width,
      height: height
    };
  }

  /**
   * Shims the native getBoundingClientRect for compatibility with older IE.
   * @param {Element} el The element whose bounding rect to get.
   * @return {Object} The (possibly shimmed) rect of the element.
   */
  function getBoundingClientRect(el) {
    var rect;

    try {
      rect = el.getBoundingClientRect();
    } catch (err) {
      // Ignore Windows 7 IE11 "Unspecified error"
      // https://github.com/w3c/IntersectionObserver/pull/205
    }

    if (!rect) return getEmptyRect();

    // Older IE
    if (!(rect.width && rect.height)) {
      rect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
      };
    }
    return rect;
  }

  /**
   * Returns an empty rect object. An empty rect is returned when an element
   * is not in the DOM.
   * @return {Object} The empty rect.
   */
  function getEmptyRect() {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0
    };
  }

  /**
   * Checks to see if a parent element contains a child element (including inside
   * shadow DOM).
   * @param {Node} parent The parent element.
   * @param {Node} child The child element.
   * @return {boolean} True if the parent node contains the child node.
   */
  function containsDeep(parent, child) {
    var node = child;
    while (node) {
      if (node == parent) return true;

      node = getParentNode(node);
    }
    return false;
  }

  /**
   * Gets the parent node of an element or its host element if the parent node
   * is a shadow root.
   * @param {Node} node The node whose parent to get.
   * @return {Node|null} The parent node or null if no parent exists.
   */
  function getParentNode(node) {
    var parent = node.parentNode;

    if (parent && parent.nodeType == 11 && parent.host) {
      // If the parent is a shadow root, return the host element.
      return parent.host;
    }

    if (parent && parent.assignedSlot) {
      // If the parent is distributed in a <slot>, return the parent of a slot.
      return parent.assignedSlot.parentNode;
    }

    return parent;
  }

  // Exposes the constructors globally.
  window.IntersectionObserver = IntersectionObserver;
  window.IntersectionObserverEntry = IntersectionObserverEntry;
})(window, document);

// ######################################
// END OF POLYFILL START OF NWDSI LIBRARY
// ######################################

// default behavior for this method is to look for lazy-load images, then
// populate the src attr with the data-url attr and remove the preloader svg
// though it was designed to be able to pass in a config object with
// a selector, options for IntersectionObserver and a callback which fires
// when the element that matches the selector comes into view.
if (!nwdsi) nwdsi = {};
// nwdsi.showTickers = () => { console.log('Show Tickers!!!'); }
nwdsi.whenVisibleObserver = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  $ = jQuery;
  // a method that removes the preloader after the image loads
  var targetLoaded = function targetLoaded(element) {
    element.onload = function () {
      var $self = $(element);
      var $parent = $self.parent();
      var $preloader = $parent.find('.lazy-load-preloader');
      if ($preloader) {
        $preloader.fadeOut('slow', function () {
          $(this).remove();
        });
      }
      if ($self.hasClass("lazy-load-placeholder")) {
        $self.removeClass("lazy-load-placeholder");
      }
    };
    element.src = element.dataset.url;
  };
  // set up defaults
  var defaults = {
    selector: 'img.lazy-load',
    options: { rootMargin: '200px 200px 200px 200px' },
    callback: targetLoaded,
    callbackEvent: null
    // handle the assigning/extending of the defaults if no config object
  };var assigned = $.extend(true, {}, defaults, config);
  // could not use Object.assign because it is not supported in IE11
  // rather than instal polyfill used jquery method
  // let assigned = Object.assign({}, defaults, config);
  // get all the targeted elements
  var elements = document.querySelectorAll(assigned.selector);
  if (!elements.length) return;
  // create the new observers for all the targeted elements
  var observer = new IntersectionObserver(function (entries) {
    // console.log('check the length of the entries');
    // console.log(entries.length);
    // entries.forEach(entry => {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        observer.unobserve(entries[i].target);
        // if a callback is specified call it after removing the observer
        // if not the default callback will be called
        assigned.callback(entries[i].target, assigned.callbackEvent);
      }
    };
  }, assigned.options);
  for (var i = 0; i < elements.length; i++) {
    observer.observe(elements[i]);
  }
};
// call this method to handle lazy loading when the file loads
nwdsi.whenVisibleObserver();

// for custom usage here is an example
// stat-ticker.js pattern uses a call like this:
// nwdsi.whenVisibleObserver({"selector":".stat-ticker-group", "callback": showTickers, "callbackEvent": "inview"})
'use strict';

// Polyfill needed to use prepend method in IE11
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('prepend')) {
      return;
    }
    Object.defineProperty(item, 'prepend', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function prepend() {
        var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });

        this.insertBefore(docFrag, this.firstChild);
      }
    });
  });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);
// TBD rmeoved casue fetch was throwing an error in IE 11
// we need to update the ajax method to another IE 11 friendly version
// (function lucidWorksScript($, Drupal) {
//   if (!$('[data-query]').length) return;
//   Drupal.behaviors.lucidWorksData = {
//     attach(context) {
//       const list = $('a[data-query]', context);
//       const browser_name = navigator.browserSpecs.name;
//       const browser_version = navigator.browserSpecs.version;
//       const referrer = document.referrer;
//       const url = window.location.href;
//       const userInfo = {
//         'browser_name': browser_name ,
//         'browser_version': browser_version,
//         'referrer':referrer,
//         'url': url
//       }
//
//       $(list).on('click', function(e) {
//         e.preventDefault();
//         const $self = $(this);
//         const target = $self.attr('href');
//         const index = $self.parent().parent().parent().parent().index();
//         const lucidWorksInfo = drupalSettings.northwell_query_result[index];
//         const clickInfo = $.extend({}, lucidWorksInfo, userInfo);
//         const data = new FormData();
//         const apiCall = '/api/signals/click/';
//         data.append( "json", JSON.stringify( clickInfo ) );
//         fetch(apiCall, {
//           method: "POST",
//           body: data
//         })
//         .then(res => {
//           res.json();//response type
//           window.location = target;// redirect
//         })
//       });
//     }
//   }
// })(jQuery, Drupal);
"use strict";
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! nouislider - 14.7.0 - 4/6/2021 */
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object") {
        module.exports = factory();
    } else {
        window.noUiSlider = factory();
    }
})(function () {
    "use strict";

    var VERSION = "14.7.0";
    //region Helper Methods
    function isValidFormatter(entry) {
        return (typeof entry === "undefined" ? "undefined" : _typeof(entry)) === "object" && typeof entry.to === "function" && typeof entry.from === "function";
    }
    function removeElement(el) {
        el.parentElement.removeChild(el);
    }
    function isSet(value) {
        return value !== null && value !== undefined;
    }
    // Bindable version
    function preventDefault(e) {
        e.preventDefault();
    }
    // Removes duplicates from an array.
    function unique(array) {
        return array.filter(function (a) {
            return !this[a] ? this[a] = true : false;
        }, {});
    }
    // Round a value to the closest 'to'.
    function closest(value, to) {
        return Math.round(value / to) * to;
    }
    // Current position of an element relative to the document.
    function offset(elem, orientation) {
        var rect = elem.getBoundingClientRect();
        var doc = elem.ownerDocument;
        var docElem = doc.documentElement;
        var pageOffset = getPageOffset(doc);
        // getBoundingClientRect contains left scroll in Chrome on Android.
        // I haven't found a feature detection that proves this. Worst case
        // scenario on mis-match: the 'tap' feature on horizontal sliders breaks.
        if (/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)) {
            pageOffset.x = 0;
        }
        return orientation ? rect.top + pageOffset.y - docElem.clientTop : rect.left + pageOffset.x - docElem.clientLeft;
    }
    // Checks whether a value is numerical.
    function isNumeric(a) {
        return typeof a === "number" && !isNaN(a) && isFinite(a);
    }
    // Sets a class and removes it after [duration] ms.
    function addClassFor(element, className, duration) {
        if (duration > 0) {
            addClass(element, className);
            setTimeout(function () {
                removeClass(element, className);
            }, duration);
        }
    }
    // Limits a value to 0 - 100
    function limit(a) {
        return Math.max(Math.min(a, 100), 0);
    }
    // Wraps a variable as an array, if it isn't one yet.
    // Note that an input array is returned by reference!
    function asArray(a) {
        return Array.isArray(a) ? a : [a];
    }
    // Counts decimals
    function countDecimals(numStr) {
        numStr = String(numStr);
        var pieces = numStr.split(".");
        return pieces.length > 1 ? pieces[1].length : 0;
    }
    // http://youmightnotneedjquery.com/#add_class
    function addClass(el, className) {
        if (el.classList && !/\s/.test(className)) {
            el.classList.add(className);
        } else {
            el.className += " " + className;
        }
    }
    // http://youmightnotneedjquery.com/#remove_class
    function removeClass(el, className) {
        if (el.classList && !/\s/.test(className)) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
        }
    }
    // https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
    function hasClass(el, className) {
        return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY#Notes
    function getPageOffset(doc) {
        var supportPageOffset = window.pageXOffset !== undefined;
        var isCSS1Compat = (doc.compatMode || "") === "CSS1Compat";
        var x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? doc.documentElement.scrollLeft : doc.body.scrollLeft;
        var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? doc.documentElement.scrollTop : doc.body.scrollTop;
        return {
            x: x,
            y: y
        };
    }
    // we provide a function to compute constants instead
    // of accessing window.* as soon as the module needs it
    // so that we do not compute anything if not needed
    function getActions() {
        // Determine the events to bind. IE11 implements pointerEvents without
        // a prefix, which breaks compatibility with the IE10 implementation.
        return window.navigator.pointerEnabled ? {
            start: "pointerdown",
            move: "pointermove",
            end: "pointerup"
        } : window.navigator.msPointerEnabled ? {
            start: "MSPointerDown",
            move: "MSPointerMove",
            end: "MSPointerUp"
        } : {
            start: "mousedown touchstart",
            move: "mousemove touchmove",
            end: "mouseup touchend"
        };
    }
    // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
    // Issue #785
    function getSupportsPassive() {
        var supportsPassive = false;
        /* eslint-disable */
        try {
            var opts = Object.defineProperty({}, "passive", {
                get: function get() {
                    supportsPassive = true;
                }
            });
            window.addEventListener("test", null, opts);
        } catch (e) {}
        /* eslint-enable */
        return supportsPassive;
    }
    function getSupportsTouchActionNone() {
        return window.CSS && CSS.supports && CSS.supports("touch-action", "none");
    }
    //endregion
    //region Range Calculation
    // Determine the size of a sub-range in relation to a full range.
    function subRangeRatio(pa, pb) {
        return 100 / (pb - pa);
    }
    // (percentage) How many percent is this value of this range?
    function fromPercentage(range, value, startRange) {
        return value * 100 / (range[startRange + 1] - range[startRange]);
    }
    // (percentage) Where is this value on this range?
    function toPercentage(range, value) {
        return fromPercentage(range, range[0] < 0 ? value + Math.abs(range[0]) : value - range[0], 0);
    }
    // (value) How much is this percentage on this range?
    function isPercentage(range, value) {
        return value * (range[1] - range[0]) / 100 + range[0];
    }
    function getJ(value, arr) {
        var j = 1;
        while (value >= arr[j]) {
            j += 1;
        }
        return j;
    }
    // (percentage) Input a value, find where, on a scale of 0-100, it applies.
    function toStepping(xVal, xPct, value) {
        if (value >= xVal.slice(-1)[0]) {
            return 100;
        }
        var j = getJ(value, xVal);
        var va = xVal[j - 1];
        var vb = xVal[j];
        var pa = xPct[j - 1];
        var pb = xPct[j];
        return pa + toPercentage([va, vb], value) / subRangeRatio(pa, pb);
    }
    // (value) Input a percentage, find where it is on the specified range.
    function fromStepping(xVal, xPct, value) {
        // There is no range group that fits 100
        if (value >= 100) {
            return xVal.slice(-1)[0];
        }
        var j = getJ(value, xPct);
        var va = xVal[j - 1];
        var vb = xVal[j];
        var pa = xPct[j - 1];
        var pb = xPct[j];
        return isPercentage([va, vb], (value - pa) * subRangeRatio(pa, pb));
    }
    // (percentage) Get the step that applies at a certain value.
    function getStep(xPct, xSteps, snap, value) {
        if (value === 100) {
            return value;
        }
        var j = getJ(value, xPct);
        var a = xPct[j - 1];
        var b = xPct[j];
        // If 'snap' is set, steps are used as fixed points on the slider.
        if (snap) {
            // Find the closest position, a or b.
            if (value - a > (b - a) / 2) {
                return b;
            }
            return a;
        }
        if (!xSteps[j - 1]) {
            return value;
        }
        return xPct[j - 1] + closest(value - xPct[j - 1], xSteps[j - 1]);
    }
    function handleEntryPoint(index, value, that) {
        var percentage;
        // Wrap numerical input in an array.
        if (typeof value === "number") {
            value = [value];
        }
        // Reject any invalid input, by testing whether value is an array.
        if (!Array.isArray(value)) {
            throw new Error("noUiSlider (" + VERSION + "): 'range' contains invalid value.");
        }
        // Covert min/max syntax to 0 and 100.
        if (index === "min") {
            percentage = 0;
        } else if (index === "max") {
            percentage = 100;
        } else {
            percentage = parseFloat(index);
        }
        // Check for correct input.
        if (!isNumeric(percentage) || !isNumeric(value[0])) {
            throw new Error("noUiSlider (" + VERSION + "): 'range' value isn't numeric.");
        }
        // Store values.
        that.xPct.push(percentage);
        that.xVal.push(value[0]);
        // NaN will evaluate to false too, but to keep
        // logging clear, set step explicitly. Make sure
        // not to override the 'step' setting with false.
        if (!percentage) {
            if (!isNaN(value[1])) {
                that.xSteps[0] = value[1];
            }
        } else {
            that.xSteps.push(isNaN(value[1]) ? false : value[1]);
        }
        that.xHighestCompleteStep.push(0);
    }
    function handleStepPoint(i, n, that) {
        // Ignore 'false' stepping.
        if (!n) {
            return;
        }
        // Step over zero-length ranges (#948);
        if (that.xVal[i] === that.xVal[i + 1]) {
            that.xSteps[i] = that.xHighestCompleteStep[i] = that.xVal[i];
            return;
        }
        // Factor to range ratio
        that.xSteps[i] = fromPercentage([that.xVal[i], that.xVal[i + 1]], n, 0) / subRangeRatio(that.xPct[i], that.xPct[i + 1]);
        var totalSteps = (that.xVal[i + 1] - that.xVal[i]) / that.xNumSteps[i];
        var highestStep = Math.ceil(Number(totalSteps.toFixed(3)) - 1);
        var step = that.xVal[i] + that.xNumSteps[i] * highestStep;
        that.xHighestCompleteStep[i] = step;
    }
    //endregion
    //region Spectrum
    function Spectrum(entry, snap, singleStep) {
        this.xPct = [];
        this.xVal = [];
        this.xSteps = [singleStep || false];
        this.xNumSteps = [false];
        this.xHighestCompleteStep = [];
        this.snap = snap;
        var index;
        var ordered = []; // [0, 'min'], [1, '50%'], [2, 'max']
        // Map the object keys to an array.
        for (index in entry) {
            if (entry.hasOwnProperty(index)) {
                ordered.push([entry[index], index]);
            }
        }
        // Sort all entries by value (numeric sort).
        if (ordered.length && _typeof(ordered[0][0]) === "object") {
            ordered.sort(function (a, b) {
                return a[0][0] - b[0][0];
            });
        } else {
            ordered.sort(function (a, b) {
                return a[0] - b[0];
            });
        }
        // Convert all entries to subranges.
        for (index = 0; index < ordered.length; index++) {
            handleEntryPoint(ordered[index][1], ordered[index][0], this);
        }
        // Store the actual step values.
        // xSteps is sorted in the same order as xPct and xVal.
        this.xNumSteps = this.xSteps.slice(0);
        // Convert all numeric steps to the percentage of the subrange they represent.
        for (index = 0; index < this.xNumSteps.length; index++) {
            handleStepPoint(index, this.xNumSteps[index], this);
        }
    }
    Spectrum.prototype.getDistance = function (value) {
        var index;
        var distances = [];
        for (index = 0; index < this.xNumSteps.length - 1; index++) {
            // last "range" can't contain step size as it is purely an endpoint.
            var step = this.xNumSteps[index];
            if (step && value / step % 1 !== 0) {
                throw new Error("noUiSlider (" + VERSION + "): 'limit', 'margin' and 'padding' of " + this.xPct[index] + "% range must be divisible by step.");
            }
            // Calculate percentual distance in current range of limit, margin or padding
            distances[index] = fromPercentage(this.xVal, value, index);
        }
        return distances;
    };
    // Calculate the percentual distance over the whole scale of ranges.
    // direction: 0 = backwards / 1 = forwards
    Spectrum.prototype.getAbsoluteDistance = function (value, distances, direction) {
        var xPct_index = 0;
        // Calculate range where to start calculation
        if (value < this.xPct[this.xPct.length - 1]) {
            while (value > this.xPct[xPct_index + 1]) {
                xPct_index++;
            }
        } else if (value === this.xPct[this.xPct.length - 1]) {
            xPct_index = this.xPct.length - 2;
        }
        // If looking backwards and the value is exactly at a range separator then look one range further
        if (!direction && value === this.xPct[xPct_index + 1]) {
            xPct_index++;
        }
        var start_factor;
        var rest_factor = 1;
        var rest_rel_distance = distances[xPct_index];
        var range_pct = 0;
        var rel_range_distance = 0;
        var abs_distance_counter = 0;
        var range_counter = 0;
        // Calculate what part of the start range the value is
        if (direction) {
            start_factor = (value - this.xPct[xPct_index]) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
        } else {
            start_factor = (this.xPct[xPct_index + 1] - value) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
        }
        // Do until the complete distance across ranges is calculated
        while (rest_rel_distance > 0) {
            // Calculate the percentage of total range
            range_pct = this.xPct[xPct_index + 1 + range_counter] - this.xPct[xPct_index + range_counter];
            // Detect if the margin, padding or limit is larger then the current range and calculate
            if (distances[xPct_index + range_counter] * rest_factor + 100 - start_factor * 100 > 100) {
                // If larger then take the percentual distance of the whole range
                rel_range_distance = range_pct * start_factor;
                // Rest factor of relative percentual distance still to be calculated
                rest_factor = (rest_rel_distance - 100 * start_factor) / distances[xPct_index + range_counter];
                // Set start factor to 1 as for next range it does not apply.
                start_factor = 1;
            } else {
                // If smaller or equal then take the percentual distance of the calculate percentual part of that range
                rel_range_distance = distances[xPct_index + range_counter] * range_pct / 100 * rest_factor;
                // No rest left as the rest fits in current range
                rest_factor = 0;
            }
            if (direction) {
                abs_distance_counter = abs_distance_counter - rel_range_distance;
                // Limit range to first range when distance becomes outside of minimum range
                if (this.xPct.length + range_counter >= 1) {
                    range_counter--;
                }
            } else {
                abs_distance_counter = abs_distance_counter + rel_range_distance;
                // Limit range to last range when distance becomes outside of maximum range
                if (this.xPct.length - range_counter >= 1) {
                    range_counter++;
                }
            }
            // Rest of relative percentual distance still to be calculated
            rest_rel_distance = distances[xPct_index + range_counter] * rest_factor;
        }
        return value + abs_distance_counter;
    };
    Spectrum.prototype.toStepping = function (value) {
        value = toStepping(this.xVal, this.xPct, value);
        return value;
    };
    Spectrum.prototype.fromStepping = function (value) {
        return fromStepping(this.xVal, this.xPct, value);
    };
    Spectrum.prototype.getStep = function (value) {
        value = getStep(this.xPct, this.xSteps, this.snap, value);
        return value;
    };
    Spectrum.prototype.getDefaultStep = function (value, isDown, size) {
        var j = getJ(value, this.xPct);
        // When at the top or stepping down, look at the previous sub-range
        if (value === 100 || isDown && value === this.xPct[j - 1]) {
            j = Math.max(j - 1, 1);
        }
        return (this.xVal[j] - this.xVal[j - 1]) / size;
    };
    Spectrum.prototype.getNearbySteps = function (value) {
        var j = getJ(value, this.xPct);
        return {
            stepBefore: {
                startValue: this.xVal[j - 2],
                step: this.xNumSteps[j - 2],
                highestStep: this.xHighestCompleteStep[j - 2]
            },
            thisStep: {
                startValue: this.xVal[j - 1],
                step: this.xNumSteps[j - 1],
                highestStep: this.xHighestCompleteStep[j - 1]
            },
            stepAfter: {
                startValue: this.xVal[j],
                step: this.xNumSteps[j],
                highestStep: this.xHighestCompleteStep[j]
            }
        };
    };
    Spectrum.prototype.countStepDecimals = function () {
        var stepDecimals = this.xNumSteps.map(countDecimals);
        return Math.max.apply(null, stepDecimals);
    };
    // Outside testing
    Spectrum.prototype.convert = function (value) {
        return this.getStep(this.toStepping(value));
    };
    //endregion
    //region Options
    /*	Every input option is tested and parsed. This'll prevent
        endless validation in internal methods. These tests are
        structured with an item for every option available. An
        option can be marked as required by setting the 'r' flag.
        The testing function is provided with three arguments:
            - The provided value for the option;
            - A reference to the options object;
            - The name for the option;
    
        The testing function returns false when an error is detected,
        or true when everything is OK. It can also modify the option
        object, to make sure all values can be correctly looped elsewhere. */
    //region Defaults
    var defaultFormatter = {
        to: function to(value) {
            return value !== undefined && value.toFixed(2);
        },
        from: Number
    };
    var cssClasses = {
        target: "target",
        base: "base",
        origin: "origin",
        handle: "handle",
        handleLower: "handle-lower",
        handleUpper: "handle-upper",
        touchArea: "touch-area",
        horizontal: "horizontal",
        vertical: "vertical",
        background: "background",
        connect: "connect",
        connects: "connects",
        ltr: "ltr",
        rtl: "rtl",
        textDirectionLtr: "txt-dir-ltr",
        textDirectionRtl: "txt-dir-rtl",
        draggable: "draggable",
        drag: "state-drag",
        tap: "state-tap",
        active: "active",
        tooltip: "tooltip",
        pips: "pips",
        pipsHorizontal: "pips-horizontal",
        pipsVertical: "pips-vertical",
        marker: "marker",
        markerHorizontal: "marker-horizontal",
        markerVertical: "marker-vertical",
        markerNormal: "marker-normal",
        markerLarge: "marker-large",
        markerSub: "marker-sub",
        value: "value",
        valueHorizontal: "value-horizontal",
        valueVertical: "value-vertical",
        valueNormal: "value-normal",
        valueLarge: "value-large",
        valueSub: "value-sub"
    };
    // Namespaces of internal event listeners
    var INTERNAL_EVENT_NS = {
        tooltips: ".__tooltips",
        aria: ".__aria"
    };
    //endregion
    function validateFormat(entry) {
        // Any object with a to and from method is supported.
        if (isValidFormatter(entry)) {
            return true;
        }
        throw new Error("noUiSlider (" + VERSION + "): 'format' requires 'to' and 'from' methods.");
    }
    function testStep(parsed, entry) {
        if (!isNumeric(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'step' is not numeric.");
        }
        // The step option can still be used to set stepping
        // for linear sliders. Overwritten if set in 'range'.
        parsed.singleStep = entry;
    }
    function testKeyboardPageMultiplier(parsed, entry) {
        if (!isNumeric(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'keyboardPageMultiplier' is not numeric.");
        }
        parsed.keyboardPageMultiplier = entry;
    }
    function testKeyboardDefaultStep(parsed, entry) {
        if (!isNumeric(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'keyboardDefaultStep' is not numeric.");
        }
        parsed.keyboardDefaultStep = entry;
    }
    function testRange(parsed, entry) {
        // Filter incorrect input.
        if ((typeof entry === "undefined" ? "undefined" : _typeof(entry)) !== "object" || Array.isArray(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'range' is not an object.");
        }
        // Catch missing start or end.
        if (entry.min === undefined || entry.max === undefined) {
            throw new Error("noUiSlider (" + VERSION + "): Missing 'min' or 'max' in 'range'.");
        }
        // Catch equal start or end.
        if (entry.min === entry.max) {
            throw new Error("noUiSlider (" + VERSION + "): 'range' 'min' and 'max' cannot be equal.");
        }
        parsed.spectrum = new Spectrum(entry, parsed.snap, parsed.singleStep);
    }
    function testStart(parsed, entry) {
        entry = asArray(entry);
        // Validate input. Values aren't tested, as the public .val method
        // will always provide a valid location.
        if (!Array.isArray(entry) || !entry.length) {
            throw new Error("noUiSlider (" + VERSION + "): 'start' option is incorrect.");
        }
        // Store the number of handles.
        parsed.handles = entry.length;
        // When the slider is initialized, the .val method will
        // be called with the start options.
        parsed.start = entry;
    }
    function testSnap(parsed, entry) {
        // Enforce 100% stepping within subranges.
        parsed.snap = entry;
        if (typeof entry !== "boolean") {
            throw new Error("noUiSlider (" + VERSION + "): 'snap' option must be a boolean.");
        }
    }
    function testAnimate(parsed, entry) {
        // Enforce 100% stepping within subranges.
        parsed.animate = entry;
        if (typeof entry !== "boolean") {
            throw new Error("noUiSlider (" + VERSION + "): 'animate' option must be a boolean.");
        }
    }
    function testAnimationDuration(parsed, entry) {
        parsed.animationDuration = entry;
        if (typeof entry !== "number") {
            throw new Error("noUiSlider (" + VERSION + "): 'animationDuration' option must be a number.");
        }
    }
    function testConnect(parsed, entry) {
        var connect = [false];
        var i;
        // Map legacy options
        if (entry === "lower") {
            entry = [true, false];
        } else if (entry === "upper") {
            entry = [false, true];
        }
        // Handle boolean options
        if (entry === true || entry === false) {
            for (i = 1; i < parsed.handles; i++) {
                connect.push(entry);
            }
            connect.push(false);
        }
        // Reject invalid input
        else if (!Array.isArray(entry) || !entry.length || entry.length !== parsed.handles + 1) {
                throw new Error("noUiSlider (" + VERSION + "): 'connect' option doesn't match handle count.");
            } else {
                connect = entry;
            }
        parsed.connect = connect;
    }
    function testOrientation(parsed, entry) {
        // Set orientation to an a numerical value for easy
        // array selection.
        switch (entry) {
            case "horizontal":
                parsed.ort = 0;
                break;
            case "vertical":
                parsed.ort = 1;
                break;
            default:
                throw new Error("noUiSlider (" + VERSION + "): 'orientation' option is invalid.");
        }
    }
    function testMargin(parsed, entry) {
        if (!isNumeric(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'margin' option must be numeric.");
        }
        // Issue #582
        if (entry === 0) {
            return;
        }
        parsed.margin = parsed.spectrum.getDistance(entry);
    }
    function testLimit(parsed, entry) {
        if (!isNumeric(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'limit' option must be numeric.");
        }
        parsed.limit = parsed.spectrum.getDistance(entry);
        if (!parsed.limit || parsed.handles < 2) {
            throw new Error("noUiSlider (" + VERSION + "): 'limit' option is only supported on linear sliders with 2 or more handles.");
        }
    }
    function testPadding(parsed, entry) {
        var index;
        if (!isNumeric(entry) && !Array.isArray(entry)) {
            throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be numeric or array of exactly 2 numbers.");
        }
        if (Array.isArray(entry) && !(entry.length === 2 || isNumeric(entry[0]) || isNumeric(entry[1]))) {
            throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be numeric or array of exactly 2 numbers.");
        }
        if (entry === 0) {
            return;
        }
        if (!Array.isArray(entry)) {
            entry = [entry, entry];
        }
        // 'getDistance' returns false for invalid values.
        parsed.padding = [parsed.spectrum.getDistance(entry[0]), parsed.spectrum.getDistance(entry[1])];
        for (index = 0; index < parsed.spectrum.xNumSteps.length - 1; index++) {
            // last "range" can't contain step size as it is purely an endpoint.
            if (parsed.padding[0][index] < 0 || parsed.padding[1][index] < 0) {
                throw new Error("noUiSlider (" + VERSION + "): 'padding' option must be a positive number(s).");
            }
        }
        var totalPadding = entry[0] + entry[1];
        var firstValue = parsed.spectrum.xVal[0];
        var lastValue = parsed.spectrum.xVal[parsed.spectrum.xVal.length - 1];
        if (totalPadding / (lastValue - firstValue) > 1) {
            throw new Error("noUiSlider (" + VERSION + "): 'padding' option must not exceed 100% of the range.");
        }
    }
    function testDirection(parsed, entry) {
        // Set direction as a numerical value for easy parsing.
        // Invert connection for RTL sliders, so that the proper
        // handles get the connect/background classes.
        switch (entry) {
            case "ltr":
                parsed.dir = 0;
                break;
            case "rtl":
                parsed.dir = 1;
                break;
            default:
                throw new Error("noUiSlider (" + VERSION + "): 'direction' option was not recognized.");
        }
    }
    function testBehaviour(parsed, entry) {
        // Make sure the input is a string.
        if (typeof entry !== "string") {
            throw new Error("noUiSlider (" + VERSION + "): 'behaviour' must be a string containing options.");
        }
        // Check if the string contains any keywords.
        // None are required.
        var tap = entry.indexOf("tap") >= 0;
        var drag = entry.indexOf("drag") >= 0;
        var fixed = entry.indexOf("fixed") >= 0;
        var snap = entry.indexOf("snap") >= 0;
        var hover = entry.indexOf("hover") >= 0;
        var unconstrained = entry.indexOf("unconstrained") >= 0;
        if (fixed) {
            if (parsed.handles !== 2) {
                throw new Error("noUiSlider (" + VERSION + "): 'fixed' behaviour must be used with 2 handles");
            }
            // Use margin to enforce fixed state
            testMargin(parsed, parsed.start[1] - parsed.start[0]);
        }
        if (unconstrained && (parsed.margin || parsed.limit)) {
            throw new Error("noUiSlider (" + VERSION + "): 'unconstrained' behaviour cannot be used with margin or limit");
        }
        parsed.events = {
            tap: tap || snap,
            drag: drag,
            fixed: fixed,
            snap: snap,
            hover: hover,
            unconstrained: unconstrained
        };
    }
    function testTooltips(parsed, entry) {
        if (entry === false) {
            return;
        }
        if (entry === true) {
            parsed.tooltips = [];
            for (var i = 0; i < parsed.handles; i++) {
                parsed.tooltips.push(true);
            }
        } else {
            parsed.tooltips = asArray(entry);
            if (parsed.tooltips.length !== parsed.handles) {
                throw new Error("noUiSlider (" + VERSION + "): must pass a formatter for all handles.");
            }
            parsed.tooltips.forEach(function (formatter) {
                if (typeof formatter !== "boolean" && ((typeof formatter === "undefined" ? "undefined" : _typeof(formatter)) !== "object" || typeof formatter.to !== "function")) {
                    throw new Error("noUiSlider (" + VERSION + "): 'tooltips' must be passed a formatter or 'false'.");
                }
            });
        }
    }
    function testAriaFormat(parsed, entry) {
        parsed.ariaFormat = entry;
        validateFormat(entry);
    }
    function testFormat(parsed, entry) {
        parsed.format = entry;
        validateFormat(entry);
    }
    function testKeyboardSupport(parsed, entry) {
        parsed.keyboardSupport = entry;
        if (typeof entry !== "boolean") {
            throw new Error("noUiSlider (" + VERSION + "): 'keyboardSupport' option must be a boolean.");
        }
    }
    function testDocumentElement(parsed, entry) {
        // This is an advanced option. Passed values are used without validation.
        parsed.documentElement = entry;
    }
    function testCssPrefix(parsed, entry) {
        if (typeof entry !== "string" && entry !== false) {
            throw new Error("noUiSlider (" + VERSION + "): 'cssPrefix' must be a string or `false`.");
        }
        parsed.cssPrefix = entry;
    }
    function testCssClasses(parsed, entry) {
        if ((typeof entry === "undefined" ? "undefined" : _typeof(entry)) !== "object") {
            throw new Error("noUiSlider (" + VERSION + "): 'cssClasses' must be an object.");
        }
        if (typeof parsed.cssPrefix === "string") {
            parsed.cssClasses = {};
            for (var key in entry) {
                if (!entry.hasOwnProperty(key)) {
                    continue;
                }
                parsed.cssClasses[key] = parsed.cssPrefix + entry[key];
            }
        } else {
            parsed.cssClasses = entry;
        }
    }
    // Test all developer settings and parse to assumption-safe values.
    function testOptions(options) {
        // To prove a fix for #537, freeze options here.
        // If the object is modified, an error will be thrown.
        // Object.freeze(options);
        var parsed = {
            margin: 0,
            limit: 0,
            padding: 0,
            animate: true,
            animationDuration: 300,
            ariaFormat: defaultFormatter,
            format: defaultFormatter
        };
        // Tests are executed in the order they are presented here.
        var tests = {
            step: { r: false, t: testStep },
            keyboardPageMultiplier: { r: false, t: testKeyboardPageMultiplier },
            keyboardDefaultStep: { r: false, t: testKeyboardDefaultStep },
            start: { r: true, t: testStart },
            connect: { r: true, t: testConnect },
            direction: { r: true, t: testDirection },
            snap: { r: false, t: testSnap },
            animate: { r: false, t: testAnimate },
            animationDuration: { r: false, t: testAnimationDuration },
            range: { r: true, t: testRange },
            orientation: { r: false, t: testOrientation },
            margin: { r: false, t: testMargin },
            limit: { r: false, t: testLimit },
            padding: { r: false, t: testPadding },
            behaviour: { r: true, t: testBehaviour },
            ariaFormat: { r: false, t: testAriaFormat },
            format: { r: false, t: testFormat },
            tooltips: { r: false, t: testTooltips },
            keyboardSupport: { r: true, t: testKeyboardSupport },
            documentElement: { r: false, t: testDocumentElement },
            cssPrefix: { r: true, t: testCssPrefix },
            cssClasses: { r: true, t: testCssClasses }
        };
        var defaults = {
            connect: false,
            direction: "ltr",
            behaviour: "tap",
            orientation: "horizontal",
            keyboardSupport: true,
            cssPrefix: "noUi-",
            cssClasses: cssClasses,
            keyboardPageMultiplier: 5,
            keyboardDefaultStep: 10
        };
        // AriaFormat defaults to regular format, if any.
        if (options.format && !options.ariaFormat) {
            options.ariaFormat = options.format;
        }
        // Run all options through a testing mechanism to ensure correct
        // input. It should be noted that options might get modified to
        // be handled properly. E.g. wrapping integers in arrays.
        Object.keys(tests).forEach(function (name) {
            // If the option isn't set, but it is required, throw an error.
            if (!isSet(options[name]) && defaults[name] === undefined) {
                if (tests[name].r) {
                    throw new Error("noUiSlider (" + VERSION + "): '" + name + "' is required.");
                }
                return true;
            }
            tests[name].t(parsed, !isSet(options[name]) ? defaults[name] : options[name]);
        });
        // Forward pips options
        parsed.pips = options.pips;
        // All recent browsers accept unprefixed transform.
        // We need -ms- for IE9 and -webkit- for older Android;
        // Assume use of -webkit- if unprefixed and -ms- are not supported.
        // https://caniuse.com/#feat=transforms2d
        var d = document.createElement("div");
        var msPrefix = d.style.msTransform !== undefined;
        var noPrefix = d.style.transform !== undefined;
        parsed.transformRule = noPrefix ? "transform" : msPrefix ? "msTransform" : "webkitTransform";
        // Pips don't move, so we can place them using left/top.
        var styles = [["left", "top"], ["right", "bottom"]];
        parsed.style = styles[parsed.dir][parsed.ort];
        return parsed;
    }
    //endregion
    function scope(target, options, originalOptions) {
        var actions = getActions();
        var supportsTouchActionNone = getSupportsTouchActionNone();
        var supportsPassive = supportsTouchActionNone && getSupportsPassive();
        // All variables local to 'scope' are prefixed with 'scope_'
        // Slider DOM Nodes
        var scope_Target = target;
        var scope_Base;
        var scope_Handles;
        var scope_Connects;
        var scope_Pips;
        var scope_Tooltips;
        // Slider state values
        var scope_Spectrum = options.spectrum;
        var scope_Values = [];
        var scope_Locations = [];
        var scope_HandleNumbers = [];
        var scope_ActiveHandlesCount = 0;
        var scope_Events = {};
        // Exposed API
        var scope_Self;
        // Document Nodes
        var scope_Document = target.ownerDocument;
        var scope_DocumentElement = options.documentElement || scope_Document.documentElement;
        var scope_Body = scope_Document.body;
        // Pips constants
        var PIPS_NONE = -1;
        var PIPS_NO_VALUE = 0;
        var PIPS_LARGE_VALUE = 1;
        var PIPS_SMALL_VALUE = 2;
        // For horizontal sliders in standard ltr documents,
        // make .noUi-origin overflow to the left so the document doesn't scroll.
        var scope_DirOffset = scope_Document.dir === "rtl" || options.ort === 1 ? 0 : 100;
        // Creates a node, adds it to target, returns the new node.
        function addNodeTo(addTarget, className) {
            var div = scope_Document.createElement("div");
            if (className) {
                addClass(div, className);
            }
            addTarget.appendChild(div);
            return div;
        }
        // Append a origin to the base
        function addOrigin(base, handleNumber) {
            var origin = addNodeTo(base, options.cssClasses.origin);
            var handle = addNodeTo(origin, options.cssClasses.handle);
            addNodeTo(handle, options.cssClasses.touchArea);
            handle.setAttribute("data-handle", handleNumber);
            if (options.keyboardSupport) {
                // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
                // 0 = focusable and reachable
                handle.setAttribute("tabindex", "0");
                handle.addEventListener("keydown", function (event) {
                    return eventKeydown(event, handleNumber);
                });
            }
            handle.setAttribute("role", "slider");
            handle.setAttribute("aria-orientation", options.ort ? "vertical" : "horizontal");
            if (handleNumber === 0) {
                addClass(handle, options.cssClasses.handleLower);
            } else if (handleNumber === options.handles - 1) {
                addClass(handle, options.cssClasses.handleUpper);
            }
            return origin;
        }
        // Insert nodes for connect elements
        function addConnect(base, add) {
            if (!add) {
                return false;
            }
            return addNodeTo(base, options.cssClasses.connect);
        }
        // Add handles to the slider base.
        function addElements(connectOptions, base) {
            var connectBase = addNodeTo(base, options.cssClasses.connects);
            scope_Handles = [];
            scope_Connects = [];
            scope_Connects.push(addConnect(connectBase, connectOptions[0]));
            // [::::O====O====O====]
            // connectOptions = [0, 1, 1, 1]
            for (var i = 0; i < options.handles; i++) {
                // Keep a list of all added handles.
                scope_Handles.push(addOrigin(base, i));
                scope_HandleNumbers[i] = i;
                scope_Connects.push(addConnect(connectBase, connectOptions[i + 1]));
            }
        }
        // Initialize a single slider.
        function addSlider(addTarget) {
            // Apply classes and data to the target.
            addClass(addTarget, options.cssClasses.target);
            if (options.dir === 0) {
                addClass(addTarget, options.cssClasses.ltr);
            } else {
                addClass(addTarget, options.cssClasses.rtl);
            }
            if (options.ort === 0) {
                addClass(addTarget, options.cssClasses.horizontal);
            } else {
                addClass(addTarget, options.cssClasses.vertical);
            }
            var textDirection = getComputedStyle(addTarget).direction;
            if (textDirection === "rtl") {
                addClass(addTarget, options.cssClasses.textDirectionRtl);
            } else {
                addClass(addTarget, options.cssClasses.textDirectionLtr);
            }
            return addNodeTo(addTarget, options.cssClasses.base);
        }
        function addTooltip(handle, handleNumber) {
            if (!options.tooltips[handleNumber]) {
                return false;
            }
            return addNodeTo(handle.firstChild, options.cssClasses.tooltip);
        }
        function isSliderDisabled() {
            return scope_Target.hasAttribute("disabled");
        }
        // Disable the slider dragging if any handle is disabled
        function isHandleDisabled(handleNumber) {
            var handleOrigin = scope_Handles[handleNumber];
            return handleOrigin.hasAttribute("disabled");
        }
        function removeTooltips() {
            if (scope_Tooltips) {
                removeEvent("update" + INTERNAL_EVENT_NS.tooltips);
                scope_Tooltips.forEach(function (tooltip) {
                    if (tooltip) {
                        removeElement(tooltip);
                    }
                });
                scope_Tooltips = null;
            }
        }
        // The tooltips option is a shorthand for using the 'update' event.
        function tooltips() {
            removeTooltips();
            // Tooltips are added with options.tooltips in original order.
            scope_Tooltips = scope_Handles.map(addTooltip);
            bindEvent("update" + INTERNAL_EVENT_NS.tooltips, function (values, handleNumber, unencoded) {
                if (!scope_Tooltips[handleNumber]) {
                    return;
                }
                var formattedValue = values[handleNumber];
                if (options.tooltips[handleNumber] !== true) {
                    formattedValue = options.tooltips[handleNumber].to(unencoded[handleNumber]);
                }
                scope_Tooltips[handleNumber].innerHTML = formattedValue;
            });
        }
        function aria() {
            removeEvent("update" + INTERNAL_EVENT_NS.aria);
            bindEvent("update" + INTERNAL_EVENT_NS.aria, function (values, handleNumber, unencoded, tap, positions) {
                // Update Aria Values for all handles, as a change in one changes min and max values for the next.
                scope_HandleNumbers.forEach(function (index) {
                    var handle = scope_Handles[index];
                    var min = checkHandlePosition(scope_Locations, index, 0, true, true, true);
                    var max = checkHandlePosition(scope_Locations, index, 100, true, true, true);
                    var now = positions[index];
                    // Formatted value for display
                    var text = options.ariaFormat.to(unencoded[index]);
                    // Map to slider range values
                    min = scope_Spectrum.fromStepping(min).toFixed(1);
                    max = scope_Spectrum.fromStepping(max).toFixed(1);
                    now = scope_Spectrum.fromStepping(now).toFixed(1);
                    handle.children[0].setAttribute("aria-valuemin", min);
                    handle.children[0].setAttribute("aria-valuemax", max);
                    handle.children[0].setAttribute("aria-valuenow", now);
                    handle.children[0].setAttribute("aria-valuetext", text);
                });
            });
        }
        function getGroup(mode, values, stepped) {
            // Use the range.
            if (mode === "range" || mode === "steps") {
                return scope_Spectrum.xVal;
            }
            if (mode === "count") {
                if (values < 2) {
                    throw new Error("noUiSlider (" + VERSION + "): 'values' (>= 2) required for mode 'count'.");
                }
                // Divide 0 - 100 in 'count' parts.
                var interval = values - 1;
                var spread = 100 / interval;
                values = [];
                // List these parts and have them handled as 'positions'.
                while (interval--) {
                    values[interval] = interval * spread;
                }
                values.push(100);
                mode = "positions";
            }
            if (mode === "positions") {
                // Map all percentages to on-range values.
                return values.map(function (value) {
                    return scope_Spectrum.fromStepping(stepped ? scope_Spectrum.getStep(value) : value);
                });
            }
            if (mode === "values") {
                // If the value must be stepped, it needs to be converted to a percentage first.
                if (stepped) {
                    return values.map(function (value) {
                        // Convert to percentage, apply step, return to value.
                        return scope_Spectrum.fromStepping(scope_Spectrum.getStep(scope_Spectrum.toStepping(value)));
                    });
                }
                // Otherwise, we can simply use the values.
                return values;
            }
        }
        function generateSpread(density, mode, group) {
            function safeIncrement(value, increment) {
                // Avoid floating point variance by dropping the smallest decimal places.
                return (value + increment).toFixed(7) / 1;
            }
            var indexes = {};
            var firstInRange = scope_Spectrum.xVal[0];
            var lastInRange = scope_Spectrum.xVal[scope_Spectrum.xVal.length - 1];
            var ignoreFirst = false;
            var ignoreLast = false;
            var prevPct = 0;
            // Create a copy of the group, sort it and filter away all duplicates.
            group = unique(group.slice().sort(function (a, b) {
                return a - b;
            }));
            // Make sure the range starts with the first element.
            if (group[0] !== firstInRange) {
                group.unshift(firstInRange);
                ignoreFirst = true;
            }
            // Likewise for the last one.
            if (group[group.length - 1] !== lastInRange) {
                group.push(lastInRange);
                ignoreLast = true;
            }
            group.forEach(function (current, index) {
                // Get the current step and the lower + upper positions.
                var step;
                var i;
                var q;
                var low = current;
                var high = group[index + 1];
                var newPct;
                var pctDifference;
                var pctPos;
                var type;
                var steps;
                var realSteps;
                var stepSize;
                var isSteps = mode === "steps";
                // When using 'steps' mode, use the provided steps.
                // Otherwise, we'll step on to the next subrange.
                if (isSteps) {
                    step = scope_Spectrum.xNumSteps[index];
                }
                // Default to a 'full' step.
                if (!step) {
                    step = high - low;
                }
                // Low can be 0, so test for false. Index 0 is already handled.
                if (low === false) {
                    return;
                }
                // If high is undefined we are at the last subrange. Make sure it iterates once (#1088)
                if (high === undefined) {
                    high = low;
                }
                // Make sure step isn't 0, which would cause an infinite loop (#654)
                step = Math.max(step, 0.0000001);
                // Find all steps in the subrange.
                for (i = low; i <= high; i = safeIncrement(i, step)) {
                    // Get the percentage value for the current step,
                    // calculate the size for the subrange.
                    newPct = scope_Spectrum.toStepping(i);
                    pctDifference = newPct - prevPct;
                    steps = pctDifference / density;
                    realSteps = Math.round(steps);
                    // This ratio represents the amount of percentage-space a point indicates.
                    // For a density 1 the points/percentage = 1. For density 2, that percentage needs to be re-divided.
                    // Round the percentage offset to an even number, then divide by two
                    // to spread the offset on both sides of the range.
                    stepSize = pctDifference / realSteps;
                    // Divide all points evenly, adding the correct number to this subrange.
                    // Run up to <= so that 100% gets a point, event if ignoreLast is set.
                    for (q = 1; q <= realSteps; q += 1) {
                        // The ratio between the rounded value and the actual size might be ~1% off.
                        // Correct the percentage offset by the number of points
                        // per subrange. density = 1 will result in 100 points on the
                        // full range, 2 for 50, 4 for 25, etc.
                        pctPos = prevPct + q * stepSize;
                        indexes[pctPos.toFixed(5)] = [scope_Spectrum.fromStepping(pctPos), 0];
                    }
                    // Determine the point type.
                    type = group.indexOf(i) > -1 ? PIPS_LARGE_VALUE : isSteps ? PIPS_SMALL_VALUE : PIPS_NO_VALUE;
                    // Enforce the 'ignoreFirst' option by overwriting the type for 0.
                    if (!index && ignoreFirst && i !== high) {
                        type = 0;
                    }
                    if (!(i === high && ignoreLast)) {
                        // Mark the 'type' of this point. 0 = plain, 1 = real value, 2 = step value.
                        indexes[newPct.toFixed(5)] = [i, type];
                    }
                    // Update the percentage count.
                    prevPct = newPct;
                }
            });
            return indexes;
        }
        function addMarking(spread, filterFunc, formatter) {
            var element = scope_Document.createElement("div");
            var valueSizeClasses = [];
            valueSizeClasses[PIPS_NO_VALUE] = options.cssClasses.valueNormal;
            valueSizeClasses[PIPS_LARGE_VALUE] = options.cssClasses.valueLarge;
            valueSizeClasses[PIPS_SMALL_VALUE] = options.cssClasses.valueSub;
            var markerSizeClasses = [];
            markerSizeClasses[PIPS_NO_VALUE] = options.cssClasses.markerNormal;
            markerSizeClasses[PIPS_LARGE_VALUE] = options.cssClasses.markerLarge;
            markerSizeClasses[PIPS_SMALL_VALUE] = options.cssClasses.markerSub;
            var valueOrientationClasses = [options.cssClasses.valueHorizontal, options.cssClasses.valueVertical];
            var markerOrientationClasses = [options.cssClasses.markerHorizontal, options.cssClasses.markerVertical];
            addClass(element, options.cssClasses.pips);
            addClass(element, options.ort === 0 ? options.cssClasses.pipsHorizontal : options.cssClasses.pipsVertical);
            function getClasses(type, source) {
                var a = source === options.cssClasses.value;
                var orientationClasses = a ? valueOrientationClasses : markerOrientationClasses;
                var sizeClasses = a ? valueSizeClasses : markerSizeClasses;
                return source + " " + orientationClasses[options.ort] + " " + sizeClasses[type];
            }
            function addSpread(offset, value, type) {
                // Apply the filter function, if it is set.
                type = filterFunc ? filterFunc(value, type) : type;
                if (type === PIPS_NONE) {
                    return;
                }
                // Add a marker for every point
                var node = addNodeTo(element, false);
                node.className = getClasses(type, options.cssClasses.marker);
                node.style[options.style] = offset + "%";
                // Values are only appended for points marked '1' or '2'.
                if (type > PIPS_NO_VALUE) {
                    node = addNodeTo(element, false);
                    node.className = getClasses(type, options.cssClasses.value);
                    node.setAttribute("data-value", value);
                    node.style[options.style] = offset + "%";
                    node.innerHTML = formatter.to(value);
                }
            }
            // Append all points.
            Object.keys(spread).forEach(function (offset) {
                addSpread(offset, spread[offset][0], spread[offset][1]);
            });
            return element;
        }
        function removePips() {
            if (scope_Pips) {
                removeElement(scope_Pips);
                scope_Pips = null;
            }
        }
        function pips(grid) {
            // Fix #669
            removePips();
            var mode = grid.mode;
            var density = grid.density || 1;
            var filter = grid.filter || false;
            var values = grid.values || false;
            var stepped = grid.stepped || false;
            var group = getGroup(mode, values, stepped);
            var spread = generateSpread(density, mode, group);
            var format = grid.format || {
                to: Math.round
            };
            scope_Pips = scope_Target.appendChild(addMarking(spread, filter, format));
            return scope_Pips;
        }
        // Shorthand for base dimensions.
        function baseSize() {
            var rect = scope_Base.getBoundingClientRect();
            var alt = "offset" + ["Width", "Height"][options.ort];
            return options.ort === 0 ? rect.width || scope_Base[alt] : rect.height || scope_Base[alt];
        }
        // Handler for attaching events trough a proxy.
        function attachEvent(events, element, callback, data) {
            // This function can be used to 'filter' events to the slider.
            // element is a node, not a nodeList
            var method = function method(e) {
                e = fixEvent(e, data.pageOffset, data.target || element);
                // fixEvent returns false if this event has a different target
                // when handling (multi-) touch events;
                if (!e) {
                    return false;
                }
                // doNotReject is passed by all end events to make sure released touches
                // are not rejected, leaving the slider "stuck" to the cursor;
                if (isSliderDisabled() && !data.doNotReject) {
                    return false;
                }
                // Stop if an active 'tap' transition is taking place.
                if (hasClass(scope_Target, options.cssClasses.tap) && !data.doNotReject) {
                    return false;
                }
                // Ignore right or middle clicks on start #454
                if (events === actions.start && e.buttons !== undefined && e.buttons > 1) {
                    return false;
                }
                // Ignore right or middle clicks on start #454
                if (data.hover && e.buttons) {
                    return false;
                }
                // 'supportsPassive' is only true if a browser also supports touch-action: none in CSS.
                // iOS safari does not, so it doesn't get to benefit from passive scrolling. iOS does support
                // touch-action: manipulation, but that allows panning, which breaks
                // sliders after zooming/on non-responsive pages.
                // See: https://bugs.webkit.org/show_bug.cgi?id=133112
                if (!supportsPassive) {
                    e.preventDefault();
                }
                e.calcPoint = e.points[options.ort];
                // Call the event handler with the event [ and additional data ].
                callback(e, data);
            };
            var methods = [];
            // Bind a closure on the target for every event type.
            events.split(" ").forEach(function (eventName) {
                element.addEventListener(eventName, method, supportsPassive ? { passive: true } : false);
                methods.push([eventName, method]);
            });
            return methods;
        }
        // Provide a clean event with standardized offset values.
        function fixEvent(e, pageOffset, eventTarget) {
            // Filter the event to register the type, which can be
            // touch, mouse or pointer. Offset changes need to be
            // made on an event specific basis.
            var touch = e.type.indexOf("touch") === 0;
            var mouse = e.type.indexOf("mouse") === 0;
            var pointer = e.type.indexOf("pointer") === 0;
            var x;
            var y;
            // IE10 implemented pointer events with a prefix;
            if (e.type.indexOf("MSPointer") === 0) {
                pointer = true;
            }
            // Erroneous events seem to be passed in occasionally on iOS/iPadOS after user finishes interacting with
            // the slider. They appear to be of type MouseEvent, yet they don't have usual properties set. Ignore
            // events that have no touches or buttons associated with them. (#1057, #1079, #1095)
            if (e.type === "mousedown" && !e.buttons && !e.touches) {
                return false;
            }
            // The only thing one handle should be concerned about is the touches that originated on top of it.
            if (touch) {
                // Returns true if a touch originated on the target.
                var isTouchOnTarget = function isTouchOnTarget(checkTouch) {
                    return checkTouch.target === eventTarget || eventTarget.contains(checkTouch.target) || checkTouch.target.shadowRoot && checkTouch.target.shadowRoot.contains(eventTarget);
                };
                // In the case of touchstart events, we need to make sure there is still no more than one
                // touch on the target so we look amongst all touches.
                if (e.type === "touchstart") {
                    var targetTouches = Array.prototype.filter.call(e.touches, isTouchOnTarget);
                    // Do not support more than one touch per handle.
                    if (targetTouches.length > 1) {
                        return false;
                    }
                    x = targetTouches[0].pageX;
                    y = targetTouches[0].pageY;
                } else {
                    // In the other cases, find on changedTouches is enough.
                    var targetTouch = Array.prototype.find.call(e.changedTouches, isTouchOnTarget);
                    // Cancel if the target touch has not moved.
                    if (!targetTouch) {
                        return false;
                    }
                    x = targetTouch.pageX;
                    y = targetTouch.pageY;
                }
            }
            pageOffset = pageOffset || getPageOffset(scope_Document);
            if (mouse || pointer) {
                x = e.clientX + pageOffset.x;
                y = e.clientY + pageOffset.y;
            }
            e.pageOffset = pageOffset;
            e.points = [x, y];
            e.cursor = mouse || pointer; // Fix #435
            return e;
        }
        // Translate a coordinate in the document to a percentage on the slider
        function calcPointToPercentage(calcPoint) {
            var location = calcPoint - offset(scope_Base, options.ort);
            var proposal = location * 100 / baseSize();
            // Clamp proposal between 0% and 100%
            // Out-of-bound coordinates may occur when .noUi-base pseudo-elements
            // are used (e.g. contained handles feature)
            proposal = limit(proposal);
            return options.dir ? 100 - proposal : proposal;
        }
        // Find handle closest to a certain percentage on the slider
        function getClosestHandle(clickedPosition) {
            var smallestDifference = 100;
            var handleNumber = false;
            scope_Handles.forEach(function (handle, index) {
                // Disabled handles are ignored
                if (isHandleDisabled(index)) {
                    return;
                }
                var handlePosition = scope_Locations[index];
                var differenceWithThisHandle = Math.abs(handlePosition - clickedPosition);
                // Initial state
                var clickAtEdge = differenceWithThisHandle === 100 && smallestDifference === 100;
                // Difference with this handle is smaller than the previously checked handle
                var isCloser = differenceWithThisHandle < smallestDifference;
                var isCloserAfter = differenceWithThisHandle <= smallestDifference && clickedPosition > handlePosition;
                if (isCloser || isCloserAfter || clickAtEdge) {
                    handleNumber = index;
                    smallestDifference = differenceWithThisHandle;
                }
            });
            return handleNumber;
        }
        // Fire 'end' when a mouse or pen leaves the document.
        function documentLeave(event, data) {
            if (event.type === "mouseout" && event.target.nodeName === "HTML" && event.relatedTarget === null) {
                eventEnd(event, data);
            }
        }
        // Handle movement on document for handle and range drag.
        function eventMove(event, data) {
            // Fix #498
            // Check value of .buttons in 'start' to work around a bug in IE10 mobile (data.buttonsProperty).
            // https://connect.microsoft.com/IE/feedback/details/927005/mobile-ie10-windows-phone-buttons-property-of-pointermove-event-always-zero
            // IE9 has .buttons and .which zero on mousemove.
            // Firefox breaks the spec MDN defines.
            if (navigator.appVersion.indexOf("MSIE 9") === -1 && event.buttons === 0 && data.buttonsProperty !== 0) {
                return eventEnd(event, data);
            }
            // Check if we are moving up or down
            var movement = (options.dir ? -1 : 1) * (event.calcPoint - data.startCalcPoint);
            // Convert the movement into a percentage of the slider width/height
            var proposal = movement * 100 / data.baseSize;
            moveHandles(movement > 0, proposal, data.locations, data.handleNumbers);
        }
        // Unbind move events on document, call callbacks.
        function eventEnd(event, data) {
            // The handle is no longer active, so remove the class.
            if (data.handle) {
                removeClass(data.handle, options.cssClasses.active);
                scope_ActiveHandlesCount -= 1;
            }
            // Unbind the move and end events, which are added on 'start'.
            data.listeners.forEach(function (c) {
                scope_DocumentElement.removeEventListener(c[0], c[1]);
            });
            if (scope_ActiveHandlesCount === 0) {
                // Remove dragging class.
                removeClass(scope_Target, options.cssClasses.drag);
                setZindex();
                // Remove cursor styles and text-selection events bound to the body.
                if (event.cursor) {
                    scope_Body.style.cursor = "";
                    scope_Body.removeEventListener("selectstart", preventDefault);
                }
            }
            data.handleNumbers.forEach(function (handleNumber) {
                fireEvent("change", handleNumber);
                fireEvent("set", handleNumber);
                fireEvent("end", handleNumber);
            });
        }
        // Bind move events on document.
        function eventStart(event, data) {
            // Ignore event if any handle is disabled
            if (data.handleNumbers.some(isHandleDisabled)) {
                return false;
            }
            var handle;
            if (data.handleNumbers.length === 1) {
                var handleOrigin = scope_Handles[data.handleNumbers[0]];
                handle = handleOrigin.children[0];
                scope_ActiveHandlesCount += 1;
                // Mark the handle as 'active' so it can be styled.
                addClass(handle, options.cssClasses.active);
            }
            // A drag should never propagate up to the 'tap' event.
            event.stopPropagation();
            // Record the event listeners.
            var listeners = [];
            // Attach the move and end events.
            var moveEvent = attachEvent(actions.move, scope_DocumentElement, eventMove, {
                // The event target has changed so we need to propagate the original one so that we keep
                // relying on it to extract target touches.
                target: event.target,
                handle: handle,
                listeners: listeners,
                startCalcPoint: event.calcPoint,
                baseSize: baseSize(),
                pageOffset: event.pageOffset,
                handleNumbers: data.handleNumbers,
                buttonsProperty: event.buttons,
                locations: scope_Locations.slice()
            });
            var endEvent = attachEvent(actions.end, scope_DocumentElement, eventEnd, {
                target: event.target,
                handle: handle,
                listeners: listeners,
                doNotReject: true,
                handleNumbers: data.handleNumbers
            });
            var outEvent = attachEvent("mouseout", scope_DocumentElement, documentLeave, {
                target: event.target,
                handle: handle,
                listeners: listeners,
                doNotReject: true,
                handleNumbers: data.handleNumbers
            });
            // We want to make sure we pushed the listeners in the listener list rather than creating
            // a new one as it has already been passed to the event handlers.
            listeners.push.apply(listeners, moveEvent.concat(endEvent, outEvent));
            // Text selection isn't an issue on touch devices,
            // so adding cursor styles can be skipped.
            if (event.cursor) {
                // Prevent the 'I' cursor and extend the range-drag cursor.
                scope_Body.style.cursor = getComputedStyle(event.target).cursor;
                // Mark the target with a dragging state.
                if (scope_Handles.length > 1) {
                    addClass(scope_Target, options.cssClasses.drag);
                }
                // Prevent text selection when dragging the handles.
                // In noUiSlider <= 9.2.0, this was handled by calling preventDefault on mouse/touch start/move,
                // which is scroll blocking. The selectstart event is supported by FireFox starting from version 52,
                // meaning the only holdout is iOS Safari. This doesn't matter: text selection isn't triggered there.
                // The 'cursor' flag is false.
                // See: http://caniuse.com/#search=selectstart
                scope_Body.addEventListener("selectstart", preventDefault, false);
            }
            data.handleNumbers.forEach(function (handleNumber) {
                fireEvent("start", handleNumber);
            });
        }
        // Move closest handle to tapped location.
        function eventTap(event) {
            // The tap event shouldn't propagate up
            event.stopPropagation();
            var proposal = calcPointToPercentage(event.calcPoint);
            var handleNumber = getClosestHandle(proposal);
            // Tackle the case that all handles are 'disabled'.
            if (handleNumber === false) {
                return false;
            }
            // Flag the slider as it is now in a transitional state.
            // Transition takes a configurable amount of ms (default 300). Re-enable the slider after that.
            if (!options.events.snap) {
                addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
            }
            setHandle(handleNumber, proposal, true, true);
            setZindex();
            fireEvent("slide", handleNumber, true);
            fireEvent("update", handleNumber, true);
            fireEvent("change", handleNumber, true);
            fireEvent("set", handleNumber, true);
            if (options.events.snap) {
                eventStart(event, { handleNumbers: [handleNumber] });
            }
        }
        // Fires a 'hover' event for a hovered mouse/pen position.
        function eventHover(event) {
            var proposal = calcPointToPercentage(event.calcPoint);
            var to = scope_Spectrum.getStep(proposal);
            var value = scope_Spectrum.fromStepping(to);
            Object.keys(scope_Events).forEach(function (targetEvent) {
                if ("hover" === targetEvent.split(".")[0]) {
                    scope_Events[targetEvent].forEach(function (callback) {
                        callback.call(scope_Self, value);
                    });
                }
            });
        }
        // Handles keydown on focused handles
        // Don't move the document when pressing arrow keys on focused handles
        function eventKeydown(event, handleNumber) {
            if (isSliderDisabled() || isHandleDisabled(handleNumber)) {
                return false;
            }
            var horizontalKeys = ["Left", "Right"];
            var verticalKeys = ["Down", "Up"];
            var largeStepKeys = ["PageDown", "PageUp"];
            var edgeKeys = ["Home", "End"];
            if (options.dir && !options.ort) {
                // On an right-to-left slider, the left and right keys act inverted
                horizontalKeys.reverse();
            } else if (options.ort && !options.dir) {
                // On a top-to-bottom slider, the up and down keys act inverted
                verticalKeys.reverse();
                largeStepKeys.reverse();
            }
            // Strip "Arrow" for IE compatibility. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
            var key = event.key.replace("Arrow", "");
            var isLargeDown = key === largeStepKeys[0];
            var isLargeUp = key === largeStepKeys[1];
            var isDown = key === verticalKeys[0] || key === horizontalKeys[0] || isLargeDown;
            var isUp = key === verticalKeys[1] || key === horizontalKeys[1] || isLargeUp;
            var isMin = key === edgeKeys[0];
            var isMax = key === edgeKeys[1];
            if (!isDown && !isUp && !isMin && !isMax) {
                return true;
            }
            event.preventDefault();
            var to;
            if (isUp || isDown) {
                var multiplier = options.keyboardPageMultiplier;
                var direction = isDown ? 0 : 1;
                var steps = getNextStepsForHandle(handleNumber);
                var step = steps[direction];
                // At the edge of a slider, do nothing
                if (step === null) {
                    return false;
                }
                // No step set, use the default of 10% of the sub-range
                if (step === false) {
                    step = scope_Spectrum.getDefaultStep(scope_Locations[handleNumber], isDown, options.keyboardDefaultStep);
                }
                if (isLargeUp || isLargeDown) {
                    step *= multiplier;
                }
                // Step over zero-length ranges (#948);
                step = Math.max(step, 0.0000001);
                // Decrement for down steps
                step = (isDown ? -1 : 1) * step;
                to = scope_Values[handleNumber] + step;
            } else if (isMax) {
                // End key
                to = options.spectrum.xVal[options.spectrum.xVal.length - 1];
            } else {
                // Home key
                to = options.spectrum.xVal[0];
            }
            setHandle(handleNumber, scope_Spectrum.toStepping(to), true, true);
            fireEvent("slide", handleNumber);
            fireEvent("update", handleNumber);
            fireEvent("change", handleNumber);
            fireEvent("set", handleNumber);
            return false;
        }
        // Attach events to several slider parts.
        function bindSliderEvents(behaviour) {
            // Attach the standard drag event to the handles.
            if (!behaviour.fixed) {
                scope_Handles.forEach(function (handle, index) {
                    // These events are only bound to the visual handle
                    // element, not the 'real' origin element.
                    attachEvent(actions.start, handle.children[0], eventStart, {
                        handleNumbers: [index]
                    });
                });
            }
            // Attach the tap event to the slider base.
            if (behaviour.tap) {
                attachEvent(actions.start, scope_Base, eventTap, {});
            }
            // Fire hover events
            if (behaviour.hover) {
                attachEvent(actions.move, scope_Base, eventHover, {
                    hover: true
                });
            }
            // Make the range draggable.
            if (behaviour.drag) {
                scope_Connects.forEach(function (connect, index) {
                    if (connect === false || index === 0 || index === scope_Connects.length - 1) {
                        return;
                    }
                    var handleBefore = scope_Handles[index - 1];
                    var handleAfter = scope_Handles[index];
                    var eventHolders = [connect];
                    addClass(connect, options.cssClasses.draggable);
                    // When the range is fixed, the entire range can
                    // be dragged by the handles. The handle in the first
                    // origin will propagate the start event upward,
                    // but it needs to be bound manually on the other.
                    if (behaviour.fixed) {
                        eventHolders.push(handleBefore.children[0]);
                        eventHolders.push(handleAfter.children[0]);
                    }
                    eventHolders.forEach(function (eventHolder) {
                        attachEvent(actions.start, eventHolder, eventStart, {
                            handles: [handleBefore, handleAfter],
                            handleNumbers: [index - 1, index]
                        });
                    });
                });
            }
        }
        // Attach an event to this slider, possibly including a namespace
        function bindEvent(namespacedEvent, callback) {
            scope_Events[namespacedEvent] = scope_Events[namespacedEvent] || [];
            scope_Events[namespacedEvent].push(callback);
            // If the event bound is 'update,' fire it immediately for all handles.
            if (namespacedEvent.split(".")[0] === "update") {
                scope_Handles.forEach(function (a, index) {
                    fireEvent("update", index);
                });
            }
        }
        function isInternalNamespace(namespace) {
            return namespace === INTERNAL_EVENT_NS.aria || namespace === INTERNAL_EVENT_NS.tooltips;
        }
        // Undo attachment of event
        function removeEvent(namespacedEvent) {
            var event = namespacedEvent && namespacedEvent.split(".")[0];
            var namespace = event ? namespacedEvent.substring(event.length) : namespacedEvent;
            Object.keys(scope_Events).forEach(function (bind) {
                var tEvent = bind.split(".")[0];
                var tNamespace = bind.substring(tEvent.length);
                if ((!event || event === tEvent) && (!namespace || namespace === tNamespace)) {
                    // only delete protected internal event if intentional
                    if (!isInternalNamespace(tNamespace) || namespace === tNamespace) {
                        delete scope_Events[bind];
                    }
                }
            });
        }
        // External event handling
        function fireEvent(eventName, handleNumber, tap) {
            Object.keys(scope_Events).forEach(function (targetEvent) {
                var eventType = targetEvent.split(".")[0];
                if (eventName === eventType) {
                    scope_Events[targetEvent].forEach(function (callback) {
                        callback.call(
                        // Use the slider public API as the scope ('this')
                        scope_Self,
                        // Return values as array, so arg_1[arg_2] is always valid.
                        scope_Values.map(options.format.to),
                        // Handle index, 0 or 1
                        handleNumber,
                        // Un-formatted slider values
                        scope_Values.slice(),
                        // Event is fired by tap, true or false
                        tap || false,
                        // Left offset of the handle, in relation to the slider
                        scope_Locations.slice(),
                        // add the slider public API to an accessible parameter when this is unavailable
                        scope_Self);
                    });
                }
            });
        }
        // Split out the handle positioning logic so the Move event can use it, too
        function checkHandlePosition(reference, handleNumber, to, lookBackward, lookForward, getValue) {
            var distance;
            // For sliders with multiple handles, limit movement to the other handle.
            // Apply the margin option by adding it to the handle positions.
            if (scope_Handles.length > 1 && !options.events.unconstrained) {
                if (lookBackward && handleNumber > 0) {
                    distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.margin, 0);
                    to = Math.max(to, distance);
                }
                if (lookForward && handleNumber < scope_Handles.length - 1) {
                    distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.margin, 1);
                    to = Math.min(to, distance);
                }
            }
            // The limit option has the opposite effect, limiting handles to a
            // maximum distance from another. Limit must be > 0, as otherwise
            // handles would be unmovable.
            if (scope_Handles.length > 1 && options.limit) {
                if (lookBackward && handleNumber > 0) {
                    distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.limit, 0);
                    to = Math.min(to, distance);
                }
                if (lookForward && handleNumber < scope_Handles.length - 1) {
                    distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.limit, 1);
                    to = Math.max(to, distance);
                }
            }
            // The padding option keeps the handles a certain distance from the
            // edges of the slider. Padding must be > 0.
            if (options.padding) {
                if (handleNumber === 0) {
                    distance = scope_Spectrum.getAbsoluteDistance(0, options.padding[0], 0);
                    to = Math.max(to, distance);
                }
                if (handleNumber === scope_Handles.length - 1) {
                    distance = scope_Spectrum.getAbsoluteDistance(100, options.padding[1], 1);
                    to = Math.min(to, distance);
                }
            }
            to = scope_Spectrum.getStep(to);
            // Limit percentage to the 0 - 100 range
            to = limit(to);
            // Return false if handle can't move
            if (to === reference[handleNumber] && !getValue) {
                return false;
            }
            return to;
        }
        // Uses slider orientation to create CSS rules. a = base value;
        function inRuleOrder(v, a) {
            var o = options.ort;
            return (o ? a : v) + ", " + (o ? v : a);
        }
        // Moves handle(s) by a percentage
        // (bool, % to move, [% where handle started, ...], [index in scope_Handles, ...])
        function moveHandles(upward, proposal, locations, handleNumbers) {
            var proposals = locations.slice();
            var b = [!upward, upward];
            var f = [upward, !upward];
            // Copy handleNumbers so we don't change the dataset
            handleNumbers = handleNumbers.slice();
            // Check to see which handle is 'leading'.
            // If that one can't move the second can't either.
            if (upward) {
                handleNumbers.reverse();
            }
            // Step 1: get the maximum percentage that any of the handles can move
            if (handleNumbers.length > 1) {
                handleNumbers.forEach(function (handleNumber, o) {
                    var to = checkHandlePosition(proposals, handleNumber, proposals[handleNumber] + proposal, b[o], f[o], false);
                    // Stop if one of the handles can't move.
                    if (to === false) {
                        proposal = 0;
                    } else {
                        proposal = to - proposals[handleNumber];
                        proposals[handleNumber] = to;
                    }
                });
            }
            // If using one handle, check backward AND forward
            else {
                    b = f = [true];
                }
            var state = false;
            // Step 2: Try to set the handles with the found percentage
            handleNumbers.forEach(function (handleNumber, o) {
                state = setHandle(handleNumber, locations[handleNumber] + proposal, b[o], f[o]) || state;
            });
            // Step 3: If a handle moved, fire events
            if (state) {
                handleNumbers.forEach(function (handleNumber) {
                    fireEvent("update", handleNumber);
                    fireEvent("slide", handleNumber);
                });
            }
        }
        // Takes a base value and an offset. This offset is used for the connect bar size.
        // In the initial design for this feature, the origin element was 1% wide.
        // Unfortunately, a rounding bug in Chrome makes it impossible to implement this feature
        // in this manner: https://bugs.chromium.org/p/chromium/issues/detail?id=798223
        function transformDirection(a, b) {
            return options.dir ? 100 - a - b : a;
        }
        // Updates scope_Locations and scope_Values, updates visual state
        function updateHandlePosition(handleNumber, to) {
            // Update locations.
            scope_Locations[handleNumber] = to;
            // Convert the value to the slider stepping/range.
            scope_Values[handleNumber] = scope_Spectrum.fromStepping(to);
            var translation = 10 * (transformDirection(to, 0) - scope_DirOffset);
            var translateRule = "translate(" + inRuleOrder(translation + "%", "0") + ")";
            scope_Handles[handleNumber].style[options.transformRule] = translateRule;
            updateConnect(handleNumber);
            updateConnect(handleNumber + 1);
        }
        // Handles before the slider middle are stacked later = higher,
        // Handles after the middle later is lower
        // [[7] [8] .......... | .......... [5] [4]
        function setZindex() {
            scope_HandleNumbers.forEach(function (handleNumber) {
                var dir = scope_Locations[handleNumber] > 50 ? -1 : 1;
                var zIndex = 3 + (scope_Handles.length + dir * handleNumber);
                scope_Handles[handleNumber].style.zIndex = zIndex;
            });
        }
        // Test suggested values and apply margin, step.
        // if exactInput is true, don't run checkHandlePosition, then the handle can be placed in between steps (#436)
        function setHandle(handleNumber, to, lookBackward, lookForward, exactInput) {
            if (!exactInput) {
                to = checkHandlePosition(scope_Locations, handleNumber, to, lookBackward, lookForward, false);
            }
            if (to === false) {
                return false;
            }
            updateHandlePosition(handleNumber, to);
            return true;
        }
        // Updates style attribute for connect nodes
        function updateConnect(index) {
            // Skip connects set to false
            if (!scope_Connects[index]) {
                return;
            }
            var l = 0;
            var h = 100;
            if (index !== 0) {
                l = scope_Locations[index - 1];
            }
            if (index !== scope_Connects.length - 1) {
                h = scope_Locations[index];
            }
            // We use two rules:
            // 'translate' to change the left/top offset;
            // 'scale' to change the width of the element;
            // As the element has a width of 100%, a translation of 100% is equal to 100% of the parent (.noUi-base)
            var connectWidth = h - l;
            var translateRule = "translate(" + inRuleOrder(transformDirection(l, connectWidth) + "%", "0") + ")";
            var scaleRule = "scale(" + inRuleOrder(connectWidth / 100, "1") + ")";
            scope_Connects[index].style[options.transformRule] = translateRule + " " + scaleRule;
        }
        // Parses value passed to .set method. Returns current value if not parse-able.
        function resolveToValue(to, handleNumber) {
            // Setting with null indicates an 'ignore'.
            // Inputting 'false' is invalid.
            if (to === null || to === false || to === undefined) {
                return scope_Locations[handleNumber];
            }
            // If a formatted number was passed, attempt to decode it.
            if (typeof to === "number") {
                to = String(to);
            }
            to = options.format.from(to);
            to = scope_Spectrum.toStepping(to);
            // If parsing the number failed, use the current value.
            if (to === false || isNaN(to)) {
                return scope_Locations[handleNumber];
            }
            return to;
        }
        // Set the slider value.
        function valueSet(input, fireSetEvent, exactInput) {
            var values = asArray(input);
            var isInit = scope_Locations[0] === undefined;
            // Event fires by default
            fireSetEvent = fireSetEvent === undefined ? true : !!fireSetEvent;
            // Animation is optional.
            // Make sure the initial values were set before using animated placement.
            if (options.animate && !isInit) {
                addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
            }
            // First pass, without lookAhead but with lookBackward. Values are set from left to right.
            scope_HandleNumbers.forEach(function (handleNumber) {
                setHandle(handleNumber, resolveToValue(values[handleNumber], handleNumber), true, false, exactInput);
            });
            var i = scope_HandleNumbers.length === 1 ? 0 : 1;
            // Secondary passes. Now that all base values are set, apply constraints.
            // Iterate all handles to ensure constraints are applied for the entire slider (Issue #1009)
            for (; i < scope_HandleNumbers.length; ++i) {
                scope_HandleNumbers.forEach(function (handleNumber) {
                    setHandle(handleNumber, scope_Locations[handleNumber], true, true, exactInput);
                });
            }
            setZindex();
            scope_HandleNumbers.forEach(function (handleNumber) {
                fireEvent("update", handleNumber);
                // Fire the event only for handles that received a new value, as per #579
                if (values[handleNumber] !== null && fireSetEvent) {
                    fireEvent("set", handleNumber);
                }
            });
        }
        // Reset slider to initial values
        function valueReset(fireSetEvent) {
            valueSet(options.start, fireSetEvent);
        }
        // Set value for a single handle
        function valueSetHandle(handleNumber, value, fireSetEvent, exactInput) {
            // Ensure numeric input
            handleNumber = Number(handleNumber);
            if (!(handleNumber >= 0 && handleNumber < scope_HandleNumbers.length)) {
                throw new Error("noUiSlider (" + VERSION + "): invalid handle number, got: " + handleNumber);
            }
            // Look both backward and forward, since we don't want this handle to "push" other handles (#960);
            // The exactInput argument can be used to ignore slider stepping (#436)
            setHandle(handleNumber, resolveToValue(value, handleNumber), true, true, exactInput);
            fireEvent("update", handleNumber);
            if (fireSetEvent) {
                fireEvent("set", handleNumber);
            }
        }
        // Get the slider value.
        function valueGet() {
            var values = scope_Values.map(options.format.to);
            // If only one handle is used, return a single value.
            if (values.length === 1) {
                return values[0];
            }
            return values;
        }
        // Removes classes from the root and empties it.
        function destroy() {
            // remove protected internal listeners
            removeEvent(INTERNAL_EVENT_NS.aria);
            removeEvent(INTERNAL_EVENT_NS.tooltips);
            for (var key in options.cssClasses) {
                if (!options.cssClasses.hasOwnProperty(key)) {
                    continue;
                }
                removeClass(scope_Target, options.cssClasses[key]);
            }
            while (scope_Target.firstChild) {
                scope_Target.removeChild(scope_Target.firstChild);
            }
            delete scope_Target.noUiSlider;
        }
        function getNextStepsForHandle(handleNumber) {
            var location = scope_Locations[handleNumber];
            var nearbySteps = scope_Spectrum.getNearbySteps(location);
            var value = scope_Values[handleNumber];
            var increment = nearbySteps.thisStep.step;
            var decrement = null;
            // If snapped, directly use defined step value
            if (options.snap) {
                return [value - nearbySteps.stepBefore.startValue || null, nearbySteps.stepAfter.startValue - value || null];
            }
            // If the next value in this step moves into the next step,
            // the increment is the start of the next step - the current value
            if (increment !== false) {
                if (value + increment > nearbySteps.stepAfter.startValue) {
                    increment = nearbySteps.stepAfter.startValue - value;
                }
            }
            // If the value is beyond the starting point
            if (value > nearbySteps.thisStep.startValue) {
                decrement = nearbySteps.thisStep.step;
            } else if (nearbySteps.stepBefore.step === false) {
                decrement = false;
            }
            // If a handle is at the start of a step, it always steps back into the previous step first
            else {
                    decrement = value - nearbySteps.stepBefore.highestStep;
                }
            // Now, if at the slider edges, there is no in/decrement
            if (location === 100) {
                increment = null;
            } else if (location === 0) {
                decrement = null;
            }
            // As per #391, the comparison for the decrement step can have some rounding issues.
            var stepDecimals = scope_Spectrum.countStepDecimals();
            // Round per #391
            if (increment !== null && increment !== false) {
                increment = Number(increment.toFixed(stepDecimals));
            }
            if (decrement !== null && decrement !== false) {
                decrement = Number(decrement.toFixed(stepDecimals));
            }
            return [decrement, increment];
        }
        // Get the current step size for the slider.
        function getNextSteps() {
            return scope_HandleNumbers.map(getNextStepsForHandle);
        }
        // Updateable: margin, limit, padding, step, range, animate, snap
        function updateOptions(optionsToUpdate, fireSetEvent) {
            // Spectrum is created using the range, snap, direction and step options.
            // 'snap' and 'step' can be updated.
            // If 'snap' and 'step' are not passed, they should remain unchanged.
            var v = valueGet();
            var updateAble = ["margin", "limit", "padding", "range", "animate", "snap", "step", "format", "pips", "tooltips"];
            // Only change options that we're actually passed to update.
            updateAble.forEach(function (name) {
                // Check for undefined. null removes the value.
                if (optionsToUpdate[name] !== undefined) {
                    originalOptions[name] = optionsToUpdate[name];
                }
            });
            var newOptions = testOptions(originalOptions);
            // Load new options into the slider state
            updateAble.forEach(function (name) {
                if (optionsToUpdate[name] !== undefined) {
                    options[name] = newOptions[name];
                }
            });
            scope_Spectrum = newOptions.spectrum;
            // Limit, margin and padding depend on the spectrum but are stored outside of it. (#677)
            options.margin = newOptions.margin;
            options.limit = newOptions.limit;
            options.padding = newOptions.padding;
            // Update pips, removes existing.
            if (options.pips) {
                pips(options.pips);
            } else {
                removePips();
            }
            // Update tooltips, removes existing.
            if (options.tooltips) {
                tooltips();
            } else {
                removeTooltips();
            }
            // Invalidate the current positioning so valueSet forces an update.
            scope_Locations = [];
            valueSet(isSet(optionsToUpdate.start) ? optionsToUpdate.start : v, fireSetEvent);
        }
        // Initialization steps
        function setupSlider() {
            // Create the base element, initialize HTML and set classes.
            // Add handles and connect elements.
            scope_Base = addSlider(scope_Target);
            addElements(options.connect, scope_Base);
            // Attach user events.
            bindSliderEvents(options.events);
            // Use the public value method to set the start values.
            valueSet(options.start);
            if (options.pips) {
                pips(options.pips);
            }
            if (options.tooltips) {
                tooltips();
            }
            aria();
        }
        setupSlider();
        // noinspection JSUnusedGlobalSymbols
        scope_Self = {
            destroy: destroy,
            steps: getNextSteps,
            on: bindEvent,
            off: removeEvent,
            get: valueGet,
            set: valueSet,
            setHandle: valueSetHandle,
            reset: valueReset,
            // Exposed for unit testing, don't use this in your application.
            __moveHandles: function __moveHandles(a, b, c) {
                moveHandles(a, b, scope_Locations, c);
            },
            options: originalOptions,
            updateOptions: updateOptions,
            target: scope_Target,
            removePips: removePips,
            removeTooltips: removeTooltips,
            getTooltips: function getTooltips() {
                return scope_Tooltips;
            },
            getOrigins: function getOrigins() {
                return scope_Handles;
            },
            pips: pips // Issue #594
        };
        return scope_Self;
    }
    // Run the standard initializer
    function initialize(target, originalOptions) {
        if (!target || !target.nodeName) {
            throw new Error("noUiSlider (" + VERSION + "): create requires a single element, got: " + target);
        }
        // Throw an error if the slider was already initialized.
        if (target.noUiSlider) {
            throw new Error("noUiSlider (" + VERSION + "): Slider was already initialized.");
        }
        // Test the options and create the slider environment;
        var options = testOptions(originalOptions);
        var api = scope(target, options, originalOptions);
        target.noUiSlider = api;
        return api;
    }
    // Use an object instead of a function for future expandability;
    return {
        // Exposed for unit testing, don't use this in your application.
        __spectrum: Spectrum,
        version: VERSION,
        // A reference to the default classes, allows global changes.
        // Use the cssClasses option for changes to one slider.
        cssClasses: cssClasses,
        create: initialize
    };
});
"use strict";

// a class to handle building the stat tickers
if (!nwdsi) nwdsi = {};

nwdsi.statTicker = function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  $ = jQuery;

  var defaults = {
    element: '.stat-ticker',
    options: {
      "top_stroke": "#003ca5",
      "bottom_stroke": "#bbeaff",
      "top_fill": "#003ca5",
      "bottom_fill": "#bbeaff",
      "tickerduration": 100
    }
    // handle the assigning/extending of the defaults if no config object
  };var assigned = $.extend(true, {}, defaults, config);

  // set the rest of the global variables
  var $ticker = assigned.element;
  var tickernumber = assigned.options.tickernumber;
  var tickerduration = assigned.options.tickerduration;
  var tickerprefix = assigned.options.tickerprefix;
  var tickersuffix = assigned.options.tickersuffix;
  var tickerstyle = assigned.options.tickerstyle;
  var tickericon = assigned.options.tickericon;
  var tickercolor = assigned.options.tickercolor;
  var tickervariant = assigned.options.tickervariant;
  var ctx = assigned.overlay;
  var ctx2 = assigned.underlay;
  var $title = assigned.options.title;
  var $canvas = $ticker.find('canvas');

  // The following is being done server side now
  // parse the tickernuumber feild checking the first and last feilds
  // if letters exist store them as suffix and prefix respectively
  // const firstChar = tickernumber.charAt(0);
  // const lastChar = tickernumber.slice(-1);
  // let noPrefix = (firstChar >= '0' && firstChar <= '9');
  // let noSuffix = (lastChar >= '0' && lastChar <= '9');
  //
  // if(!noPrefix){
  //   tickerprefix = firstChar;
  //   tickernumber = tickernumber.substr(1);
  // }
  // if(!noSuffix){
  //   tickersuffix  = lastChar;
  //   tickernumber = tickernumber.slice(0, -1);
  // }

  var isDecimal = tickernumber % 1 != 0 ? true : false;
  // assign colors if different from default
  if (tickercolor === 'purple') {
    assigned.options.top_fill = "#5c0b8a";
    assigned.options.top_stroke = "rgb(159,41,181)";
    assigned.options.bottom_fill = "rgb(189,131,202)";
    assigned.options.bottom_stroke = "rgb(189,131,202)";
  }
  if (tickercolor === 'blue' && tickervariant === 'icon') {
    assigned.options.top_fill = "#003ca5";
    assigned.options.top_stroke = "#009adf";
    assigned.options.bottom_fill = "#6dc3e7";
    assigned.options.bottom_stroke = "#6dc3e7";
  }

  // get the window size options
  var getWindowWidthOptions = function getWindowWidthOptions() {

    if (tickervariant === 'icon') {
      if ($(window).width() < 768) {
        // console.log('this screen is less than 768 width');
        return {
          "arc": { "x": 76, "y": 76, "r": 58 },
          "cw": 150,
          "ch": 210,
          "fontPos": 90,
          "fontStyle": "normal normal bold 22pt arial, sans-serif",
          "lineWidth": 10,
          "titlePos": "86px",
          "titleSize": "16px",
          "titleWidth": "150px"
        };
      } else if ($(window).width() < 992) {
        // console.log('this screen is less than 992 width');
        return {
          "arc": { "x": 74, "y": 74, "r": 60 },
          "fontStyle": "normal normal bold 22pt arial, sans-serif", //normal normal bold 30pt arial, sans-serif
          "titlePos": "36px",
          "titleSize": "16px",
          "titleWidth": "150px",
          "fontPos": 90,
          "cw": 150,
          "ch": 284,
          "lineWidth": 8
        };
      } else if ($(window).width() < 1200) {
        // console.log('this screen is less than 1200 width');
        return {
          "arc": { "x": 118, "y": 118, "r": 80 },
          "fontStyle": "normal normal bold 24pt arial, sans-serif",
          "titlePos": "125px",
          "titleSize": "18px",
          "titleWidth": "215px",
          "fontPos": 120,
          "cw": 235,
          "ch": 410,
          "lineWidth": 12
        };
      } else {
        return {
          "arc": { "x": 116, "y": 116, "r": 100 },
          "fontStyle": "normal normal bold 30pt arial, sans-serif",
          "titlePos": "166px",
          "titleSize": "20px",
          "titleWidth": "235px",
          "fontPos": 140,
          "cw": 235,
          "ch": 460,
          "lineWidth": 12
        };
      }
    } else {
      if ($(window).width() < 768) {
        // console.log('this screen is less than 768 width');
        return {
          "arc": { "x": 76, "y": 76, "r": 64 },
          "cw": 150,
          "ch": 150,
          "fontPos": -8,
          "fontStyle": "normal normal normal 30pt 'TheSans',sans-serif",
          "lineWidth": 8,
          "titlePos": "86px",
          "titleSize": "12px",
          "titleWidth": "100px"
        };
      } else if ($(window).width() < 992) {
        // console.log('this screen is less than 992 width');
        return {
          "arc": { "x": 76, "y": 76, "r": 64 },
          "fontStyle": "normal normal normal 30pt 'TheSans',sans-serif",
          "titlePos": "86px",
          "titleSize": "12px",
          "titleWidth": "100px",
          "fontPos": -8,
          "cw": 150,
          "ch": 150,
          "lineWidth": 8
        };
      } else if ($(window).width() < 1200) {
        // console.log('this screen is less than 1200 width');
        return {
          "arc": { "x": 124, "y": 124, "r": 100 },
          "fontStyle": "normal normal normal 44pt 'TheSans',sans-serif",
          "titlePos": "150px",
          "titleSize": "16px",
          "titleWidth": "150px",
          "fontPos": -20,
          "cw": 250,
          "ch": 250,
          "lineWidth": 12
        };
      } else {
        return {
          "arc": { "x": 126, "y": 126, "r": 116 },
          "fontStyle": "normal normal normal 50pt 'TheSans',sans-serif",
          "titlePos": "156px",
          "titleSize": "20px",
          "titleWidth": "180px",
          "fontPos": -5,
          "cw": 250,
          "ch": 250,
          "lineWidth": 12
        };
      }
    }
  };

  var setStaticTickers = function setStaticTickers() {
    // reset tickers w/out animation if window is mobile or window resized and animation is already run
    // get window options
    var windowOptions = getWindowWidthOptions();

    $ticker.not('.show-ticker').addClass('show-ticker');
    var cw = windowOptions.cw;
    var ch = windowOptions.ch;
    // const $title = $ticker.find('.stat-ticker__text');
    var $canvas = $ticker.find('canvas');
    $canvas.attr("width", cw);
    $canvas.attr("height", ch);
    $ticker.width(cw);
    $ticker.height(ch);
    $title.css({ 'padding-top': windowOptions.titlePos, 'font-size': windowOptions.titleSize, 'width': windowOptions.titleWidth, "line-height": windowOptions.titleSize + 2 });
    // create background white circle for icon version
    if (tickervariant === 'icon') {
      var ctx3 = assigned.bg;
      ctx3.beginPath();
      ctx3.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, 0, 2 * Math.PI, false);
      ctx3.fillStyle = 'rgba(255,255,255, 0.5)';
      ctx3.fill();
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.lineWidth = windowOptions.lineWidth;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = windowOptions.fontStyle;
    ctx.strokeStyle = assigned.options.top_stroke;
    ctx.fillStyle = assigned.options.top_fill;
    var halfctxwidth = cw * .5;
    var formattedNumber = tickernumber;
    // check if the number is greater than 999 if so add a comma
    if (tickernumber.length > 3) formattedNumber = tickernumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    ctx.fillText(tickerprefix + formattedNumber + tickersuffix, halfctxwidth, halfctxwidth + windowOptions.fontPos, cw);
    ctx.beginPath();
    ctx.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, 0, Math.PI * 2, true);
    ctx.stroke();
  };

  var showTickers = function showTickers() {
    // get window options
    var windowOptions = getWindowWidthOptions();

    var al = 0;
    var al2 = 0;
    var start = 4.72;
    var cw = windowOptions.cw;
    var ch = windowOptions.ch;
    var diff = void 0;
    var sim = void 0;
    var stopAnimation = false;
    var $title = assigned.options.title;
    var $canvas = $ticker.find('canvas');
    $canvas.attr("width", cw);
    $canvas.attr("height", ch);
    $ticker.width(cw);
    $ticker.height(ch);
    $title.css({ 'padding-top': windowOptions.titlePos, 'font-size': windowOptions.titleSize, 'width': windowOptions.titleWidth, "line-height": windowOptions.titleSize + 2 });

    // create background white circle for icon version
    if (tickervariant === 'icon') {
      var progressSim2 = function progressSim2() {
        diff = al2 / tickernumber * Math.PI * 2 * 10;
        ctx2.clearRect(0, 0, cw, ch);
        ctx2.lineWidth = windowOptions.lineWidth;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.font = windowOptions.fontStyle;
        ctx2.strokeStyle = assigned.options.bottom_stroke;
        var halfctxwidth = cw * .5;
        var decimal = al2;
        var roundNumber = parseInt(decimal.toFixed(2));
        var formattedNumber = roundNumber;
        if (formattedNumber > al2) formattedNumber = tickernumber;
        ctx2.beginPath();
        ctx2.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, start, diff / 10 + start, false);
        ctx2.stroke();

        if (roundNumber >= tickernumber || stopAnimation) {
          cancelAnimationFrame(sim2);
          return;
        }
        al2 = al2 + Number(durationIncr);

        sim2 = requestAnimationFrame(progressSim2);
      };

      var progressSim = function progressSim() {
        diff = al / tickernumber * Math.PI * 2 * 10;
        ctx.clearRect(0, 0, cw, ch);
        ctx.lineWidth = windowOptions.lineWidth;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = windowOptions.fontStyle;
        ctx.strokeStyle = assigned.options.top_stroke;
        ctx.fillStyle = assigned.options.top_fill;
        var halfctxwidth = cw * .5;
        var decimal = al;
        var formattedNumber = void 0;
        var decimalizedNumber = void 0;
        var roundNumber = void 0;
        var end = diff / 10 + start;

        // if the number has a decimal place then deliver a decimal as the formatted number
        // otherwise deliver a whole number
        // currently only able to handle one decimal place

        if (isDecimal) {
          var numberDecimals = nwdsi.countDecimals(tickernumber);
          // parse the decimals to the length of the original
          decimalizedNumber = parseFloat(decimal).toFixed(numberDecimals);
          formattedNumber = decimalizedNumber;
        } else {
          roundNumber = parseInt(decimal.toFixed(2));
          formattedNumber = roundNumber;
          // if number is greater than 3 then add a comma
          if (tickernumber.length > 3 && !isDecimal) formattedNumber = formattedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        // convert decimalized number back to numeric and round up
        if (decimalizedNumber) decimalizedNumber = Math.round(parseFloat(decimalizedNumber) * 100) / 100;
        // check if decimal otherwise use rounded whole
        var compareNumber = decimalizedNumber ? decimalizedNumber : roundNumber;
        // deal with decimal compare
        end = compareNumber >= tickernumber ? Math.round(end) + .004 : end;
        // build circle and text
        ctx.fillText(tickerprefix + formattedNumber + tickersuffix, halfctxwidth, halfctxwidth + windowOptions.fontPos, cw);
        ctx.beginPath();
        ctx.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, start, end, false);
        ctx.stroke();

        if (compareNumber >= tickernumber || stopAnimation) {
          cancelAnimationFrame(sim);
          return;
        }

        al = al + Number(durationIncr);

        sim = requestAnimationFrame(progressSim);
      };

      var sim2 = void 0;
      var ctx3 = assigned.bg;
      ctx3.beginPath();
      ctx3.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, 0, 2 * Math.PI, false);
      ctx3.fillStyle = 'rgba(255,255,255, 0.5)';
      ctx3.fill();

      if (tickerstyle) {
        $ticker.removeClass('stat-ticker__style--' + tickerstyle);
        $ticker.addClass('stat-ticker__style--' + tickerstyle + '--animate');
      }
      var durationIncr = tickernumber / tickerduration;

      $ticker.addClass('show-ticker');
      sim2 = requestAnimationFrame(progressSim2);
      setTimeout(function () {
        sim = requestAnimationFrame(progressSim);
      }, 800);
      // if not icons variantion
    } else {
      var _progressSim = function _progressSim() {
        var durationIncr = tickernumber / tickerduration;
        diff = al / tickernumber * Math.PI * 2 * 10;
        ctx.clearRect(0, 0, cw, ch);
        ctx.lineWidth = windowOptions.lineWidth;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = windowOptions.fontStyle;
        ctx.strokeStyle = assigned.options.top_stroke;
        ctx.fillStyle = assigned.options.top_fill;
        var halfctxwidth = cw * .5;
        var decimal = al;
        var formattedNumber = void 0;
        var decimalizedNumber = void 0;
        var roundNumber = void 0;
        var end = diff / 10 + start;

        // if the number has a decimal place then deliver a decimal as the formatted number
        // otherwise deliver a whole number

        if (isDecimal) {
          var numberDecimals = nwdsi.countDecimals(tickernumber);
          // parse the decimals to the length of the original
          decimalizedNumber = parseFloat(decimal).toFixed(numberDecimals);
          formattedNumber = decimalizedNumber;
        } else {
          roundNumber = parseInt(decimal.toFixed(2));
          formattedNumber = roundNumber;
          // if number is greater than 3 then add a comma
          if (tickernumber.length > 3 && !isDecimal) formattedNumber = formattedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        // convert decimalized number back to numeric and round up
        if (decimalizedNumber) decimalizedNumber = Math.round(parseFloat(decimalizedNumber) * 100) / 100;
        // check if decimal otherwise use rounded whole
        var compareNumber = decimalizedNumber ? decimalizedNumber : roundNumber;
        // deal with decimal compare
        end = compareNumber >= tickernumber ? Math.round(end) + .004 : end;
        // build circle and text
        ctx.fillText(tickerprefix + formattedNumber + tickersuffix, halfctxwidth, halfctxwidth + windowOptions.fontPos, cw);
        ctx.beginPath();
        ctx.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, start, end, false);
        ctx.stroke();

        // check either the decimal or the whole number against the user entered tickernumber
        if (compareNumber >= tickernumber || stopAnimation) {
          cancelAnimationFrame(sim);
          return;
        }
        al = al + Number(durationIncr);

        sim = requestAnimationFrame(_progressSim);
      };

      ctx2.beginPath();
      ctx2.lineWidth = windowOptions.lineWidth;
      ctx2.fillStlye = assigned.options.bottom_fill;
      ctx2.strokeStyle = assigned.options.bottom_stroke;
      ctx2.arc(windowOptions.arc.x, windowOptions.arc.y, windowOptions.arc.r, 0, Math.PI * 2, true);
      ctx2.stroke();
      ctx2.closePath();
      if (tickerstyle) {
        $ticker.removeClass('stat-ticker__style--' + tickerstyle);
        $ticker.addClass('stat-ticker__style--' + tickerstyle + '--animate');
      }

      $ticker.addClass('show-ticker');
      sim = requestAnimationFrame(_progressSim);
    }
  };
  if (assigned.showOnlyStatic) {
    setStaticTickers();
  } else {
    showTickers();
    //   nwdsi.whenVisibleObserver({"selector":".stat-ticker-group","callback": showTickers, "callbackEvent": "inview", "options": {"rootMargin": "-50px"}})
  }
};

// for custom usage here is an example
// stat-ticker.js pattern uses a call like this:
// nwdsi.statTicker({}) TBD
'use strict';

nwdsi || (nwdsi = {});

nwdsi.triageBot = function () {
  var triageBotLinks = document.getElementsByClassName('enable_triage_bot_link');

  for (var i = 0; i < triageBotLinks.length; i++) {
    triageBotLinks[i].addEventListener("click", function (e) {
      e.preventDefault();
      window.Syllable.open('seeking_care');
      return false;
    });
  }
}();
'use strict';

(function accordionScript($, Drupal) {
  'use strict';

  Drupal.behaviors.accordion = {
    attach: function attach(context) {
      var $readMore = $('.btn-accordion', context);
      if ($readMore.length) {
        $readMore.on('click', function onReadMoreClick(event) {
          var $this = $(this);
          var target = '';
          event.preventDefault(); /* Prevents jumping to a named anchor */
          $this.html($this.text() === 'Read more' ? 'Read less<i class="fas fa-chevron-up">' : 'Read more<i class="fas fa-chevron-down">');
          $this.removeClass('read-less').removeClass('read-more').addClass($this.text() === 'Read more' ? 'read-more' : 'read-less');
          target = $this.data('target');
          jQuery(target).collapse('toggle'); /* Ensures the collapsing happens even if we're clicking on the icon */
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function mainThemeScript($, Drupal) {
  Drupal.behaviors.back_to_search = {
    attach: function attach(context) {
      var $back = $('.back-to-search', context);
      if ($back.length && $('#anchors-nav').length) {
        $back.toggleClass('back-to-search--with-anchor-nav', true);
      }
    }
  };
})(jQuery, Drupal);
"use strict";

/* global NProgress */
(function loadMoreArticles($, Drupal) {
  // Sample JSONs to return for AJAX call
  /*
  {
    status: "success",
    "ajax-action": "/boom/shaka/lection", // Updates AJAX pointer, i.e. bumps pagination
    "results": "...markup here..."
  }
   {
    status: "success",
    "ajax-action": false, // Will disable form
    "results": "...markup here..."
  }
  */

  var hook_class = ".js-load-more-articles";

  function load_more_articles(e) {
    var $form = $(this);
    var ajax_action = $form.attr("data-ajax-action");

    if (ajax_action) {
      e.preventDefault();
      // disable form
      var $button = $form.find(hook_class);
      $button.prop("disabled", true);

      // n progress start
      NProgress.start();

      // Better to keep one method to handle ajax promise than split them into
      // success, fail, error, or whatever. Less fragmentation of code and more
      // likelihood of us keeping the ball in our court.
      //
      // jqXHR.always documentation:
      // @link http://api.jquery.com/jquery.ajax/#jqXHR
      //
      // It's either .done or .fail, so the arguments can be either or.
      // i.e. [data, status, jqXHR] or [jqXHR, status, error]
      //
      // $.ajax({ url: ajax_action }).always(function (a, status, c) {
      // ^ status and c are never used
      $.ajax({ url: ajax_action }).always(function ajax_handler(data_or_jqXHR) {
        // if a is a jqXHR, this is a fail.
        // if c is a jqXHR, this is a success.

        var response = void 0;
        // let xhr;

        // jqXHR always provides .readyState for XHR backwards compatibility.
        if (data_or_jqXHR.readyState !== undefined) {
          // fail routine
          // xhr = a;
        } else {
          // success routine
          // xhr = c;
          response = data_or_jqXHR;
          // console.log('response? ', response);
        }

        // n progress stop
        NProgress.done();

        //
        // Content changes, if any
        //
        if (response.results) {
          // Tabindex and focus are for a11y
          // This way the user goes to the new content which precedes
          // instead of proceeds the button they just pressed.
          $('<div class="js-load-more-articles-result load-more-articles-result" tabindex="-1"></div>').html(response.results).insertBefore($form).focus();
        }

        //
        // Form changes, if any
        //

        // if ajax-endpoint === false, there are no more articles to retrieve.
        // Remove form.
        if (response["ajax-action"] === false) {
          $form.remove();
        } else {
          // Update endpoint if any
          if (response["ajax-action"]) {
            $form.attr("data-ajax-action", response["ajax-action"]);
          }
          // Re-enable form
          $button.prop("disabled", false);
        }
      });

      return false;
    }
  }

  Drupal.behaviors.load_more_articles = {
    attach: function attach(context) {
      var $buttons = $(hook_class, context);

      $buttons.each(function attach_load_more_article(i, button) {
        var $button = $(button);
        var $form = $button.parents("form");

        if ($form.length) {
          $form.on("submit", load_more_articles);
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/* global window */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * js/vendors/typeahead/_typeahead-init.js
 */

// DSI method of insertion
(function typeahead($, Drupal) {
  window.nwdsi.bloodhound = {
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace
  };

  var typeahead_focus_class = 'twitter-typeahead--focus';
  var typeahead_focus_timer = 0;
  var typeahead_blur_event = function typeahead_blur_event(e) {
    clearTimeout(typeahead_focus_timer);
    // Close is triggered by selecting a field, clicking out, tabbing out,
    // so in general it looks like when focus is lost.
    // However, when making a selection, focus is still retained, this is
    // the one case we don't want to detoggle the focus state.
    //
    // Sometimes tabbing out of the field after making a new selection triggers
    // change instead of close event. If it's already selected then sometimes
    // neither triggers.
    //
    // Nevermind the above. The idle event seems to be the blur we're looking for.
    var $field = $(this);
    // Time it so the accuracy between various possible triggers is more accurate.
    typeahead_focus_timer = setTimeout(function () {
      if (!$field.is(':focus')) {
        var $typeahead = $field.parents('.twitter-typeahead');
        $typeahead.toggleClass(typeahead_focus_class, false);
      }
    }, 15);
  };

  var typeahead_options = {
    classNames: {
      menu: 'tt-dropdown-menu'
    },
    hint: true,
    highlight: true,
    minLength: 3,
    events: {
      'typeahead:active': function typeaheadActive(e) {
        // The original input does not receive focus, so we can't apply :focus
        // styling on it. The interactive field cannot have styles eg background
        // modified so we use this event to apply a focus state to the parent.
        //console.log('typeahead:active');
        clearTimeout(typeahead_focus_timer);
        var $field = $(this);
        var $typeahead = $field.parents('.twitter-typeahead');
        $typeahead.toggleClass(typeahead_focus_class, true);
      },
      //'typeahead:change': function(e) {
      //  console.log('typehead:change');
      //  typeahead_blur_event.call(this, e);
      //},
      'typeahead:open': function typeaheadOpen(e) {
        //  console.log(this);
        //  console.log(this.id);
        var $self = $(this);
        $self.typeahead('val', $self.val());
      },
      'typeahead:idle': function typeaheadIdle(e) {
        //console.log('typeahead:idle: ');
        typeahead_blur_event.call(this, e);
      }
    }
  };

  Drupal.behaviors.typeahead = {
    attach: function attach(context) {
      // Old statics copy/paste begin

      /* !***** TYPEAHEAD ******* */
      // constructs the suggestion engine
      var $typeaheads = $('.typeahead', context);

      var $lat_field = $('#search-doctors-component-field-latitude');
      var $lon_field = $('#search-doctors-component-field-longitude');
      var $header_lat_field = $('#search-header-field-latitude');
      var $header_lon_field = $('#search-header-field-longitude');

      if ($typeaheads.length) {

        $typeaheads.each(function (i, typeahead_input) {

          // Build search engine
          var bloodhound_options = $.extend(true, {}, window.nwdsi.bloodhound);

          var remote = {
            url: '//api.northwell.edu/v1/suggester/suggest',
            wildcard: '%QUERY'
          };

          //var suggester = 'suggester_services';

          var query = {
            q: '%QUERY'
          };

          var location_iq = false;

          // Loop through all attributes for data-* attributes to build Bloodhound
          $.each(typeahead_input.attributes, function () {
            if (this.specified && /data-remote-/.test(this.name)) {
              var match = void 0;

              // Build url
              if (/data-remote-url/.test(this.name)) {
                remote.url = this.value;
              }

              // Build query object
              if (match = this.name.match(/data-remote-query-(.*)/)) {
                query[match[1]] = this.value;
              }

              //// Find the filter if any
              //if (/data-suggester/.test(this.name)) {
              //    suggester = this.value;
              //}
            }
            if (/data-variant/.test(this.name)) {
              remote.url = drupalSettings.locationiq.url_autocomplete;
              location_iq = true;
            }
          });

          var query_string = decodeURIComponent($.param(query));
          if (location_iq) {
            remote.url += '?' + 'key=' + drupalSettings.locationiq.autocomplete_map_token + '&' + query_string + '&viewbox=-74.7237%2C40.1607%2C-71.8009%2C41.7133&bounded=1&countrycodes=us&dedupe=1&tag=place%3Acity%2Cplace%3Atown%2Cplace%3Avillage%2Cplace%3Aneighbourhood%2Cplace%3Aquarter%2Cplace%3Asuburb%2Cplace%3Alocality%2Cplace%3Apostcode';
            remote.filter = function (re) {
              var formatted_results = re.map(function (suggestion) {
                return { value: suggestion.address.state && suggestion.address.postcode ? suggestion.address.name + ', ' + suggestion.address.state + ' ' + suggestion.address.postcode : suggestion.address.name, lat: suggestion.lat, lon: suggestion.lon };
              });

              return formatted_results;
            };
          } else {
            remote.url += '?' + query_string;
            remote.filter = function (re) {
              return re.response.results;
            };
          }

          bloodhound_options.remote = remote;

          var engine = new Bloodhound(bloodhound_options);
          var $input = $(typeahead_input);
          $input.data('nw_bloodhound', engine);
          $input.data('nw_bloodhound.options', bloodhound_options);

          var name = $input.attr('name');
          engine.initialize(); // this is supposed to happen on the constructor for Bloodhound, but perhaps our version doesn't have it

          // Initialize typeahead
          $input.typeahead(typeahead_options, {
            name: 'suggest_' + name,
            display: 'value',
            source: engine.ttAdapter(),
            templates: {
              suggestion: function suggestion(data) {
                //if there is on Url just print the data URL and value
                var selectOption = data.url ? '<div><span class="tt-suggestion__text" url="' + data.url + '">' + data.value + '</span></div>'
                //if there is no Url just print the value
                : '<div><span class="tt-suggestion__text">' + data.value + '</span></div>';
                return selectOption;
              }
            }
          });
        });
      }
      // submit on change
      var $typeahead_submit = $typeaheads.filter('.js-submit-on-change');
      var $typeahead_submit_url = $typeaheads.filter('.js-submit-on-change.js-submit-url');
      var $typeahead_no_submit_url = $typeaheads.parents('.twitter-typeahead').find('input');
      // if ($typeahead_submit.length) {
      //     // Automatically submit the form once a suggestion is selected
      //     $typeahead_submit.on('typeahead:select', function(e) {
      //         $(this).parents('form').get(0).submit();
      //     });
      // }
      if ($typeahead_submit_url.length) {
        // Automatically submit the form once a suggestion is selected using the url node
        $typeahead_submit_url.on('typeahead:select', function (e, selected_object, dataset) {
          var $typeahead_match_keys = selected_object.name + selected_object.value;
          // console.log($typeahead_match_keys);
          // matches the name & value keys called back from ajax response
          // checks for a match, then redirects to url using the url key from the ajax reponse
          if ($typeahead_match_keys) {
            window.location.href = selected_object.url;
          } else {
            return false;
          }
        });
      } else if ($typeahead_submit.length) {
        $typeahead_submit.on('typeahead:select', function (e, suggestion) {
          $lat_field.val(suggestion.lat);
          $lon_field.val(suggestion.lon);
          $header_lat_field.val(suggestion.lat);
          $header_lon_field.val(suggestion.lon);
          $typeahead_no_submit_url.removeClass('js-submit-url');
          $(this).parents('form').get(0).submit();
        });
      }

      // Assign events
      if ($typeaheads.length) {
        $.each(typeahead_options.events, function (event_name, event_handler) {
          $typeaheads.on(event_name, event_handler);
        });

        // There is no (easy) way to determine if the menu is open for Typeahead and then to style it accordingly....
        // so we create one. Booyah.
        var $typeahead_dropdowns = $typeaheads.parents('.twitter-typeahead').find('.tt-dropdown-menu');
        var watch_typeaheads = function watch_typeaheads() {
          clearInterval(_watch_typeaheads_timer);
          $typeahead_dropdowns.watch({
            'properties': 'display',
            callback: function callback(data, i) {
              var propChanged = data.props[i];
              var newValue = data.vals[i];
              if (propChanged === 'display') {
                var $typeahead_wrapper = $(this).parents('.twitter-typeahead');

                switch (newValue) {
                  case 'block':
                    if (!$typeahead_wrapper.hasClass('twitter-typeahead--open')) {
                      $typeahead_wrapper.addClass('twitter-typeahead--open');
                    }
                    break;

                  case 'none':
                    if ($typeahead_wrapper.hasClass('twitter-typeahead--open')) {
                      $typeahead_wrapper.removeClass('twitter-typeahead--open');
                    }
                    break;

                  default:
                    break;
                }
              }
            }
          });
        };

        var _watch_typeaheads_timer = setInterval(function () {
          if (typeof $.fn.watch !== 'undefined') {
            watch_typeaheads();
          }
        }, 100);
      }

      // end old statics copy/paste
      // continue DSI method of insertion
    }
  };
})(jQuery, Drupal, drupalSettings);
"use strict";

(function formElementsMarketoScript($, Drupal) {
  "use strict";

  Drupal.behaviors.formElementsMarketo = {
    attach: function attach(context) {
      var $marketoForm = $(".nwh-marketo-form", context);
      // marketo forms inject a lot of css and html so just
      // removing these elements and adding classes
      // makes it easier to style.
      // also the selects need custom styling so we need to add that
      if (!$marketoForm.length) return;
      // find utm_ params  
      var mktoFormURL = window.location.search.substring(1);
      var mktoFormVars = mktoFormURL.split('&');
      var mktoFormUTMs = {};
      for (var i = 0; i < mktoFormVars.length; i++) {
        var nameValue = mktoFormVars[i].split('=');
        var name = nameValue[0];
        var value = nameValue[1];
        if (name.toUpperCase().indexOf('UTM_') === 0) mktoFormUTMs[name] = value;
      }
      var $selects = void 0,
          $multiSelects = void 0,
          reachSuccess = false;
      // add onSubmitError library from: https://blog.teknkl.com/adding-a-network-server-error-handler-to-marketo-forms/
      // BEGIN ONSUBMITERROR library
      /*! @author Sanford Whiteman @license MIT */
      window.FormsPlus = window.FormsPlus || {
        allDescriptors: {},
        allMessages: {},
        detours: {}
      };

      FormsPlus.onSubmitError = function (cb) {
        var listenPending = true;

        MktoForms2.whenReady(function (form) {
          var sameOrigin = !window.MktoForms2XDIframe;
          if (sameOrigin) addSameOriginHandler(form);
          if (listenPending) listenErrors(cb, sameOrigin);
        });

        function listenErrors(cb, sameOrigin) {
          window.addEventListener("message", function (e) {
            var msg, allowedLoc, allowedOrigin;

            if (sameOrigin) {
              allowedLoc = document.location;
            } else {
              allowedLoc = document.createElement("A");
              allowedLoc.href = MktoForms2XDIframe.src;
            }

            allowedOrigin = getOrigin(allowedLoc);
            if (e.origin != allowedOrigin) return;

            try {
              msg = JSON.parse(e.data);
              if (msg.mktoResponse && msg.mktoResponse.error == true) {
                cb(msg.mktoResponse.data);
              }
            } catch (err) {}
          });

          listenPending = false;
        }

        function addSameOriginHandler(form) {
          if (!window.MutationObserver) {
            console.log("Cannot listen for named form errors in this browser.");
            return;
          }

          var formId = form.getId(),
              formEl = form.getFormElem()[0],
              submitEl = formEl.querySelector(".mktoButton"),
              observerConfig = {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ["disabled"]
          };

          var observer = new MutationObserver(function (mutations) {
            mutations.filter(function (mutation) {
              return mutation.oldValue == "disabled";
            }).forEach(function (mutation) {
              var data = {
                mktoResponse: {
                  error: true,
                  data: "Form ID " + formId
                }
              };

              var dataString = JSON.stringify(data),
                  targetOrigin = getOrigin(document.location);

              window.postMessage(dataString, targetOrigin);
            });
          });

          observer.observe(submitEl, observerConfig);
        }

        function getOrigin(loc) {
          return loc.origin || [loc.protocol, loc.host].join("//");
        }
      };
      // END ONSUBMITERROR library

      // create custom select dropdowns
      var initSelects = function initSelects() {
        var x, i, j, l, ll, selElmnt, a, b, c;
        /* Look for any elements with the class "has-select": */
        x = document.querySelectorAll(".has-select:not(.select-customized)");
        l = x.length;
        for (i = 0; i < l; i++) {
          selElmnt = x[i].getElementsByTagName("select")[0];
          // if selected index is less than 0 set to 0
          var selIndex = selElmnt.selectedIndex < 0 ? 0 : selElmnt.selectedIndex;
          ll = selElmnt.length;
          /* For each element, create a new DIV that will act as the selected item: */
          a = document.createElement("DIV");
          a.setAttribute("class", "mktoSelect-selected");
          a.setAttribute("tabindex", "0");
          a.innerHTML = selElmnt.options[selIndex].innerHTML;
          x[i].appendChild(a);
          /* For each element, create a new DIV that will contain the option list: */
          b = document.createElement("DIV");
          b.setAttribute("class", "mktoSelect-items mktoSelect-hide");
          for (j = 1; j < ll; j++) {
            /* For each option in the original select element,
            create a new DIV that will act as an option item: */
            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            if (c.innerHTML === 'REDACTED') {
              c.classList.add('mktoSelect-redacted');
            }
            c.addEventListener("click", function (e) {
              /* When an item is clicked, update the original select box,
                and the selected item: */
              var y, i, k, s, h, sl, yl, ms;
              s = this.parentNode.parentNode.getElementsByTagName("select")[0];
              sl = s.length;
              h = this.parentNode.previousSibling;
              for (i = 0; i < sl; i++) {
                if (s.options[i].innerHTML == this.innerHTML) {
                  s.selectedIndex = i;
                  s.dispatchEvent(new Event("change"));
                  h.innerHTML = this.innerHTML;
                  y = this.parentNode.getElementsByClassName("same-as-selected");
                  yl = y.length;
                  for (k = 0; k < yl; k++) {
                    y[k].removeAttribute("class");
                  }
                  this.setAttribute("class", "same-as-selected");
                  ms = this.parentNode.parentNode.querySelector(".mktoSelect-selected");
                  ms.classList.add("select-value-selected");
                  break;
                }
              }
              h.click();
            });
            b.appendChild(c);
          }
          x[i].appendChild(b);
          x[i].classList.add("select-customized");
          a.addEventListener("click", function (e) {
            /* When the select box is clicked, close any other select boxes,
            and open/close the current select box: */
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("mktoSelect-hide");
            this.classList.toggle("select-arrow-active");
            // get the clicked objects parent
            var parent = e.target.parentNode;
            // get the dropdown
            var dd = parent.querySelector(".mktoSelect-items");
            var domRect = dd.getBoundingClientRect();
            // get the select
            var origSelect = parent.getElementsByTagName("select")[0];
            //get the parent form
            var form = origSelect.form;
            var bottomOverlap = window.innerHeight - domRect.bottom < 0 ? true : false;
            // set the max height of the dropdowns
            // but if less than max-height set to auto
            // add 5px to trigger so options are partly
            // cut off before truncating dropdown
            if (domRect.height > 221) {
              dd.style.height = "216px";
            }
            // remove the error
            if (parent.querySelector(".mktoError")) parent.querySelector(".mktoError").remove();
            if (!e.target.classList.contains("select-arrow-active")) {
              var selects = form.getElementsByTagName("select");
              if (selects.length) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                  for (var _iterator = selects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var select = _step.value;

                    if (!select.parentNode.classList.contains("has-select")) select.parentNode.classList.add("has-select");
                  }
                } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                      _iterator.return();
                    }
                  } finally {
                    if (_didIteratorError) {
                      throw _iteratorError;
                    }
                  }
                }

                initSelects();
              }
            }
            // check if the select dropdown is off the bottom of the page
            // if so reposition it from the top of the select
            if (bottomOverlap) {
              parent.classList.add("select-top");
            } else {
              parent.classList.remove("select-top");
            }
            // check for clear divs
            var mktoClears = form.querySelectorAll(".mktoClear");
            if (mktoClears.length) {
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = mktoClears[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var mktoClear = _step2.value;

                  mktoClear.remove();
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }
            }
            // check for textareas
            var mktoTextareas = form.querySelectorAll("textarea.mktoField");
            if (mktoTextareas.length) {
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = mktoTextareas[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var mktoTextarea = _step3.value;

                  if (!mktoTextarea.parentNode.classList.contains("has-textarea")) mktoTextarea.parentNode.classList.add("has-textarea");
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
            // check for injected placeholders for conditional
            // logic and add the class to the parent to remove the right padding
            var mktoPlaceHolders = form.querySelectorAll(".mktoPlaceholder");
            if (mktoPlaceHolders.length) {
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = mktoPlaceHolders[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var mktoPlaceHolder = _step4.value;

                  mktoPlaceHolder.parentNode.classList.add("has-placeholder");
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }
            }
            if (e.target.matches(".select-value-selected.select-arrow-active") && origSelect.selectedIndex > 0) {
              e.target.classList.remove("select-value-selected");
              origSelect.selectedIndex = 0;
              e.target.innerHTML = origSelect.options[0].innerHTML;
            }
          });
        }

        function closeAllSelect(elmnt) {
          /* A function that will close all select boxes in the document,
          except the current select box: */
          var x,
              y,
              i,
              xl,
              yl,
              arrNo = [];
          x = document.getElementsByClassName("mktoSelect-items");
          y = document.getElementsByClassName("mktoSelect-selected");
          xl = x.length;
          yl = y.length;
          for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
              arrNo.push(i);
            } else {
              y[i].classList.remove("select-arrow-active");
            }
          }
          for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
              x[i].classList.add("mktoSelect-hide");
            }
          }
        }

        /* If the user clicks anywhere outside the select box,
        then close all select boxes: */
        document.addEventListener("click", closeAllSelect);
      };

      $marketoForm.each(function (i, e) {
        if (!e.id) return;
        var formId = e.id.split("_")[1];
        var $form = $(e);
        var form = e;
        var total = 0;
        var count = 0;

        var initForm = function initForm() {
          // add eventhandler for validation of selects
          // remove error if it exists
          $form.on("blur", ".mktoSelect-selected", function (e) {
            $(e.target).parent().find(".mktoError").remove();
          });
          // add eventhandler for validation of selects
          // add error message on second focus
          $form.on("focus", ".mktoSelect-selected", function (e) {
            var $parent = $(e.target).parent();
            var labelText = $parent.find("label").text();
            var errorText = labelText.replace("*", "");
            var error = '<div class="mktoError"><div class="mktoErrorArrowWrap"><div class="mktoErrorArrow"></div></div><div role="alert" tabindex="-1" class="mktoErrorMsg">' + errorText + " field is required.</div>";
            var $select = $parent.find("select.mktoRequired");
            var hasError = $parent.find(".mktoError").length;
            if ($select.val() === "" && $parent.data("notfirstfocus") && !hasError) {
              $parent.append(error);
            }
            $parent.data({ notfirstfocus: true });
          });
          // add focus handler to not show error on first focus
          $form.on("focus", "textarea", function (e) {
            var $txtarea = $(e.target);
            var $parent = $txtarea.parent();
            if ($txtarea.data("notfirstfocus")) {
              $parent.find(".mktoError").remove;
            }
            $txtarea.data({ notfirstfocus: true });
          });
          // handle DOM manipulation of form injected by marketo
          manipulateMktoForm();
        };

        var manipulateMktoForm = function manipulateMktoForm() {
          var $mktoClear = $form.find(".mktoClear"),
              $mktoFinePrint = $form.find("#fine_print"),
              $overflowWrapper = $form.closest(".body-section__columns-wrapper");
          if ($overflowWrapper.length > 0) $overflowWrapper.css('overflow', 'visible');
          $form.css("min-height", 0);
          $selects = $form.find("select:not([multiple])");
          $multiSelects = $form.find("select[multiple]");
          if ($multiSelects.length > 0) {
            Drupal.behaviors.multiselect.attach();
          }
          if ($mktoClear.length) $mktoClear.remove();
          if ($mktoFinePrint.length) $mktoFinePrint.closest(".mktoFormRow").not(".has-fine-print").addClass("has-fine-print");
          if ($selects.length) {
            $selects.parent(".mktoFieldWrap").not(".has-select").addClass("has-select");
            var $phiSelects = $form.find("select[name^='phi_'], select[name^='PHI_']");
            $phiSelects.append($("<option></option>").attr({ value: "REDACTED" }).text("REDACTED"));
          }
          // check for textareas
          var $mktoTextareas = $form.find("textarea.mktoField");
          if ($mktoTextareas.length) {
            $mktoTextareas.each(function (i, e) {
              if (!$(e).parent().hasClass("has-textarea").length) {
                $(e).parent().addClass("has-textarea");
              }
            });
          }
        };
        // check if the form is loaded and ready to be initialized
        // otherwise add observer to watch 4 it
        if ($form.hasClass("mktoForm")) {
          // mrkto form populated already onload
          initForm();
          if ($selects.length) initSelects();
        } else {
          // mrkto form NOT populated so add the observer to keep checking 4it
          var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
              var formLoaded = $(mutation.addedNodes).find(".mktoClear").length > 0 ? true : false;
              if (formLoaded) {
                // manipulateMktoForm();
                initForm();
                if ($selects.length) initSelects();
                observer.disconnect();
              }
            });
          });

          observer.observe(e, { childList: true, subtree: true });
        }

        // handle the form submit
        MktoForms2.loadForm("//app-ab16.marketo.com", "309-LVL-470", formId, function (form) {
          // Submission success handler
          form.onSuccess(function (values, followUpUrl) {
            // console.log("response ONSUCCESS");
            // console.log("response ONSUCCESS: ", values);
            // console.log("response ONSUCCESS: ", followUpUrl);
            // console.log('Marketo package');
            // console.log(values);
            // Get the form's jQuery element and hide it, then show success message
            form.getFormElem().hide();
            $("#mktoForm-requiredField_" + formId).hide();
            $("#disclaimer_" + formId).hide();
            $("#submission-success-message_" + formId).show();

            // Return false to prevent the submission handler from taking the lead to the follow up url.
            return false;
          });
          form.onValidate(function (isSuccess) {
            var hasPHI = false;
            var $form = form.getFormElem();
            var $selects = $form.find("select.mktoRequired");
            form.submittable(false);
            // had to add a timeout because the errors fade on and the :visible attribute
            // messes with the DOM knowing if the error is there or not
            setTimeout(function () {
              var errors = $form.find(".mktoError");
              $selects.each(function (i, e) {
                var $self = $(e);
                var $parent = $self.parent();
                var labelText = $parent.find("label").text();
                var errorText = labelText.replace("*", "");
                var error = '<div class="mktoError"><div class="mktoErrorArrowWrap"><div class="mktoErrorArrow"></div></div><div role="alert" tabindex="-1" class="mktoErrorMsg">' + errorText + " field is required.</div>";
                if ($self.val() === "" && !$parent.find(".mktoError").length && !errors.length) {
                  $self.parent().append(error);
                  return false;
                }
                $self.parent().data({ notfirstfocus: true });
              });
            }, 300);
            // start phi handling
            //only post if validation is successful
            if (isSuccess) {
              //loop through all form fields
              var fields = form.getValues();
              var newVals = {};
              var reachPHI = {};
              for (var fieldname in fields) {
                var fieldvalue = fields[fieldname];
                //console.log("field name = " + fieldname);
                //console.log("field value = " + fieldvalue);

                //if field name contains PHI then encrypt
                if (fieldname.toUpperCase().indexOf('PHI_') === 0) {
                  hasPHI = true;
                  //redact PHI field
                  newVals[fieldname] = 'REDACTED';
                  if (fieldvalue !== '') {
                    // set value for reach phi info
                    reachPHI[fieldname] = 'REDACTED';
                    //set un-encrypted value (not stored in mkto)
                    reachPHI[fieldname + "_decrypted"] = fieldvalue;
                  }
                } else {
                  newVals[fieldname] = fieldvalue;
                }
              }
              // get page form is on
              var currentPageUrl = window.location.href;
              // get mkto trk cookie value
              var mktoTrk = nwdsi.getCookie('_mkto_trk');
              var mergeObj = { "_mkt_trk": mktoTrk, "SourceUri": currentPageUrl, "SrcSystem": "Marketo" };
              form.vals(newVals);
              var combineddata = [];
              var formVals = form.getValues();
              var mergeVals = Object.assign(mergeObj, formVals);
              combineddata.push(mergeVals, reachPHI);
              // add a bail out so form does not get submitted multiple times.
              // and check that forms with no PHI data do not submit to Reach
              if (reachSuccess) return; // removed "|| !hasPHI check as we are now submitting only to reach endpoint

              $.ajax({
                type: 'post',
                method: 'post',
                contentType: 'application/json',
                url: 'https://formdata.reachnorthwell.com/api/v1.0/FormData',
                headers: {
                  'Content-Type': 'application/json'
                },
                data: JSON.stringify(combineddata)
              }).done(function (response) {
                // console.log(combineddata);
                reachSuccess = true;
                // Grabbed the code from lines 407-409 because the form is no longer submitting to marketo
                // Get the form's jQuery element and hide it, then show success message
                form.getFormElem().hide();
                $("#mktoForm-requiredField_" + formId).hide();
                $("#disclaimer_" + formId).hide();
                $("#submission-success-message_" + formId).show();
              }).fail(function (error) {
                // took code from lines 527-531 to display error when failing at Reach
                // Get the form's jQuery element and hide it, then show fail message
                form.getFormElem().hide();
                $("#submission-failure-message_" + formId).show();
                $("#disclaimer_" + formId).hide();
                $("#mktoForm-requiredField_" + formId).hide();
                console.log('REACH CALL FAILED');
                console.log(error);
                console.log(combineddata);
              });

              return false;
            }
            return false;
            // end phi handling
          });
          // add hidden fields for utm query params
          if (Object.keys(mktoFormUTMs).length) {
            form.addHiddenFields(mktoFormUTMs);
          }
          FormsPlus.onSubmitError(function (error) {
            console.log("A network or server error was detected on posting form data: " + error);
            // Get the form's jQuery element and hide it, then show fail message
            form.getFormElem().hide();
            $("#submission-failure-message_" + formId).show();
            $("#disclaimer_" + formId).hide();
            $("#mktoForm-requiredField_" + formId).hide();

            return false;
          });
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function paginationDropdownScript($, Drupal, window) {
  Drupal.behaviors.paginationDropdown = {
    attach: function attach(context) {
      $('#pagination-alpha__dropdown', context).change(function () {
        var targetElement = this.value;
        $('html, body').animate({
          scrollTop: $(targetElement).offset().top
        }, 800);
      });

      // initiate sticky behavior on scroll
      var $headerHeight = $('.site-header', context).height();
      var $nestedHeaderHeight = $('.page-header__wrapper', context).height();

      $(window).scroll(function () {
        var scrollPosition = $(window).scrollTop();
        var stickyHeight = $headerHeight + $nestedHeaderHeight;
        if (scrollPosition >= stickyHeight) {
          $('.pagination-alpha', context).addClass('pagination-alpha--sticky');
        } else {
          $('.pagination-alpha', context).removeClass('pagination-alpha--sticky');
        }
      });
    }
  };
})(jQuery, Drupal, window);
"use strict";

(function relateditemScript($, Drupal) {
  Drupal.behaviors.relateditem = {
    attach: function attach(context) {}
  };
})(jQuery, Drupal);
'use strict';

(function togglepanelScript($, Drupal) {
  Drupal.behaviors.togglepanel = {
    state: {
      mobileLineHeight: 20,
      desktopLineHeight: 26
    },
    checkIfMobile: function checkIfMobile() {
      if (nwdsi.isMobile()) {
        this.state.isMobile = true;
      } else {
        this.state.isMobile = false;
      }
    },
    setClosed: function setClosed(toggleWrapper) {
      var $toggleWrapper = $(toggleWrapper);
      var $toggleBody = $toggleWrapper.find('.toggle-panel__body');
      $toggleBody.css('max-height', 'none');
      var textHeight = $toggleBody.height();
      var $button = $toggleWrapper.find('.toggle-panel__body-button');
      var open_text = $button.attr('data-more-text');
      var close_text = $button.attr('data-less-text');
      toggleWrapper.state.isOpen = false;
      toggleWrapper.state.isExpanded = false;
      toggleWrapper.state.max_height = textHeight;
      $toggleBody.addClass('body-compressed');
      var isShowAll = $toggleBody.hasClass('.show-all');
      // add class to toggle panel to show fade gradient
      $toggleWrapper.addClass('add-text-fade');
      var fade = '<div class="toggel-panel__fade"></div>';
      $toggleBody.append(fade);

      if (!isShowAll) {
        if (this.state.isMobile) {
          $toggleBody.css('max-height', toggleWrapper.state.mobileLineHeight * 6 + 'px');
        } else {
          $toggleBody.css('max-height', toggleWrapper.state.desktopLineHeight * 6 + 'px');
        }
      }
      if ($button.is(":hidden")) $button.show();
      $button.find('span').html(open_text);
      $button.find('.fal').removeClass('fa-minus-circle').addClass('fa-plus-circle');
      $toggleBody.removeClass('show-all');
    },
    setOpen: function setOpen(toggleWrapper) {
      var $toggleWrapper = $(toggleWrapper);
      var $toggleBody = $toggleWrapper.find('.toggle-panel__body');
      var $button = $toggleWrapper.find('.toggle-panel__body-button');
      var open_text = $button.attr('data-more-text');
      var close_text = $button.attr('data-less-text');
      toggleWrapper.state.isOpen = true;
      toggleWrapper.state.isExpanded = false;
      $toggleBody.removeClass('body-compressed');
      if (this.state.isMobile) {
        $toggleBody.css('max-height', toggleWrapper.state.mobileLineHeight * 6 + 'px');
      } else {
        $toggleBody.css('max-height', toggleWrapper.state.desktopLineHeight * 6 + 'px');
      }
      if ($button.is(":hidden")) $button.show();
      $button.find('span').html(close_text);
      $button.find('.fal').removeClass('fa-plus-circle').addClass('fa-minus-circle');
      $toggleBody.addClass('show-all');
    },
    setExpanded: function setExpanded(toggleWrapper) {
      var $toggleWrapper = $(toggleWrapper);
      var $toggleBody = $toggleWrapper.find('.toggle-panel__body');
      var $button = $toggleWrapper.find('.toggle-panel__body-button');
      var open_text = $button.attr('data-more-text');
      var close_text = $button.attr('data-less-text');
      toggleWrapper.state.isOpen = false;
      toggleWrapper.state.isExpanded = true;
      $toggleBody.removeClass('body-compressed');
      $toggleBody.css('max-height', 'none');
      $button.hide();
      $toggleBody.addClass('show-all');
    },
    setup: function setup(toggleWrapper) {
      var $this = $(toggleWrapper);
      var $dHeight = parseInt($this.attr('data-desktopHeight'), 10);
      var $mHeight = parseInt($this.attr('data-mobileHeight'), 10);
      var $removeMobile = $this.attr('data-remove-mobile');
      var $toggleBody = $this.find('.toggle-panel__body');
      $toggleBody.css('max-height', 'none');

      toggleWrapper.state = {
        isExpanded: false,
        isOpen: false,
        max_height: 0
      };

      toggleWrapper.state.mobileLineHeight = $mHeight ? $mHeight : 20;
      toggleWrapper.state.desktopLineHeight = $dHeight ? $dHeight : 26;
      toggleWrapper.state.removeMobile = $removeMobile;

      Drupal.behaviors.togglepanel.state.mobileLineHeight = $mHeight;
      Drupal.behaviors.togglepanel.state.desktopLineHeight = $dHeight;

      var $togglepanel = $this.find('.toggle-panel');
      setTimeout(function () {
        var textHeight = $toggleBody.height();
        if (nwdsi.isMobile() && toggleWrapper.state.removeMobile) {
          Drupal.behaviors.togglepanel.setExpanded(toggleWrapper);
        } else {

          if (textHeight > Drupal.behaviors.togglepanel.state.mobileLineHeight * 6 && nwdsi.isMobile()) {
            // mobile and height is greater than new container
            Drupal.behaviors.togglepanel.setClosed(toggleWrapper);
          } else if (textHeight > Drupal.behaviors.togglepanel.state.desktopLineHeight * 6) {
            // desktop and height is more than new container
            Drupal.behaviors.togglepanel.setClosed(toggleWrapper);
          } else {
            // if is an accordion then bypass otherwise
            // set to open and remove button if body text is not long enought to warrant
            if (toggleWrapper.classList.contains('toggle_panel--accordion')) {
              Drupal.behaviors.togglepanel.setClosed(toggleWrapper);
            } else {
              // mobile or desktop and height is less than new container
              Drupal.behaviors.togglepanel.setExpanded(toggleWrapper);
            }
          }
        }
      }, 100);
    },
    attach: function attach(context) {
      var _this = this;

      var $toggleWrapper = $('.toggle-panel', context);
      if (!$toggleWrapper.length) {
        return;
      }

      $toggleWrapper.each(function () {
        Drupal.behaviors.togglepanel.setup(this);
        // const $toggleBody = $(this).find('.toggle-panel__body');
        // // Add fade div and add it to DOM
        // const add_fade = $(this).hasClass('add-text-fade');
        // if(add_fade) {
        //   const fade = '<div class="toggel-panel__fade"></div>';
        //   $toggleBody.append(fade);
        // }
      });

      // When show more or show less button text is clicked
      $toggleWrapper.on('click', 'a.toggle-panel__body-button', function (e) {
        var parent = e.currentTarget.parentNode;
        var $toggleBody = $(parent).find('.toggle-panel__body');
        var $button = $(e.currentTarget);
        var open_text = $(e.currentTarget).attr('data-more-text');
        var close_text = $(e.currentTarget).attr('data-less-text');
        var $fadeOverlay = $toggleBody.find('.toggel-panel__fade');

        if (parent.state.isOpen) {
          $button.find('span').html(open_text);
          $button.find('.fal').addClass('fa-plus-circle').removeClass('fa-minus-circle');
          // hide fade div
          $fadeOverlay.removeClass('out');
          // $toggleBody.removeClass('show-all');
          parent.state.isOpen = false;
          // $toggleBody.css('max-height', 1);
          if (_this.state.isMobile) {
            $toggleBody.css('max-height', parent.state.mobileLineHeight * 6 + 'px');
          } else {
            $toggleBody.css('max-height', parent.state.desktopLineHeight * 6 + 'px');
          }
        } else {
          $button.find('span').html(close_text);
          $button.find('.fal').addClass('fa-minus-circle').removeClass('fa-plus-circle');
          // $toggleBody.addClass('show-all');
          // add fade div
          $fadeOverlay.addClass('out');

          $toggleBody.css('max-height', parent.state.max_height + 20);
          parent.state.isOpen = true;
        }
      });
      this.checkIfMobile();
      $(window).on('resize', _.debounce(function () {
        $toggleWrapper.each(function () {
          Drupal.behaviors.togglepanel.setup(this);
        });
      }, 100));
    }
  };
})(jQuery, Drupal);
'use strict';

(function accordionsearchScript($, Drupal) {
  Drupal.behaviors.accordionsearch = {
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('.accordion-search', context);
      var $resultsList = this.$parentSelector.find('.accordion-search__panel');
      var $clearButton = this.$parentSelector.find('.accordion-search__clear-input');

      this.$parentSelector.on('keyup', '.accordion-search__input', function (e) {
        // Grab input value
        var term = $(e.currentTarget).val();
        if (term.length === 0) {
          $clearButton.css('display', 'none');
        } else {
          $clearButton.css('display', 'block');
        }
        // Loop through each results to check if search term matches result data
        $resultsList.each(function (index, item) {
          var resultsText = $(item).data('value');
          if (!resultsText.includes(term)) {
            $(item).addClass('hidden');
          } else {
            $(item).removeClass('hidden');
          }
        });
      });

      // When clear search button is clicked, empty input and trigger keydown
      this.$parentSelector.on('click', '.form-group--submit', function (e) {
        e.preventDefault();
        _this.$parentSelector.find('.accordion-search__input').val('').trigger('keyup');
      });
    }
  };
})(jQuery, Drupal);
// (function alertsbannerScript($, Drupal) {
//   Drupal.behaviors.alertsbanner = {
//     attach(context) {

//       function showAlert() {
//         const hasBanner = document.getElementById('alerts-banner');
//         if (document.cookie.replace(/(?:(?:^|.*;\s*)nw_alert_cookie\s*\=\s*([^;]*).*$)|^.*$/, "$1") !== "true" && !hasBanner) {

//           var host = window.location.origin
//           var groupId = window.drupalSettings.site.gid
//           var endPoint = host +"/api/alerts/" + groupId
//           var levelIcon = ''

//           jQuery.ajax({
//             url: endPoint,
//             method : "GET",
//             cache : true,
//             success: function(data) {
//               if(data.length < 1){
//                 return
//               } else {
//                 if(data.level === 'level4') {
//                   levelIcon = 'circle'
//                 } else {
//                   levelIcon = 'triangle'
//                 }

//                 var alertsHtml = '<div class="alerts-banner ' + data.level +'" id="alerts-banner"><div class="alerts-message"><div class="alerts-icon"><i class="fal fa-exclamation-'+ levelIcon +'"></i></div><div class="alerts-text"><p class="desktop-cta">' + data.cta_text + '<a href=' + data.cta_link.url + ' target=' + data.cta_link.target+ '>'+ data.cta_link.text +'</a></p><p class="mobile-cta">' + data.cta_text + '<a href=' + data.cta_link.url + ' target=' + data.cta_link.target+ '>' + data.cta_link.text + '</a></p></div><i id="btn-dismiss" class="fal fa-times alerts-close"></i></div></div>';

//                 const $mainContainer = $(".site-header");
//                 $(alertsHtml).insertBefore($mainContainer)
//                 $('.alerts-banner').addClass('show-nw-alert');
//                 $('#btn-dismiss').on('click', function() {
//                   var date = new Date();
//                   date.setDate(date.getDate() + 1);
//                   $('.alerts-banner').removeClass('show-nw-alert');
//                   document.cookie = "nw_alert_cookie=true; expires="+date.toGMTString()+"";
//                 })
//               }
//             }
//           })

//         }
//         }
//         showAlert();
//     },
//   };
// })(jQuery, Drupal);
"use strict";
"use strict";

(function autocompleteInputScript($, Drupal, settings) {
  Drupal.behaviors.autocompleteInput = {
    attach: function attach(context) {
      // check for auto complete inputs
      var $autocompletes = $(".devbridge-autocomplete-input", context);
      // if found then set up each input with autocomplete
      if ($autocompletes.length) {
        $autocompletes.each(function () {
          var $currentInput = $(this);
          // SET UP DEFAULTS
          // attach data model defaults to input
          $currentInput.data({ num: 3, groupnum: 6 });
          var apiUrl = "/api/search/typeahead"; // [pl] https://stage-api2.northwell.io/v2/content/typeahead // [enviroment/local] /api/search/typeahead
          //set up config for use in init of autocomplete
          var config = {
            groupBy: "group",
            minChars: 3,
            deferRequestBy: 250,
            showNoSuggestionNotice: false
            // noSuggestionNotice: 'Sorry, no matching results'
          };
          // OVERRIDE DEFUALTS
          // check for the data-remote-url attr and update the api endpoint if it exists
          apiUrl = $currentInput.attr("data-remote-url") ? $currentInput.attr("data-remote-url") : apiUrl;
          // check for the data-num and data-groupnum and add to the data obj of the current input
          if ($currentInput.attr("data-num")) $currentInput.data("num", $currentInput.attr("data-num"));
          if ($currentInput.attr("data-groupnum")) $currentInput.data("groupnum", $currentInput.attr("data-groupnum"));
          // check for the data-groupby data-minChars and data-sugg-notice attrs and override the config
          if ($currentInput.attr("data-groupby")) config.groupby = $currentInput.attr("data-groupby");
          if ($currentInput.attr("data-minChars")) config.minChars = $currentInput.attr("data-minChars");
          if ($currentInput.attr("data-sugg-notice")) config.noSuggestionNotice = $currentInput.attr("data-sugg-notice");

          // INIT devbridge autocomplete to the input
          $currentInput.devbridgeAutocomplete({
            lookup: function lookup(query, done) {
              var taxonomy = void 0,
                  num = void 0,
                  url = void 0,
                  suggestions = [];
              taxonomy = $currentInput.data("taxonomy") && $currentInput.data("activeCategory") ? "&taxonomy=" + encodeURIComponent($currentInput.data("taxonomy")) : "";
              num = $currentInput.data("activeCategory") ? "&num=" + $currentInput.data("groupnum") : "&num=" + (Number($currentInput.data("num")) + 1);
              url = apiUrl + "?q=" + encodeURIComponent(query) + "&facets_results=true" + num + taxonomy;
              // Do Ajax call ,
              // call the callback and pass results:
              $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                success: function success(data) {
                  var results = data.response.response.results;
                  $(results).each(function (index, element) {
                    var group = element.group;
                    var pages = element.pages;
                    var length = pages.length;
                    var moreAvailableResults = void 0;
                    if (pages.length === Number($currentInput.data("num")) + 1 && !$currentInput.data("activeCategory")) {
                      moreAvailableResults = true;
                      pages.splice(-1, 1);
                    } else {
                      moreAvailableResults = false;
                    }
                    $(pages).each(function (i, el) {
                      var url = el.url ? el.url : null;
                      var obj = {
                        value: el.name,
                        data: {
                          group: group,
                          more: moreAvailableResults,
                          activeCategory: $currentInput.data("activeCategory"),
                          url: url
                        }
                      };
                      suggestions.push(obj);
                    });
                  });
                  var result = { suggestions: suggestions };
                  done(result);
                },
                error: function error(request, _error) {
                  console.log("Request: " + JSON.stringify(request));
                }
              });
            },
            // the following sets up the group bar that opens more results adding the button to see more or less
            formatGroup: function formatGroup(suggestion, currentValue) {
              var buttontext = suggestion.data.activeCategory ? "< Back to all categories" : "See more >";
              var groupbar = suggestion.data.more || suggestion.data.activeCategory ? "<div class=\"autocomplete-group\"><span class=\"autocomplete-group-text\">" + currentValue + "</span><a class=\"autocomplete-group-button\" aria-label=\"View all " + currentValue + " options\">" + buttontext + "</a></div>" : "<div class=\"autocomplete-group\">" + currentValue + "</div>";
              // draw in the group bar with or without a See more link
              return groupbar;
            },
            // the following mocks a submit of the form onselect using window.location
            onSelect: function onSelect(suggestion) {
              var value = suggestion.value ? encodeURIComponent(suggestion.value) : null;
              if (suggestion.data.url) {
                // the following is logic to create a queryurl for a link
                var url = suggestion.data.url;
                var isUrlAbsolute = function isUrlAbsolute(url) {
                  return url.indexOf("://") > 0 || url.indexOf("//") === 0;
                };
                var linkUrl = isUrlAbsolute ? url : location.protocol + "//" + location.host + url;
                // set history state
                // to enable the back button functionality
                history.pushState({ fromAutocomplete: true }, null, "?keywords=" + value);
                // If user selects a suggestion go to that url
                window.location = linkUrl;
              } else if (value) {
                // the following is logic to create a queryurl for a search
                var formQueryUrl = value ? "?" + "keywords=" + value : "";
                var cleanHref = location.protocol + "//" + location.host + "/search/";
                // set history state
                // to enable the back button functionality
                history.pushState({ fromAutocomplete: true }, null, "?keywords=" + value);
                // If user selects a suggestion go get that result
                window.location = cleanHref + formQueryUrl;
              }
            },
            // the following adds a preloader while perfroming ajax request
            onSearchStart: function onSearchStart() {
              var $parent = $currentInput.parent();
              if ($parent.css("position") !== "relative") $parent.css({ position: "relative" });
              $currentInput.data({ active: true }).after('<span class="devbridge-autocomplete--loading"><i class="fal fa-spinner"></i></span>');
            },
            onSearchComplete: function onSearchComplete(query, suggestions) {
              $(".devbridge-autocomplete--loading").remove();
              if (!suggestions.length) {
                $currentInput.data({ active: false });
                $currentInput.removeClass("devbridge-autocomplete-input--open");
              } else {
                $currentInput.addClass("devbridge-autocomplete-input--open");
              }
            },
            // the following adds a class to handle styles of input after close of autocomplete
            onHide: function onHide() {
              $currentInput.data({ active: false }).removeClass("devbridge-autocomplete-input--open");
            },
            groupBy: config.groupBy,
            minChars: config.minChars,
            deferRequestBy: config.deferRequestBy,
            showNoSuggestionNotice: config.showNoSuggestionNotice,
            noSuggestionNotice: config.noSuggestionNotice,
            triggerSelectOnValidInput: false
          });
        });
      } else {
        // BAIL if dependanet element is not present
        return;
      }
      // attach click handler to see more button
      $(document).on("click", "a.autocomplete-group-button", function (e) {
        var self = e.currentTarget,
            $self = $(self);
        var $parent = $self.parent();
        var group = $parent.find(".autocomplete-group-text").text();
        var $allinputs = $("input"),
            $originalInput = void 0,
            $element = void 0,
            autocomplete = void 0,
            query = void 0,
            buttontext = void 0,
            groupnumber = void 0,
            activeCat = void 0;
        $allinputs.each(function (index, element) {
          $element = $(element);
          if ($element.data("active")) {
            $originalInput = $element;
            autocomplete = $originalInput.data("autocomplete");
            query = autocomplete.currentValue;
          }
        });
        activeCat = $self.text() === "See more >" ? group : false;
        buttontext = activeCat === true ? "< Back to all categories" : "See more >";
        $self.text(buttontext);
        $self.closest(".autocomplete-suggestions").scrollTop(0);
        $originalInput.data({ taxonomy: group, activeCategory: activeCat });
        $originalInput.devbridgeAutocomplete("getSuggestions", query);
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
"use strict";

(function buttonGroupScript($, Drupal) {
  Drupal.behaviors.buttonGroup = {
    attach: function attach(context) {}
  };
})(jQuery, Drupal);
'use strict';

(function footerScript($, Drupal) {
  Drupal.behaviors.inline_video_script = {
    attach: function attach(context) {
      // handle loading limelight player API and the associated videos into the carousel
      var playerArr = document.querySelectorAll('*[id^="limelight_player"]');
      if (playerArr.length) {
        var limelightAPI = 'https://assets.video.limelight.com/production/limelightjs-player/limelightjs-player-4.2.6/limelightjs-player.js?version=4.2.6';
        var llAPILoaded = typeof LimelightPlayer != 'undefined' ? true : false;

        var loadPlayers = function loadPlayers() {
          $(playerArr).each(function (i) {
            var $self = $(this);
            var limelight_id = $self.attr('data-ll-id');
            var options = {
              width: '100%',
              height: '100%',
              playerForm: 'Player',
              playerId: 'limelight_player_' + limelight_id,
              mediaId: limelight_id
            };
            LimelightPlayerUtil.embed(options);
          });
        };
        // if the player API is loaded then just call the method to load
        // the vids otherwise load the API scirpt first
        if (!llAPILoaded) {
          $.getScript(limelightAPI).done(function (script, textStatus) {
            loadPlayers();
          });
          llAPILoaded = true;
        } else {
          loadPlayers();
        }
      }
      var $player_wrappers = $('.card-media__overlay-wrapper', context);
      if (!$player_wrappers) return;
      $player_wrappers.click(function () {
        var overlay = $(this);
        // Show the video
        var videoWrapper = overlay.prev('.card-media__iframe-wrapper');
        videoWrapper.removeClass('hidden');
        videoWrapper.attr('aria-hidden', false);

        // Remove data-src, replace it with src to play video
        var iframe = videoWrapper.find('iframe');
        var srcVal = iframe.data('video');
        iframe.attr({
          src: srcVal
        }).removeAttr('data-video');

        // Adding a specific class selector because we only want this to happen
        // on iframes that are being used on the body-section__image
        // full-article-video variant.
        $('.body-section__image--full-article-video .card-media__iframe-wrapper iframe').fitVids();

        // Transition the image overlay out
        var wrapperClass = 'card-media__overlay-wrapper';
        overlay.toggleClass(wrapperClass + '--out', true);
        // Hide the overlay after the transition
        overlay.on('transitionend', function () {
          overlay.addClass('hidden');
          overlay.attr('aria-hidden', true);
        });
        $('.card-media--iframe').addClass('video-visible');
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function testScript($, Drupal) {
  // Monday - Sun
  var _days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  Drupal.behaviors.card_hours = {
    attach: function attach(context) {
      var $card_hour_tbodies = $('.card__hours table tbody', context);
      if ($card_hour_tbodies.length) {
        var _today = new Date().getDay();
        var _day = _days[_today];

        $card_hour_tbodies.each(function (i, tbody) {
          var $tbody = $(tbody);
          var $trs = $tbody.find('tr');
          var reset_index = 0;

          $trs.each(function (r, tr) {
            if ($trs.eq(r).find('td').first().text().trim() === _day) {
              reset_index = r;
            }
          });

          $tbody.find('tr:nth-child(1n+' + String(reset_index + 1) + ')').prependTo($tbody);

          // While viewing multiple contact patterns in PL there is a flash of visibility.
          // Delay is not needed and quite undesirable everywhere else.
          // setTimeout(function(){
          $tbody.parents('.card__hours').css('visibility', 'visible');
          // }, 100);
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function testScript($, Drupal) {
  Drupal.behaviors.support_card_read_more = {
    attach: function attach(context) {
      var charLimit = 55;
      var showChar = 47;
      var ellipsisText = '...';
      $('.card__staff-title', context).each(function truncateText() {
        var content = $(this).html();
        if (content.length > charLimit) {
          var truncated = content.substr(0, showChar);
          var full = content;
          var html = '<div class="card__truncate-text" style="display:block">' + truncated + '<span class="card__read-more-ellipsis">' + ellipsisText + '&nbsp;&nbsp;<a href="" class="typog-body card__read-more-less more">more</a></span></span></div><div class="card__truncate-text" style="display:none">' + full + '&nbsp;&nbsp;<a href="" class="typog-body card__read-more-less less">less</a></span></div>';
          $(this).html(html);
        }
      });

      $('.card__read-more-less', context).click(function showMoreLess() {
        var thisElement = $(this);
        var cT = thisElement.closest('.card__truncate-text');
        var tX = '.card__truncate-text';

        if (thisElement.hasClass('less')) {
          cT.prev(tX).toggle();
          cT.slideToggle();
        } else {
          cT.toggle();
          cT.next(tX).fadeToggle();
        }
        return false;
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * nslij3-statics/js/vendors/bootstrap-multiselect/_bootstrap-multiselect-init.js
 */
(function contactFormTweaks($, Drupal) {
  Drupal.behaviors.requestAnAppointmentFormTweaks = {
    attach: function attach(context) {
      var form = '.webform-submission-request-an-appointment-form';
      var formApp = '.webform-submission-request-an-appointment-app-form';

      $(form + ' .form-item-denotes').detach().prependTo('.form-item--button');
      $(formApp + ' .form-item-denotes').detach().appendTo('.form-item--button');
      $(formApp + ' #fine_print,' + form + ' #fine_print').html('');
      $('label[for^="edit-appointment-type-other"]').addClass('form-required');
    }
  };
})(jQuery, Drupal);
"use strict";

(function covidlibrarysidebarScript($, Drupal) {
  Drupal.behaviors.covidlibrarysidebar = {
    attach: function attach(context) {
      if (!$(".covid-library-sidebar").length) return;
      var inputs = document.querySelectorAll(".covid-filter-date");

      var dateInputMask = function dateInputMask(elm) {
        elm.addEventListener("keypress", function (e) {
          if (e.keyCode < 47 || e.keyCode > 57) {
            e.preventDefault();
          }

          var len = elm.value.length;

          // If we're at a particular place, let the user type the slash
          if (len !== 1 || len !== 3) {
            if (e.keyCode == 47) {
              e.preventDefault();
            }
          }

          // If they don't add the slash, do it for them...
          if (len === 2) {
            elm.value += "/";
          }
        });
      };

      inputs.forEach(function (input) {
        dateInputMask(input);
      });

      var html5Slider = document.getElementById("impact-slider");

      var inputMin = document.getElementById("inputMin");
      var inputMax = document.getElementById("inputMax");
      var sliderMin = $("#inputMin").attr("min");
      var sliderMax = $("#inputMax").attr("max");

      var sliderStart = 0;
      var sliderEnd = parseInt(sliderMax, 10);

      if (inputMin.value) {
        sliderStart = inputMin.value;
      } else {
        sliderStart = 0;
      }
      if (inputMax.value) {
        sliderEnd = inputMax.value;
      } else {
        sliderEnd = parseInt(sliderMax, 10);
      }

      noUiSlider.create(html5Slider, {
        start: [sliderStart, sliderEnd],
        connect: true,
        step: 1,
        range: {
          min: parseInt(sliderMin, 10),
          max: parseInt(sliderMax, 10)
        }
      });

      html5Slider.noUiSlider.on("update", function (values, handle) {
        var value = values[handle];

        if (handle) {
          inputMax.value = Math.round(value);
        } else {
          inputMin.value = Math.round(value);
        }
      });

      inputMin.addEventListener("change", function () {
        html5Slider.noUiSlider.set([this.value, null]);
      });

      inputMax.addEventListener("change", function () {
        html5Slider.noUiSlider.set([null, this.value]);
      });

      $(".sidebar-filter-toggle").on("click", function () {
        $(".covid-library-sidebar").toggleClass("show-filters");
        $(".no--border").removeClass("show-sort");
      });
      $(".sidebar-sort-toggle").on("click", function () {
        $(".no--border").toggleClass("show-sort");
        $(".covid-library-sidebar").removeClass("show-filters");
      });
      $(".close-filters").on("click", function () {
        $(".covid-library-sidebar").toggleClass("show-filters");
      });
      $(".reset-sidebar-filters").on("click", function () {
        $("#publication_select").val(null).trigger("change");
        $("#journal_select").val(null).trigger("change");
        $("#startDate").val(null).trigger("change");
        $("#endDate").val(null).trigger("change");
        html5Slider.noUiSlider.set([0, 19]);
        $(".checkbox input").prop("checked", false);
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function customersurveyScript($, Drupal) {
  Drupal.behaviors.customersurvey = {
    attach: function attach(context) {
      var $parentSelector = $('.customer-survey', context);

      $parentSelector.find('.customer-survey__radio').on('change', function (e) {
        $parentSelector.find('.customer-survey__prompt').removeClass('show');
        $parentSelector.find('.customer-survey__response').addClass('show');
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadphysicianprofilecardScript($, Drupal) {
  Drupal.behaviors.fadphysicianprofilecard = {
    attach: function attach(context) {
      var $profileCard = $('.fad-physician-profile-card', context);
      var state = {
        isFavorited: false
      };

      $profileCard.on('click', '.fad-physician-profile-card__favorite-icon', function toggleFavorited(e) {
        state.isFavorited = !state.isFavorited;
        $(this).toggleClass('active');
      }).on('click', '.fad-physician-profile-card__ratings-link', function (e) {
        if (nwdsi.isMobile) {
          var target = $(e.currentTarget).attr('href');
          $(target).find('a[data-toggle="collapse"]').trigger('click');
        }
      }).on('click', '.fad-physician-profile-card__locations-link', function (e) {
        if (nwdsi.isMobile) {
          var target = $(e.currentTarget).attr('href');
          $(target).find('a[data-toggle="collapse"]').trigger('click');
        }
      });
    }
  };
})(jQuery, Drupal);
// const drupalSettings = (drupalSettings === undefined) ? {} : drupalSettings;
// (function fadPrimarySearchSelectScript($, Drupal, settings) {
//   Drupal.behaviors.fadPrimarySearchSelect = {
//     initSelect2(state, unselecting) {
//       const queryParameters = state.queryParameters;
//       /**
//        *
//        * @param data, Data returned from API
//        * @returns results, Object with a key results
//        *
//        */
//       function processData(data) {
//         let optionsIndex = 0;
//         const results = [];
//         // Create first <option> which we will use as a placeholder for a button
//         results.push({ text: '&lt; Back to all categories', button: true });
//
//         // If Object.entries does not exist, create it.
//         if (!Object.entries)
//           Object.entries = function (obj) {
//             var ownProps = Object.keys(obj),
//               i = ownProps.length,
//               resArray = new Array(i); // preallocate the Array
//             while (i--)
//               resArray[i] = [ownProps[i], obj[ownProps[i]]];
//
//             return resArray;
//           };
//
//         // First loop over group object
//         Object.entries(data.response.results).forEach(([group, children]) => {
//           let moreAvailableResults = false;
//           // Alter optgroup text displayed in the dropdown
//           let groupText = '';
//           if (group === 'term') {
//             groupText = 'Treatments & conditions';
//           } else if (group === 'specialty') {
//             groupText = 'Specialties';
//           } else {
//             groupText = 'Doctors';
//           }
//
//           if (children.length === 4 && !state.activeCategory) {
//             moreAvailableResults = true;
//             children.splice(-1, 1);
//           } else {
//             moreAvailableResults = false;
//           }
//           const processedResult = { text: groupText, group: group.toLowerCase(), children, moreChildren: moreAvailableResults };
//
//           // Then loop over its nested children array
//           Object.entries(children).forEach(([key, item], index, arr) => {
//             item.id = this.ajaxOptions.titleCaseOptions(item.value, group);
//             item.text = item.value;
//             item.group = group;
//             // If end of loop, reset optionsIndex
//             (index === arr.length - 1) ? optionsIndex = 0 : optionsIndex += 1;
//           });
//           // Push processed result to the results array
//           results.push(processedResult);
//         });
//
//         // Select2 expects a very specific data format. This format consists of a
//         // JSON object containing an array of objects keyed by the results key.
//         return {
//           results,
//         };
//       }
//
//       // Typeahead behavior
//       /**
//        *
//        * @param resultsText[str], options we are matching against
//        * @param term[str], search input value
//        *
//        */
//       function markMatch(resultsText, term, group) {
//         // Find where the match is
//         const match = resultsText.toUpperCase().indexOf(term.toUpperCase());
//         const $result = $(`<span data-group="${group}"></span>`);
//
//         // If there is no match, move on
//         if (match < 0) {
//           return $result.text(resultsText);
//         }
//         // Put in whatever text is before the match
//         $result.text(resultsText.substring(0, match));
//         // Mark the match
//         const $match = $(`<span class="select2-rendered__match" data-group="${group}"></span>`).text(resultsText.substring(match, match + term.length));
//
//         return $result
//         // Append the matching text
//           .append($match)
//           // Put in whatever is after the match
//           .append(resultsText.substring(match + term.length));
//       }
//
//       /**
//        *
//        * @param text, String - option
//        * @returns group, String - optgroup
//        *
//        */
//       function processText(text, group) {
//         let processedText = text;
//         // Provider's have titles, like "MD" after their name so we capitalize them
//         if (group === 'provider') {
//           processedText = text.toLowerCase().split(' ').map((word, i, arr) => {
//             if (arr.length - 1 === i) {
//               return word.toUpperCase();
//             }
//             return word.replace(word[0], word[0].toUpperCase());
//           }).join(' ');
//         // Everything else can be title cased
//         } else {
//           processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1).toLowerCase();
//         }
//         return processedText;
//       }
//
//       this.$originalSelect.select2({
//         dropdownParent: $('#fad-search-form__ajax-wrapper'),
//         placeholder: `${Drupal.t('Specialty, condition, treatment, doctor name')}`,
//         minimumInputLength: 3,
//         ajax: {
//           delay: 250, // wait 250 milliseconds before triggering the request
//           cache: false,
//           url: (query) => {
//             // Group ex. providers, specialites, or term
//             if (queryParameters.taxonomy) {
//               query.taxonomy = `&taxonomy=${queryParameters.taxonomy}`;
//             }
//
//             // Number of results to show
//             query.count = queryParameters.count;
//             query.url = queryParameters.apiUrl;
//             query.defaultArgs = queryParameters.defaultArgs;
//             if (!query.term) {
//               query.term = queryParameters.term;
//             }
//             return `${query.url}/suggester/typeahead?q=${query.term}&${query.defaultArgs}&group_results=true&count=${query.count}${query.taxonomy}`;
//           },
//           dataType: 'json',
//           processResults: processData,
//           data: (params) => {
//             const query = {
//               search: params.term,
//               type: 'query',
//             };
//             return query;
//           },
//           titleCaseOptions: processText,
//         },
//         templateResult: (item) => {
//           if (item.loading) {
//             return item.text;
//             // Select2 does not give optgroups an ID. this is how we check for optgroups.
//           } else if (!item.id && item.text && !item.button) {
//             // Title case text
//             item.text = processText(item.text, item.data_parent = '');
//             // If on default optgroups view, add button to result
//             if (!this.state.activeCategory && item.moreChildren) {
//               return $(`<span class="search-form__group">
//                               <h4>${item.text}</h4>
//                               <button data-group="${item.group}" href="#" class="search-form__opt-group-button" role="button" aria-label="View all ${item.text} options">
//                                 ${Drupal.t('See more')} >
//                               </button>
//                             </span>`);
//             } else {
//               return $(`<span class="search-form__group"><h4>${item.text}</h4></span>`);
//             }
//             // The first "optgroup" is the 'Back to all categories button"
//           } else if (item.button) {
//             return $(`<div class="search-form__opt-group-show-less ${this.state.buttonClass}"><button aria-label="Back to all categories">${Drupal.t('&lt; Back to all categories')}</button></div>`);
//             // Only options have an id
//           } else if (item.id) {
//             // Title case text and send group var as well to check type
//             item.text = processText(item.text, item.group);
//             const term = this.state.query.term || '';
//             return markMatch(item.text, term, item.group);
//           }
//         },
//         language: {
//           searching: (params) => {
//             // Intercept the query as it is happening
//             this.state.query = params;
//             // Change this to be appropriate for your application
//             return Drupal.t('Searching...');
//           },
//         },
//       });
//
//       // If an option has been selected, create a new Option object and append it to the control
//       if (this.$originalSelect.find('option').length && !unselecting) {
//         const selectedValue = this.$originalSelect.val();
//         // 3rd param determines where item is "default selected"
//         // 4th param sets the options selected state
//         const newOption = new Option(selectedValue, selectedValue, true, true);
//
//         this.$originalSelect.append(newOption).trigger('change');
//       }
//     },
//
//     state: {
//       isOpen: false,
//       activeCategory: false,
//       $detachedButton: '',
//       storedInput: '',
//       buttonClass: 'hidden',
//       unselecting: false,
//       query: {},
//       queryParameters: {
//         defaultArgs: '',
//         count: 4,
//         taxonomy: '',
//         term: '',
//         apiUrl: ''
//       },
//     },
//
//     change(newState) {
//       if (!nwdsi.isIE()) {
//         this.state = Object.assign({}, this.state, newState);
//       } else if (nwdsi.isIE()) {
//         this.state = $.extend(this.state, newState);
//       }
//       // Check if user is on an optgroup list view
//       if (this.state.isOpen && this.state.activeCategory) {
//         // First we close select2 to reset query
//         this.$originalSelect.select('close');
//         // Then we update the query terms
//         this.initSelect2(this.state);
//         // Init select2 with updated query terms
//         this.$originalSelect.select2('open');
//         // Update input field with stored value and trigger search query
//         this.$parentSelector.find('.select2-search__field').val(this.state.storedInput).trigger('keyup');
//         // Change 'back to categories' button class to show
//         this.state.buttonClass = 'visible';
//         // Remove hidden class from 'back to all categories' parent
//         this.$parentSelector.find('.search-form__opt-group-show-less').parent('li').removeClass('hidden');
//       } else if (this.state.isOpen && !this.state.activeCategory) {
//         // Init select2
//         this.initSelect2(this.state);
//         // Open select2 with update parameters
//         this.$originalSelect.select2('open');
//         // Append saved search term back into text field and programatically trigger a query
//         this.$parentSelector.find('.select2-search__field').val(this.state.storedInput).trigger('keyup');
//         // Hide 'back to all categories button'
//         this.$parentSelector.find('.search-form__opt-group-show-less.hidden').parent('li').addClass('hidden');
//       }
//     },
//
//     reset(newState) {
//       if (!nwdsi.isIE()) {
//         this.state = Object.assign({}, this.state, newState);
//       } else if (nwdsi.isIE()) {
//         this.state = $.extend(this.state, newState);
//       }
//       // Reset search dropdown to default: 3 items per optgroup visible
//       this.initSelect2(this.state, this.state.unselecting);
//     },
//
//     attach(context) {
//       // Scope parent
//       this.$parentSelector = $('#fad-search-form__ajax-wrapper', context);
//       // <select> form id that select2 initializes against
//       this.$originalSelect = $('#search-form__form--category-search', context);
//
//       // Scope form
//       this.$findAdoctorForm = $('#find-a-doctor', context);
//       const $sortResultsDropdown = this.$findAdoctorForm.find('#search-doctors-select-sort');
//
//       let defaultArgs = '';
//       let apiUrl = '';
//
//       // Bail immediately if our widget doesn't even exist, improves performance
//       if (!this.$parentSelector.length) { return false; }
//
//       // Default query arguments to be added to api call
//       if (settings.fad) {
//         defaultArgs = settings.fad.defaultQueryArguments;
//         apiUrl = settings.api.url;
//       } else {
//         defaultArgs = '';
//       }
//       this.state.queryParameters.defaultArgs = defaultArgs;
//       this.state.queryParameters.apiUrl = apiUrl;
//
//       // On dropdown open
//       this.$originalSelect.on('select2:open', () => {
//         this.state.isOpen = true;
//         // Accessibility
//         this.$parentSelector.find('.select2-results__options').attr('role', 'list');
//       });
//
//       // On dropdown close
//       this.$originalSelect.on('select2:close', () => {
//         // Reset state
//         this.reset({
//           isOpen: false,
//           activeCategory: false,
//           buttonClass: 'hidden',
//           storedInput: '',
//           queryParameters: {
//             count: 4,
//             taxonomy: '',
//             term: '',
//             defaultArgs: defaultArgs,
//             apiUrl: apiUrl,
//           },
//         });
//       });
//
//       // When clearSelection button is clicked
//       this.$parentSelector.on('click', 'b', () => {
//         if (this.$parentSelector.find('.select2').hasClass('select2-container--selected')) {
//           // Set sort to a-z
//           $sortResultsDropdown.val('az');
//           // Remove options from dom for a fresh ajax call
//           this.$originalSelect.find('option').remove();
//           $('#search-doctors-select-term-group', context).val('');
//           // Reset select2 and state
//           this.reset({
//             isOpen: false,
//             activeCategory: false,
//             buttonClass: 'hidden',
//             storedInput: '',
//             unselecting: true,
//             queryParameters: {
//               count: 4,
//               taxonomy: '',
//               term: '',
//               defaultArgs: defaultArgs,
//               apiUrl: apiUrl,
//             },
//           });
//           // If mobile, open select2
//           if (window.matchMedia('(max-width: 767px)').matches) {
//             this.$originalSelect.select2('open');
//             // On desktop, keep dropdown close and submit form
//           } else {
//             this.$originalSelect.select2('close');
//             // jQuery('.invisible-form-submit')[0].click();
//             this.$findAdoctorForm.submit();
//           }
//         }
//       });
//
//       this.$parentSelector.on('input', 'input.select2-search__field', (el) => {
//         this.state.storedInput = $(el.currentTarget).val();
//       });
//
//       // Navigation from default limited list to active category full list
//       this.$parentSelector.on('click', '.search-form__opt-group-button', (el) => {
//         el.preventDefault();
//         const activeCategory = $(el.currentTarget).data('group');
//         this.change({
//           isOpen: true,
//           activeCategory: true,
//           queryParameters: {
//             count: 100,
//             taxonomy: activeCategory,
//             term: this.state.storedInput,
//             defaultArgs: defaultArgs,
//             apiUrl: apiUrl,
//           },
//         });
//       });
//
//       // Navigating from active category full list to defaut limited list of optgroups
//       this.$parentSelector.on('click', '.search-form__opt-group-show-less', () => {
//         this.change({
//           isOpen: true,
//           activeCategory: false,
//           buttonClass: 'hidden',
//           queryParameters: {
//             count: 4,
//             taxonomy: '',
//             defaultArgs: defaultArgs,
//             apiUrl: apiUrl,
//           },
//         });
//       });
//
//       // Inintiate select2
//       this.initSelect2(this.state, this.state.unselecting);
//     },
//   };
// })(jQuery, Drupal, drupalSettings);
"use strict";
"use strict";

(function profileResultScript($, Drupal) {
  Drupal.behaviors.profileResult = {
    attach: function attach(context) {
      var $profileCard = $(".fad-profile-result, .profile-card-v2", context);
      if (!$profileCard.length) return;
      console.log('Profile card');
      var state = {
        isFavorited: false
      };

      $profileCard.on("click", ".fad-profile-result__btn", function toggleLocationsList(e) {
        var $parent = $(e.delegateTarget);
        var $button = $(this);
        var $buttonText = $button.find("span");
        var $locationsList = $parent.find(".fad-profile-result__location");

        if (!$parent.hasClass("locations-visible")) {
          $locationsList.addClass("show");
          $button.attr("aria-expanded", "true");
          $buttonText.html("Show less locations");
          $parent.addClass("locations-visible");
        } else {
          $locationsList.removeClass("show");
          $button.attr("aria-expanded", "false");
          $buttonText.html("Show all locations");
          $parent.removeClass("locations-visible");
        }
      }).on("click", "button.fad-profile-result__favorite-icon", function toggleFavorited(e) {
        var $parent = $(e.delegateTarget);
        state.isFavorited = !state.isFavorited;
        if (!state.isFavorited === false) {
          $parent.find("a.tooltip__link").attr("data-toggle", "");
          $parent.find("a.tooltip__link").attr("data-content", "");
        }
        $(this).toggleClass("active");
      }).on("mouseover", "button.fad-profile-result__favorite-icon", function toggleHoverStyles(e) {
        var $parent = $(e.delegateTarget);
        if (state.isFavorited) {
          $parent.find(".popover").remove();
        }
      }).on("click", ".maa-online", function setPhysicianId(e) {
        localStorage.setItem("physician_id", e.target.dataset.provider_id);
        localStorage.setItem("echo_id", e.target.dataset.echo_id);
      }).on("click", ".link--appointment-btn", function setRaaPrepopulate(e) {
        localStorage.setItem("raaPrepopulate", JSON.stringify({
          provider_id: e.target.dataset.provider_id,
          provider_specialty: e.target.dataset.specialty,
          provider_name: e.target.dataset.fullname
        }));
        // set the prepopulate cookie to expire in one hour
        var prepop_date = new Date();
        prepop_date.setTime(prepop_date.getTime() + 60 * 60 * 1000);
        var expirePrepop = prepop_date.toGMTString();
        nwdsi.setCookie('raaPrepopulate', expirePrepop, JSON.stringify({ provider_name: e.target.dataset.fullname })); // key, duration, value
      }).on("click", ".profile-card-v2__button-wrapper", "a[href$='/request-an-appointment']", function setRaaPrepopulate(e) {
        // set the prepopulate cookie to expire in one hour
        var prepop_date = new Date();
        prepop_date.setTime(prepop_date.getTime() + 60 * 60 * 1000);
        var expirePrepop = prepop_date.toUTCString();
        var $info_wrapper = $(e.target).closest('.profile-card-v2');
        var p_name = $info_wrapper.find('.profile-card-v2__name a').text();
        var p_specialty = $info_wrapper.find('.profile-card-v2__specialties').text();
        nwdsi.setCookie('raaPrepopulate', expirePrepop, JSON.stringify({
          provider_name: p_name
        })); // key, duration(default to 10 yrs if false), value
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadSearchResultsBarScript($, Drupal) {
  Drupal.behaviors.fadSearchResultsBar = {
    attach: function attach(context) {
      var $filterForm = $('.fad-search-results-bar__filter-form', context);
      var $filterFormDesktopParent = $('.fad-search-results-bar__filter', context);
      var $filterFormMobileParent = $('.fad-controls--mobile .sort', context);
      var $originalSelect = $('#search-doctors-select-sort', context);
      var selectedValue = $originalSelect.val();
      var $detachedElement = '';

      // Disable dropdown if value is location
      if ($originalSelect.val() === 'location') {
        $originalSelect.prop('disabled', 'disabled');
      }

      // Disable select2 on mobile
      function change() {
        if (window.matchMedia('(min-width: 768px)').matches) {
          // If desktop, first initiate select2
          $filterForm.select2({
            dropdownParent: $filterFormDesktopParent,
            minimumResultsForSearch: Infinity
          });

          // Then remove it from the DOM and append it back into its original parent
          $filterFormDesktopParent.append($filterForm.detach());
        } else if ($filterForm.data('select2')) {
          // If mobile, disable select2, add mobile styles and remove from DOM
          $detachedElement = $filterForm.select2('destroy').addClass('isMobile').detach();
          // Remove select2's required placeholder
          $filterForm.find('option').eq(0).val('').text('');
          // Then append it to its mobile parent element
          $filterFormMobileParent.append($detachedElement);
          // And clear $detachedElement
          $detachedElement = '';
        }
      }

      change();

      $(window).on('resize', function () {
        change();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function filterSidebarScript($, Drupal) {
  Drupal.behaviors.filterSidebar = {
    renderPag: function renderPag(pag) {
      // sample pag obj
      // pag = {
      //   "showing": {
      //       "start": 101,
      //       "end": 110,
      //       "total": 122
      //   },
      //   "total_pages": 12,
      //   "pages_to_display": 7,
      //   "per_page": 10,
      //   "current_page": 10,
      //   "previous_page": 9,
      //   "next_page":11,
      //   "first_page": 1,
      //   "last_page": 12,
      //   "offset": 0,
      //   "total_results": 122,
      //   "total_results_unfiltered": 122,
      //   "display": [
      //       {
      //           "text": 7,
      //           "url": "/v2/vax-locations/all/?page=7",
      //           "url_params": "page=7",
      //           "status": ""
      //       },
      //       {
      //           "text": 8,
      //           "url": "/v2/vax-locations/all/?page=8",
      //           "url_params": "page=8",
      //           "status": ""
      //       },
      //       {
      //         "text": 9,
      //         "url": "/v2/vax-locations/all/?page=9",
      //         "url_params": "page=9",
      //         "status": ""
      //     },
      //     {
      //         "text": 10,
      //         "url": "/v2/vax-locations/all/?page=10",
      //         "url_params": "page=10",
      //         "status": "active"
      //     },
      //     {
      //       "text": 11,
      //       "url": "/v2/vax-locations/all/?page=11",
      //       "url_params": "page=11",
      //       "status": ""
      //   },
      //   {
      //       "text": 12,
      //       "url": "/v2/vax-locations/all/?page=12",
      //       "url_params": "page=12",
      //       "status": ""
      //   },
      //   {
      //     "text": 13,
      //     "url": "/v2/vax-locations/all/?page=13",
      //     "url_params": "page=13",
      //     "status": ""
      // }
      //   ]
      // }
      var pagination = void 0;
      // need to empty out the pagination or it will display defaults
      if (pag.total_pages <= 1) return pagination = '';
      if (pag.total_pages > 1) {
        pagination = '<ul class="pagination">\n';
        // set previous links
        if (pag.previous_page > 0) {
          pagination += '<li class="pager-first first"><a title="Go to first page"><i class="fal fa-angle-double-left" aria-hidden="true"></i> <span class="pagination__text">first</span></a></li>\n' + '<li class="pager-previous"><a title="Go to previous page"><i class="fal fa-angle-left" aria-hidden="true"></i> <span class="pagination__text">previous</span></a></li>\n';
        }
        // set page links
        var item_list = pag.display;
        for (var index = 0; index < item_list.length; index++) {
          if (item_list[index].status === 'active') {
            pagination += '<li class="pager-current"><span class="pagination__current">' + item_list[index].text + '</span></li>\n';
          } else {
            pagination += '<li class="pager-item"><a title="Go to page ' + item_list[index].text + '">' + item_list[index].text + '</a></li>\n';
          }
        }
        // set next links
        if (pag.next_page > 0) {
          pagination += '<li class="pager-next"><a title="Go to next page"><span class="pagination__text">next</span> <i class="fal fa-angle-right" aria-hidden="true"></i></a></li>\n' + '<li class="pager-last last"><a title="Go to last page"><span class="pagination__text">last</span> <i class="fal fa-angle-double-right" aria-hidden="true"></i></a></li>\n';
        }
        pagination += '</ul>\n';
      }

      return pagination;
    },
    getData: function getData(url, el, params, $form, day, onlyJJ) {
      var hasFilterControls = el.filter_controls ? el.filter_controls : false;
      var dataObj = void 0;
      params === '' ? dataObj = {} : dataObj = params;
      $.ajax({
        type: 'get',
        method: 'get',
        contentType: 'application/json',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        dataType: 'json',
        data: dataObj
      }).done(function (response) {
        // sample responses to hardcode in case of CORS
        // let response = { "code": 200, "query": [], "response": { "locations": [{ "id": 100, "name": "Nassau - Roosevelt High School (1 Wagner Ave) -- Pfizer", "address": "1 Wagner Avenue", "suite": "", "city": "Roosevelt", "state": "NY", "zip": "11575", "county": "Nassau", "latitude": "40.685", "longitude": "-73.5804", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TsylEAC", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "open", "current_status": "closed", "time_open": "2:00pm", "time_closed": "6:45pm" }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 99, "name": "Nassau - Bethlehem of Judea Church (83 Greenwich St) -- Pfizer", "address": "83 Greenwich Street", "suite": "", "city": "Hempstead", "state": "NY", "zip": "11550", "county": "Nassau", "latitude": "40.7034", "longitude": "-73.6209", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TsygEAC", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "open", "current_status": "open", "time_open": "9:00am", "time_closed": "1:45pm" }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 98, "name": "Richmond - Berry Houses NYCHA (26 Dongan Hills Ave) -- Pfizer", "address": "26 Dongan Hills Avenue", "suite": "", "city": "Staten Island", "state": "NY", "zip": "10306", "county": "Richmond", "latitude": "40.5882", "longitude": "-74.1016", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TsvXEAS", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "open", "current_status": "closed", "time_open": "12:00pm", "time_closed": "4:45pm" }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 97, "name": "Suffolk - Salsa Party (22 First Avenue) -- Pfizer", "address": "22 1st Street", "suite": "", "city": "Brentwood", "state": "NY", "zip": "11717", "county": "Suffolk", "latitude": "40.7666", "longitude": "-73.2527", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TstyEAC", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "open", "current_status": "closed", "time_open": "6:00pm", "time_closed": "8:45pm" }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 91, "name": "Nassau - NYS Dept of Labor (303 W. Old Country Rd) -- J&J", "address": "303 West Old Country Road", "suite": "", "city": "Hicksville", "state": "NY", "zip": "11801", "county": "Nassau", "latitude": "40.7596", "longitude": "-73.5352", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TscYEAS", "vaccine_manufacturer": "Johnson & Johnson (Janssen)", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "wednesday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "thursday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 89, "name": "Suffolk - Dolan (284 Pulaski Rd.) -- Pfizer", "address": "284 Pulaski Road", "suite": "", "city": "Greenlawn", "state": "NY", "zip": "11740", "county": "Suffolk", "latitude": "40.8584", "longitude": "-73.3884", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TWHNEA4", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": true, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "open", "current_status": "open", "time_open": "9:00am", "time_closed": "3:45pm" }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 88, "name": "Nassau - Western Beef Parking Lot (322 Nassau Rd) -- Pfizer", "address": "322 Nassau Road", "suite": "", "city": "Roosevelt", "state": "NY", "zip": "11575", "county": "", "latitude": "40.6805", "longitude": "-73.5895", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TslkEAC", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "open", "current_status": "open", "time_open": "9:00am", "time_closed": "12:45pm" }], "distance": null }, { "id": 87, "name": "Suffolk - Perry B Duryea State Office (250 Veterans Memorial Hwy) -- J&J", "address": "250 Veterans Memorial Highway", "suite": "", "city": "Hauppauge", "state": "NY", "zip": "11788", "county": "Suffolk", "latitude": "40.8204", "longitude": "-73.2196", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TsejEAC", "vaccine_manufacturer": "Johnson & Johnson (Janssen)", "is_walk_in": false, "has_booster_shot": false, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "wednesday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "thursday", "general_status": "open", "current_status": "open", "time_open": "8:30am", "time_closed": "3:30pm" }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 58, "name": "Suffolk - Bohemia Babies R Us (5181 Sunrise Hwy) -- Pfizer", "address": "5181 Sunrise Highway", "suite": "", "city": "Bohemia", "state": "NY", "zip": "11716", "county": "Suffolk", "latitude": "40.7648", "longitude": "-73.0926", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TWHNEA4", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": true, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "open", "current_status": "closed", "time_open": "12:00pm", "time_closed": "6:45pm" }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }, { "id": 56, "name": "Suffolk - Riverhead Entenmann (4 West 2nd St) -- Pfizer", "address": "4 West 2nd Street", "suite": "", "city": "Riverhead", "state": "NY", "zip": "11901", "county": "Suffolk", "latitude": "40.9188", "longitude": "-72.664", "program_url": "https://northwellvaccine.force.com/s/?id=a1T4x000007TT2OEAW", "vaccine_manufacturer": "Pfizer test test", "is_walk_in": false, "has_booster_shot": true, "hours": [{ "day": "monday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "tuesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "wednesday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "thursday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "friday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }, { "day": "saturday", "general_status": "open", "current_status": "open", "time_open": "9:00am", "time_closed": "3:45pm" }, { "day": "sunday", "general_status": "closed", "current_status": "closed", "time_open": null, "time_closed": null }], "distance": null }], "pagination": { "showing": { "start": 1, "end": 10, "total": 18 }, "total_pages": 2, "pages_to_display": 7, "per_page": 10, "current_page": 1, "previous_page": 0, "next_page": 2, "first_page": 1, "last_page": 2, "offset": 0, "total_results": 18, "total_results_unfiltered": 18, "display": [{ "text": 1, "url": "/v2/vax-locations/all?page=1", "url_params": "page=1", "status": "active" }, { "text": 2, "url": "/v2/vax-locations/all?page=2", "url_params": "page=2", "status": "" }] }, "facets": { "manufacturers": [{ "name": "Johnson & Johnson (Janssen)", "short_name": "J&J", "slug": "johnson-johnson-janssen" }, { "name": "Moderna test", "short_name": "Moderna test", "slug": "moderna" }, { "name": "Pfizer test test", "short_name": "Pfizer test test", "slug": "pfizer" }, { "name": "Test 1", "short_name": "test short", "slug": "test1" }] }, "search": { "manufacturer_placeholder": "Manufacturer (J&J, Moderna test, Pfizer x)" } } }
        var results_bar_text = void 0;
        var locations = response.response.locations;
        var pagination = response.response.pagination;
        var facets = response.response.facets.manufacturers;
        var placeholder = response.response.search.manufacturer_placeholder;
        drupalSettings.multiselectPlaceholder = placeholder;
        drupalSettings.multiselectVariant = 'vaccine_page';
        var $multiSelect = $('select[name="manufacturer[]"]');

        window.addEventListener('load', function (event) {
          var $placeholder = $('.multiselect-selected-text');
          $multiSelect.empty();
          for (var index in facets) {
            if (facets.hasOwnProperty(index)) {
              $multiSelect.append('<option value="' + facets[index].slug + '">' + facets[index].name + '</option>');
            }
          }
          $multiSelect.attr('multiple', 'multiple');
          var $multiSelectdd = $('.multiselect.dropdown-toggle');
          // $multiSelectdd.attr('title', placeholder);
          // $multiSelect.attr({ 'title': placeholder, 'data-placeholder': placeholder })
          $multiSelect.multiselect('rebuild');
          $placeholder.html(placeholder + ' <i class="fal fa-angle-down"></i>');
          $multiSelectdd.addClass('remove-disabled');
        });
        $form.data('pagination', pagination);
        var html = void 0;
        el.target.html('');
        // if results list comes back with 0 results
        if (locations.length) {
          for (var i = 0; i < locations.length; i++) {
            var distance = locations[i].distance;
            var isWalkin = locations[i].is_walk_in;
            html = '<div class="content-list__list-item row">\n' + '<div class="card card--filter-list container card--full-width card--no-image">';
            html += '<div class="card__content col-sm-12">\n' + '<div class="card-content__inner-wrap">\n' + '<div class="card__title">\n' + locations[i].name + '</div>\n' + '<div class="card__type">\n' + 'Manufacturer: <strong>' + locations[i].vaccine_manufacturer + '</strong>\n' + '</div>\n' + '<div class="row card__address">\n' + '<div class="col-md-1 col-sm-1 col-xs-1 map-marker">\n' + '<a href="https://www.google.com/maps/place/' + locations[i].address + '+' + locations[i].city + '+' + locations[i].state + '+' + locations[i].zip + '" target="_blank"><i class="fas fa-map-marker-alt"></i></a>\n' + '</div>\n' + '<div class="col-sm-8 col-md-8 col-xs-10">\n' + '<div class="address ">\n' + '<div class="address__address">\n' + '<span class="address__street">\n' + '<span>' + locations[i].address + '</span>\n';
            if (locations[i].suite !== '') {
              html += '<span>' + locations[i].suite + '</span>\n';
            }
            html += '</span>\n' + '<span>' + locations[i].city + '</span>,\n' + '<span>' + locations[i].state + '</span>\n' + '<span>' + locations[i].zip + '</span>\n' + '</div>\n';
            if (distance) {
              var currentZip = $form.find('input[name=zip]').val();
              html += '<strong>\n' + +locations[i].distance + ' miles from ' + currentZip + ' \n' + '</strong>\n';
            }
            html += '</div>\n' + '</div>\n' + '</div>\n';
            // start hours block
            if (locations[i].hours.length) {
              if (day === 0) day = 7;
              var currentStatus = locations[i].hours[day - 1].current_status === 'open' ? 'Open now' : 'Closed';
              html += '<div class="filter-list__hours">' + '<i class="far fa-clock"></i><span class="card__filter-list_hours-status card__filter-list_hours-status--' + locations[i].hours[day - 1].current_status + '"> ' + currentStatus + '</span> <span>&bull;</span> \n';
              if (locations[i].hours[day - 1].current_status === 'open') {
                html += locations[i].hours[day - 1].time_open + ' - ' + locations[i].hours[day - 1].time_closed;
              } else {
                html += 'View operating hours \n';
              }
              html += '<button type="button" class="btn card__filter-list_hours--btn" data-toggle="collapse" data-target="#hours-collapse' + i + '"><i class="fal fa-chevron-down"></i></button>\n' + '<div id="hours-collapse' + i + '" class="collapse card__filter-list_hours--drop-down">\n';
              for (var c = 0; c < locations[i].hours.length; c++) {
                if (locations[i].hours[c].general_status === 'closed') {
                  html += '<div class="card__filter-list_hours--dd-item"><span class="card__filter-list_hours--dd-day">' + locations[i].hours[c].day + '</span><span class="card__filter-list_hours--dd-closed">Closed</span></div>';
                } else {
                  html += '<div class="card__filter-list_hours--dd-item"><span class="card__filter-list_hours--dd-day">' + locations[i].hours[c].day + '</span><span class="card__filter-list_hours--dd-time">' + locations[i].hours[c].time_open + ' - ' + locations[i].hours[c].time_closed + '</span></div>\n';
                }
              }
              html += '</div><!-- div end 1 -->\n' + '</div><!-- div end 2 -->\n';
            }
            html += '<div class="vax-badge-container">\n';
            if (locations[i].has_third_dose) {
              html += '<div class="filter-list__card--booster">\n' + 'Third dose\n' + '</div>\n';
            }
            if (locations[i].has_booster_shot) {
              html += '<div class="filter-list__card--booster">\n' + 'Booster dose\n' + '</div>\n';
            }
            if (locations[i].has_pediatric_available) {
              html += '<div class="filter-list__card--booster">\n' + 'Pediatric dose (ages 5-11)\n' + '</div>\n';
            }
            html += '</div><!-- badge container end -->\n';
            html += '</div><!-- div end 3 -->\n' + '<div class="card_content_wrap">\n' + '<div class="make-appointment-btn">\n' + '<a href="' + locations[i].program_url + '" class="link link--appointment-btn" target="_blank">\n' + '<i class="fal fa-calendar-check " aria-hidden="false"></i>Make an appointment\n' + '</a>\n' + '</div>\n';
            if (isWalkin) {
              html += '<div class="card__filter-list--walkin">\n' + '<div class="filter-list--walkin">\n' + '<i class="far fa-check"></i>Walk-in appointments available\n' + '</div>\n' + '</div>';
            }
            html += '</div>\n' + '</div>\n' + '</div>';
            el.target.append(html);
            $('[data-toggle="popover"]').popover();
          }
          if (drupalSettings.filterPage && drupalSettings.filterPage.variant === 'vaccinehub') {}
          // if pagination exists
          if (pagination) {
            if (pagination.showing.start === pagination.showing.end) {
              results_bar_text = 'Showing ' + pagination.showing.start + ' of ' + pagination.total_results + ' results';
            } else {
              results_bar_text = 'Showing ' + pagination.showing.start + ' - ' + pagination.showing.end + ' of ' + pagination.total_results + ' results';
            }
            el.pag_wrapper.html(Drupal.behaviors.filterSidebar.renderPag(pagination));
          }
          el.preloader.fadeOut(400, function () {
            el.content_list.fadeIn();
            if (hasFilterControls) el.filter_controls.addClass('fadeIn');
            // show pagination results bar
            if (el.search_results_bar.length) {
              el.search_results_bar.fadeIn().removeClass('no-locations');
              el.results_bar_pag.html(results_bar_text);
            }
            // show pagination
            if (el.pag_wrapper.length) {
              el.pag_wrapper.fadeIn();
              // set up scroll to top
              var elementOffset = el.pag_wrapper.offset().top;
              if (nwdsi.isMobile()) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (elementOffset > 450) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }
          });
          // if johnson & johnson is the only manufacturer then disable the filter for 3rd dose
          if (onlyJJ) {
            $form.find('#has_booster_shot').prop('disabled', true);
          } else {
            $form.find('#has_booster_shot').prop('disabled', false);
          }
          // if no results are returned
        } else {
          if ($form.data('formData')) {
            // make sure the filter in mobile is accessible
            if (hasFilterControls) el.filter_controls.css('opacity', 1);
          } else {
            // results are empty this is the page load
            // disable filter elements
            $form.find('checkbox').prop('disabled', true);
            $form.find('input').prop('disabled', true);
            $form.find('select').prop('disabled', true);
            el.submit.prop('disabled', true);
          }
          if (drupalSettings.filterPage && drupalSettings.filterPage.variant === 'vaccinehub') {
            if ($form.data('formData') && $form.data('formData') !== 'zip=') {
              html = '<h3>No appointments available in the area you currently requested.</h3>\n' + '<p>Please expand your search area or check back for when new appointments are made available.</p>\n';
            } else {
              html = '<h3>Due to limited supply, vaccine appointments are currently unavailable.</h3>\n' + '<p>New appointments will be added as available.</p>\n';
            }
            el.search_results_bar.addClass('no-locations').css({ display: 'block' });
            el.target.append(html);
            el.preloader.fadeOut(400, function () {
              el.content_list.fadeIn();
              if (hasFilterControls) el.filter_controls.addClass('fadeIn');
            });
          } else {
            html = '<h3>Suggestions:</h3>\n' + '<ul>\n' + '<li>\n' + '<a href="https://www.northwell.edu/search">Use the search option, and let us do the work for you</a>\n' + '</li>\n' + '<li>\n' + '<a href="https://www.northwell.edu/">Visiting our homepage</a>\n' + '</li>\n' + '</ul>\n' + '<h3>Still stuck?:</h3>\n' + '<ul>\n' + '<li>\n' + '<a href="https://www.northwell.edu/find-care">Find Care</a>\n' + '</li>\n' + '<li>\n' + '<a href="https://www.northwell.edu/manage-your-care">Manage your care</a>\n' + '</li>\n' + '<li>\n' + '<a href="https://www.northwell.edu/support-and-resources">Support &amp; resources</a>\n' + '</li>\n' + '<li>\n' + '<a href="https://www.northwell.edu/research-and-education">Research &amp; education</a>\n' + '</li>\n' + '<li>\n' + '<a href="https://www.northwell.edu/about">About Northwell Health</a>\n' + '</li>\n' + '</ul>\n' + '<p> </p>\n';

            el.preloader.fadeOut(400, function () {
              el.target.append(html);
              el.content_list.fadeIn();
              if (hasFilterControls) el.filter_controls.removeClass('fadeIn');
              // show pagination results bar
              if (el.search_results_bar.length) {
                el.results_bar_pag.html('<h2>No results match your search</h2>');
                el.search_results_bar.fadeIn();
              }
            });
          }
        }
      }).fail(function (error) {
        console.log('CALL FAILED');
        console.log(error);
      });
    },
    attach: function attach(context) {
      var $filter = $('#filter_sidebar');
      // bailout script
      if (!$('.filter-list__form-vaccine').length) return;
      // set vars
      var $submit = $('#btnSubmit');
      var $filter_controls = $('#filter_controls');
      var $preloader = $('#filter-list-preloader', context);
      var $target = $('.content-list__list--results', context);
      var $content_list = $('.content-list', context);
      var $search_results_bar = $('.search-results-bar__wrapper', context);
      var $results_bar_pag = $('.search-results-bar__pagination-status', context);
      var $pag_wrapper = $('.pagination_wrapper', context);
      var $hours = $('.filter-list__hours', context);
      var $checkbox = $('.checkbox', context);
      var $checkbox_filter = $('#has_booster_shot', context);
      var date = new Date();
      var $form = $('.filter-list-page-form');
      var day = date.getDay();

      var DOMels = {
        filter: $filter,
        preloader: $preloader,
        target: $target,
        content_list: $content_list,
        search_results_bar: $search_results_bar,
        results_bar_pag: $results_bar_pag,
        pag_wrapper: $pag_wrapper,
        filter_controls: $filter_controls,
        submit: $submit
      };
      var apiUrl = void 0;
      if (drupalSettings.filterPage) {
        apiUrl = drupalSettings.filterPage.apiurl;
      } else {
        apiUrl = 'https://stage-api.northwell.io/v2/vax-locations/all';
      }
      // disable default from submit
      $form.submit(function (e) {
        e.preventDefault();
        var dataArray = $form.serializeArray();
        var manCount = 0;
        var jJ = false;
        var onlyJJ = false;
        $(dataArray).each(function (i, field) {
          if (field.name === 'manufacturer[]') manCount++;
          if (field.value === 'johnson-johnson-janssen') jJ = true;
        });
        if (manCount === 1 && jJ) onlyJJ = true;
        var params = $.param(dataArray);
        if ($search_results_bar.length) $search_results_bar.fadeOut();
        if ($pag_wrapper.length) $pag_wrapper.fadeOut();
        $form.data('formData', params);
        $content_list.fadeOut(400, function () {
          $preloader.fadeIn(400, function () {
            Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day, onlyJJ);
          });
        });
      });
      // get initial data load
      this.getData(apiUrl, DOMels, null, $form, day);
      // attach handlers
      $('.sidebar-filter-toggle').on('click', function () {
        $filter.toggleClass('show-filters');
        $filter_controls.toggleClass('hidden');
      });
      $('.close-filters').on('click', function () {
        $filter.toggleClass('show-filters');
        $filter_controls.toggleClass('hidden');
      });
      $('.reset-sidebar-filters').on('click', function () {
        // $form.trigger('reset');
        // $form[0].reset();
        $('.checkbox input').each(function (i, e) {
          if ($(e).is(':checked')) {
            $(e).prop('checked', false).removeAttr('checked');
          }
          if ($(e).val() == 'true') {
            $(e).val(false);
          }
        });
        $form.submit();
      });
      // set up pagination handlers
      $pag_wrapper.on('click', '.pager-previous a', function (e) {
        e.preventDefault();
        var params = $form.data('formData') ? $form.data('formData') + '&' : '';
        var pagination = $form.data('pagination');
        params = params + 'page=' + pagination.previous_page;
        Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day);
      });
      $pag_wrapper.on('click', '.pager-first a', function (e) {
        e.preventDefault();
        var params = $form.data('formData') ? $form.data('formData') + '&' : '';
        params = params + 'page=1';
        Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day);
      });
      $pag_wrapper.on('click', '.pager-next a', function (e) {
        e.preventDefault();
        var params = $form.data('formData') ? $form.data('formData') + '&' : '';
        var pagination = $form.data('pagination');
        params = params + 'page=' + pagination.next_page;
        Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day);
      });
      $pag_wrapper.on('click', '.pager-last a', function (e) {
        e.preventDefault();
        var params = $form.data('formData') ? $form.data('formData') + '&' : '';
        var pagination = $form.data('pagination');
        params = params + 'page=' + pagination.total_pages;
        Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day);
      });
      $pag_wrapper.on('click', '.pager-item a', function (e) {
        e.preventDefault();
        var page = $(this).text();
        var params = $form.data('formData') ? $form.data('formData') + '&' : '';
        params = params + 'page=' + page;
        Drupal.behaviors.filterSidebar.getData(apiUrl, DOMels, params, $form, day);
      });
      $target.on('click', 'button.card__filter-list_hours--btn', function (e) {
        $(this).toggleClass('is_open');
      });
      // was getting strange behavior with checkboxes so added handler
      $checkbox.on('click', '[type=checkbox]', function (e) {
        if ($(this).is(':checked')) {
          $(this).prop('checked', true).attr('checked', 'checked');
        } else {
          $(this).prop('checked', false).removeAttr('checked');
        }
        if ($(this).val() == 'true') {
          $(this).val(false);
        } else {
          $(this).val(true);
        }
        $form.submit();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function footerScript($, Drupal) {
  Drupal.behaviors.footer_script = {
    attach: function attach(context) {
      $(document).ready(function () {
        $('.ft-nav-1').click(function () {
          $('.footer__nav-1').toggleClass('show-mobile-foot');
          $('.ft-i-1').toggleClass('ft-icon-rev');
        });
      });

      $(document).ready(function () {
        $('.ft-nav-2').click(function () {
          $('.footer__nav-2').toggleClass('show-mobile-foot');
          $('.ft-i-2').toggleClass('ft-icon-rev');
        });
      });

      $(document).ready(function () {
        $('.ft-nav-3').click(function () {
          $('.footer__nav-3').toggleClass('show-mobile-foot');
          $('.ft-i-3').toggleClass('ft-icon-rev');
        });
      });

      $(document).ready(function () {
        $('.ft-nav-4').click(function () {
          $('.footer__policy').toggleClass('show-mobile-foot');
          $('.ft-i-4').toggleClass('ft-icon-rev');
        });
      });
    }
  };
})(jQuery, Drupal);
"use strict";

(function secondInputResizeScript($, Drupal, settings) {
    Drupal.behaviors.handleSecondInputResize = {
        attach: function attach(context) {
            var $tabbedSearch = $(".tabbed-search__content", context);
            if (!$tabbedSearch.length) return;

            var $firstSelect2 = $("select[id*=search-doctors-select-specialty]").not("#search-nav select[id*=search-doctors-select-specialty]");

            //breakpoints
            var mediaQueryDesktop = window.matchMedia('(min-width:992px)');
            var mediaQueryTablet = window.matchMedia('(min-width: 768px) and (max-width:991px');

            function isMobileOS() {
                return "ontouchstart" in document.documentElement;
            }

            var changeWindow = isMobileOS() ? "onOrientationChange" : "resize";

            //function to check window width and adjust input
            function resizeInput() {
                var formGroup1Width = void 0;

                if (mediaQueryTablet.matches) {
                    formGroup1Width = '250px';
                }

                if ($tabbedSearch) {
                    var searchFormGroup = $(".search-form__group-wrapper");
                    if (searchFormGroup) {
                        var formGroup1 = $(".form-group.form-group__1");
                        var formGroup2 = $(".form-group.form-group__2");
                        var formGroup3 = $(".form-group.form-group__3");

                        if (formGroup3) {
                            formGroup1.css("width", formGroup1Width);
                            formGroup1.addClass("form-group__dd-style-wrap-text");
                        }
                    }
                }

                $firstSelect2.on("select2:open", function (e) {
                    var $selectResults = $(".select2-results__group");
                });
            }

            if (document.readyState !== 'loading') {
                resizeInput();
            } else {
                document.addEventListener('DOMContentLoaded', function () {
                    resizeInput();
                });
            }

            //event listener on window resize
            window.addEventListener(changeWindow, _.debounce(function (event) {
                resizeInput();
            }, 500));
        }
    };
})(jQuery, Drupal);
'use strict';

(function formToSButtonSet($, Drupal) {
  'use scrict';

  Drupal.behaviors.formToSButtonSet = {
    attach: function attach(context) {
      // If the ToS Bar is shown, add a class to add padding to the footer.
      var $tos = $('.tos-affix-bottom', context);
      var $acceptBtn = $(context).find('#accept-terms-of-service a.btn-primary');
      var $declineBtn = $(context).find('#accept-terms-of-service a.button--inverse');
      var $acceptBtnInline = $(context).find('.tos-accept-button');
      var $declineBtnInline = $(context).find('.tos-decline-button');

      if (typeof $tos !== 'undefined' && $tos.length > 0) {
        $('.footer__wrapper', context).addClass('with--tos');
      }
      if (typeof $acceptBtn !== 'undefined' && $acceptBtn.length > 0) {
        $acceptBtn.once('cookie').click(Drupal.behaviors.formToSButtonSet.acceptToS);
      }
      if (typeof $declineBtn !== 'undefined' && $declineBtn.length > 0) {
        $declineBtn.once('cookie').click(Drupal.behaviors.formToSButtonSet.rejectToS);
      }
      if (typeof $acceptBtnInline !== 'undefined' && $acceptBtnInline.length > 0) {
        $acceptBtnInline.once('cookie').click(Drupal.behaviors.formToSButtonSet.acceptToS);
      }
      if (typeof $declineBtnInline !== 'undefined' && $declineBtnInline.length > 0) {
        $declineBtnInline.once('cookie').click(Drupal.behaviors.formToSButtonSet.rejectToS);
      }
    },
    acceptToS: function acceptToS() {
      // Write a cookie only valid for the next 10 minutes.
      var now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      document.cookie = 'acceptToS=true; expires=' + now.toUTCString();
    },
    rejectToS: function rejectToS() {
      // Overwrite the cookie to make it invalid.
      var now = new Date();
      now.setMonth(now.getMonth() - 6);
      document.cookie = 'acceptToS=false; expires=' + now.toUTCString();
    },
    hasAcceptedToS: function hasAcceptedToS() {
      // Check if we have a valid cookie.
      return document.cookie.indexOf('acceptToS=true') > -1;
    },
    checkRedirect: function checkRedirect() {
      // Check if we're on /signup/info.
      if (/^\/?signup\/info\/?$/.test(window.location.pathname)) {
        // Check if the user has accepted the ToS.
        if (Drupal.behaviors.formToSButtonSet.hasAcceptedToS() !== true) {
          // Redirect.
          window.location.replace('/signup');
        }
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function onSelectGoScript($, Drupal) {
  Drupal.behaviors.onSelectGo = {
    attach: function attach(context) {
      // created for and used with accordion list for departments & services page
      // and now that departments & services page is a three col list it applies there
      var selectRedirect = document.getElementById('onSelectGo') || document.getElementsByClassName('onSelectGo');

      if (selectRedirect) {
        $(selectRedirect, context).change(function () {
          var goValue = this.options[this.selectedIndex].value;
          if (goValue) window.location.href = goValue;
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

/**
 * This js is for passing values to marketo for form footer.
 * How this works?
 * So basically on form-footer.twig we load marketo form "924" and we set a display none
 * since this forms comes out of the box form marketo platform and it is difficult to style
 * for our design purposes and make form more accesible.
 * custom JS is so the actual form of Marketo's is bootstrapped by their script,
 * our form will submit theirs, and their ajax success will trigger a custom event
 * on our form so we can place a custom message and/or animation
 * (former at the time of writing).
 */
// Turning off eslit func-names because some functions complain like:
// $marketoAjaxForms.on('submit', function (e) {
// and I get Unexpected unnamed function.
/* eslint func-names: ["error", "never"] */
(function ($, Drupal) {
  /**
   * Adds error message and add error class.
   *
   * @param string id
   *   The id of selector.
   * @param message
   *   The error message to display below input.
   */
  function addErrorInput(id, message) {
    if (!$(id).hasClass('error')) {
      $(id).after('<div class="form-item__message form-item__message--error style-alternate">' + message + '</div>');
      $(id).addClass('error');
    } else {
      $(id).next('.form-item__message--error').html(message);
    }
  }

  /**
   * Removes error on input.
   *
   * @param string id
   *   The id of selector.
   * @param message
   *   The error message to display below input.
   */
  function removeErrorInput(id) {
    if ($(id).hasClass('error')) {
      $(id).next('.form-item__message--error').remove();
      $(id).removeClass('error');
    }
  }

  /**
   * Validate if email is valid.
   *
   * @param string email
   *   Email address.
   * @returns boolean
   *   true if email is valid else false.
   *
   * @see credit: https://github.com/eslint/eslint/issues/6148#issuecomment-320997819
   */
  function isEmail(email) {
    /* eslint max-len: ["error", 800] */
    var regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
  }

  /**
   * Validate if zipcode is valid.
   *
   * @param int zipCode
   *
   * @returns boolean
   *   true if zipCode is valid else false.
   */
  function isValidUsZipCode(zipCode) {
    return (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipCode)
    );
  }

  /**
   * Validates whole form.
   *
   * @return boolean
   *   true if all form fields are valid else false.
   */
  function isFormValid() {
    var isValidationOk = true;
    // Custom validation starts here.
    var firstName = $('#form-footer__first-name').val();
    var lastName = $('#form-footer__last-name').val();
    var email = $('#form-footer__email').val();
    var zipCode = $('#form-footer__zip').val();

    // Error message copy found here: @link https://northwell-health.atlassian.net/wiki/spaces/FADCS/pages/207716444/Global+Subscribe+Form

    if (!$.trim(firstName)) {
      isValidationOk = false;
      addErrorInput('#form-footer__first-name', 'Please enter your first&nbsp;name.');
    } else {
      removeErrorInput('#form-footer__first-name');
    }
    if (!$.trim(lastName)) {
      isValidationOk = false;
      addErrorInput('#form-footer__last-name', 'Please enter your last&nbsp;name.');
    } else {
      removeErrorInput('#form-footer__last-name');
    }
    if (!$.trim(email)) {
      isValidationOk = false;
      addErrorInput('#form-footer__email', 'Please enter your email&nbsp;address.');
    } else if (!isEmail(email)) {
      isValidationOk = false;
      addErrorInput('#form-footer__email', 'Please enter a valid email&nbsp;address.');
    } else {
      removeErrorInput('#form-footer__email');
    }
    if (!$.trim(zipCode)) {
      isValidationOk = false;
      addErrorInput('#form-footer__zip', 'Please enter your ZIP&nbsp;code.');
    } else if (!isValidUsZipCode(zipCode)) {
      isValidationOk = false;
      addErrorInput('#form-footer__zip', 'Please enter a valid 5-digit ZIP&nbsp;code.');
    } else {
      removeErrorInput('#form-footer__zip');
    }
    return isValidationOk;
  }

  Drupal.behaviors.form_footer_script = {
    attach: function attach(context) {
      var marketoAjaxFormClass = '.js-marketo-form'; // this is the class for our own form.
      var $marketoAjaxForms = $(marketoAjaxFormClass, context);
      if ($marketoAjaxForms.length) {
        // Race condition between Marketo form being rendered (ajax) and our validation being ready.
        // So prevent submission and disable interaction until jQuery validate is ready.
        // See notes on MktoForms2 object and .mktoForm below.
        $marketoAjaxForms.on('submit', function (e) {
          e.preventDefault();
        });

        var marketoFormInit = function marketoFormInit() {
          // Add custom event to Marketo's generated form so we know when their
          // submission went through.
          var $marketoForms = $('.form-footer form[id^=mktoForm_]', context);
          if ($marketoForms.length) {
            $marketoForms.on('marketo-form-submit-success', function () {
              var $marketoForm = $(this);
              var $form = $marketoForm.parents('.form-footer').find('.js-marketo-form');
              if ($form.length) {
                var $successMessage = $form.find('.js-success-message');
                $form.html($successMessage.toggleClass('hidden', false).attr('aria-hidden', 'false'));
              }
            });
          }
          $marketoAjaxForms.on('submit', function (e) {
            e.preventDefault();
            var $form = $(this);
            // Prevent duplicate submissions.
            if (!$form.data('ajax-form-submission-triggered')) {
              $form.data('ajax-form-submission-triggered', true);
              if (isFormValid()) {
                /* If form#mktoForm_### has a class .mktoForm, then the form has been rendered.
                 * Not really doing anything for the race condition if the form loads before/after.
                 * Just going to presume by the time anyone hits submit that this will be available.
                 */
                var $marketoForm = $form.parents('.form-footer').find('form.mktoForm');
                if ($marketoForm.length) {
                  // Serialize all user form fields that aren't buttons.
                  var marketoFieldsSerialized = $form.find(':input:not(:hidden):not(:button)').serializeArray();
                  if (marketoFieldsSerialized.length) {
                    // Map serialized form fields to a set that marketo accepts.
                    var marketoFields = {};
                    $.each(marketoFieldsSerialized, function (i, marketoField) {
                      marketoFields[marketoField.name] = marketoField.value;
                    });
                    // We use getForm takes the ID of form and look for digits
                    // at end of string in id="mktoForm_###".
                    /* global getForm MktoForms2:true */
                    /* eslint no-undef: "error" */
                    var marketoForm = MktoForms2.getForm($marketoForm.attr('id').match(/\d+$/)[0]);
                    marketoForm.addHiddenFields(marketoFields);
                    marketoForm.submit();
                  } else {
                    $form.data('ajax-form-submission-triggered', false);
                  }
                } else {
                  $form.data('ajax-form-submission-triggered', false);
                }
              } else {
                $form.data('ajax-form-submission-triggered', false);
              }
            }
          });
        };
        marketoFormInit();
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function heroblueboxScript($, Drupal) {
  Drupal.behaviors.herobluebox = {
    attach: function attach(context) {
      var $hero = $('.blue-box-youtube-video', context);
      if ($hero.length && !nwdsi.isMobile()) {
        var onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
          ytPlayer = new YT.Player('yt-player', {
            width: '1280',
            height: '720',
            videoId: bgVideoID,
            playerVars: playerOptions,
            events: {
              onReady: _onPlayerReady,
              onStateChange: _onPlayerStateChange
            }
          });
        };

        // The API will call this function when the video player is ready.
        var _onPlayerReady = function _onPlayerReady(event) {
          event.target.playVideo();
        };

        // When the player is ready and when the video starts playing
        // The state changes to PLAYING and we can remove our overlay
        // This is needed to mask the preloading


        var _onPlayerStateChange = function _onPlayerStateChange(event) {
          if (event.data == YT.PlayerState.PLAYING) {
            videoOverlay.classList.add('fadeout');
          }
        };

        // Insert the <script> tag targeting the iframe API
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Get the video ID passed to the data-video attribute
        var bgVideoID = document.querySelector('.blue-box-youtube-video').getAttribute('data-video-id');

        // Set the player options
        var playerOptions = {
          // Autoplay + mute has to be activated (value = 1) if you want to autoplay it everywhere
          // Chrome/Safari/Mobile
          autoplay: 1,
          mute: 1,
          autohide: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          // For looping video you have to have loop to 1
          // And playlist value equal to your currently playing video
          loop: 1,
          playlist: bgVideoID
        };

        // Get the video overlay, to mask it when the video is loaded
        var videoOverlay = document.querySelector('.hero-video-overlay');

        // This function creates an <iframe> (and YouTube player)
        // after the API code downloads.
        var ytPlayer = void 0;

        $(window).on('load resize', function () {
          onYouTubeIframeAPIReady();
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function fullscreenParallaxHero($, Drupal) {
  Drupal.behaviors.fullscreenParallaxHero = {
    attach: function attach(context) {
      // check if there are parallax images
      var images = document.querySelectorAll('.hero__fullscreen .hero__parallax--image img');
      if (!images.length) return;
      var hero = document.querySelector('.hero__fullscreen');
      var scrollOptions = { capture: false, passive: true };
      var yValue = void 0;

      function loaded() {
        hero.classList.add("images-loaded");
        hero.classList.remove("spinner");
      }

      nwdsi.allImagesLoaded(images, loaded);

      function onScroll(event) {
        // bail if mobile
        if (nwdsi.isMobile()) return;
        var yValue = window.pageYOffset;
        for (var i = 0, len = images.length; i < len; i++) {
          if (!images[i]) break;
          var img = images[i];
          var x = void 0;
          var depth = void 0;
          var movement = void 0;
          if (i === 0) {
            x = i / 6;
            depth = Number(x) + .2;
            movement = -(yValue * depth);
          } else if (i === 1) {
            // do nothing
          } else if (i === 2) {
            x = i / 30;
            depth = Number(x) + .005;
            movement = -(yValue * depth);
          }

          if (i !== 1) {
            var translate3d = 'translate3d(0, ' + movement + 'px, 0)';
            img.style['-webkit-transform'] = translate3d;
            img.style['-moz-transform'] = translate3d;
            img.style['-ms-transform'] = translate3d;
            img.style['-o-transform'] = translate3d;
            img.style.transform = translate3d;
          }
        };
        // Note: another way to set y scroll
        // document.querySelector('.hero').style.setProperty('--y', `${window.scrollY}px`)
      }

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          var _entries = _slicedToArray(entries, 1),
              isIntersecting = _entries[0].isIntersecting;
          // add and remove the scroll event to optimize based on whether the element is in view


          if (isIntersecting) {
            window.addEventListener('scroll', onScroll, scrollOptions); //_.throttle(onScroll, 300)
          } else {
            window.removeEventListener('scroll', onScroll, scrollOptions);
          }
        });

        for (var c = 0, length = images.length; c < length; c++) {
          observer.observe(images[c]);
        }
      } else {
        window.addEventListener('scroll', onScroll, scrollOptions);
      }

      // $(window).on('resize', _.debounce(function() {
      //   if ($(window).width() < 768) {
      //     for (let i = 0, len = images.length; i < len; i++) {
      //       images[i].style.transform = "scale(2)";
      //       images[i].style.transform += "translateX(24vw)";
      //       images[i].style.transform += "translateY(4.5vh)";
      //     }
      //   } else if ($(window).width() > 767) {
      //     for (let i = 0, len = images.length; i < len; i++) {
      //       images[i].style.transform = "scale(1)";
      //     }
      //   }
      // }));
    }
  };
})(jQuery, Drupal);
'use strict';

(function fullscreenVideoHero($, Drupal) {
  Drupal.behaviors.fullscreenVideoHero = {
    attach: function attach(context) {
      var $hero_video = $('#hero__parallax_video', context);
      if (!$hero_video.length || nwdsi.isMobile()) {
        if (nwdsi.isMobile()) {
          // remove prelaoder spinner
          var _$hero = $hero_video.closest('.hero');
          var _$hero_video_placeholder = $('.hero__parallax-video');
          var _$hero_video_img = $('.hero__parallax_video--mobile-image');
          _$hero.removeClass('spinner');
          _$hero_video_placeholder.css('opacity', 1);
          _$hero_video_img.css('opacity', 1);
        };
        return;
      }
      var dataObj = $hero_video.data('video-id');
      var YTapiScript = document.createElement('script');
      YTapiScript.src = 'https://www.youtube.com/player_api';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(YTapiScript, firstScriptTag);
      var heroVid = void 0,
          playerDefaults = { autoplay: 0, autohide: 1, modestbranding: 0, rel: 0, showinfo: 0, controls: 0, disablekb: 1, enablejsapi: 0, iv_load_policy: 3 };
      var vidList = [];
      vidList = dataObj.map(function (item) {
        var itemObj = {
          "videoId": item,
          "suggestedQuality": "hd720",
          "startSeconds": 0
        };
        return itemObj;
      });
      var randomVid = Math.floor(Math.random() * vidList.length),
          currVid = randomVid;
      var $hero_video_placeholder = $('.hero__parallax-video');
      var $hero_video_img = $('.hero__parallax_video--mobile-image');
      var $hero = $hero_video.closest('.hero');
      // sample videos
      // {'videoId': '9ge5PzHSS0Y', 'startSeconds': 465, 'endSeconds': 657, 'suggestedQuality': 'hd720'},
      // {'videoId': 'OWsCt7B-KWs', 'startSeconds': 0, 'endSeconds': 240, 'suggestedQuality': 'hd720'},
      // {'videoId': 'qMR-mPlyduE', 'startSeconds': 19, 'endSeconds': 241, 'suggestedQuality': 'hd720'}
      // $('.hi em:last-of-type').html(vid.length);

      function onYouTubePlayerAPIReady() {
        heroVid = new YT.Player('hero__parallax_video', {
          events: { 'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          },
          videoId: vidList[currVid].videoId,
          playerVars: playerDefaults
        });
      }

      function onPlayerReady() {
        heroVid.loadVideoById(vidList[currVid]).mute().setPlaybackQuality('hd1080');
      }

      function onPlayerStateChange(e) {
        if (e.data === 1) {
          $hero_video.addClass('active');
          // $('.hi em:nth-of-type(2)').html(currVid + 1);
        } else if (e.data === 2) {
          $hero_video.removeClass('active');
          if (currVid === vidList.length - 1) {
            currVid = 0;
          } else {
            currVid++;
          }
          heroVid.loadVideoById(vidList[currVid]);
          heroVid.seekTo(vidList[currVid].startSeconds);
        }
        if (e.data === YT.PlayerState.ENDED) {
          heroVid.playVideo();
        }
      }

      function vidRescale() {
        if (!heroVid) {
          onYouTubePlayerAPIReady();
          // remove preloader spinner
          $hero.removeClass('spinner');
          $hero_video_placeholder.css('opacity', 1);
          $hero_video_img.css('opacity', 1);
        }

        var w = $(window).width() + 200,
            h = $(window).height() + 200;

        if (w / h > 16 / 9) {
          heroVid.setSize(w, w / 16 * 9);
          $('.hero__parallax-video .screen').css({ 'left': '0px' });
        } else {
          heroVid.setSize(h / 9 * 16, h);
          $('.hero__parallax-video .screen').css({ 'left': -($('.hero__parallax-video .screen').outerWidth() - w) / 2 });
        }
      }

      $(window).on('load resize', function () {
        vidRescale();
      });

      $('.hero__parallax_video--mute span').on('click', function () {
        $hero_video.toggleClass('mute');
        $('.hero__parallax_video--mute em').toggleClass('hidden');
        if ($hero_video.hasClass('mute')) {
          heroVid.mute();
        } else {
          heroVid.unMute();
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function hospitalheroScript($, Drupal) {
  Drupal.behaviors.hospitalhero = {
    attach: function attach(context) {
      var $hospital_hero = $('.hospital-hero', context);
      if ($hospital_hero.length && !nwdsi.isMobile()) {
        var onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
          ytPlayer = new YT.Player('yt-player', {
            width: '1280',
            height: '720',
            videoId: bgVideoID,
            playerVars: playerOptions,
            events: {
              'onReady': _onPlayerReady,
              'onStateChange': _onPlayerStateChange
            }
          });
        };

        // The API will call this function when the video player is ready.
        var _onPlayerReady = function _onPlayerReady(event) {
          event.target.playVideo();

          // Get the duration of the currently playing video
          var videoDuration = event.target.getDuration();

          // When the video is playing, compare the total duration
          // To the current passed time if it's below 2 and above 0,
          // Return to the first frame (0) of the video
          // This is needed to avoid the buffering at the end of the video
          // Which displays a black screen + the YouTube loader
          setInterval(function () {
            var videoCurrentTime = event.target.getCurrentTime();
            var timeDifference = videoDuration - videoCurrentTime;

            if (2 > timeDifference > 0) {
              event.target.seekTo(0);
            }
          }, 1000);
        };

        // When the player is ready and when the video starts playing
        // The state changes to PLAYING and we can remove our overlay
        // This is needed to mask the preloading


        var _onPlayerStateChange = function _onPlayerStateChange(event) {
          if (event.data == YT.PlayerState.PLAYING) {
            videoOverlay.classList.add('fadeout');
          }
        };

        // Insert the <script> tag targeting the iframe API
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Get the video ID passed to the data-video attribute
        var bgVideoID = document.querySelector('.hospital-hero-video').getAttribute('data-video-id');

        // Set the player options
        var playerOptions = {
          // Autoplay + mute has to be activated (value = 1) if you want to autoplay it everywhere 
          // Chrome/Safari/Mobile
          autoplay: 1,
          mute: 1,
          autohide: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          // For looping video you have to have loop to 1
          // And playlist value equal to your currently playing video
          loop: 1,
          playlist: bgVideoID

          // Get the video overlay, to mask it when the video is loaded
        };var videoOverlay = document.querySelector('.hero-video-overlay');

        // This function creates an <iframe> (and YouTube player)
        // after the API code downloads.
        var ytPlayer = void 0;

        $(window).on('load resize', function () {
          onYouTubeIframeAPIReady();
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function infinitescrollScript($, Drupal) {

  Drupal.behaviors.infinitescroll = {
    attach: function attach(context) {

      $('.infinite-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 3,
        arrows: false,
        mobileFirst: true,
        useCSS: false,
        useTransform: true,
        respondTo: 'window',
        infinite: true,
        swipeToSlide: true,
        variableWidth: false,
        draggable: false,
        centerMode: false,
        dots: false,
        autoplay: false,
        cssEase: 'linear',
        speed: 900,
        autoplaySpeed: 0,
        responsive: [{
          breakpoint: 1750,
          settings: {
            slidesToShow: 4
          }
        }, {
          breakpoint: 1200,
          settings: {
            slidesToShow: 3
          }
        }, {
          breakpoint: nwdsi.settings.breakpoints.sm,
          settings: {
            slidesToShow: 2
          }
        }]
      });

      $('.infinite-rh-pane').mouseenter(function () {
        $('.infinite-carousel').slick("slickSetOption", "slidesToScroll", 1, false);
        $('.infinite-carousel').slick('play');
      });
      $('.infinite-rh-pane').mouseleave(function () {
        $('.infinite-carousel').slick('pause');
      });

      $('.infinite-lh-pane').mouseenter(function () {
        $('.infinite-carousel').slick('play');
        $('.infinite-carousel').slick("slickSetOption", "slidesToScroll", -1, false);
      });
      $('.infinite-lh-pane').mouseleave(function () {
        $('.infinite-carousel').slick('pause');
      });

      var nudgeSlider = function nudgeSlider(target, event) {
        $(".infinite-carousel .slick-track").queue(function (next) {
          $(this).animate({ marginLeft: '-300px' }, 900);
          next();
        });

        $(".infinite-carousel .slick-track").queue(function (next2) {
          $(this).animate({ marginLeft: '0px' }, 700);
          next2();
        });
      };

      // nwdsi.whenVisibleObserver({"selector":".infinite-carousel .slick-track","callback": nudgeSlider, "callbackEvent": "inview", "options": {"rootMargin": "-450px"} });

    }
  };
})(jQuery, Drupal);
'use strict';

(function insurancetoolsearchselectScript($, Drupal) {
  Drupal.behaviors.insurancetoolsearchselect = {
    initSelect2: function initSelect2(locationData) {
      this.$originalSelect.select2({
        dropdownParent: $('#insurance-tool__dropdown-wrapper'),
        placeholder: '' + Drupal.t('Select a location'),
        data: locationData,
        templateResult: function templateResult(item) {
          if (item.loading) {
            return item.text;
          } else if (item.id) {
            // Title case text and send group var as well to check type
            return item.text;
          }
        }
      });
    },


    data: [{ text: 'Select a location', id: '' }, { text: 'Bay Street Health Center', id: 'location_1111' }, { text: 'Center for Advanced Medicine', id: 'location_2222' }, { text: 'Center for Womens Health', id: 'location_3333' }, { text: 'Glen Cove Hospital', id: 'location_4444' }, { text: 'Huntington Hospital', id: 'location_5555' }, { text: 'North Shore Home Care', id: 'location_6666' }, { text: 'Northwell Health Sleep Disorders Center', id: 'location_7777' }],

    attach: function attach(context) {
      var _this = this;

      // Scope parent selector
      this.$parentSelector = $('#insurance-tool__dropdown-wrapper', context);
      //  <select> form id that select2 initializes against
      this.$originalSelect = $('#insurance-tool__dropdown', context);
      // Scope form
      this.$insuranceToolForm = $('#insurance-tool-search-location', context);

      this.$originalSelect.on('select2:open', function () {
        _this.$parentSelector.addClass('insurance-tool__dropdown--open');
      });

      this.$originalSelect.on('select2:close', function () {
        _this.$parentSelector.removeClass('insurance-tool__dropdown--open');
      });

      // When clearSelection button is clicked
      this.$parentSelector.on('click', 'b', function () {
        if (_this.$parentSelector.find('.select2').hasClass('select2-container--selected')) {
          // Remove options from dom for a fresh ajax call
          _this.$originalSelect.find('option').remove();
        }
      });

      // Init select2
      this.initSelect2(this.data);
    }
  };
})(jQuery, Drupal);
'use strict';

(function listItem($, Drupal) {
  Drupal.behaviors.list_item = {
    attach: function attach(context) {
      var $hide_show = $('.link-item__button--hide, .link-item__button--show', context);
      $hide_show.on('click', function () {
        var $self = $(this);
        var behavior = $self.hasClass('link-item__button--hide') ? 'hide' : 'show';
        var $parent = $self.parent();
        var $content = $parent.find('.link-item__content');
        $self.hide();
        if (behavior === 'hide') {
          $parent.find('.link-item__content').slideUp('slow');
          $parent.find('.link-item__button--show').show();
        } else {
          $parent.find('.link-item__content').slideDown('slow');
          $parent.find('.link-item__button--hide').show();
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */

/**
 *
 * @file Copy of northwell.map.js.
 *
 * Copied from northwell.edu/sites/northwell/modules/custom/nslij3_custom_search/theme/js/northwell.Map.js.
 * The functionality around the FAD and wait times map component failed otherwise. The new FAD and wait times sample uses
 * the same logic to handle the basic map rendering.
 */

function validChain(object) {
  var keys;

  if (arguments.length === 2) {
    keys = String(arguments[1]).split('.');
  } else {
    for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      keys[_key - 1] = arguments[_key];
    }
  }

  return keys.reduce(function (a, b) {
    return (a || {})[b];
  }, object) !== undefined;
}

/**
 * All JS classes and functions related to Google Maps on northwell.edu
 *
 * @module northwell.Map
 */

/** @namespace Namespace for northwell classes and functions. */
var northwell = northwell || {};

/**
 * Constructs map objects
 * @class Map
 * @constructor
 * @namespace northwell
 * @param element {String} ID of an element on the page to place the Google Map
 */
northwell.Map = function (element, options) {
  this.element = element;
  this.bounds = [];
  this.map = null;
  this.infoWindow = new google.maps.InfoWindow({ content: "" }); //makes the info window a singleton
  this.markers = [];
  this.locations = [];
  this.mapCustomMarkers = null;
  if (typeof mapCustomMarkers !== 'undefined') {
    this.mapCustomMarkers = mapCustomMarkers;
  }
};
/**
 * Fitbounds but with a limited minZoom and maxZoom.
 *
 * Sets and resets minZoom and maxZoom.
 *
 * @method fitBoundsWithMinMaxZoom
 * @param bounds google.maps.LatLngBounds bounds  Bounds object to constrain the map to (literally `google.maps.fitBounds(bounds)`)
 * @param maxZoom mixed maxZoom integer or null to reset. The greater the zoom the more zoomed in you are.
 * @param minZoom mixed minZoom integer or null to reset. Minimum is 0, which shows the whole world.
 */
northwell.Map.prototype.fitBoundsWithMinMaxZoom = function (bounds, maxZoom, minZoom) {
  // @todo Consider fitBounds with minZoom or anything else for that matter, how would this method work simultaneously or in sequence with others?
  var map = this.map;
  maxZoom = maxZoom || 17; // Prevent faceplanting on single marker views
  minZoom = minZoom || 7; // Prevent flying into space on mobile

  // @todo the number 19 is arbitrary. Should be configured elsewhere.
  map.setOptions({
    maxZoom: maxZoom,
    minZoom: minZoom
  });

  // console.log('map');
  // console.log(map);

  // @todo respect initial config for maxZoom. if any. Right now there isn't any.
  google.maps.event.addListenerOnce(map, 'bounds_changed', function () {
    //map.setOptions({ maxZoom: null, minZoom: null });

    // In mobile, sometimes the map zooms out to the world.
    // minZoom helps limit some of that damage.
    // However, it could still be off center.
    if (window.matchMedia('(max-width: 767px)').matches) {

      var bounds_center = bounds.getCenter().toJSON();
      var map_center = map.getCenter().toJSON();
      var lat_diff = bounds_center.lat - map_center.lat;
      var lng_diff = bounds_center.lng - map_center.lng;

      //console.log('bounds_change: mobile ', bounds_center, map_center, lat_diff, lng_diff);

      if (lat_diff > 1 || lat_diff < -1 || lng_diff > 1 || lng_diff < -1) {
        //console.log('bounds_changed: center is off...');
        map.setCenter(bounds_center);
      }
    }
    //if (this.initial) {
    //    this.initial = false;
    //
    //}
  });
  map.fitBounds(bounds);
};

/**
 * Adds a marker to the markers array
 *
 * @method addMarker
 * @param location object A JSON object which contains all the data for the marker
 * @param showWindow boolean flag that indicates whether to use the custom info
 * @param mapCustomMarker boolean for if the markers are the custom version
 */
northwell.Map.prototype.addMarker = function (location, showWindow, mapCustomMarker) {
  // console.log('add marker');
  // console.log(location);
  // console.log(showWindow);
  // console.log(mapCustomMarker);
  var markerOptions = {};
  if (mapCustomMarker) {
    var CUSTOMMARKER = function CUSTOMMARKER(markerOptions) {
      this.pos = new google.maps.LatLng(markerOptions.position.lat, markerOptions.position.lng);
      this.setMap(markerOptions.map);
    };

    var customMarker = void 0;
    this.pos = new google.maps.LatLng(location.geo.latitude, location.geo.longitude);
    var infoWindow = this.infoWindow;
    markerOptions = {
      position: {
        lat: location.geo.latitude,
        lng: location.geo.longitude
      },
      map: this.map,
      draggable: false,
      northwell: {
        output: location.output,
        infoWindow: this.infoWindow
      }
    };


    CUSTOMMARKER.prototype = new google.maps.OverlayView();
    // may not need this
    CUSTOMMARKER.prototype.onRemove = function () {};

    //init your html element here
    CUSTOMMARKER.prototype.onAdd = function () {
      var div = document.createElement('DIV');
      var waitTime = isNaN(location.wait_time.numeric) ? location.wait_time.numeric : location.wait_time.numeric > 60 ? '<span class="map-tooltip--time">60+</span> m' : '<span class="map-tooltip--time">' + location.wait_time.numeric + '</span>' + ' min';
      div.style.position = 'absolute';
      div.className = "nwh-google-map-htmlMarker";
      div.innerHTML = '<div class="htmlMarker-pin htmlMarker_type__' + location.wait_time_header.location_type + '">' + waitTime + '<div class="map-tooltip--arrow map-tooltip--arrow-' + location.wait_time_header.location_type + '"></div></div>';

      google.maps.event.addDomListener(div, "click", function (event) {
        google.maps.event.trigger(self, "click");
        infoWindow.close();
        infoWindow.setContent(markerOptions.northwell.output);
        infoWindow.setPosition(customMarker.pos);
        infoWindow.open(markerOptions.map);
        // add custom class for styling overrides
        google.maps.event.addListener(infoWindow, 'domready', function () {
          var $tooltip = jQuery('.map-tooltip');
          var $tooltipParent = $tooltip.parent().parent().parent().parent();
          $tooltipParent.removeClass('customHTMLInfoWindow--type-gohealth customHTMLInfoWindow--type-hospital customHTMLInfoWindow--type-lab');
          $tooltipParent.addClass('customHTMLInfoWindow customHTMLInfoWindow--type-' + location.wait_time_header.location_type);
          // This re-adds the ability to close tooltips when clicking/dragging/closing via x
          google.maps.event.addListenerOnce(this.map, 'click', function () {
            infoWindow.close();
          });
          google.maps.event.addListenerOnce(this.map, 'drag', function () {
            infoWindow.close();
          });
          // fade in to avoid FOUC
          $tooltip.fadeIn();
        });
      });

      var panes = this.getPanes();
      panes.overlayMouseTarget.appendChild(div);
      this.div = div;
    };

    CUSTOMMARKER.prototype.draw = function () {
      var overlayProjection = this.getProjection();
      var position = overlayProjection.fromLatLngToDivPixel(this.pos);
      var panes = this.getPanes();
      this.div.style.left = position.x + 'px';
      this.div.style.top = position.y - 30 + 'px';
    };

    customMarker = new CUSTOMMARKER(markerOptions);

    //set the bounds of the overlays
    // let position = new google.maps.LatLng(location.geo.latitude, location.geo.longitude);
    this.bounds.extend(this.pos);
  } else {
    var marker = void 0;
    markerOptions = {
      position: {
        lat: location.geo.latitude,
        lng: location.geo.longitude
      },
      map: this.map,
      draggable: false,
      animation: google.maps.Animation.DROP,
      northwell: {
        output: location.output,
        infoWindow: this.infoWindow
      },
      icon: mapIcon
    };
    marker = new google.maps.Marker(markerOptions);

    if (showWindow) {
      // Listen for when a marker is clicked and:
      // - apply the marker content.
      // - open the marker.
      google.maps.event.addListener(marker, 'click', function (e) {
        marker.northwell.infoWindow.setContent(marker.northwell.output);
        marker.northwell.infoWindow.open(this.map, marker);
      });
    }

    // Listen for when the map is clicked (anywhere off of an infoWindow) and reset the icon(s).
    // Close info box when randomly clicking around on the map.
    google.maps.event.addListener(this.map, 'click', function (e) {
      marker.northwell.infoWindow.close();
    });

    // Close any open window when the map is dragged.
    google.maps.event.addListener(this.map, 'drag', function (e) {
      marker.northwell.infoWindow.close();
    });

    this.bounds.extend(marker.position);
    this.markers.push(marker);
  }
};

/**
 * Adds a marker to the markers array
 *
 * @method markerAdjustments
 */
northwell.Map.prototype.markerAdjustments = function (map) {
  var _this = this;

  var _loop = function _loop(i) {
    var marker = _this.markers[i];
    // Listen for when a marker is clicked and:
    // - change the icon for the pin.
    google.maps.event.addListener(marker, 'click', function (e) {
      // Reset ALL icons.
      map.resetIcons();
      // Set the current icon to 'active'.
      marker.setIcon(mapIconSelected);
    });

    // Listen for when the close icon (X) is clicked and reset the icon.
    google.maps.event.addListener(marker.northwell.infoWindow, 'closeclick', function (e) {
      // Reset ALL icons.
      map.resetIcons();
    });

    // Listen for when the map is clicked (anywhere off of an infoWindow) and reset the icon(s).
    // Close info box when randomly clicking around on the map.
    google.maps.event.addListener(_this.map, 'click', function (e) {
      // Reset ALL icons.
      map.resetIcons();
    });

    google.maps.event.addListener(_this.map, 'dragstart', function (e) {
      marker.northwell.infoWindow.close();
      // Reset ALL icons.
      map.resetIcons();
    });
  };

  for (var i = 0; i < this.markers.length; i++) {
    _loop(i);
  }
};

/**
 * Reset all icons pins to default.
 *
 * @method resetIcons
 */
northwell.Map.prototype.resetIcons = function () {
  for (var i = 0; i < this.markers.length; i++) {
    var _marker = this.markers[i];
    _marker.setIcon(mapIcon);
  }
};

/**
 * Reset all icons pins to default.
 *
 * @method resetCustomIcons
 */
// northwell.Map.prototype.resetCustomIcons = function() {
//   for (let i = 0; i < this.markers.length; i++) {
//     let marker = this.markers[i];
//     console.log('marker');
//     console.log(marker);
//   }
// };

/**
 * Adds a location to the locations array
 *
 * @method addLocation
 * @param location object A JSON object which contains all the data a location
 */
northwell.Map.prototype.addLocation = function (location) {
  this.locations.push(location);
};

/**
 * Replaces all locations with the array provided
 *
 * @method addLocations
 * @param locations array An array containing JSON location objects
 */
northwell.Map.prototype.addLocations = function (locations) {
  this.locations = locations;
};

/**
 * Removes all the markers from the associated map
 *
 * @method clearMarkers
 */
northwell.Map.prototype.clearMarkers = function () {
  for (var i = 0; i < this.markers.length; i++) {
    this.markers[i].setMap(null);
  }
  this.markers = [];
};

/**
 * Gets marker objects.
 *
 * @method getMarkers
 */
northwell.Map.prototype.getMarkers = function () {
  return this.markers;
};

/**
 * Removes all the markers from the associated map
 *
 * @method clearLocations
 */
northwell.Map.prototype.clearLocations = function () {
  this.locations = [];
};

/**
 * Returns reference to the google map
 *
 * @method getMap
 */
northwell.Map.prototype.getMap = function () {
  return this.map;
};

/**
 * Initializes the Google Map and places any markers
 *
 * @method initializeMap
 */
northwell.Map.prototype.initializeMap = function () {
  //145 Community Drive, Great Neck, New York, 11021
  this.initializeMapTo({ lat: 40.783706, lng: -73.704410 }, 16);
};

/**
 * Initializes the Google Map at the specified location / zoom level
 *
 * @method initializeMapTo
 * @param center object The lat/lng the map should start centered on
 * @param zoom integer The zoom level to default the google map to
 */
northwell.Map.prototype.initializeMapTo = function (center, zoom) {
  // Create a map object and specify the DOM element for display.
  var mapOptions = {};

  if (this.mapCustomMarkers) {
    mapOptions = {
      center: center,
      zoom: zoom,
      scrollwheel: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      disableDefaultUI: true
    };
  } else {
    mapOptions = {
      center: center,
      zoom: zoom,
      scrollwheel: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false
    };
  }

  this.map = new google.maps.Map(document.getElementById(this.element), mapOptions);

  // Change the style of the tooltips/infoWindows.
  this.styleTooltips();

  // Refesh the map object.
  this.refreshMap();

  // If this is not a custom overlay and infowindow map
  if (!this.mapCustomMarkers) this.markerAdjustments(this);
};

/**
 * Removes all markers from the Google Map and then places new ones.
 *
 * @method refreshMap
 */
northwell.Map.prototype.refreshMap = function () {
  // console.log('start re-zoom');
  if (!this.mapCustomMarkers) this.clearMarkers();
  this.bounds = new google.maps.LatLngBounds();

  var hasCustomMarkers = this.mapCustomMarkers ? true : false;
  for (var i = 0; i < this.locations.length; i++) {
    this.addMarker(this.locations[i], true, hasCustomMarkers);
  }
  // console.log(this.bounds.isEmpty());
  if (!this.bounds.isEmpty()) {
    this.fitBoundsWithMinMaxZoom(this.bounds, 17, 7);
  }
};

/**
 * Adjust options sent to google api.
 *
 * @method adjustOptions
 * @param options object A JSON object which contains all the API options
 */
northwell.Map.prototype.adjustOptions = function (options) {
  var map = this.map;
  map.setOptions(options);
};

/**
 * This function handles doing a 'minor' restyling of the infoWindow element.
 *
 * @todo: Remove $/jQuery.
 * Here it is/was assumed we have jQuery (we always do).
 * However, if this is to be used more outside of Northwell D8 PL/Drupal, then
 * it may be possible that we don't.
 */
northwell.Map.prototype.styleTooltips = function () {

  google.maps.event.addListener(this.infoWindow, 'domready', function () {

    $ = jQuery;
    // Reference to the DIV that wraps the bottom of infowindow
    var iwOuter = $('.gm-style-iw');
    // console.log(iwOuter)
    var iwBackground = iwOuter.prev();
    // console.log(iwBackground)
    var iwParent = iwOuter.parent();
    // console.log(iwParent)
    var iwContainer = iwOuter.parent().parent();
    // console.log(iwContainer)
    // Reference to the div that groups the close button elements.
    var iwCloseBtn = iwOuter.next();
    // console.log(iwCloseBtn)

    // Add meaningful classes to act upon.
    iwBackground.addClass('gm-style-iw--background--wrapper');
    iwParent.addClass('gm-style-iw--background--parent');
    iwCloseBtn.addClass('gm-style-iw--close-button');

    // Additional styling is applied in 01-atoms/fad-tooltip/_dsi_fad-tooltip.scss
    // Background shadow DIV.
    iwBackground.children(':nth-child(2)').addClass('gm-style-iw--background--shadow');
    // White background DIV.
    iwBackground.children(':nth-child(4)').addClass('gm-style-iw--background--color');
    // Shadow on the arrow.
    iwBackground.children(':nth-child(1)').addClass('gm-style-iw--arrow--shadows');
    // More shadows on the arrow.
    iwBackground.children(':nth-child(3)').find('div > div').addClass('gm-style-iw--arrow--shadows');
    // Arrow so we can show our own.
    iwBackground.children(':nth-child(3)').addClass('gm-style-iw--arrow');

    // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
    if ($('.iw-content').height() < 140) {
      $('.iw-bottom-gradient').css({ display: 'none' });
    }
  });
};

/* eslint-enable */
'use strict';

(function testScript($, Drupal) {
  Drupal.behaviors.modal_dialogs = {
    attach: function attach(context) {
      // Find modal templates, grab markup, throw in body, dump the original bodies, ???, profit.
      var $modal_templates = $('script[type="modal/template"]', context);
      var ll_video_options = [];
      var modalLength = $modal_templates.length;
      var has_ll_videos = false;
      var limelightAPI = 'https://assets.video.limelight.com/production/limelightjs-player/limelightjs-player-4.2.6/limelightjs-player.js?version=4.2.6';

      var loadPlayers = function loadPlayers(options) {
        var llAPILoaded = typeof LimelightPlayer != 'undefined' ? true : false;
        if (!llAPILoaded) {
          $.getScript(limelightAPI).done(function (script, textStatus) {
            $(options).each(function (i) {
              console.log();
              LimelightPlayerUtil.embed(options[i]);
            });
          });
          llAPILoaded = true;
        } else {
          $(arr).each(function (i) {
            LimelightPlayerUtil.embed(options[i]);
          });
        }
      };

      $modal_templates.each(function (i, modal) {
        var limelight_id = $(JSON.parse($(modal).html())).data('ll_id');
        var $body = $('body');
        // handle loading limelight player API and the associated videos into the carousel
        if (typeof limelight_id !== 'undefined') {
          var options = {
            width: '100%',
            height: '100%',
            playerForm: 'Player',
            playerId: 'limelight_player_' + limelight_id,
            mediaId: limelight_id
          };
          ll_video_options.push(options);
          has_ll_videos = true;
          // console.log('ran loadPlayer');
          // LimelightPlayerUtil.embed(options);
        }

        if (! --modalLength && has_ll_videos) loadPlayers(ll_video_options);
        // if the player API is loaded then just call the method to load
        // the vids otherwise load the API script first
        //   console.log(llAPILoaded);
        //   if (!llAPILoaded) {
        //     $.getScript(limelightAPI)
        //       .done(function (script, textStatus) {
        //         console.log('done');
        //         loadPlayer();
        //       });
        //     llAPILoaded = true;
        //   } else {
        //     console.log('already loaded');
        //     loadPlayer();
        //   }
        // }
        // });


        // if (typeof limelight_id !== 'undefined') {
        //   const limelightAPI = 'https://assets.video.limelight.com/production/limelightjs-player/limelightjs-player-4.2.6/limelightjs-player.js?version=4.2.6';
        //   if (!APILoaded) {
        //     // console.log('APILoaded');
        //     // console.log(APILoaded);
        //     let APILoaded = true;
        //     const load = (function () {
        //       function _load(tag) {
        //         return function (url) {
        //           // This promise will be used by Promise.all to determine success or failure
        //           return new Promise(function (resolve, reject) {
        //             const element = document.createElement(tag);
        //             const parent = 'head';
        //             const attr = 'src';
        //             // Important success and error for the promise
        //             element.onload = function () {
        //               resolve(url);
        //             };
        //             element.onerror = function () {
        //               reject(url);
        //             };
        //             element.async = true;
        //             // Inject into document to kick off loading
        //             element[attr] = url;
        //             document[parent].appendChild(element);
        //           });
        //         };
        //       }
        //
        //       return {
        //         js: _load('script'),
        //         APILoaded,
        //       };
        //     })();
        //     Promise.all([
        //       load.js(limelightAPI),
        //     ]).then(function () {
        //       const options = {
        //         width: '100%',
        //         height: '100%',
        //         playerForm: 'Player',
        //         playerId: `limelight_player_${limelight_id}`,
        //         mediaId: limelight_id,
        //       };
        //       LimelightPlayerUtil.embed(options);
        //       APILoaded = load.APILoaded;
        //     }).catch(function () {
        //       console.log('Sorry there is something wrong with this request.');
        //     });
        //   } else {
        //     const options = {
        //       width: '100%',
        //       height: '100%',
        //       playerForm: 'Player',
        //       playerId: `limelight_player_${limelight_id}`,
        //       mediaId: limelight_id,
        //     };
        //     LimelightPlayerUtil.embed(options);
        //   }
        //   // });
        // }

        $(JSON.parse($(modal).html())).appendTo(document.body);

        $body.on('hidden.bs.modal', $(modal), function () {
          var $modal = $(this);
          $modal.find('video').trigger('pause');
        });
      });
      $modal_templates.remove();
      var $body = $('body');
      if (!$body.data('modal-youtube-events')) {
        $body.data('modal-youtube-events', true);
        $body.on('shown.bs.modal', '.modal', function () {
          var $modal = $(this);
          var $youtube = $modal.find('iframe.modal-youtube');

          if ($youtube.length) {
            $youtube.get(0).contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }
        });
        $body.on('hidden.bs.modal', '.modal', function () {
          var $modal = $(this);
          var $youtube = $modal.find('iframe.modal-youtube');
          if ($youtube.length) {
            $youtube.get(0).contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
        });
      }
    }
  };

  /**
   * Campaign Modal Popup.
   *
   * Initiates a popup window to promote new campaigns. LocalStorage keys should not interfere with other sites
   * within the origin, as well as new content due to the use of the node uuid.
   *
   * @type {{attach: Drupal.behaviors.modalPopup.attach}}
   *    Attach the modalPop script to the page load.
   */
  Drupal.behaviors.modalPopup = {
    attach: function attach(context) {
      var ds = drupalSettings;
      // Retrieve modal content.
      if (typeof ds.campaign_modal !== 'undefined' && Object.keys(ds.campaign_modal.content).length) {
        var modalContent = ds.campaign_modal.content,
            storageIdentifier = modalContent.settings.uuid,
            contentIdentifier = {
          site_name: modalContent.settings.site_name,
          nid: modalContent.settings.nid
        },
            $body = $('body', context),
            modalHtml = Drupal.theme.modalPopup(modalContent);

        // Define local storage methods.
        var browserStorage = {
          save: function save(key) {
            localStorage.setItem(key, JSON.stringify(contentIdentifier));
          },
          load: function load(key) {
            return JSON.parse(localStorage.getItem(key));
          }
        };

        // Try to load the browser storage.
        if (typeof Storage !== 'undefined') {
          var result = browserStorage.load(storageIdentifier);
          if (!result) {
            browserStorage.save(storageIdentifier);
            browserStorage.load(storageIdentifier);
            $(window).on('load', function () {
              $body.append(modalHtml);
              // Show the modal popup.
              $('#modal-popup').modal('show');
            });
          }
        }
      }
    }
  };

  /**
   * Themes the campaign modal.
   *
   * @param content
   * @returns {string}
   *   An HTML string of modal markup containing dynamic values.
   */
  Drupal.theme.modalPopup = function (content) {
    // Return the modal markup.
    return '\n      <div id="modal-popup" class="modal nw-scale" role="dialog">\n        <div class="modal-dialog">\n          <div class="modal-content">\n            <div class="modal-header">\n              <button type="button" class="close" data-dismiss="modal">&times;</button>\n            </div>\n            <div class="modal-body">\n              <div class="modal-body__image">\n                <img src="' + (content.graphic.sizes ? content.graphic.sizes.webimage : '') + '" alt="' + (content.graphic.alt ? content.graphic.alt : '') + '">\n              </div>\n              <div class="modal-body__content-wrapper">\n                <div class="modal-body__content">\n                  <div class="modal-body__title typog-content-title">' + content.title + '</div>\n                  <div class="modal-body__summary typog-body">' + content.body + '</div>\n                  <div class="modal-body__buttons">\n                  ' + (content.cta.url ? '<a href="' + content.cta.url + '" class="button" target="_blank">' + content.cta.title + '</a>' : '') + '\n                  ' + (content.dismissal ? '<button type="button" class="button" data-dismiss="modal">' + content.dismissal_text + '</button>' : '') + '</div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>';
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/* global window */
/**
 * Disabling ES6 linting on this file since it is based from:
 * nslij3-statics/js/globals/_navigation.js
 */

(function navigationScript($, Drupal) {
  Drupal.behaviors.navigation = {
    attach: function attach(context) {
      var $html = $('html', context);
      var $body = $('body', context);
      var $html_body = $('html, body', context);
      var $site_nav = $('.site-navigation', context);
      var $mobile_simple_search = $('.site-nav__toggle-simple-search', context);
      var $site_links = $('.site-links', context);
      var $bell_icon = $('.nwh_notifications_bell');
      //const $nav_search_icon    = $site_links.find('.toggle-search');
      //const $search_icon        = $nav_search_icon.find('.icon--search');
      window.$mm = $('[id=main-nav]', context);
      var $mm_li = $mm.find('> li');
      window.$sm = $('[id=search-nav]', context);
      var $sm_li = $sm.find('> li');

      // Pattern Lab mod, applying swap classes to html does nav swap on all instances,
      // "$nav_classer" will represent the element on which stateful classes will be managed.
      // That ought to be <html> for non-pl, and a <div class="sg-pattern-example"> for pl.
      var nav_classer = function nav_classer($node) {
        var $pattern_example = $node.parents('.sg-pattern-example');
        return $pattern_example.length ? $pattern_example : $html;
      };

      // a class to make display: block stick when accessible mega menu
      // would otherwise remove it due to user interaction elsewhere on
      // the page.
      var sm_stick_form_class = 'form-focus';
      var mm_reveal_class = 'hover';

      // Mobile navigation
      var close_nav_timer = 0;
      var panel_animation_timer = 0;

      //      Neither #site-navigation nor .close-panel seem to exist in markup anymore... therefore commenting this out.
      //
      //      /* !********** OVERLAY NAVIGATION SLIDEOUT - KC******* */
      //      $("#site-navigation .close-panel", context).on('click', function(e){
      //
      //        // Exception is #main .tabbed-search--mobile a.nw-btn,
      //        // this should not trigger a panel close thing
      //        var $this = $(this);
      //        if ($this.parents('.tabbed-search--mobile').length && $this.hasClass('tabbed-search__mobile-button')){ // worked on desktop tests
      //          return;
      //        }
      //        // for mobile, same thing as above with a diff element
      //        if (e.target) {
      //          var $target = jQuery(e.target);
      //          if ($target.parents('.tabbed-search--mobile').length && $target.hasClass('tabbed-search__mobile-button')){
      //            return;
      //          }
      //        }
      //
      //        clearTimeout(panel_animation_timer);
      //        $html.removeClass("openNav");
      //        $html.toggleClass("closingNav", true); // we need this class for keeping the nav transition
      //
      //        // Deselect stickied flyout
      //        var $sticky_sm_tab;
      //        if ($sm.length && ($sticky_sm_tab = $sm.find('.' + sm_stick_form_class)).length) {
      //          $sticky_sm_tab.toggleClass(sm_stick_form_class, false);
      //        }
      //
      //        panel_animation_timer = setTimeout(function(){
      //          $html.removeClass('closingNav');
      //        }, 505);
      //      });


      var collapse_menu_multi_fix = function collapse_menu_multi_fix(i, bootstrap_collapse_link) {
        // bootstrap collapse checks for data-target attribute first, then href
        // Update data-target for multi nav compatibility, remove href to prevent
        // navigation to hash.

        //const $bootstrap_collapse_link = $(bootstrap_collapse_link);
        $(bootstrap_collapse_link).attr("data-target", "[id=main-nav]:eq(" + i + ")").removeAttr("href");
      };
      var collapse_search_multi_fix = function collapse_search_multi_fix(i, bootstrap_collapse_link) {
        // bootstrap collapse checks for data-target attribute first, then href
        // Update data-target for multi nav compatibility, remove href to prevent
        // navigation to hash.

        //const $bootstrap_collapse_link = $(bootstrap_collapse_link);
        $(bootstrap_collapse_link).attr("data-target", "[id=search-nav]:eq(" + i + ")").removeAttr("href");
      };

      $site_nav.find('.site-nav__toggle-menu').each(collapse_menu_multi_fix);
      $site_nav.find('.utility-nav__toggle-search').each(collapse_search_multi_fix);
      $site_nav.find('.site-nav__toggle-search').each(collapse_search_multi_fix);

      // Clicking this link triggers bootstrap collapse on the main nav.
      // Utility nav's show/hide is dependent on the openNav class on $nav_classer.
      // Clicking this link fast will trigger the openNav toggle but may not
      // trigger collapse, so at some point the main and utility navs can get out
      // of sync. Solution is to move all the toggling to the collapse events.
      //      $site_nav.find('.site-nav__toggle-menu').on('click', function(e){
      //        //console.log('hash pre: ', document.location.hash);
      //        //e.preventDefault(); // Still goes to #main-nav
      //        //
      //        //console.log('e prevented?? ', e, this);
      //        //console.log('hash post: ', document.location.hash);
      //
      //        clearTimeout(panel_animation_timer);
      //        const $event_node = $(this);
      //        const $nav_classer = nav_classer($event_node);
      //        const $this_site_nav = $event_node.parents('.site-navigation')
      //        $nav_classer.removeClass('closingNav');
      //
      //        // If the search had opened the menu, keep the menu open
      //        //if ($nav_classer.hasClass('openNav') && $site_nav.hasClass('nav--search')) {
      //        if ($nav_classer.hasClass('openNav') && $this_site_nav.hasClass('nav--search')) {
      //          swap_navs.call($this_site_nav);
      //        } else {
      //          $nav_classer.toggleClass('openNav');
      //          //$this_site_nav.find('.site-nav__toggle-menu .fas').toggleClass('fa-bars fa-remove');
      //        }
      //
      //      });

      //      $site_nav.find('.site-nav__toggle-search, .utility-nav__toggle-search').on('click', function(e){
      //        //e.preventDefault(); // Still goes to #search-nav
      //        clearTimeout(panel_animation_timer);
      //        const $event_node = $(this);
      //        const $nav_classer = nav_classer($event_node);
      //        const $this_site_nav = $event_node.parents('.site-navigation');
      //        $nav_classer.removeClass('closingNav');
      //
      //        // If the burger had opened the menu, keep the menu open
      //        //if ($nav_classer.hasClass('openNav') && $site_nav.hasClass('nav--main')) {
      //        if ($nav_classer.hasClass('openNav') && $this_site_nav.hasClass('nav--main')) {
      //        } else {
      //          $nav_classer.toggleClass('openNav');
      //        }q
      //        swap_navs.call($this_site_nav);
      //      });
      // $mobile_simple_search.on('click', function(e){
      //   const $event_node = $(this);
      //   const $nav_classer = nav_classer($event_node);
      //   $nav_classer.toggleClass('openSearch');
      //   $('#simple-search-nav--mobile input').eq(1).focus();
      // });
      $site_nav.find('.utility-nav__toggle-simple-search, .site-nav__toggle-simple-search').on('click', function (e) {
        var $event_node = $(this);
        var $nav_classer = nav_classer($event_node);
        var $this_site_nav = $event_node.parents('.site-navigation');
        var $toggle_search_button = $event_node.find('button');
        var pressed = $toggle_search_button.attr("aria-pressed") === "true";
        // Change aria-pressed to the opposite state
        $toggle_search_button.attr("aria-pressed", !pressed);
        // Update aria-label for screenreaders
        if ($toggle_search_button.attr('aria-pressed') === 'true') {
          $toggle_search_button.attr('aria-label', 'Close search form');
        } else {
          $toggle_search_button.attr('aria-label', 'Open search form');
        }
        // Remove focus from button
        $toggle_search_button.blur();

        // $nav_classer.removeClass('closingNav');
        // If the burger had opened the menu, swap navs
        // if ($this_site_nav.hasClass('nav--main')) {
        //   swap_navs.call($this_site_nav);
        //
        // }
        var $searchIcon = $toggle_search_button.find('i');
        if ($nav_classer.hasClass('openSearch')) {
          $searchIcon.addClass('fal fa-search');
          $searchIcon.removeClass('icon--close');
        } else {
          $('#simple-search-nav input').eq(1).focus();
          $searchIcon.addClass('icon--close');
          $searchIcon.removeClass('fal fa-search');
        }

        $nav_classer.toggleClass('openSearch');
      });

      $site_nav.find('.utility-nav__toggle-search').on('click', function (e) {
        // e.preventDefault(); // Still goes to #search-nav
        // console.log('utility nav search click');
        clearTimeout(panel_animation_timer);
        var $event_node = $(this);
        var $nav_classer = nav_classer($event_node);
        var $this_site_nav = $event_node.parents('.site-navigation');
        var $toggle_search_button = $event_node.find('button');
        var pressed = $toggle_search_button.attr("aria-pressed") === "true";

        // Change aria-pressed to the opposite state
        $toggle_search_button.attr("aria-pressed", !pressed);

        // Update aria-label for screenreaders
        if ($toggle_search_button.attr('aria-pressed') === 'true') {
          $toggle_search_button.attr('aria-label', 'Close search form');
        } else {
          $toggle_search_button.attr('aria-label', 'Open search form');
        }

        // Remove focus from button
        $toggle_search_button.blur();

        $nav_classer.removeClass('closingNav');

        // If the burger had opened the menu, swap navs
        //if ($nav_classer.hasClass('openNav') && $site_nav.hasClass('nav--main')) {
        if ($this_site_nav.hasClass('nav--main')) {
          swap_navs.call($this_site_nav);
        }
        $nav_classer.toggleClass('openNav', true);
      });

      // Desktop search icon
      // Swap navigations on icon click
      var swap_navs = function swap_navs(e) {

        var $this_site_nav = this;
        var $this_mm = $this_site_nav.find('#main-nav');
        var $this_sm = $this_site_nav.find('#search-nav');
        var $this_sm_li = $this_sm.find('> li');

        $this_site_nav.toggleClass('nav--main');
        $this_site_nav.toggleClass('nav--search');

        $this_mm.toggleClass('nav--hide');

        $this_sm.toggleClass('nav--hide');

        $this_sm_li.toggleClass(sm_stick_form_class, false);

        // If not mobile ensure main menu open.
        if (!nwdsi.isMobile()) {
          $this_mm.collapse('show');

          return;
        }
      };

      // If mobile, toggle aria-expanded attribute when burger is clicked
      $('.site-nav__toggle-item', context).on('click', function (e) {
        if (nwdsi.isMobile()) {
          $(e.currentTarget).attr('aria-expanded', function (i, attr) {
            return attr == 'true' ? 'false' : 'true';
          });
        }
      });

      // If mobile toggle menus.
      $mm.each(function (i, mm) {
        var $this_mm = $(mm);
        var $this_sm = $sm.eq(i);
        var $nav_classer = nav_classer($this_mm);
        var $this_site_nav = $this_mm.parents('.site-navigation');

        $this_mm.on('show.bs.collapse', function () {

          if (!nwdsi.isMobile()) return;

          if ($this_sm.hasClass('in')) {

            $this_sm.collapse('hide');
          }

          clearTimeout(close_nav_timer);

          $nav_classer.removeClass('closingNav');

          // If the search had opened the menu, swap navs
          if ($this_site_nav.hasClass('nav--search')) {

            swap_navs.call($this_site_nav);
          }
          $nav_classer.toggleClass('openNav', true);
        });

        $this_mm.on('hide.bs.collapse', function () {
          clearTimeout(close_nav_timer);

          close_nav_timer = setTimeout(function () {
            $nav_classer.toggleClass('openNav', false);
          }, 10);
        });
      });

      $sm.each(function (i, sm) {
        var $this_sm = $(sm);
        var $this_mm = $mm.eq(i);
        var $nav_classer = nav_classer($this_sm);
        var $this_site_nav = $this_sm.parents('.site-navigation');
        var $this_sm_li = $this_sm.find('> li');
        var sm_open_timer = 0;

        $this_sm.on('show.bs.collapse', function () {
          clearTimeout(sm_open_timer);

          if (!nwdsi.isMobile()) {

            // Select/Reveal first or last-opened Tab upon opening the search flyout.
            // But only if no other tab is open.
            var last_active_tab_index = $this_sm_li.index($this_sm.data('last-opened.accessible-megamenu')) || 0;
            var $tab_to_open = $this_sm_li.eq(last_active_tab_index);
            if ($tab_to_open.length && !$this_sm_li.filter('.' + sm_stick_form_class + ', .active-parent').length) {
              //$all_tab.eq(0).toggleClass(sm_stick_form_class, true);
              // Use library events so other dependent behaviors can trigger,
              // E.g. Accessible-Mega-Menu -> panel-opened -> auto focus

              var $tab_to_open_link = $tab_to_open.find('> a').first();

              // Without timer, it is too soon to do focus events.
              // Need for search nav's opening transition to complete.

              sm_open_timer = setTimeout(function () {
                // Enables AMM click event, then clicks
                $tab_to_open.trigger('focusin').trigger('click').addClass('form-focus');
              }, window.nwdsi.settings.transitions.duration + 150);

              // Without timer, it is too soon to do focus events.
              // Need for search nav's opening transition to complete.
              sm_open_timer = setTimeout(function () {
                // Enables AMM click event, then clicks
                $tab_to_open_link.trigger('focusin').trigger('click');
              }, window.nwdsi.settings.transitions.duration + 150); // 150 seems to be a sweet spot. Any less and the input appears above the search nav then drops down, bizarre.
            }
            return;
          }

          if ($this_mm.hasClass('in')) {

            $this_mm.collapse('hide');
          }

          clearTimeout(close_nav_timer);

          $nav_classer.removeClass('closingNav');

          // If the burger had opened the menu, swap navs
          if ($this_site_nav.hasClass('nav--main')) {

            swap_navs.call($this_site_nav);
          }

          // Select/Reveal All Tab first by default upon opening the search flyout.
          // But only if no other tab is open.
          if ($this_sm_li.eq(0).length && !$this_sm_li.filter('.' + sm_stick_form_class + ', .active-parent').length) {

            $this_sm_li.eq(0).toggleClass(sm_stick_form_class, true);
          }

          $nav_classer.toggleClass('openNav', true);
        });

        $this_sm.on('hide.bs.collapse', function () {
          clearTimeout(sm_open_timer);
          clearTimeout(close_nav_timer);

          close_nav_timer = setTimeout(function () {
            $nav_classer.toggleClass('openNav', false);

            // find the open button and put focus back on it
            var $utility_nav_container = $('.utility-nav__container');
            var $search_nav_close = $utility_nav_container.find('.utility-nav__toggle-search button');
            // find the close button give it focus
            $search_nav_close.focus();

            if ($this_site_nav.hasClass('nav--search')) {
              swap_navs.call($this_site_nav);
            }
          }, 10);
        });
      });

      // duplicate of above
      //$sm.on('show.bs.collapse', function () {
      //  // Select/Reveal All Tab first by default upon opening the search flyout.
      //  $(this).find('> li').eq(0).toggleClass(sm_stick_form_class, true);
      //});

      // swap sub tabs eg doctors specialty & insurance > name &  keyword and
      // vice versa used to be here. Have moved it to tabbed-search.js.

      // If the search flyout links are still just #, then don't go anywhere.
      $sm.find(" > li > a[href='#']").on('click', function (e) {
        e.preventDefault();
      });

      var accessibleMegaMenu_options = {
        /* prefix for generated unique id attributes, which are required
         to indicate aria-owns, aria-controls and aria-labelledby */
        uuidPrefix: "accessible-megamenu",

        /* css class used to define the megamenu styling */
        menuClass: "accessible-megamenu-nav-menu",

        /* selector for the menu element within the nav */
        menuSelector: "#main-nav", //"ul.menu:first",

        /* css class for a top-level navigation item in the megamenu */
        topNavItemClass: "accessible-megamenu-nav-item",

        /* css class for a megamenu panel */
        panelClass: "accessible-megamenu-sub-nav",

        /* css class for a group of items within a megamenu panel */
        panelGroupClass: "accessible-megamenu-sub-nav-group",

        /* css class for the hover state */
        hoverClass: mm_reveal_class,

        /* css class for the focus state */
        focusClass: "focus",

        /* css class for the open state */
        openClass: "open"
      };

      // Disable for mobile
      if (nwdsi.isMobile()) {
        var subNavToggle = function subNavToggle($this) {
          var $sibs = $this.siblings();
          var $li = $this.parent();
          var $icons = $li.siblings().find(' > .sub-nav__toggle');
          // console.log($sibs); // first-level li's
          // console.log($li); // #main nav
          if ($sibs.hasClass('active-parent-link') || $li.hasClass(sm_stick_form_class)) {
            $li.removeClass(sm_stick_form_class);
            $sibs.removeClass('active-parent-link');
            $li.removeClass('active-parent');
          } else {
            $li.find('> a').addClass('active-parent-link');
            $li.addClass('active-parent');
          }

          $li.siblings().removeClass('active-parent');
          $li.siblings().removeClass(sm_stick_form_class);
          $sibs.parents('#main-nav').addClass('is_open'); // #main-nav

          $li.siblings().children().removeClass('active-parent-link');

          // If the menu item renders off screen, scroll to it
          var top = $li.offset().top;
          if ($body.scrollTop() > top) {
            $html_body.scrollTop(top);
          }
        };

        // Clicking Search Nav links should open/close, not take you to link


        $sm_li.find("> a").on('click', function (e) {
          e.preventDefault();
          // jQuery(this).find('+ .sub-nav__toggle').click();
          subNavToggle($(this));
        });

        $("[id=main-nav] li .sub-nav__toggle, [id=search-nav] li .sub-nav__toggle, [id=main-nav] li", context).click(function () {
          subNavToggle($(this).find('.sub-nav__toggle'));
        });
      } else {

        var sm_accessibleMegaMenu_options = $.extend(true, {}, accessibleMegaMenu_options);
        sm_accessibleMegaMenu_options.menuSelector = '#search-nav';

        // Prevent mousedown from working in medium+
        $mm.on('mousedown.accessible-megamenu', function (e) {

          if ($body.width() >= 992) {
            e.stopImmediatePropagation();
            return false;
          }
        });
        var $mm_nav = $site_links.find(".main-nav__wrapper");
        $mm_nav.accessibleMegaMenu(accessibleMegaMenu_options);
        // these conflict with menuAim
        $mm.off('mouseover.accessible-megamenu').off('mouseout.accessible-megamenu');

        $site_links.find('.search-nav__wrapper').accessibleMegaMenu(sm_accessibleMegaMenu_options);
        $sm.off('mouseover.accessible-megamenu').off('mouseout.accessible-megamenu');

        // For some odd reason hovering over select causes parent to lose focus
        var sm_stick_form_fn = function sm_stick_form_fn() {
          $(this).parents('li').toggleClass(sm_stick_form_class, true);
        };
        // no longer needed in dsi
        //$sm.on('mouseenter', '.select2-container', sm_stick_form_fn);
        //$sm.find('.typeahead').on('typeahead:select', sm_stick_form_fn); // some browsers (not Chrome) hide the nav after selecting a typeahead option beyond the nav
        //$sm.on('click', '.tabs-text__item', sm_stick_form_fn); // If you click in search helper not lose the mega menu
        $sm.find('.form-control').on('focus', sm_stick_form_fn); // If you right click in an input to paste we lose the mega menu
        $sm.on('mousedown', '.' + sm_accessibleMegaMenu_options.topNavItemClass, function () {
          var $this = $(this);
          $this.siblings().removeClass(sm_stick_form_class);
          $this.toggleClass(sm_stick_form_class, true);
        });

        // On tab activation, auto focus to input if there is only one.
        $sm.on('panel-opened.accessible-megamenu', function (event, list_item, panel, hide, panelWasOpen) {
          var $this_sm = $(list_item).parents('#search-nav');
          $this_sm.data('last-opened.accessible-megamenu', list_item);

          //if ( ! panelWasOpen) { // for some reason in DSI this is always true...
          //console.log('panel was not previously open');
          if (!hide) {
            // Accessibility fix, keyboard commands toggle openClass but not our custom sticky class
            $this_sm.find('.' + sm_accessibleMegaMenu_options.topNavItemClass).not('.' + sm_accessibleMegaMenu_options.openClass).toggleClass(sm_stick_form_class, false);
            //console.log('hide is not truthy', panel);
            // Auto focus first field if non dropdown
            window.nwdsi.focus_first_field(panel);
          }
          //}
        });

        var menuaim_options = {
          activate: function activate(li) {
            var $li = $(li);
            // console.log($li)
            $li.toggleClass(mm_reveal_class, true);
            // $li.toggleClass('open', true);
          },
          deactivate: function deactivate(li) {
            $(li).removeClass(mm_reveal_class);
            // $(li).removeClass('open');
          },
          exitMenu: function exitMenu(ul) {
            return true;
          },
          tolerance: 20,
          submenuDirection: 'below'
        };

        $mm.menuAim(menuaim_options);
      }
      // wf 144123 DDM 10.23.2019 add focus handling for the close button on the global search
      var $search_nav = $('#search-nav');
      // find the submit button of the last tab and send focus to the close button on tab
      var $searchnav_submit_last = $search_nav.find('form .button--submit').last();
      $searchnav_submit_last.blur(function (e) {
        // there are two utility navs so chose the one that handles the desktop search
        var $search_nav_close = null;
        if (nwdsi.isMobile()) {
          var $site_header_top = $('.site-header__top');
          $search_nav_close = $site_header_top.find('.site-nav__toggle-search');
        } else {
          var $utility_nav_container = $('.utility-nav__container');
          $search_nav_close = $utility_nav_container.find('.utility-nav__toggle-search button');
        }
        // find the close button give it focus
        $search_nav_close.focus();
      });

      // add click event to bell icon in desktop utiliy nav
      // to show the notifications tray
      var hideMessageDrawer = function hideMessageDrawer() {
        // @todo add a method to `northwell` to trigger this on the component to avoid tightly coupling to the DOM of the React component.
        var $messagesListContainer = $('#message-list-container');
        if (!$messagesListContainer.hasClass('drawer__hidden')) {
          $messagesListContainer.addClass('drawer__hidden');

          setTimeout(function () {
            $messagesListContainer.removeClass('drawer__added');
          }, 500);
        }
      };
      var showMessageDrawer = function showMessageDrawer() {
        var $messagesListContainer = $('#message-list-container');
        if ($messagesListContainer.hasClass('drawer__hidden')) {
          $messagesListContainer.addClass('drawer__added');

          setTimeout(function () {
            $messagesListContainer.removeClass('drawer__hidden');
          }, 10);
        }
      };
      if (!$bell_icon.length) return;
      $("body").bind("click", function (e) {
        var $el = $(e.target);
        var $isMessageList = $el.parents('#message-list-container').length;
        // user clicks anywhere but the bell close the panel
        if (!$el.hasClass('nwh_notifications_bell') && !$isMessageList) {
          hideMessageDrawer();
        }
      });
      $bell_icon.on('click', function (e) {
        var $messagesListContainer = $('#message-list-container');
        if (!$messagesListContainer.length) return;
        if ($messagesListContainer.hasClass('drawer__hidden')) {
          showMessageDrawer();
        } else {
          hideMessageDrawer();
        }
        // START appinsights
        if (gigya) {
          gigya.accounts.getAccountInfo({
            callback: function callback(response) {
              // check if notifications are present
              var readMsgs = "notchecked";
              if (northwell.getUnreadMessageCount) readMsgs = northwell.getUnreadMessageCount() > 0 ? "read" : "unread";
              // Check we're logged in.
              var gigUID = response.UID ? response.UID : null;
              if (typeof appInsights !== "undefined") {
                try {
                  appInsights.trackEvent({
                    name: "Button Clicked",
                    properties: {
                      Properties: {
                        gigyaUID: gigUID,
                        channel: "edu",
                        pageURL: window.location.href,
                        screenTitle: JSON.stringify(document.getElementsByTagName("title")[0].innerHTML),
                        testId: "Notifications-Icon-Bell",
                        readUnread: readMsgs
                      }
                    }
                  });
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error(e);
                }
              }
            }
          });
        }
        // END app insights
        // START Google Tag Manager Tracking
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "notifications",
          action: "open notifications"
        });
        // END Google Tag Manager Tracking
      });
      if (typeof gigya !== 'undefined' && typeof gigya.accounts !== 'undefined' && typeof gigya.accounts.addEventHandlers !== 'undefined') {
        gigya.accounts.addEventHandlers({ onLogout: hideMessageDrawer });
      }
    }
  };
})(jQuery, Drupal);

// Set CSS variables which are used for the message list in the header.
(function () {
  var debounce = function debounce(f) {
    var inProgress = false;

    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (inProgress) {
        return;
      }

      inProgress = true;

      f.apply(undefined, args);

      // To allow the drawer to track the sticky header, we will allow this value to update 60 times per second which is similar to a 60 fps screen common to many devices. Hopefully that is a sweet spot between performance and smoothness.
      setTimeout(function () {
        inProgress = false;
      }, 1000 / 60);
    };
  };

  var getVisibleHightForTopAlignedItem = function getVisibleHightForTopAlignedItem(element) {
    if (element === null) {
      return 0;
    }

    var bounds = element.getBoundingClientRect();
    var visibleHeight = bounds.top + bounds.height;
    return visibleHeight > 0 ? visibleHeight : 0;
  };

  var getVisibleHightForBottomAlignedItem = function getVisibleHightForBottomAlignedItem(element) {
    if (element === null) {
      return 0;
    }

    var bounds = element.getBoundingClientRect();
    // Bottom aligned elements seem to have 0 height when not visible.
    return bounds.height;
  };

  var body = document.querySelector('body');

  var setHeightCSSVariablesAndClasses = function setHeightCSSVariablesAndClasses() {
    // body.style.setProperty('--scroll-y', `${window.scrollY}px`);

    var headerMenuHeight = getVisibleHightForTopAlignedItem(document.querySelector('.menu-holder'));
    var headerStickyMenuHeight = getVisibleHightForTopAlignedItem(document.querySelector('.compressed-nav'));

    body.style.setProperty('--header-menu-height', headerMenuHeight + 'px');

    body.style.setProperty('--header-sticky-menu-height', headerStickyMenuHeight + 'px');

    body.style.setProperty('--mobile-tray-height', getVisibleHightForBottomAlignedItem(document.querySelector('.mobile-tray')) + 'px');

    if (window.scrollY < headerMenuHeight + headerStickyMenuHeight) {
      body.classList.add('scrolled-above-header');
    } else {
      body.classList.remove('scrolled-above-header');
    }
  };

  document.addEventListener('scroll', debounce(function () {
    setHeightCSSVariablesAndClasses();
    // There is an animation, so we want to set this value again once the animation has completed.
    setTimeout(setHeightCSSVariablesAndClasses, 500);
  }));

  window.addEventListener('resize', debounce(setHeightCSSVariablesAndClasses));

  // Set initial values.
  setTimeout(setHeightCSSVariablesAndClasses, 1000);
})();
"use strict";

(function profilecardScript($, Drupal) {
  Drupal.behaviors.profilecard = {
    attach: function attach(context) {
      // Checks if titles exceeds 3 lines. If does, truncates with
      // '...See more' and links to doctor profile via data-url attr
      var $titleContainer = $(".profile-card-v2__titles-container");

      $($titleContainer).each(function (index) {
        var $this = $(this);
        var url = $this.attr("data-url");
        var target = $this.attr("data-target");
        var $title = $this.find(".profile-card-v2__professional-title");

        // Shave set to 66px, (Line height for each line is 22px, 66px === 3 lines, should always be in intervals of 22)
        shave($title, 66, {
          character: target ? "<a href=" + url + " target=" + target + "> ...See more</a>" : ' ...'
        });
      });
      // End truncation function

      if (!$(".profile-card--toggle_panel").length) return;
      var $contentBody = $(".profile-card__column-wrapper");
      var $contentBodySection = $(".profile-card__column-wrapper .profile-card__body-section");
      var $contentBodyArrow = $(".profile-card__column-wrapper").find(".icon.icon--angle-thin");
      var $contentBodyBtn = $(".profile-card-btn__toggle");

      if ($contentBody.length >= 0) {
        var targetEl = $($contentBodySection);
        var charLimit = 500;
        $(targetEl).each(function (index) {
          var $this = $(this);
          var charLength = $this.text().length;
          console.log("charLimit:" + charLimit);
          console.log("charLength:" + charLength);
          // for index, if the charlength exceeds the limit,
          // first statement executes, else second excutes
          if (charLength > charLimit) {
            $this.closest($contentBody).find($contentBodyBtn).addClass("active-view");
            $this.closest($contentBody).addClass("active-view");
            $this.closest($contentBody).find(".icon.icon--angle-thin").addClass("active-view");
          } else {
            $this.closest($contentBody).find($contentBodyBtn).removeClass("active-view");
            $this.closest($contentBody).removeClass("active-view");
            $this.closest($contentBody).find(".icon.icon--angle-thin").removeClass("active-view");
            $this.closest($contentBody).find(".profile-card__panel-clip").addClass("remove");
          }
        });

        $($contentBodyBtn).click(function () {
          var $this = $(this);
          // button has a class of 'btn-active'
          if ($this.hasClass("btn-active")) {
            $this.removeClass("btn-active");
            $this.text("View more");
            $this.next($contentBodyArrow).removeClass("caret-up");
            // traverse up the DOm 'closest()' in the set matched, find the section
            // then remove the active class
            $this.closest($contentBody).find(".profile-card__body-section").removeClass("active");
          } else {
            // if button has no class of 'btn-active'
            $this.addClass("btn-active");
            $this.text("View less");
            $this.next($contentBodyArrow).addClass("caret-up");
            // traverse up the DOm 'closest()' in the set matched, find the section
            // then add the active class
            $this.closest($contentBody).find(".profile-card__body-section").addClass("active");
          }
        });
      }
    }
  };
})(jQuery, Drupal);
"use strict";

(function profileCompressedHeaderScript($, Drupal) {
  Drupal.behaviors.profileCompressedHeaderScript = {
    attach: function attach(context) {
      if ($("#toolbar-administration").length) {
        var topOffset = 78;
        $(".profile-hero__header--collapsed").css({
          "margin-top": topOffset + "px",
          "z-index": 99
        });
      }
      var collapse_header = document.querySelector(".profile-hero__collapsed-header");
      var $collapse_header = $(collapse_header);
      if (!$collapse_header.length) return;
      var go2topBtn = $("#header--gototop", context);
      var scrolling = false;
      var header = document.querySelector(".profile-hero--bg");
      var $header = $(header);
      var headerHeight = $header.height();
      // create the observer
      var observer = new IntersectionObserver(function (entry, observer) {
        if (entry[0].isIntersecting) {
          $collapse_header.removeClass("profile-hero__header--collapsed");
        } else {
          if (nwdsi.isMobile()) {
            var $navOpen = $("html.openNav");
            var $statusOpen = $(".status-message");
            if ($navOpen.length || $statusOpen.length) {
              // get the height of the mobile menu and/or the status message
              var statusHeight = $statusOpen.length ? $(".status-message").height() : 0;
              var navHeight = $navOpen.length ? $(".nav--main").height() : 0;
              var profheaderHeight = $(".profile-hero--bg__container").height();
              var topBuffer = parseFloat(navHeight) + parseFloat(statusHeight) + parseFloat(profheaderHeight);
              if ($(window).scrollTop() >= topBuffer) $collapse_header.addClass("profile-hero__header--collapsed");
              return;
            }
          }
          $collapse_header.addClass("profile-hero__header--collapsed");
        }
      });
      // pass in the observer
      observer.observe(header);
      // add click handler for gototop
      // attach the click handler to the "go to top" button
      // to take the user to the top of the page, animated
      go2topBtn.on("click", function (e) {
        e.preventDefault();
        $("html,body").animate({ scrollTop: 0 }, "slow");
        return false;
      });

      function setPhysicianId() {
        var ds = drupalSettings;
        var echoId = ds.baa.echo_id;
        var physicianId = ds.baa.provider_id;
        var telehealthType = ds.baa.telehealth_type;
        localStorage.setItem("physician_id", physicianId);
        localStorage.setItem("telehealth_type", telehealthType);
        localStorage.setItem("echo_id", echoId);
      }

      $(".maa-online").on("click", setPhysicianId);
    }
  };
})(jQuery, Drupal);
'use strict';

(function searchFormLocationsGeolocationScript($, Drupal) {
  Drupal.behaviors.searchFormLocationsGeolocation = {
    initTypeahead: function initTypeahead(newState) {
      var _this = this;

      // Merge state object with new state object
      $.extend(this.state, newState);

      var typeahead_focus_class = 'twitter-typeahead--focus';
      var typeahead_focus_timer = 0;

      var typeahead_blur_event = function typeahead_blur_event(e) {
        clearTimeout(typeahead_focus_timer);
        var $field = $(this);
        // Time it so the accuracy between various possible triggers is more accurate.
        typeahead_focus_timer = setTimeout(function () {
          if (!$field.is(':focus')) {
            var $typeahead = $field.parents('.twitter-typeahead');
            $typeahead.toggleClass(typeahead_focus_class, false);
          }
        }, 15);
      };

      // First argument for typeahead
      var typeaheadOptions = {
        highlight: true,
        minLength: 0,
        events: {
          'typeahead:active': function typeaheadActive(e) {
            clearTimeout(typeahead_focus_timer);
            var $field = $(this);
            var $typeahead = $field.parents('.twitter-typeahead');
            $typeahead.toggleClass(typeahead_focus_class, true);
          },
          'typeahead:idle': function typeaheadIdle(e) {
            typeahead_blur_event.call(this, e);
          }
        }

        /**
         *
         * @param response[arr], response returned from API
         * @returns results, array of locations
         *
         */
      };var transformResponse = function transformResponse(response) {
        var results = response.response.results;
        // "Use current location" option. See this.state.
        var userLocationOption = _this.state.location;

        // First we check if the userLocationOption obj is in the results
        // array. If not, add the oject to the beginning of the array
        if (results.indexOf(userLocationOption) === -1) {
          results.unshift(userLocationOption);
        }

        // Map the remote source JSON array to a JavaScript object array
        return $.map(results, function (item) {
          return {
            value: item.value,
            id: item.id,
            longitude: item.longitude,
            latitude: item.latitude,
            type: item.type
          };
        });
      };

      /**
       *
       * @param datum[obj], item from results array
       * @returns markup with item's value
       *
       */
      var templateResults = function templateResults(datum) {
        // If geolocation, style differently
        if (datum.type === 'geolocation') {
          return '<div class="tt-suggestion__text--geolocation"><i class="fal fa-location-arrow"></i><span>' + datum.value + '</span></div>';
        }
        return '<div><span class="tt-suggestion__text">' + datum.value + '</span></div>';
      };

      // Instantiate the Bloodhound suggestion engine
      var locations = new Bloodhound({
        datumTokenizer: function datumTokenizer(datum) {
          return Bloodhound.tokenizers.whitespace(datum.value);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        identify: function identify(obj) {
          return obj.value;
        },
        local: this.state.location,
        remote: {
          url: this.state.searchApiUrl + '?q=%QUERY',
          wildcard: '%QUERY',
          transform: transformResponse
        }
      });

      /**
       *
       * @param q [str], search term
       * @param sync [func], checks local storage for data
       *
       * If input is empty, only show "User location" option. If not, init typeahead with remote data
       *
       */
      var defaultSuggestions = function defaultSuggestions(q, sync) {
        if (q === '') {
          sync(locations.all());
        } else {
          $.extend(typeaheadOptions, { minLength: 1 });

          _this.$geolocationField.typeahead('destroy').typeahead(typeaheadOptions, {
            name: 'suggest_' + name,
            display: 'value',
            source: locations.ttAdapter(),
            templates: {
              suggestion: templateResults
            }
          }).typeahead('val', _this.$geolocationField.val()).trigger('change').trigger('focus');
        }
      };

      // Initial typeahead init
      this.$geolocationField.typeahead(typeaheadOptions, {
        name: 'suggest_' + name,
        display: 'value',
        source: defaultSuggestions,
        templates: {
          suggestion: templateResults
        }
      });
    },


    state: {
      searchApiUrl: 'https://api.northwell.edu/v1/geo/search',
      googleApiUrl: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyByobPcaArIweKdpYh_LYqORmjXrz7TlUk',
      location: {
        value: 'Use current location',
        id: 'geo_location_use_current',
        longitude: '',
        latitude: '',
        type: 'geolocation'
      }
    },

    /**
     *
     * @param newState[obj], Updating field with city, state and zip
     *
     */
    change: function change(newState) {
      // Merge state object with new state object
      $.extend(this.state, newState);
      // If there is an error message visible, hide it.
      this.$parentSelector.find('.form-item__geolocation-error-message').addClass('hidden');

      this.$geolocationField
      // Update value to user's location
      .typeahead('val', this.state.location.value)
      // Notify typeahead of change
      .trigger('change').parents('form').get(0).submit();
    },


    /**
     *
     * @param newState[obj], Reverse geocoding to get city, state, zip using latlng.
     *
     */
    getLocation: function getLocation(newState) {
      var _this2 = this;

      // Merge state object with new state object
      $.extend(this.state, newState);

      var city = void 0;
      var state = void 0;
      var zip = void 0;

      $.getScript(this.state.googleApiUrl, function () {
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(_this2.state.location.latitude, _this2.state.location.longitude);

        geocoder.geocode({ latLng: latlng }, function (results, status) {
          var components = results[0].address_components;
          if (status === google.maps.GeocoderStatus.OK && components.length) {
            components.forEach(function (component) {
              switch (component.types[0]) {
                case 'political':
                  city = component.long_name;
                  break;
                case 'administrative_area_level_1':
                  state = component.long_name;
                  break;
                case 'postal_code':
                  zip = component.long_name;
                  break;
                default:
                  break;
              }
            });
          }

          _this2.change({
            location: {
              value: city + ', ' + state + ' ' + zip
            }
          });
        });
      });
    },
    attach: function attach(context) {
      var _this3 = this;

      // Scope parent
      this.$parentSelector = $('.search-form--geolocation-field', context);
      // Bail immediately if our widget doesn't exist, improves performance.
      if (!this.$parentSelector.length) {
        return false;
      }

      this.$geolocationField = this.$parentSelector.find('.search-locations--default-geolocation');

      var onGeolocateSuccess = function onGeolocateSuccess(coordinates) {
        _this3.$parentSelector.find('.form-item__geolocation-error-message').addClass('hidden');
        // Grab latitude and longitude and send to getLocation() function.
        var _coordinates$coords = coordinates.coords,
            latitude = _coordinates$coords.latitude,
            longitude = _coordinates$coords.longitude;

        _this3.getLocation({
          location: {
            latitude: latitude,
            longitude: longitude
          }
        });
      };

      var onGeolocateError = function onGeolocateError(error) {
        switch (error.code) {
          // Permission denied
          case 1:
            _this3.$parentSelector.find('.form-item__geolocation-error-message').removeClass('hidden');
            _this3.$geolocationField.typeahead('val', '').typeahead('typeahead:close');
            break;
          // Timeout
          case 2:
            _this3.$parentSelector.find('.form-item__geolocation-error-message').removeClass('hidden');
            break;
          default:
            break;
        }
      };

      // When a selection has been made
      this.$geolocationField.on('typeahead:select', function (ev, suggestion) {
        // Check if the selection was geolocation
        if (suggestion.type && suggestion.type === 'geolocation') {
          // Request that user share their location.
          navigator.geolocation.getCurrentPosition(onGeolocateSuccess, onGeolocateError);
        } else {
          _this3.change({
            location: {
              value: _this3.$geolocationField.typeahead('val')
            }
          });
        }
      }).on('input', function () {
        _this3.$parentSelector.find('.form-item__geolocation-error-message').addClass('hidden');
      });

      this.initTypeahead({
        searhApiUrl: this.state.searhApiUrl,
        location: this.state.location
      });
    }
  };
})(jQuery, Drupal);
"use strict";

(function searchCovidPublications($, Drupal) {
  if (!$("#covid_search_form").length) return;

  Drupal.behaviors.searchCovidPublications = {
    attach: function attach(context) {
      //   var input = document.querySelectorAll("#covid_search_form")[0];
      //   console.log(input);
      //   function pop(e) {
      //     e.preventDefault();
      //     console.log("submitted");
      //   }
      //   input.addEventListener("submit", pop);
    }
  };
})(jQuery, Drupal);
"use strict";
'use strict';

(function searchlinksScript($, Drupal) {
  Drupal.behaviors.searchlinks = {
    state: {
      isVisible: false
    },
    change: function change(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }

      if (this.state.isVisible) {
        this.$parentSelector.addClass('search-links--open');
      } else if (!this.state.isVisible) {
        this.$parentSelector.removeClass('search-links--open');
      } else {
        return false;
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('.search-links', context);

      this.$parentSelector.on('click', '.search-links__button', function () {
        _this.change({ isVisible: !_this.state.isVisible });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function statTickerScript($, Drupal) {
  if ($(!'.stat-ticker').length) return;
  Drupal.behaviors.statTicker = {
    attach: function attach(context) {
      var browser_name = navigator.browserSpecs.name;
      var browser_version = navigator.browserSpecs.version;
      var showOnlyStatic = nwdsi.isMobile() || browser_name === 'MSIE' ? true : false;
      var $ticker_groups = $('.stat-ticker-group');
      function setTickers() {
        $ticker_groups.each(function (i, e) {
          var $tickers = $(e).find('.stat-ticker');
          $tickers.each(function (i, e) {
            var $ticker = $(e);
            // create the variables for the options and config objects
            var tickernumber = $ticker.attr('data-number');
            var tickerprefix = $ticker.attr('data-prefix');
            var tickersuffix = $ticker.attr('data-suffix');
            var tickerduration = $ticker.attr('data-duration');
            var tickervariant = $ticker.attr('data-variant');
            var tickerstyle = $ticker.attr('data-style');
            var tickercolor = $ticker.attr('data-color');
            var ctx_id = "animated_ctx_" + $ticker.attr('data-id');
            var ctx2_id = "underlay_ctx_" + $ticker.attr('data-id');
            var ctx3 = void 0;
            if (tickervariant === 'icon') {
              var ctx3_id = "bg_ctx_" + $ticker.attr('data-id');
              ctx3 = document.getElementById(ctx3_id).getContext('2d');
            }
            var ctx = document.getElementById(ctx_id).getContext('2d');
            var ctx2 = document.getElementById(ctx2_id).getContext('2d');
            var $title = $ticker.find('.stat-ticker__text');
            var options = {
              "tickervariant": tickervariant,
              "tickernumber": tickernumber,
              "tickerprefix": tickerprefix,
              "tickersuffix": tickersuffix,
              "tickerdurarion": tickerduration,
              "tickerstyle": tickerstyle,
              "tickercolor": tickercolor,
              "tickerid": $ticker.attr('data-id'),
              "title": $title
            };
            var config = {
              "element": $ticker,
              "underlay": ctx2,
              "overlay": ctx,
              "bg": ctx3,
              "options": options,
              "showOnlyStatic": showOnlyStatic
            };
            if (tickervariant === 'icon' && !showOnlyStatic) {
              $ticker.delay(500 * i).queue(function () {
                nwdsi.statTicker(config);
              });
            } else {
              nwdsi.statTicker(config);
            }
          });
        });
      }
      // init tickers
      if (showOnlyStatic) {
        setTickers();
      } else {
        nwdsi.whenVisibleObserver({ "selector": ".stat-ticker-group", "callback": setTickers, "callbackEvent": "inview", "options": { "rootMargin": "-50px" } });
      }

      $(window).on('resize orientationchange', _.debounce(function () {
        showOnlyStatic = true;
        setTickers();
      }));
    }
  };
})(jQuery, Drupal);
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var drupalSettings = drupalSettings === undefined ? {} : drupalSettings;
(function typeaheadSearchGroupingScript($, Drupal, settings) {
  Drupal.behaviors.typeaheadSearchGrouping = {
    initSelect2: function initSelect2(state, unselecting, typeahead) {
      var _this2 = this;

      var $dropdownParent = typeahead.$parentSelector;
      var $originalSelect = typeahead.$originalSelect;
      var queryParameters = state.queryParameters;
      /**
       *
       * @param data, Data returned from API
       * @returns results, Object with a key results
       *
       */
      function processData(data) {
        var _this = this;

        var optionsIndex = 0;
        var results = [];
        // Create first <option> which we will use as a placeholder for a button
        results.push({ text: "&lt; Back to all categories", button: true });

        // If Object.entries does not exist, create it.
        if (!Object.entries) Object.entries = function (obj) {
          var ownProps = Object.keys(obj),
              i = ownProps.length,
              resArray = new Array(i); // preallocate the Array
          while (i--) {
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
          }return resArray;
        };

        // First loop over group object
        Object.entries(data.response.results).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              group = _ref2[0],
              children = _ref2[1];

          var moreAvailableResults = false;
          // Alter optgroup text displayed in the dropdown
          var groupText = "";
          if (group === "term") {
            groupText = "Treatments & conditions";
          } else if (group === "specialty") {
            groupText = "Specialties";
          } else {
            groupText = "Doctors";
          }

          if (children.length === 4 && !state.activeCategory) {
            moreAvailableResults = true;
            children.splice(-1, 1);
          } else {
            moreAvailableResults = false;
          }
          var processedResult = {
            text: groupText,
            group: group.toLowerCase(),
            children: children,
            moreChildren: moreAvailableResults
          };

          // Then loop over its nested children array
          Object.entries(children).forEach(function (_ref3, index, arr) {
            var _ref4 = _slicedToArray(_ref3, 2),
                key = _ref4[0],
                item = _ref4[1];

            item.id = _this.ajaxOptions.titleCaseOptions(item.value, group);
            item.text = item.value;
            item.group = group;
            // If end of loop, reset optionsIndex
            index === arr.length - 1 ? optionsIndex = 0 : optionsIndex += 1;
          });
          // Push processed result to the results array
          results.push(processedResult);
        });

        // Select2 expects a very specific data format. This format consists of a
        // JSON object containing an array of objects keyed by the results key.
        return {
          results: results
        };
      }

      // Typeahead behavior
      /**
       *
       * @param resultsText[str], options we are matching against
       * @param term[str], search input value
       *
       */
      function markMatch(resultsText, term, group) {
        // Find where the match is
        var match = resultsText.toUpperCase().indexOf(term.toUpperCase());
        var $result = $("<span data-group=\"" + group + "\"></span>");

        // If there is no match, move on
        if (match < 0) {
          return $result.text(resultsText);
        }
        // Put in whatever text is before the match
        $result.text(resultsText.substring(0, match));
        // Mark the match
        var $match = $("<span class=\"select2-rendered__match\" data-group=\"" + group + "\"></span>").text(resultsText.substring(match, match + term.length));

        return $result
        // Append the matching text
        .append($match)
        // Put in whatever is after the match
        .append(resultsText.substring(match + term.length));
      }

      /**
       *
       * @param text, String - option
       * @returns group, String - optgroup
       *
       */
      function processText(text, group) {
        var processedText = text;
        // Provider's have titles, like "MD" after their name so we capitalize them
        if (group === "name") {
          processedText = text;
          // DDM Feb 6 2023 removed this processing code because the API is returning the correct casing.
          // .toLowerCase()
          // .split(" ")
          // .map((word, i, arr) => {
          //   if (arr.length - 1 === i) {
          //     return word.toUpperCase();
          //   }
          //   if (word === 'ii,' || word === 'iii,' || word === 'np,') {
          //     return word.toUpperCase();
          //   } else {
          //     return word.replace(word[0], word[0].toUpperCase());
          //   }
          // })
          // .join(" ");
          // Everything else can be title cased
        } else {
          processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1).toLowerCase();
        }
        return processedText;
      }
      var placeholder_text = $originalSelect.attr("placeholder") ? $originalSelect.attr("placeholder") : "" + Drupal.t("Specialty, condition, treatment, doctor name");
      $originalSelect.select2({
        dropdownParent: $dropdownParent,
        placeholder: placeholder_text,
        minimumInputLength: 3,
        ajax: {
          delay: 250, // wait 250 milliseconds before triggering the request
          cache: false,
          url: function url(query) {
            // Group ex. providers, specialites, or term
            if (queryParameters.taxonomy) {
              query.taxonomy = "&taxonomy%5B0%5D=" + queryParameters.taxonomy;
            }

            // Number of results to show
            query.count = queryParameters.count;
            query.url = queryParameters.apiUrl;

            query.defaultArgs = queryParameters.taxonomy ? '' : '&' + queryParameters.defaultArgs;

            if (!query.term) {
              query.term = queryParameters.term;
            }
            return query.url + "?q=" + query.term + query.defaultArgs + "&group_results=true&count=" + query.count + query.taxonomy;
          },
          dataType: "json",
          processResults: processData,
          data: function data(params) {
            var query = {
              search: params.term,
              type: "query"
            };
            return query;
          },
          titleCaseOptions: processText
        },
        templateResult: function templateResult(item) {
          if (item.loading) {
            return item.text;
            // Select2 does not give optgroups an ID. this is how we check for optgroups.
          } else if (!item.id && item.text && !item.button) {
            // Title case text
            item.text = processText(item.text, item.data_parent = "");
            // If on default optgroups view, add button to result
            if (!_this2.state.activeCategory && item.moreChildren) {
              return $("<span class=\"search-form__group\">\n                              <h4>" + item.text + "</h4>\n                              <button data-group=\"" + item.group + "\" href=\"#\" class=\"search-form__opt-group-button\" role=\"button\" aria-label=\"View all " + item.text + " options\">\n                                " + Drupal.t("See more") + " >\n                              </button>\n                            </span>");
            } else {
              return $("<span class=\"search-form__group\"><h4>" + item.text + "</h4></span>");
            }
            // The first "optgroup" is the 'Back to all categories button"
          } else if (item.button) {
            return $("<div class=\"search-form__opt-group-show-less " + _this2.state.buttonClass + "\"><button aria-label=\"Back to all categories\">" + Drupal.t("&lt; Back to all categories") + "</button></div>");
            // Only options have an id
          } else if (item.id) {
            // Title case text and send group var as well to check type
            item.text = processText(item.text, item.group);
            var term = _this2.state.query.term || "";
            return markMatch(item.text, term, item.group);
          }
        },
        language: {
          searching: function searching(params) {
            // Intercept the query as it is happening
            _this2.state.query = params;
            // Change this to be appropriate for your application
            return Drupal.t("Searching...");
          }
        }
      });

      // If an option has been selected, create a new Option object and append it to the control
      if ($originalSelect.find("option").length && !unselecting) {
        var selectedValue = $originalSelect.val();
        // 3rd param determines where item is "default selected"
        // 4th param sets the options selected state
        var newOption = new Option(selectedValue, selectedValue, true, true);

        $originalSelect.append(newOption).trigger("change");
      }
    },


    state: {
      isOpen: false,
      activeCategory: false,
      $detachedButton: "",
      storedInput: "",
      buttonClass: "hidden",
      unselecting: false,
      $originalSelect: "",
      $parentSelector: "",
      query: {},
      queryParameters: {
        defaultArgs: "",
        count: 4,
        taxonomy: "",
        term: "",
        apiUrl: ""
      }
    },

    change: function change(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }

      var typeaheadClasses = {
        $originalSelect: this.$originalSelect,
        $parentSelector: this.$parentSelector
      };

      // Check if user is on an optgroup list view
      if (this.state.isOpen && this.state.activeCategory) {
        // First we close select2 to reset query
        this.$originalSelect.select("close");
        // Then we update the query terms
        this.initSelect2(this.state, this.state.unselecting, typeaheadClasses);
        // Init select2 with updated query terms
        this.$originalSelect.select2("open");
        // Update input field with stored value and trigger search query
        this.$parentSelector.find(".select2-search__field").val(this.state.storedInput).trigger("keyup");
        // Change 'back to categories' button class to show
        this.state.buttonClass = "visible";
        // Remove hidden class from 'back to all categories' parent
        this.$parentSelector.find(".search-form__opt-group-show-less").parent("li").removeClass("hidden");
      } else if (this.state.isOpen && !this.state.activeCategory) {
        // Init select2
        this.initSelect2(this.state, this.state.unselecting, typeaheadClasses);
        // Open select2 with update parameters
        this.$originalSelect.select2("open");
        // Append saved search term back into text field and programatically trigger a query
        this.$parentSelector.find(".select2-search__field").val(this.state.storedInput).trigger("keyup");
        // Hide 'back to all categories button'
        this.$parentSelector.find(".search-form__opt-group-show-less.hidden").parent("li").addClass("hidden");
      }
    },


    /**
     *
     * @param newSet[obj], Resetting this.state to default values
     *
     */
    reset: function reset(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }

      var typeaheadClasses = {
        $originalSelect: this.$originalSelect,
        $parentSelector: this.$parentSelector
      };

      // Reset search dropdown to default: 3 items per optgroup visible
      this.initSelect2(this.state, this.state.unselecting, typeaheadClasses);
    },
    attach: function attach(context) {
      var _this3 = this;

      var defaultArgs = "";
      var apiUrl = "";

      // Scope parent
      this.$parentSelector = $(".typeahead-grouping-search__wrapper", context);
      // <select> form id that select2 initializes against
      // this.$originalSelect = $('#search-form__form--category-search', context);
      this.$originalSelect = $(".typeahead-grouping-search", context);
      this.$select2 = $(".typeahead-grouping-search, .select2-search", context);

      // Scope form
      this.$findAdoctorForm = $("#find-a-doctor", context);

      // Bail immediately if our widget doesn't exist, improves performance.
      if (!this.$parentSelector.length || !this.$originalSelect || !this.$findAdoctorForm) {
        return false;
      }
      // Mobile devices were not getting the focus in the input or span on click so this method was created for that
      function isTouch() {
        try {
          document.createEvent("TouchEvent");return true;
        } catch (e) {
          return false;
        }
      }
      if (isTouch()) {
        // hack to fix jquery 3.6 focus security patch that bugs auto search in select-2
        $(document).on('select2:open', function (e) {
          var select2containerOpen = document.querySelector('.select2-container--open .select2-search__field');
          var select2container = document.querySelector('.select2-container--open');
          $(select2container).on('click touchstart', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(select2containerOpen).focus();
          });
        });
      }

      // Default query arguments to be added to api call
      if (settings.fad) {
        defaultArgs = settings.fad.defaultQueryArguments;
        apiUrl = settings.fad.typeahead.url;
      } else if (settings.api) {
        defaultArgs = "";
        apiUrl = settings.fad.typeahead.url;
      } else {
        defaultArgs = "";
        apiUrl: "";
      }

      this.state.queryParameters.defaultArgs = defaultArgs;
      this.state.queryParameters.apiUrl = apiUrl;

      // On dropdown open
      this.$originalSelect.on("select2:open", function () {
        _this3.state.isOpen = true;
      });

      // On dropdown close
      this.$originalSelect.on("select2:close", function (e) {
        _this3.$originalSelect = $(e.currentTarget);
        _this3.$parentSelector = $(e.currentTarget).parent(".typeahead-grouping-search__wrapper");
        // Reset state
        _this3.reset({
          isOpen: false,
          activeCategory: false,
          buttonClass: "hidden",
          storedInput: "",
          shouldFocusInput: true,
          queryParameters: {
            count: 4,
            taxonomy: "",
            term: "",
            defaultArgs: defaultArgs,
            apiUrl: apiUrl
          }
        });
      });

      this.$originalSelect.on("select2:select", function (e) {
        _this3.$parentSelector = $(e.currentTarget).parent(".typeahead-grouping-search__wrapper");
        // e.params.data.group returns a string value of the selected term's group(term, specialty or provider)
        var selectedTermGroup = e.params.data.group;
        // Update the value of the hidden input field with the selected group
        _this3.$parentSelector.closest("form").find("input[id$='field-query-type']").not("#search-doctors-field-query-type").val(selectedTermGroup);
      });

      this.$parentSelector.on("input", "input.select2-search__field", function (e) {
        _this3.state.storedInput = $(e.currentTarget).val();
      });

      // Navigation from default limited list to active category full list
      this.$parentSelector.on("click", ".search-form__opt-group-button", function (e) {
        e.preventDefault();
        _this3.$parentSelector = $(e.delegateTarget);
        _this3.$originalSelect = $(e.delegateTarget).find(".typeahead-grouping-search");

        var activeCategory = $(e.currentTarget).data("group");
        _this3.change({
          isOpen: true,
          activeCategory: true,
          queryParameters: {
            count: 100,
            taxonomy: activeCategory,
            term: _this3.state.storedInput,
            defaultArgs: defaultArgs,
            apiUrl: apiUrl
          }
        });
      });

      // Navigating from active category full list to defaut limited list of optgroups
      this.$parentSelector.on("click", ".search-form__opt-group-show-less", function (e) {
        _this3.$parentSelector = $(e.delegateTarget);
        _this3.$originalSelect = $(e.delegateTarget).find(".typeahead-grouping-search");
        _this3.change({
          isOpen: true,
          activeCategory: false,
          buttonClass: "hidden",
          queryParameters: {
            count: 4,
            taxonomy: "",
            defaultArgs: defaultArgs,
            apiUrl: apiUrl
          }
        });
      });

      // Used only in FAD listing pages.
      var $sortResultsDropdown = this.$findAdoctorForm.find("#search-doctors-select-sort");
      // When clearSelection button is clicked
      this.$parentSelector.on("click", "b", function (e) {
        _this3.$parentSelector = $(e.delegateTarget);
        _this3.$originalSelect = $(e.delegateTarget).find(".typeahead-grouping-search");

        if (_this3.$parentSelector.find(".select2").hasClass("select2-container--selected")) {
          // Set sort to a-z
          $sortResultsDropdown.val("az");
          // Remove options from dom for a fresh ajax call
          _this3.$originalSelect.find("option").remove();

          _this3.$parentSelector.closest("form").find("input[id$='field-query-type']").val("");
          // Reset select2 and state
          _this3.reset({
            isOpen: false,
            activeCategory: false,
            buttonClass: "hidden",
            storedInput: "",
            unselecting: true,
            shouldFocusInput: true,
            queryParameters: {
              count: 4,
              taxonomy: "",
              term: "",
              defaultArgs: defaultArgs,
              apiUrl: apiUrl
            }
          });
          // If mobile, open select2
          if (window.matchMedia("(max-width: 767px)").matches) {
            _this3.$originalSelect.select2("open");
            // On desktop, keep dropdown close and submit form
          } else {
            _this3.$originalSelect.select2("close");
            _this3.$findAdoctorForm.submit();
          }
        }
      });

      // Inintiate select2
      var $typeaheadGroupingSearches = $(".typeahead-grouping-search", context);

      $typeaheadGroupingSearches.each(function (i, el) {
        var typeaheadClasses = {
          $originalSelect: $(el),
          $parentSelector: $(el).parent(".typeahead-grouping-search__wrapper")
        };
        _this3.initSelect2(_this3.state, _this3.state.unselecting, typeaheadClasses);
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
'use strict';

(function testScript($, Drupal) {
  // Set up functions for re-use between both looping through ALL and populating sole wait time once
  var base_class = 'wait-time-block__inner';
  var fade_out = function fade_out($block) {
    $block.toggleClass(base_class + '--out', true);
  };
  var fade_in = function fade_in($block) {
    // Set up fade in
    $block.toggleClass(base_class + '--in', true);

    // Actually fade in
    $block.toggleClass(base_class + '--out', false);
  };

  var update_wait_time = function update_wait_time($block, wait_time_data) {
    // Update waiting text eg "5 min"
    var wait_time_string = '';
    if (wait_time_data.average_wait_time_string == 'n/a') {
      wait_time_string = 'Unavailable at this time';
    } else {
      wait_time_string = wait_time_data.average_wait_time_string;
    }
    $block.find('.wait-time').html(wait_time_string.replace(/(\d+)/, '<span class="wait-time__numeric">$1</span>'));

    // Update link href, target, and content
    var $wait_time_link = $block.find('.wait-time-block__link a');
    $wait_time_link.attr('href', wait_time_data.website);
    if (wait_time_data.type != 'ed') {
      $wait_time_link.attr('target', '_blank');
    } else {
      $wait_time_link.removeAttr('target');
    }
    $wait_time_link.html((wait_time_data.type == 'uc' ? 'Northwell Health-GoHealth Urgent Care Center - ' : '') + wait_time_data.name);
  };

  var on_fade_out = function on_fade_out($block, facility_data) {
    // Update accessibility: hidden
    $block.attr('aria-hidden', true);

    // Update content
    update_wait_time($block, facility_data.open_facilities[facility_data.facility_iterator]);

    // Set up and fade in
    fade_in($block);
  };

  var on_fade_in = function on_fade_in($block, facility_data) {
    // Update accessibility: visible
    $block.attr('aria-hidden', false);

    // Update iterator
    if (++facility_data.facility_iterator >= facility_data.open_facilities.length) {
      facility_data.facility_iterator = 0;
    }

    // Queue next iteration
    // @todo Allow _speed to be site via data attribute, e.g. data-speed in ms.
    var _speed = 5000;
    $block.data('timer.wait_time_queue', setTimeout(function () {
      fade_out($block);
    }, _speed));
  };

  var on_fade_end = function on_fade_end(facility_data) {
    var on_fade_end_with_data = function on_fade_end_with_data(event) {
      var $block = $(this);

      // console.log('transitionend - property: ', event.originalEvent.propertyName, event);

      // Isolate to opacity. Prevent conflict with hover transitions of links.
      if (event.originalEvent.propertyName != 'opacity') {
        return;
      }

      switch (Number($block.css('opacity'))) {
        case 0:
          // console.log('faded out', facility_data.facility_iterator)
          on_fade_out($block, facility_data);
          break;

        case 1:
          // console.log('faded in', facility_data.facility_iterator)
          on_fade_in($block, facility_data);
          break;

        default:
          // console.log('default fade end', facility_data.facility_iterator)
          // console.log('wait time transition end default')
          break;
      }
    };
    return on_fade_end_with_data;
  };

  Drupal.behaviors.wait_time_block = {
    attach: function attach(context) {
      var $wait_time_blocks = $('.wait-time-block ', context);
      if ($wait_time_blocks.length) {
        var wt_api_url = drupalSettings.api.url ? drupalSettings.api.url : 'https://api.northwell.edu/v1';
        $wait_time_blocks.each(function (i, wait_time_block) {
          var $wait_time_block = $(wait_time_block);

          if (!$wait_time_block.length) {
            return;
          }

          var ref = $wait_time_block.attr('data-ref');

          if (ref == 'all') {
            // @todo make ajax call / success for ALL a singleton
            $.ajax({
              url: wt_api_url + '/wait-times/all',
              type: 'GET',
              success: function success(data) {
                // console.log('we got it!', data);

                if (data.code == '200') {
                  // Logic for transitions:
                  //
                  // Iteration:
                  // - Fade out current (apply *--out class)
                  // - - On fade out:
                  // - - Update accessibility to hidden
                  // - - Update content
                  // - - Set up fade in (apply *--in class)
                  //
                  // - Fade in next (remove *--out class)
                  // - - On fade in:
                  // - - Update accessibility to visible
                  // - - Update iterator (next, or reset)
                  // - - Queue next iteration
                  //


                  // Use object so it's passed around by reference
                  var facility_data = {
                    open_facilities: data.response.wait_times.open,
                    facility_iterator: 0
                  };
                  var $wait_time_block_inner = $wait_time_block.find('.' + base_class);
                  $wait_time_block_inner.on('transitionend.wait_time_block', on_fade_end(facility_data));

                  // Initiate loop / first iteration
                  fade_out($wait_time_block_inner);

                  // @todo accessibility: ability to pause ticker
                  // @todo ability to pause/play on hover
                  // @todo ability to pause/play when block is out/in view (scroll, orientationchange, zoom, etc.)
                }
                // console.log(wait_time_item);
              },
              error: function error(e) {
                // console.log(e.message);
              }
            });
          } else if (ref) {
            $.ajax({
              url: wt_api_url + '/wait-times/single',
              type: 'GET',
              data: 'ref=' + ref,
              success: function success(data) {
                // let wait_time_string = '';
                if (data.code == '200') {
                  // if(data.response.wait_time.average_wait_time_string == 'n/a'){
                  //  wait_time_string = 'Unavailable at this time';
                  // } else {
                  //  wait_time_string = data.response.wait_time.average_wait_time_string;
                  // }
                  // $wait_time_block.find('.wait-time').html(wait_time_string.replace(/(\d+)/, '<span class="wait-time__numeric">$1</span>' ));
                  // const $wait_time_link = $wait_time_block.find('.wait-time-block__link a');
                  // $wait_time_link.attr('href', data.response.wait_time.website);
                  // if (data.response.wait_time.type != 'ed') {
                  //  $wait_time_link.attr('target', '_blank');
                  // } else {
                  //  $wait_time_link.removeAttr('target');
                  // }
                  // $wait_time_link.html(data.response.wait_time.name)

                  update_wait_time($wait_time_block, data.response.wait_time);
                }
                // console.log(wait_time_item);
              },
              error: function error(e) {
                // console.log(e.message);
              }
            });
          }
        });
      }
    }
  };
})(jQuery, Drupal);
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function findEmergencyLocations($, Drupal) {
  /* eslint-disable no-console, no-undef, no-unused-vars, func-names */
  /**
   * Drupal.behaviors.emergencyWaitTimes handles basic implemention of the emergency wait-time interface.
   *
   * @type {{attach(*): void}}
   */
  if (!$("#emergency-wait-times").length) return;
  Drupal.behaviors.emergencyWaitTimes = {
    state: {
      formChange: false
    },

    attach: function attach(context) {
      var _this = this;

      this.$waitTimesForm = $("#emergency-wait-times", context);
      $(window).on("load", function () {
        var activeView = $("#wait-time--container", context).attr("data-visible-wait-time-tab");
        var mobile = Drupal.behaviors.waitTimeMapWindow.checkMobile();
        Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
        if (activeView === "list") {
          $("#wait-time-results-default-view").val("list");
          $("html").removeClass("wait-time-mobile--map-view");
        } else if (activeView === "map" && mobile) {
          $("#wait-time-results-default-view").val("map");
          $("html").addClass("wait-time-mobile--map-view");
          Drupal.behaviors.waitTimeMap.loadMap(context);
        } else if (activeView === "map") {
          $("#wait-time-results-default-view").val("map");
          $("html").removeClass("wait-time-mobile--map-view");
          Drupal.behaviors.waitTimeMap.loadMap(context);
        }
        // update locations placeholder and remove sr-only class
        if (mobile) {
          $("#search-emergency-locations-zip").attr("placeholder", "Zip code or neighbourhood");
          $("label[for=search-emergency-locations-zip]").removeClass("sr-only");
        }
      });

      // method for handling the defaultview
      var isParamPresent = function isParamPresent(name) {
        return window.location.href.indexOf("default_view=") != -1;
      };
      var replaceParam = function replaceParam(name, oldValue, newValue) {
        return window.location.href.replace(name + "=" + oldValue, name + "=" + newValue);
      };
      var appendParam = function appendParam(name, value) {
        var separator = window.location.href.indexOf("?") === -1 ? "?" : "&";
        return "" + window.location.href + separator + name + "=" + value;
      };
      // Handle toggle between list and map view for wait times.
      $(".wait-time-sidebar--view-controls a.view-control", context).on("click", function () {
        // .tabbed-sidebar--view-controls a.view-control
        // First, let's remove focus.
        $(this).blur();
        // Assign some variables that will help us determine what we want to do.
        var selectId = $(this).attr("data-action");
        var $waitTimeContainer = $("#wait-time--container");
        var $waitTimeResultsContainer = $waitTimeContainer.find("#wait-time_results--container");
        var activeView = $waitTimeContainer.attr("data-visible-wait-time-tab");
        var $searchBar = $(".wait-time-search-results-bar__wrapper");
        // We've selected the other view, so operate.
        // console.log('selectId: ' + selectId);
        // console.log('activeView: ' + activeView);
        if (selectId !== activeView) {
          // Change the data attribute.
          // CSS handles showing/hiding the appropriate tab.
          $waitTimeContainer.attr("data-visible-wait-time-tab", selectId);
          $("#wait-time-results-default-view").val(selectId);
          // Ensure we remove any active active classes.
          $(".wait-time-sidebar--view-controls a.view-control.active", context).removeClass("active");
          // Add the active class to this item we selected.
          // Also add it to any other controls (we have mobile and desktop controls)
          var activeLinks = "a.view-control[data-action=\"" + selectId + "\"]";
          $(activeLinks).addClass("active");
          // Handle the fact that when map is shown, the view is 100% width, and on
          // list view it is 'grid' width.
          var _mobile = Drupal.behaviors.waitTimeMapWindow.checkMobile();

          Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(_mobile);
          if (selectId === "list") {
            $searchBar.fadeIn();
            $("html").removeClass("wait-time-mobile--map-view");
            var newURL = isParamPresent("default_view") ? replaceParam("default_view", "map", "list") : appendParam("default_view", "list");
            history.pushState("", "", newURL);
          } else if (selectId === "map") {
            $searchBar.fadeOut();
            var $waitTimeMapContainer = $waitTimeResultsContainer.find(".wait-time_display--map");
            if (_mobile) {
              $("html").addClass("wait-time-mobile--map-view");
            }
            // We are looking at the initial loading of the map view.
            if ($waitTimeMapContainer.attr("data-wait-time-loaded") === "false") {
              Drupal.behaviors.waitTimeMap.loadMap();
              $waitTimeMapContainer.attr("data-wait-time-loaded", "true");
            }
            // update the url
            var _newURL = isParamPresent("default_view") ? replaceParam("default_view", "list", "map") : appendParam("default_view", "list");
            history.pushState("", "", _newURL);
          }
        }
        return false;
      });

      // Handle opening/closing the search form on mobile map view.
      $(".wait-time-sidebar--view-controls a.search-view", context).on("click", function () {
        var $searchContainer = $(".wait-time-search--container", context);
        var searchDisplay = $searchContainer.css("display");
        var mobile = Drupal.behaviors.waitTimeMapWindow.checkMobile();
        if (searchDisplay === "none") {
          $searchContainer.addClass("map-search-visible");
          $(this).addClass("active");
          $(this).text("Close search");
          Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
        } else {
          $searchContainer.removeClass("map-search-visible");
          $(this).removeClass("active");
          $(this).text("Change search");
          $(this).blur();
          Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
        }
        return false;
      });

      // Handle opening/closing the filter form on mobile.
      $(".wait-time-sidebar--view-controls a.filter-view", context).on("click", function () {
        var $filterContainer = $(".wait-time-sidebar--content", context);
        var filterDisplay = $filterContainer.css("display");
        $("#wait-time--container", context).addClass("wait-time-results__filter-visible");
        if (filterDisplay === "none") {
          $filterContainer.addClass("filters-visible").addClass("js-dont-close");
          $(this).addClass("active");
          $("html").addClass("wait-time-filters--visible");
          Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
        } else {
          $filterContainer.removeClass("filters-visible");
          $(this).removeClass("active");
          $(this).blur();
          $("html").removeClass("wait-time-filters--visible");
          Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
        }
        return false;
      });

      // Handle closing the filter form from the "Close" text/icon.
      $(".wait-time-sidebar--filter-controls a.close-filter-view", context).on("click", function () {
        if (_this.state.formChange) {
          // When close button is clicked, submit form
          _this.$waitTimesForm.submit();
        } else {
          var $filterContainer = $(".wait-time-sidebar--content", context);
          $("#wait-time--container", context).removeClass("wait-time-results__filter-visible");
          $filterContainer.removeClass("filters-visible");
          $(".wait-time-sidebar--view-controls a.filter-view", context).removeClass("active");
          $(_this).blur();
          $("html").removeClass("wait-time-filters--visible");
          return false;
        }
      });

      // Change state so we know if/when there has been a change to the form
      this.$waitTimesForm.on("change", function () {
        _this.state.formChange = true;
      });
      // Change state so we know if/when there has been a change to the form
      this.$waitTimesForm.on("click", ".filter-reset", function () {
        _this.state.formChange = false;
      });

      // On mobile, close/submit form when page EXCEPT filter block is clicked
      $("body").on("click", function (e) {
        var $filterContainer = $(".wait-time--content", context);
        // .js-dont-close is added to the filter-block on mobile
        // If an element is clicked, check if its parent has the class .js-dont-close
        if (!$(e.target).closest(".js-dont-close").length && nwdsi.isMobile() && $filterContainer.hasClass("filters-visible")) {
          // Then check if there was a change to the form
          if (_this.state.formChange) {
            // If true, submit
            _this.$waitTimesForm.submit();
          } else {
            // If false, close filter block.
            $filterContainer = $(".wait-time--content", context);
            $("#wait-time--container", context).removeClass("wait-time-results__filter-visible");
            $filterContainer.removeClass("filters-visible");
            $(".wait-time-sidebar--view-controls a.filter-view", context).removeClass("active");
            $(_this).blur();
            $("html").removeClass("wait-time-filters--visible");
            return false;
          }
        }
      });

      // Assign a UNIQUE id to each wait time map element. This is really only required
      // in order to show multiple samples in PL.
      // But this avoids a hard coded ID tag in the twig file for wait-time-map.twig.
      var waitTimeMapDefaultId = "wait-time--google-map";
      var waitTimeMapIndex = 0;
      $(".wait-time-map .google-map", context).each(function () {
        var adjustedWaitTimeMapId = waitTimeMapDefaultId + "--" + waitTimeMapIndex;
        $(this).attr("id", adjustedWaitTimeMapId);
        $(this).attr("data-map-index", waitTimeMapIndex);
        waitTimeMapIndex += 1;
      });
    }
  };

  /**
   * Drupal.behaviors.waitTimeMapWindow handles sizing the window/map appropriately.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.waitTimeMapWindow = {
    attach: function attach(context) {
      // Check for initial screen size.
      var mobile = Drupal.behaviors.waitTimeMapWindow.checkMobile(false);
      Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);

      $(window).on("resize", function () {
        // Check the size again on screen size changes.
        mobile = Drupal.behaviors.waitTimeMapWindow.checkMobile(false);
        Drupal.behaviors.waitTimeMapWindow.mobileBehaviors(mobile);
      });
    },
    checkMobile: function checkMobile() {
      var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var mobileRender = window.matchMedia("(max-width: 767px)");

      if (debug) {
        if (mobileRender.matches) {
          console.log("This appears to be a mobile screen size.");
        } else {
          console.log("This appears to NOT be a mobile screen size.");
        }
      }

      return mobileRender.matches;
    },
    mobileBehaviors: function mobileBehaviors(m, context) {
      if (m) {
        var $waitTimeResults = $("#wait-time--container", context);
        var activeView = $waitTimeResults.attr("data-visible-wait-time-tab");

        if (activeView === "list") {
          $("html").removeClass("wait-time-mobile--map-view");
        } else if (activeView === "map") {
          $("html").addClass("wait-time-mobile--map-view");
        }
        // We want to ensure that we only operate the following when we're viewing a
        // full representation of the map, including the wrapper, filter/search data
        // etc., so we will attach this to the container. This functionaity will work
        // on both a full page view, as well as the organism view of wait-time-results in PL.
        var $waitTimeHtml = $("html");
        if ($waitTimeResults.size() > 0) {
          // Add a meaningful class in case we want to act upon it in our CSS.
          // We also need to act above in Drupal.behaviors.emergencyWaitTime() when a user switches between
          // map and list view to add a class to the HTML element so we can hide/show the footer
          // accordingly in the appropriate view(s).
          $waitTimeHtml.addClass("wait-time-mobile--html");

          // Most elements here will require checking for the height of elements via
          // JavaScript before assigning a height of the map to the full height of the
          // screen.
          var viewportHeight = $(window).height();
          // console.log(`Viewport Height: ${viewportHeight}`);

          // Drupal toolbar.
          var $toolbar = $("#toolbar-administration", context);
          var toolbarHeight = $toolbar.height();
          // console.log(`Toolbar Height: ${toolbarHeight}`);

          // Primary header.
          var $header = $("header.site-header", context);
          var headerHeight = $header.height();
          // console.log(`Header Height: ${headerHeight}`);

          // Page header.
          var $pageHeader = $(".page-header__wrapper", context);
          var pageHeaderHeight = $pageHeader.height();
          // console.log(`Page Header Height: ${pageHeaderHeight}`);

          var $searchWrapper = $(".wait-time_search--container", context);
          var searchDisplay = $searchWrapper.css("display");
          var searchWrapperHeight = void 0;
          if (searchDisplay === "none") {
            searchWrapperHeight = 0;
          } else {
            searchWrapperHeight = $searchWrapper.height();
            // console.log(`Wait Time Search Height: ${searchWrapperHeight}`);
          }

          // This is the "Sidebar" element in desktop view. It houses all the filters as well as
          // the controls for the mobile interactions.
          var $waitTimeControlBar = $(".wait-time__wrapper", context);
          var waitTimeControlBarHeight = $waitTimeControlBar.height();
          // console.log(`Control Bar Height: ${waitTimeControlBarHeight}`);

          // This element has a default height of 800px assigned to account for the desktop designs.
          // This will be overwritten by our logic on mobile.
          var $waitTimeMap = $(".wait-time-map .google-map", context);
          var elementHeights = waitTimeControlBarHeight + headerHeight + pageHeaderHeight + toolbarHeight + searchWrapperHeight;
          var adjustedMapHeight = viewportHeight - elementHeights;
          // DO the height adjustment.
          $waitTimeMap.css("height", adjustedMapHeight);
          // console.log(`Elements Total Height: ${elementHeights}`);
          // console.log(`Adjusted Map Height: ${adjustedMapHeight}`);
        }
      } else {
        $("html")
        // Ensure we've removed the mobile class.
        .removeClass("wait-time-mobile--html")
        // Ensure we've removed the mobile map class.
        .removeClass("wait-time-mobile--map-view")
        // Ensure we've removed the filter view class.
        .removeClass("wait-time-filters--visible");
        $(".wait-time--content", context).removeClass("filters-visible");
        // Remove any inline styles regarding the height of the map applied for mobile view.
        $(".wait-time-map .google-map").css("height", "");
      }
    }
  };

  /**
   * Drupal.behaviors.emergencyWaitTimes handles rendering the actual wait times map.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.waitTimeMap = {
    attach: function attach(context) {
      var mapsApiLoaded = false;
      if ((typeof google === "undefined" ? "undefined" : _typeof(google)) === "object" && _typeof(google.maps) === "object") mapsApiLoaded = true;
      var api = "https://maps.googleapis.com/maps/api/js?key=AIzaSyByobPcaArIweKdpYh_LYqORmjXrz7TlUk";
      var $waitTimeMapElement = $(".wait-time-map .google-map", context);
      var waitTimeMapNumber = $waitTimeMapElement.size();
      // console.log(`Found: ${waitTimeMapNumber} wait time mapping elements on the page..`);
      // Ensure we haven't already loaded the Maps API.
      if (!mapsApiLoaded && waitTimeMapNumber > 0) {
        // console.log('Loading GoogleMaps API from _wait-time-results.js...');
        // Load the Script.
        $.getScript(api, function () {
          // Ensure we know we've now loaded it to avoid it running again.
          mapsApiLoaded = true;
        });
      } else {
        Drupal.behaviors.waitTimeMap.loadMap();
      }
    },
    loadMap: function loadMap(context) {
      $(".wait-time-map .google-map", context).each(function () {
        var waitTimeMapId = $(this).attr("id");
        var waitTimeMapIndex = $(this).attr("data-map-index");
        // console.log(`Loading: waitTimeMapId: ${waitTimeMapId}`);
        var waitTimeMap = new northwell.Map(waitTimeMapId);
        // console.log(mapLocations);
        var locations = mapLocations[waitTimeMapIndex];
        waitTimeMap.addLocations(locations);
        waitTimeMap.initializeMap();
      });
    }
  };
  /* eslint-enable no-console, no-undef, no-unused-vars */
})(jQuery, Drupal);
'use strict';

(function waitTimeSearchFormScript($, Drupal) {
  Drupal.behaviors.waitTimeFormActions = {
    state: {
      isSelected: true,
      clearFilters: false
    },
    change: function change(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }

      // Desktop: Form submits on input, dropdown, checkbox change
      // Mobile, form submits when submit button is clicked.
      if (this.state.isSelected && !this.state.isMobile) {
        this.$parentSelector.find('.button--submit').trigger('click');
      }

      // If filters are cleared
      if (this.state.isMobile && this.state.clearFilters) {
        var $filtersWrapper = this.$parentSelector.find('.wait-time-filters');
        // Clear selection event is attached to $('.select2-selection__arrow')
        // so we click that button when the reset filters button is clicked.
        $filtersWrapper.find('.select2-selection__arrow').trigger('click');
        // Clearing selection opens dropdowns by default but we want to keep it closed
        $filtersWrapper.find('select').select2('close');
        // Uncheck checkboxes
        $filtersWrapper.find('input:checkbox').prop('checked', false);
        // Reset state
        this.state.clearFilters = false;
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $("#wait-time--container", context);
      this.$ewtForm = $("#emergency-wait-times", context);

      // const $primarySelectDropdown = this.$parentSelector.find('.wait-time-search-form__ajax');
      // const $selectDropdowns = this.$parentSelector.find('select:not(#search-form__form--category-search)');
      var ds = drupalSettings;
      var $regionSelect = this.$parentSelector.find('select[name="region"]');
      var $sortFilter = this.$parentSelector.find("#sort_ewt");
      var $checkboxes = this.$parentSelector.find(".checkbox");
      var $zipInput = this.$parentSelector.find("#search-emergency-locations-zip");
      var $pageButtons = this.$ewtForm.find("button").not(".button--submit");
      var $resetButton = this.$parentSelector.find(".reset-filters");
      var $locationField = this.$parentSelector.find(".search-form__clear-selection-wrapper");

      var windowMatchMobile = window.matchMedia("(max-width: 768px)").matches;

      $sortFilter.on("change", function () {
        if (_this.state.isMobile) _this.$parentSelector.find(".button--submit").trigger("click"); // hack DDM 01.24.23 to make the mobile form submit on change of filter for usability.
        _this.change({ isSelected: true });
      });

      $checkboxes.on("change", function () {
        _this.change({ isSelected: true });
      });

      $regionSelect.on("change", function () {
        _this.change({ isSelected: true });
      });

      $zipInput.on("change", function () {
        _this.change({ isSelected: true });
      });

      //adding location services request on page load to get the user's location to refine the search

      $(window).on("load", function () {
        // var ds = drupalSettings;
        // Check if geolocation is supported
        if (_this.$ewtForm.length === 0) {
          return;
        } else {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
              // If the location is successfully retrieved, reverse geocode to get the zip code
              var lat = position.coords.latitude;
              var lon = position.coords.longitude;
              var iqKey = ds.locationiq.token; // Ensure this is defined
              var ds_url = ds.locationiq.url; // Ensure this is defined
              var iqURL = ds_url + "?key=" + iqKey + "&lat=" + lat + "&lon=" + lon + "&format=json&normalizeaddress=1";

              var xhr = new XMLHttpRequest();
              xhr.open("GET", iqURL, true);

              xhr.onload = function () {
                if (this.status === 200) {
                  var locationData = JSON.parse(this.responseText);
                  var zip = locationData.address.postcode;
                  var city = locationData.address.quarter ? locationData.address.quarter : locationData.address.neighbourhood ? locationData.address.neighbourhood : locationData.address.city;
                  var state = locationData.address.state;

                  localStorage.setItem("zip", zip);
                  localStorage.setItem("city", city);
                  localStorage.setItem("state", state);

                  var fullPlace = localStorage.city + ", " + localStorage.state + " " + localStorage.zip;

                  if ($zipInput.val() === "" && localStorage.address && localStorage.address === fullPlace) {
                    $zipInput.val(localStorage.address);
                    $zipInput.trigger("change");
                  } else if ($zipInput.val() === "" && localStorage.address && localStorage.address !== fullPlace) {
                    localStorage.setItem("address", fullPlace);
                    $zipInput.val(localStorage.address);
                    $zipInput.trigger("change");
                  } else if ($zipInput.val() === "" && !localStorage.address) {
                    localStorage.setItem("address", fullPlace);
                    $zipInput.val(localStorage.address);
                    $zipInput.trigger("change");
                  }
                } else {
                  console.error("LocationIQ API returned status:", this.status);
                }
              };

              xhr.onerror = function () {
                console.error("Request to LocationIQ API failed.");
              };

              xhr.send();
            }, function (error) {
              console.error('Geolocation Error: ' + error.code + ' - ' + error.message);
            });
          } else {
            console.log("Geolocation is not supported by this browser.");
          }
        }
      });

      // When clear selection button is clicked, empty field and submit
      $locationField.on("click", "button", function (el) {
        el.preventDefault();
        $(el.currentTarget).addClass("hidden");
        $locationField.find("input").val("");
        // this.change({ isSelected: true }); // removing this state change to trigger a submit on the clearing of a zip field per WOPS 1153
      });

      // Page is wrapped in the form so we preventDefault()
      // on buttons on page so that the form does not submit
      $pageButtons.on("click", function (e) {
        e.preventDefault();
      });

      // Reset filters action
      $resetButton.on("click", function () {
        _this.change({ clearFilters: true });
      });

      /**
       *
       * @param isMobile[bool], window.matchMedia('(max-width: 768px)').matches
       *
       */
      var checkisMobile = function checkisMobile(isMobile) {
        switch (isMobile) {
          case true:
            _this.state.isMobile = true;
            break;
          case false:
            _this.state.isMobile = false;
            break;
          default:
        }
      };

      // Check if mobile
      checkisMobile(windowMatchMobile);
    }
  };
})(jQuery, Drupal);
'use strict';

(function waitTimeSearchResultsBarScript($, Drupal) {
  Drupal.behaviors.waitTimeSearchResultsBar = {
    attach: function attach(context) {
      var $filterForm = $('.wait-time-search-results-bar__filter-form', context);
      var $filterFormDesktopParent = $('.wait-time-search-results-bar__filter', context);
      var $filterFormMobileParent = $('.wait-time-controls--mobile .sort', context);
      // const $originalSelect = $('#search-doctors-select-sort', context);
      // const selectedValue = $originalSelect.val();
      var $detachedElement = '';

      // Disable dropdown if value is location
      // if ($originalSelect.val() === 'location') {
      //   $originalSelect.prop('disabled', 'disabled');
      // }

      // Disable select2 on mobile
      function handleSelect2() {
        if (window.matchMedia('(min-width: 768px)').matches) {
          // If desktop, first initiate select2
          $filterForm.select2({
            dropdownParent: $filterFormDesktopParent,
            minimumResultsForSearch: Infinity
          });

          // Then remove it from the DOM and append it back into its original parent
          $filterFormDesktopParent.append($filterForm.detach());
        } else if ($filterForm.data('select2')) {
          // If mobile, disable select2, add mobile styles and remove from DOM
          $detachedElement = $filterForm.select2('destroy').addClass('isMobile').detach();
          // Remove select2's required placeholder // DDM 01.24.23 put the placeholder back so that the indictor is correct not sure why it was emptied out.
          // $filterForm.find('option').eq(0).val('').text('');
          // Then append it to its mobile parent element
          $filterFormMobileParent.append($detachedElement);
          // And clear $detachedElement
          $detachedElement = '';
        }
      }

      handleSelect2();

      $(window).on('resize', function () {
        handleSelect2();
      });
    }
  };
})(jQuery, Drupal);
"use strict";

(function appointmentcontactoptionsScript($, Drupal) {
  Drupal.behaviors.appointmentcontactoptions = {
    attach: function attach(context) {
      if ($(".appointment-contact-options--MAA").length) return;
      var now = new Date();
      var day = now.getDay();
      var hour = now.getHours();
      // weekdays  0==Sunday 1==Monday 2==Tuesday 3==Wednesday 4==Thurs 5==Friday 6==Sat
      // Only Monday through Friday 7-20hrs OR Saturday/Sunday 9-17hrs
      if (day !== 6 && day !== 0 && hour >= 8 && hour < 20 || (day === 6 || day === 0) && hour >= 9 && hour < 17) {
        $(".appointment-contact-options").addClass("currently-open");
      }
    }
  };
})(jQuery, Drupal);
"use strict";

(function billpayEpicScript($, Drupal) {
  Drupal.behaviors.billpayEpicGuest = {
    attach: function attach(context) {
      // Always hide preloader (previous was done after calling gigya profile status)
      $(".billpay-preloader").hide();
      var $selfBillpay = $("#billpay .body-section__side--left,#billpay .body-section__side--right,#billpay .body-section__hr");

      setTimeout(function () {
        if ($selfBillpay.length) {
          $selfBillpay.css("opacity", "1");
        }
      }, 800);

      // Reset iframe src if user presses back
      var epicLoginURL = $(".billpay-epic-widget").data("url");
      $(".billpay-epic-widget").attr("src", epicLoginURL);

      $("#redirect-to-billpay-guest, #redirect-to-epic-guest").click(function (event) {
        var redirectBtn = $(this).text();
        var targetPath = Drupal.behaviors.applicationInsights.getElementXPath(event.target);
        Drupal.behaviors.applicationInsights.linkClicked({
          testId: redirectBtn === "Account number" ? "mynorthwell_account_button" : "mynorthwell_guarantor_button",
          xPath: targetPath
        }, true, "mynorthwell_hp24");
      });

      $("#billpay-card__modal_btn").click(function (event) {
        var targetPath = Drupal.behaviors.applicationInsights.getElementXPath(event.target);

        Drupal.behaviors.applicationInsights.linkClicked({
          testId: "mynorthwell_find_my_account",
          xPath: targetPath
        }, true, "mynorthwell_hp24");
        $("#billpay-card__modal").css("display", "block");
      });

      $("#modal-close").click(function () {
        $("#billpay-card__modal").css("display", "none");
      });

      window.onclick = function (event) {
        var modal = document.getElementById("billpay-card__modal");
        if (event.target == modal) {
          $("#billpay-card__modal").css("display", "none");
        }
      };
    }
  };
})(jQuery, Drupal);
'use strict';

(function BMIcalculatorScript($, Drupal) {
  Drupal.behaviors.BMIcalculator = {
    topOffset: 10,
    getParamName: function getParamName($element) {
      if ($element[0] && $element[0].name === 'gender') {
        var _key = $element[0].name;
        var _pair = {};
        var gender = $("input[name='gender']:checked").val();
        _pair[_key] = gender;
        return _pair;
      }
      var key = $element.attr('id');
      var pair = {};
      pair[key] = $element.val() || $element.attr('value');
      return pair;
    },

    /**
     * Removes all values from inputs. Also disables the inputs except the first one.
     *
     * @param $formElement
     */
    resetInput: function resetInput($formElement) {
      $formElement.val('');
      if ($formElement.length == 1) {
        $formElement.attr('disabled', 'disabled');
      } else {
        $formElement.prop('checked', false);
      }
    },
    radioChecked: function radioChecked(formElements) {
      var feetFilled = false;
      var areComplete = false;
      var errorMsg = 'Enter only whole numbers.';
      if (formElements[1].val() !== '' && !isNaN(formElements[1].val()) && !isNaN(formElements[2].val())) {
        feetFilled = true;
      } else {
        feetFilled = false;
      }
      if (formElements[1].val() !== '' && formElements[3].val() !== '' && !isNaN(formElements[1].val()) && !isNaN(formElements[3].val()) && !isNaN(formElements[2].val())) {
        areComplete = true;
      } else {
        areComplete = false;
      }
      // enable the feet and inches inputs
      formElements[1].prop("disabled", false);
      formElements[2].prop("disabled", false);
      // enable the weight input
      if (feetFilled) {
        formElements[3].prop("disabled", false);
      } else {
        formElements[3].prop("disabled", true);
      }
      // handle not a number errors
      if (isNaN(formElements[1].val())) {
        formElements[1].next('.form-item__message').addClass('form-item__message--error').text(errorMsg);
      } else {
        formElements[1].next('.form-item__message').removeClass('form-item__message--error').text('');
      }
      if (isNaN(formElements[2].val())) {
        formElements[2].val('');
      }
      if (isNaN(formElements[3].val())) {
        formElements[3].next('.form-item__message').addClass('form-item__message--error').text(errorMsg);
      } else {
        formElements[3].next('.form-item__message').removeClass('form-item__message--error').text('');
      }
      return areComplete;
    },
    inputsComplete: function inputsComplete(formElements) {
      var self = this;
      var areComplete = void 0;
      var radioChecked = void 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(formElements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var formElement = _step.value;

          if (formElement.length == 2) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = Array.from(formElement)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var radio = _step2.value;

                if ($(radio).prop('checked')) {
                  radioChecked = true;
                  break;
                } else {
                  radioChecked = false;
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          }
          if (radioChecked) {
            areComplete = self.radioChecked(formElements);
          } else {
            formElements[1].attr('disabled', 'disabled');
            formElements[2].attr('disabled', 'disabled');
            formElements[3].attr('disabled', 'disabled');
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return areComplete;
    },
    setBusy: function setBusy($bmicalculator, value) {
      if (value) {
        $bmicalculator.addClass('busy');
      } else {
        $bmicalculator.removeClass('busy');
      }
    },
    scrollToTop: function scrollToTop($target) {
      // animate scroll to top
      $('html,body').animate({ scrollTop: $target.offset().top - this.topOffset }, 'slow');
    },
    changeHandler: function changeHandler($bmicalculator, formElements, index, $calculate, $startAgain, $results) {
      var self = this;
      var nextIndex = index + 1;
      var dependentformElements = formElements.slice(nextIndex);
      var lastIndex = formElements.length - 1;
      return function () {
        var value = formElements[index].val();
        var ddArr = formElements.slice(0, nextIndex).map(self.getParamName);
        var params = ddArr.reduce(function (r, o) {
          Object.keys(o).forEach(function (k) {
            r[k] = o[k];
          });
          return r;
        }, {});
        /**
         * If the user has entered weight and feet, we have enough info now to calculate.
         */
        if (self.inputsComplete(formElements)) {
          $calculate.removeAttr('disabled');
        } else {
          $calculate.attr("disabled", "disabled");
        }
        /**
         * Remove any previously calculated results.
         */
        if ($results) $results.hide();
        self.setBusy($bmicalculator, true);
      };
    },
    attach: function attach(context) {
      var $calculators = $('.bmi-calculator', context);
      if (!$calculators.length) return;
      var self = this;
      $calculators.each(function () {
        var _this = this;

        var $bmicalculator = $(this);
        var $landingPage = $('#bmi-calculator--landing-page', $bmicalculator);
        var $gender = $('input[name=gender]', $bmicalculator);
        var $male = $('input[value=male]', $bmicalculator);
        var $female = $('input[value=female]', $bmicalculator);
        var $feet = $('#feet', $bmicalculator);
        var $inches = $('#inches', $bmicalculator);
        var $weight = $('#weight', $bmicalculator);
        var $calculate = $('#bmi-calculator--calculate', $bmicalculator);
        var $startAgain = $('#bmi-calculator--results--calculate-again', $bmicalculator);
        var $results = $('#bmi-calculator--results', $bmicalculator);
        var $resultsBMI = $('#bmi-calculator--results--bmi', $results);
        var $resultsUnder = $('#bmi-calculator__results--under', $results);
        var $resultsNormal = $('#bmi-calculator__results--normal', $results);
        var $resultsOver = $('#bmi-calculator__results--over', $results);
        var $resultsObese = $('#bmi-calculator__results--obese', $results);
        var $resultsSevere = $('#bmi-calculator__results--severe', $results);
        var $resultsMorbid = $('#bmi-calculator__results--morbid', $results);
        var $resultsInsurance = $('.bmi-calculator--results--insurance', $results);
        var $classification = $('#bmi-calculator--results--classification', $results);
        var $risk = $('#bmi-calculator__results--risk', $results);
        var $resultsTable = $('#bmi-calculator__results--table');
        var activeClass = 'bmi-calculator__results--table-active';
        var formElements = [$gender, $feet, $inches, $weight];
        /**
         * "Calculate" should be disabled initially.
         */
        $calculate.attr('disabled', 'disabled');
        /**
         * Results should be hidden initially.
         */
        $results.hide();
        /**
         * all form elements exept radios should be disabled initially. Add change handlers to all formElements.
         */
        formElements.forEach(function ($formElement) {
          var index = formElements.indexOf($formElement);
          if (index > 0) {
            $formElement.attr('disabled', 'disabled');
          }
          $formElement.bind('change keyup', self.changeHandler($bmicalculator, formElements, index, $calculate, $results));
        });
        $calculate.bind('click', function () {
          var params = Object.assign.apply(_this, formElements.map(self.getParamName));
          self.setBusy($bmicalculator, true);
          $calculate.attr('disabled', 'disabled');
          // perform clculation
          // get the values of feet and inches and combine them into a totalof inches
          // feet/12 + inches = inches
          // get the value of the weight input
          // weight / inches squared x 703
          //get value for height - feet
          //get value for height - inches and set value to 0 if field is empty
          var feet = params.feet;
          var inches = params.inches || 0;
          //calculate total inches
          var totalInches = eval(feet * 12) + eval(inches);
          //get value for weight
          var totalWeight = params.weight;
          //convert to integer
          var weight = parseFloat(totalWeight, 10);
          var height = parseFloat(totalInches, 10);
          //calculate BMI
          var bmi = Math.round(weight * 703 * 10 / height / height) / 10;
          //calculate min weight and max weight for nomral BMI
          // var minweight = Math.round(18.5 * height * height / 703);
          // var maxweight = Math.round(24.9 * height * height / 703);
          var $targetRow = $resultsUnder;
          var classification = 'classification';
          var risk = 'risk';

          if (bmi < 18.5) {
            $targetRow = $resultsUnder;
            classification = 'Underweight';
            risk = 'You are underweight. It’s important to know that this could weaken your immune system and put you at risk of conditions like osteoporosis. <strong>Talk to your doctor about what you can do to achieve a healthier weight or to address any unexpected weight loss.</strong> To reach a healthy weight: \n' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits.</li>\n' + '<li><strong>Get snacking—</strong>have some healthy snacks between meals such as whole-grain crackers and nuts to increase calories.</li>\n' + '<li><strong>Exercise—</strong>your doctor may recommend strength training for lean muscle development and to increase your weight in a healthy way.</li>\n' + '</ul>';
          } else if (bmi >= 18.5 && bmi < 25) {
            $targetRow = $resultsNormal;
            classification = 'Normal weight';
            risk = 'Great job! Your healthy weight means you have a reduced risk of serious health conditions such as high blood pressure, heart disease, stroke and diabetes. To maintain your healthy weight: \n' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits.</li>\n' + '<li><strong>Get moving—</strong>Try for 30 to 60 minutes of moderately intense activity every day.</li>\n' + '<li><strong>Engage in healthy activities/hobbies—</strong>improve muscle tone through strength training or start a daily food and exercise diary.</li>\n' + '</ul>';
          } else if (bmi >= 25 && bmi < 30) {
            $targetRow = $resultsOver;
            classification = 'Overweight';
            risk = 'You are overweight—but you can get to a healthy weight by making some simple lifestyle changes. Achieving and maintaining a healthy weight is great for your appearance and energy levels, but more importantly, it reduces your risk of serious health conditions like heart disease, stroke and diabetes. <strong>Talk to your doctor about the best weight-loss approach for you.</strong> To lose weight:' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits.</li>\n' + '<li><strong>Get moving—</strong>try for 30 to 60 minutes of moderately intense activity every day.</li>\n' + '<li><strong>Engage in healthy activities/hobbies—</strong>improve muscle tone through strength training or start a daily food and exercise diary.</li>\n' + '</ul>';
          } else if (bmi >= 30 && bmi < 35) {
            $targetRow = $resultsObese;
            classification = 'Obese';
            risk = 'Your BMI puts you in the obese category, which means you are at very high risk of developing potentially serious conditions such as type 2 diabetes, high blood pressure and coronary artery disease. Losing weight can not only reduce your risk of these conditions, it can also boost your appearance and energy levels.</br></br>' + 'We understand that losing weight is challenging, but even smaller weight loss goals can help. A weight loss of 3 to 5 percent (of your total weight) can mean impactful health benefits. <strong>Talk to your doctor about the best weight-loss approach for you.</strong> To lose weight:\n' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits.</li>\n' + '<li><strong>Get moving—</strong>try for 30 to 60 minutes of moderately intense activity every day. Talk to your doctor before starting a new exercise program, because it’s important that you start at the activity level and type that’s right for you. And don’t forget: Even small changes can mean big health benefits.</li>\n' + '<li><strong>Track your progress—</strong>start a daily food and exercise diary.</li>\n' + '</ul>';
          } else if (bmi >= 35 && bmi < 40) {
            $targetRow = $resultsSevere;
            classification = 'Severly obese';
            risk = 'Your BMI puts you in the severely obese category. This has a serious impact on your health, so it’s important that you take steps to lose weight. We know that losing weight can be extremely challenging, so <strong>talk to your doctor about the best weight loss approach for you.</strong></br></br>\n' + 'Losing weight and maintaining a healthier weight is not only good for your self-esteem, but it can mean reducing the risk of conditions including heart disease and stroke, high blood pressure and diabetes. Metabolic improvements start to occur when people with extreme obesity lose about 10 percent of their body weight. How to start:\n' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits. You may be referred to a dietitian who can help you with a plan to lose one to two pounds a week. To lose weight, you have to reduce the number of calories you consume. Start by tracking everything you eat in a food journal.</li>\n' + '<li><strong>Exercise—</strong>try for 30 to 60 minutes of moderate exercise every day after reaching a minimum of 10 percent of your weight-loss goal.</li>\n' + '<li><strong>Medication—</strong>talk to your doctor about possible medications, as some people can benefit from medication to help with weight loss for extreme obesity. Remember though that medication can be expensive and have side effects.</li>\n' + '<li><strong>Surgery—</strong>if the above methods haven’t helped you lose enough weight, weight loss surgery may be an option. The American Heart Association recommends surgery for those who are healthy enough for the procedure and have been unsuccessful with lifestyle changes and medication. There are risks with any surgery, so <strong>talk to your doctor to decide if weight loss surgery is right for you.</strong></li>\n' + '</ul>';
          } else if (bmi >= 40) {
            $targetRow = $resultsMorbid;
            classification = 'Morbidly obese';
            risk = 'Your BMI puts you in the morbidly obese category. This has a very serious impact on your health and quality of life, so it’s important that you take steps to lose weight. We know that losing weight can be extremely challenging, so <strong>talk to your doctor about the best weight loss approach for you.</strong></br></br>\n' + 'Morbid obesity greatly increases your chances of developing serious conditions such as heart disease, stroke, diabetes, high blood pressure, sleep apnea, gallstones, osteoarthritis and some cancers. How to start on your weight loss journey:\n' + '<ul>\n' + '<li><strong>Eat well—</strong>choose a variety of nutritious foods including fruits, vegetables and whole grains, and small amounts of energy-dense foods like olive oil, nuts and dried fruits. You may be referred to a dietitian who can help you with a plan to lose one to two pounds a week. To lose weight, you have to reduce the number of calories you consume. Start by tracking everything you eat in a food journal.</li>\n' + '<li><strong>Exercise—</strong>try for 30 to 60 minutes of moderate exercise every day after reaching a minimum of 10 percent of your weight-loss goal.</li>\n' + '<li><strong>Medication—</strong>talk to your doctor about possible medications, as some people can benefit from medication to help with weight loss for extreme obesity. Remember though that medication can be expensive and have side effects.</li>\n' + '<li><strong>Surgery—</strong>if the above methods haven’t helped you lose enough weight, weight loss surgery may be an option. The American Heart Association recommends surgery for those who are healthy enough for the procedure and have been unsuccessful with lifestyle changes and medication. There are risks with any surgery, so <strong>talk to your doctor to decide if weight loss surgery is right for you.</strong></li>\n' + '</ul>';
          }

          $classification.text(classification);
          $risk.html(risk);
          $targetRow.addClass(activeClass);
          $resultsBMI.text(bmi);
          $landingPage.hide();
          $results.show();
          self.scrollToTop($results);
          self.setBusy($bmicalculator, false);
        });
        /**
         * Reset all form elements.
         */
        $startAgain.bind('click', function () {
          $results.hide();
          // clear inputs
          formElements.forEach(function ($formElement) {
            self.resetInput($formElement);
          });
          $landingPage.show();
          // remove active class from table
          $resultsTable.find('tr').removeClass(activeClass);
          self.scrollToTop($landingPage);
          self.setBusy($bmicalculator, false);
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function supportCardGroupCarousel($, Drupal) {
  Drupal.behaviors.supportCardGroupCarousel = {
    attach: function attach(context) {
      // Execute if the window changes.
      $(window).on('load resize orientationchange', function supportCarouselCheckWidth() {
        // Define window width
        var windowWidth = $(window).width();
        var $carousel = $('.card-group--support .smart-grid', context);
        // Unslick screen sizes over 768px.
        if (windowWidth > 768) {
          if ($carousel.hasClass('slick-initialized')) {
            $carousel.slick('unslick');
          }
        } else {
          if (!$carousel.hasClass('slick-initialized')) {
            Drupal.initSlickCarousel($carousel);
          }
        }
      });
    }
  };

  /**
   * Initialize the Slick Slider Carousel.
   *
   * init script for callback abstraction.
   *
   * @param $carousel
   */
  Drupal.initSlickCarousel = function ($carousel) {
    /* eslint-disable no-lonely-if */
    $carousel.slick({
      slide: '.card-group--support .card__card-wrapper',
      arrows: false,
      accessibility: true,
      autoplay: true,
      autoplaySpeed: 11000,
      dots: true,
      mobileFirst: true,
      fade: true,
      slidesToShow: 1,
      slidesToScroll: 1
    });
    /* eslint-enable no-lonely-if */
  };
})(jQuery, Drupal);
'use strict';

(function collageScript($, Drupal) {
  // if no collages on page do not run
  if (!$('.collage').length) return;
  Drupal.behaviors.collage = {
    attach: function attach(context) {
      function updateLayout(e) {
        var $collage = $(e);
        var images = e.getElementsByTagName("img");
        var count = images.length;

        function positionItems() {
          // collect collage elements
          var collage_items = $collage.find('.collage__item');

          if (images.length === 7) {
            // give each element a variable
            var $item1 = $(collage_items[0]);
            var $item2 = $(collage_items[1]);
            var $item3 = $(collage_items[2]);
            var $item4 = $(collage_items[3]);
            var $item5 = $(collage_items[4]);
            var $item6 = $(collage_items[5]);
            var $item7 = $(collage_items[6]);
            // if mobile position them dynamically
            // as images position naturally on mobile
            if (nwdsi.isMobile()) {
              collage_items.css({ 'top': 'auto', 'left': 'auto' });
              return;
            }
            // get height and width of three important elements
            var height1 = $item1.height();
            var height3 = $item3.height();
            var height5 = $item5.height();
            var width1 = $item1.width();
            var width3 = $item3.width();
            var width5 = $item5.width();
            // get width of parent container
            var parentWidth = $collage.closest('.collage-container').width();
            // get width of space between images
            var channelWidth = (parentWidth - (width1 + width3 + width5)) / 2;
            // get height so container has mass
            $collage.height(height1 * 2 + channelWidth + 'px');
            // set vertical position
            $item2.css('top', height1 + channelWidth - 7 + 'px');
            $item4.css('top', height3 + channelWidth - 7 + 'px');
            $item6.css('top', height5 + channelWidth - 7 + 'px');
            $item7.css('top', height5 + height5 + channelWidth * 2 + 'px');
            // set horizontal position
            $item1.css('left', width3 + channelWidth - 14 + 'px');
            $item2.css('left', width3 + channelWidth - 14 + 'px');
            $item3.css('left', 0);
            $item4.css('left', 0);
            $item5.css('left', width3 + width1 + channelWidth * 2 - 14 + 'px');
            $item6.css('left', width3 + width1 + channelWidth * 2 - 14 + 'px');
            $item7.css('left', width3 + width1 + channelWidth * 2 - 14 + 'px');
          } else if (images.length === 5) {
            // give each element a variable
            var _$item = $(collage_items[0]);
            var _$item2 = $(collage_items[1]);
            var _$item3 = $(collage_items[2]);
            var _$item4 = $(collage_items[3]);
            var _$item5 = $(collage_items[4]);
            var _$item6 = $(collage_items[5]);
            // if mobile position them dynamically
            // as images position naturally on mobile
            if (nwdsi.isMobile()) {
              collage_items.css({ 'top': 'auto', 'left': 'auto' });
            }

            // get height and width of three important elements
            var _height = _$item.height();
            var height2 = _$item2.height();
            var height4 = _$item4.height();
            var _width = _$item.width();
            var width2 = _$item2.width();
            var _width2 = _$item5.width();

            // get width of parent container
            var _parentWidth = $collage.closest('.collage-container').width();
            // get width of space between images
            var _channelWidth = (_parentWidth - (_width + width2)) / 2;
            // get height so container has mass
            $collage.height(_height + height4 + _channelWidth + 'px');
            // set vertical position
            _$item.css('top', 0);
            _$item2.css('top', 0);
            _$item3.css('top', height2 + _channelWidth + 2 + 'px');
            _$item4.css('top', _height + _channelWidth + 2 + 'px');
            _$item5.css('top', _height + _channelWidth + 2 + 'px');
            // set horizontal position
            _$item.css('left', 0);
            _$item2.css('right', 0);
            _$item3.css('right', 0);
            _$item4.css('left', _width2 + _channelWidth + 10 + 'px');
            _$item5.css('left', 0);
          } else {
            // do nothing yet
          }
        }
        // check if this collage has already loaded
        if (!$collage.hasClass('loaded')) {
          // make sure imgs are loaded
          $(window).on("load", function () {
            positionItems();
            // show collage for first time
            $collage.addClass('loaded');
            $collage.parent().removeClass('spinner');
          });
        } else {
          positionItems();
        }
      }
      // set up event listeners
      function attachHandlers(collage, carouselWrap) {
        var $collage = $(collage);
        var $collageItems = $collage.find('.collage__item:not(.collage__item--link-out)');
        var $carouselWrap = $(carouselWrap);
        var $carousel = $carouselWrap.find('.collage__carousel');
        var $carouselUnderlay = $collage.parent().find('.collage__carousel-underlay');

        $collageItems.on('click', function () {
          var index = $(this).index();
          $carousel.slick('slickGoTo', index, true);
          $carouselWrap.addClass('collage__carousel__show-carousel');
          $carouselUnderlay.addClass('collage__carousel-underlay--show');
        });
        // add event listener to close button and underlay
        $('.collage__carousel--close, .collage__carousel-underlay', context).on('click', function (event) {
          var $self = $(event.currentTarget);
          var $carousel = $self.closest('.collage__carousel');
          var $underlayParent = $self.parent().find('.collage__carousel-wrap');
          var $closeParent = $carousel.closest('.collage__carousel-wrap');
          var $parent = '';
          // so originally the underlay was inside the collage_carousel wrap
          // but now that is is outside the click must be handled differently
          if ($closeParent.length !== 0) {
            $parent = $closeParent;
          } else {
            $parent = $underlayParent;
          }
          $parent.removeClass('collage__carousel__show-carousel');
          $carouselUnderlay.removeClass('collage__carousel-underlay--show');
          var $videos = $parent.find('.card-media__iframe');

          if ($videos) {
            stopAllVideos();
          }
        });
        // TBD stop youtube videos
        // add listener to stop all playing you tube videos
        $carousel.on('beforeChange', function (event) {
          var loaded_carousel = false;
          if (!loaded_carousel) {
            var $self = $(event.currentTarget);
            var $videos = $self.find('.card-media__iframe');

            if ($videos) {
              stopAllVideos();
            }
            loaded_carousel = true;
          }
        });
      }
      function stopAllVideos() {
        var iframes = document.querySelectorAll('iframe');
        Array.prototype.forEach.call(iframes, function (iframe) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command',
            func: 'stopVideo' }), '*');
        });
      }
      function stopVideos($video) {
        var iframeSrc = $video.attr('src');
        $video.attr('src', iframeSrc);
      }
      function initializeCarousel(e) {
        $(e).find('.collage__carousel').each(function slickInit() {
          // Define window width
          var windowWidth = $(window).width();
          // Store each matching element in temporary memory.
          var $carousel = $(this);
          /* eslint-disable no-lonely-if */
          if (!$carousel.hasClass('slick-initialized')) {
            $carousel.slick({
              slide: '.collage__carousel--item',
              arrows: true,
              prevArrow: '<i class="collage__carousel-btn btn--prev icon--angle-thin"></i>',
              nextArrow: '<i class="collage__carousel-btn btn--next icon--angle-thin"></i>',
              infinite: true,
              slidesToShow: 1,
              accessibility: true,
              autoplay: false,
              autoplaySpeed: 11000,
              dots: false,
              mobileFirst: true
            });
          }
          /* eslint-enable no-lonely-if */
        });
      }
      // initialize the collage
      var $collages = $('.collage');
      $collages.each(function (i, e) {
        updateLayout(e);
        // if carousel then intialize it;
        // const $carouselWrap = $(e).next('.collage__carousel-wrap');
        var $carouselWrap = $(e).parent().find(".collage__carousel-wrap");
        if ($carouselWrap.length) {
          initializeCarousel($carouselWrap);
          attachHandlers(e, $carouselWrap);
        }
      });
      // re-set layout after resize
      $(window).on('resize', _.debounce(function () {
        $collages.each(function (i, e) {
          updateLayout(e);
          // if carousel then intialize it;
          var $carouselWrap = $(e).next('.collage__carousel-wrap');
          if ($carouselWrap.length) {
            initializeCarousel($carouselWrap);
          }
        });
      }, 100));
    }
  };
})(jQuery, Drupal);
'use strict';

(function contentlistresultswithsectionsScript($, Drupal) {
  if (!$('.location-map').length) return;
  Drupal.behaviors.contentlistresultswithsections = {
    state: {
      formChange: false
    },
    activeView: $('#content__wrapper').attr('data-visible-tab'),
    attach: function attach(context) {
      var _this = this;

      var $html = $('html');
      this.$locationForm = $('#location_fullresult_form', context);
      // Change state so we know if/when there has been a change to the form
      // currently not used but I left it in becasue it is useful if we need it
      this.$locationForm.on('change', function () {
        _this.state.formChange = true;
      });

      $(window).on('load', function () {
        var mobile = Drupal.behaviors.locationMapWindow.checkMobile();
        Drupal.behaviors.locationMapWindow.mobileBehaviors(mobile);
        if (_this.activeView === 'list') {
          $html.removeClass('location-mobile--map-view');
        } else if (_this.activeView === 'map' && mobile) {
          $html.addClass('location-mobile--map-view');
        }
      });
      // Handle toggle between list and map view for wait times.
      var $controls = $('#list_control, #map_control', context);
      $controls.on('click', function (e) {
        var $self = $(this); // First, let's remove focus.
        var controlId = $self.attr('id');
        $self.blur();
        // Assign some variables that will help us determine what we want to do.
        var selectId = $self.attr('data-action');
        var $searchBar = $('.search-form');
        // We've selected the other view, so operate.
        // console.log('selectId: ' + selectId);
        // console.log('activeView: ' + activeView);
        if (selectId !== this.activeView) {
          // Change the data attribute.
          // CSS handles showing/hiding the appropriate tab.
          $('#content__wrapper').attr('data-visible-tab', selectId);
          // Ensure we remove any active active classes.
          $controls.removeClass('active');
          // Add the active class to this item we selected.
          $self.addClass('active');
          // Handle the fact that when map is shown, the view is 100% width, and on
          // list view it is 'grid' width.
          var mobile = Drupal.behaviors.locationMapWindow.checkMobile();
          Drupal.behaviors.locationMapWindow.mobileBehaviors(mobile);
          if (selectId === 'list') {
            $searchBar.fadeIn();
            $html.removeClass('location-mobile--map-view');
          } else if (selectId === 'map') {
            $searchBar.fadeOut();
            var $MapContainer = $('.location_display--map');
            if (mobile) {
              $('html').addClass('location-mobile--map-view');
            }
            // We are looking at the initial loading of the map view.
            if ($MapContainer.attr('data-location-loaded') === 'false') {
              Drupal.behaviors.locationMap.loadMap();
              $MapContainer.attr('data-location-loaded', 'true');
            }
          }
        }
        return false;
      });
      // Assign a UNIQUE id to each wait time map element. This is really only required
      // in order to show multiple samples in PL.
      // But this avoids a hard coded ID tag in the twig file for map.twig.
      var locationMapDefaultId = 'location--google-map';
      var locationMapIndex = 0;
      $('.' + locationMapDefaultId, context).each(function () {
        var adjustedLocationMapId = locationMapDefaultId + '--' + locationMapIndex;
        $(this).attr('id', adjustedLocationMapId);
        $(this).attr('data-map-index', locationMapIndex);
        locationMapIndex += 1;
      });
    }
  };
  /**
   * Drupal.behaviors.waitTimeMapWindow handles sizing the window/map appropriately.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.locationMapWindow = {
    attach: function attach(context) {
      // Check for initial screen size.
      var mobile = Drupal.behaviors.locationMapWindow.checkMobile(false);
      Drupal.behaviors.locationMapWindow.mobileBehaviors(mobile);

      $(window).on('resize', function () {
        // Check the size again on screen size changes.
        mobile = Drupal.behaviors.locationMapWindow.checkMobile(false);
        Drupal.behaviors.locationMapWindow.mobileBehaviors(mobile);
      });
    },
    checkMobile: function checkMobile() {
      var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var mobileRender = window.matchMedia('(max-width: 767px)');

      if (debug) {
        if (mobileRender.matches) {
          console.log('This appears to be a mobile screen size.');
        } else {
          console.log('This appears to NOT be a mobile screen size.');
        }
      }

      return mobileRender.matches;
    },
    mobileBehaviors: function mobileBehaviors(m, context) {
      var $html = $('html');
      if (m) {
        if (this.activeView === 'list') {
          $html.removeClass('location-mobile--map-view');
        } else if (this.activeView === 'map') {
          $html.addClass('location-mobile--map-view');
        }
        // Add a meaningful class in case we want to act upon it in our CSS.
        // We also need to act above in Drupal.behaviors when a user switches between
        // map and list view to add a class to the HTML element so we can hide/show the footer
        // accordingly in the appropriate view(s).
        $html.addClass('location-mobile--html');

        // Most elements here will require checking for the height of elements via
        // JavaScript before assigning a height of the map to the full height of the
        // screen.
        var viewportHeight = $(window).height();
        // console.log(`Viewport Height: ${viewportHeight}`);

        // Drupal toolbar.
        var $toolbar = $('#toolbar-administration', context);
        var toolbarHeight = $toolbar.height();
        // console.log(`Toolbar Height: ${toolbarHeight}`);

        // Primary header.
        var $header = $('header.site-header', context);
        var headerHeight = $header.height();
        // console.log(`Header Height: ${headerHeight}`);

        // Page header.
        var $pageHeader = $('.page-header__wrapper', context);
        var pageHeaderHeight = $pageHeader.height();
        // console.log(`Page Header Height: ${pageHeaderHeight}`);

        var $searchWrapper = $('.search-form--locations', context);
        var searchDisplay = $searchWrapper.css('display');
        var searchWrapperHeight = void 0;
        if (searchDisplay === 'none') {
          searchWrapperHeight = 0;
        } else {
          searchWrapperHeight = $searchWrapper.height();
          // console.log(`Location Search Height: ${searchWrapperHeight}`);
        }

        // This element has a default height of 800px assigned to account for the desktop designs.
        // This will be overwritten by our logic on mobile.
        var $locationMap = $('.location-map .google-map', context);
        var elementHeights = headerHeight + pageHeaderHeight + toolbarHeight + searchWrapperHeight;
        var adjustedMapHeight = viewportHeight - elementHeights;
        // DO the height adjustment.
        $locationMap.css('height', adjustedMapHeight);
        // console.log(`Elements Total Height: ${elementHeights}`);
        // console.log(`Adjusted Map Height: ${adjustedMapHeight}`);
      } else {
        // Ensure we've removed the mobile class.
        // Ensure we've removed the mobile map class.
        // Remove any inline styles regarding the height of the map applied for mobile view.
        $html.removeClass('location-mobile--html').removeClass('location-mobile--map-view');
        $('.location-map .google-map').css('height', '');
      }
    }
  };

  /**
   * Drupal.behaviors.locationsMaps handles rendering the map of locations for tabbed page.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.locationMap = {
    attach: function attach(context) {
      // console.log('Running: Drupal.behaviors.locationsMap.attach();');
      var mapsApiLoaded = false;
      var api = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyByobPcaArIweKdpYh_LYqORmjXrz7TlUk';
      var $locationMapElement = $('.location-map .google-map', context);
      var locationMapNumber = $locationMapElement.size();
      // console.log(`Found: ${locationMapNumber} locations mapping elements on the page..`);
      // Ensure we haven't already loaded the Maps API.
      if (!mapsApiLoaded && locationMapNumber > 0) {
        // Load the Script.
        $.getScript(api, function () {
          // Ensure we know we've now loaded it to avoid it running again.
          mapsApiLoaded = true;
          Drupal.behaviors.locationMap.loadMap();
        });
      }
    },
    loadMap: function loadMap(context) {
      // Assign a UNIQUE id to each wait time map element. This is really only required
      // in order to show multiple samples in PL.
      // But this avoids a hard coded ID tag in the twig file for ...-map.twig.
      var locationMapDefaultId = 'location--google-map';
      $('.' + locationMapDefaultId, context).each(function () {
        var $self = $(this);
        var locationMapId = $self.attr('id');
        var locationMapIndex = $self.attr('data-map-index');
        var locationMap = new northwell.Map(locationMapId);
        var locations = mapLocations[locationMapIndex];
        locationMap.addLocations(locations);
        locationMap.initializeMap();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function costestimatorScript($, Drupal) {
  if ($('#cost_estimator').length === 0) return;
  Drupal.behaviors.costestimator = {
    baseApiUrl: '/api/cost-estimator',
    topOffset: 100,
    placeholderOption: 'none',
    getParamName: function getParamName($element) {
      var prefix = 'cost-estimator--';
      var key = $element.attr('class').split(' ').filter(function (str) {
        return str.startsWith(prefix);
      }).shift().substring(prefix.length).slice(0, -1);
      var pair = {};
      pair[key] = $element.val() || $element.attr('value');
      return pair;
    },

    /**
     * Removes all options from a dropdown save the empty placeholder option. Also disables the dropdown.
     *
     * @param $dropdown
     */
    resetDropdown: function resetDropdown($dropdown) {
      $dropdown.attr('disabled', 'disabled');
      $dropdown.children('option').slice(1).each(function () {
        var $option = $(this);
        $option.remove();
      });
    },
    dropdownsComplete: function dropdownsComplete(dropdowns) {
      var areComplete = void 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = dropdowns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var $dropdown = _step.value;

          if ($dropdown.val() === 'none') {
            areComplete = false;
            break;
          } else {
            areComplete = true;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return areComplete;
    },
    setBusy: function setBusy($costEstimator, value) {
      if (value) {
        $costEstimator.addClass('busy');
      } else {
        $costEstimator.removeClass('busy');
      }
    },
    changeHandler: function changeHandler($costEstimator, dropdowns, index, $calculate, $startAgain, $results) {
      var self = this;
      var nextIndex = index + 1;
      var dependentDropdowns = dropdowns.slice(nextIndex);
      var lastIndex = dropdowns.length - 1;
      return function () {
        var value = dropdowns[index].val();
        // removed this because it did not work in IE11
        // const params = Object.assign.apply(this, dropdowns
        //   .slice(0, nextIndex)
        //   .map(self.getParamName)
        // );
        var ddArr = dropdowns.slice(0, nextIndex).map(self.getParamName);
        var params = ddArr.reduce(function (r, o) {
          Object.keys(o).forEach(function (k) {
            r[k] = o[k];
          });
          return r;
        }, {});
        /**
         * If the user selects the empty "placeholder" option, be sure to reset all dependent dropdowns and return from
         * this function immediately.
         */
        if (value === self.placeholderOption) {
          dependentDropdowns.forEach(function ($dropdown) {
            self.resetDropdown($dropdown);
          });
          return;
        }
        /**
         * Allow folks to clear their selections.
         */
        $startAgain.removeAttr('disabled');
        /**
         * If the user has changed the last dropdown, we have enough info now to calculate. If they changed any
         * previous dropdown, the last dropdown will either have not been selected yet OR it will have been
         * reset by a change in the current dropdown, rendering the last dropdown disabled or unselected.
         */

        if (self.dropdownsComplete(dropdowns)) {
          // if (index === lastIndex) {
          $calculate.removeAttr('disabled');
          return;
        } else {
          $calculate.attr('disabled', 'disabled');
        }
        /**
         * Remove any previously calculated results.
         */
        $results.hide();
        self.setBusy($costEstimator, true);
        $.ajax(self.baseApiUrl, { data: params }).done(function (data) {
          if (index < dropdowns.length) {
            dependentDropdowns.forEach(function ($dropdown) {
              var dependentIndex = dependentDropdowns.indexOf($dropdown);
              self.resetDropdown($dropdown);
              $dropdown.val(self.placeholderOption);
              data.forEach(function (option) {
                $dropdown.append(new Option(option, option, false, false));
              });
              if (dependentIndex === 0) {
                $dropdown.removeAttr('disabled');
              }
              $dropdown.trigger('change.select2');
            });
          }
        }).always(function () {
          self.setBusy($costEstimator, false);
        });
      };
    },
    attach: function attach(context) {
      var $estimators = $('.cost-estimator', context);
      if (!$estimators.length) return;
      var self = this;
      $estimators.each(function () {
        var $costEstimator = $(this);
        var $landingPage = $('.cost-estimator--landing-page', $costEstimator);
        var $insurances = $('.cost-estimator--insurances', $costEstimator);
        var $serviceTypes = $('.cost-estimator--service-types', $costEstimator);
        var $hospitals = $('.cost-estimator--hospitals', $costEstimator);
        var $patientTypes = $('.cost-estimator--patient-types', $costEstimator);
        var $procedureNames = $('.cost-estimator--procedure-names', $costEstimator);
        var $calculate = $('.cost-estimator--calculate', $costEstimator);
        var $startAgain = $('.cost-estimator--start-again', $costEstimator);
        var $results = $('.cost-estimator--results', $costEstimator);
        var $resultsHigh = $('.cost-estimator--results--highest', $results);
        var $resultsLow = $('.cost-estimator--results--lowest', $results);
        var $resultsInsurance = $('.cost-estimator--results--insurance', $results);
        var $resultsFacility = $('.cost-estimator--results--facility', $results);
        var $resultsProcedure = $('.cost-estimator--results--procedure', $results);
        var $resultsGetAnotherEstimate = $('.cost-estimator--results--get-another-estimate', $results);
        var dropdowns = [$insurances, $serviceTypes, $hospitals, $patientTypes, $procedureNames];
        /**
         * "Calculate" should be disabled initially.
         */
        $calculate.attr('disabled', 'disabled');
        /**
         * "Start Again" should be disabled initially.
         */
        $startAgain.attr('disabled', 'disabled');
        /**
         * Results should be hidden initially.
         */
        $results.hide();
        /**
         * First dropdown should be disabled initially. Add change handlers to all dropdowns.
         */
        dropdowns.forEach(function ($dropdown) {
          var index = dropdowns.indexOf($dropdown);
          if (index > 0) {
            $dropdown.attr('disabled', 'disabled');
            $dropdown.trigger('change.select2');
          }
          $dropdown.bind('change', self.changeHandler($costEstimator, dropdowns, index, $calculate, $startAgain, $results));
        });
        $calculate.bind('click', function () {
          // removed because did not work in IE11
          // const params = Object.assign.apply(this, dropdowns.map(self.getParamName));
          var ddArr = dropdowns.map(self.getParamName);
          var params = ddArr.reduce(function (r, o) {
            Object.keys(o).forEach(function (k) {
              r[k] = o[k];
            });
            return r;
          }, {});

          self.setBusy($costEstimator, true);
          $calculate.attr('disabled', 'disabled');
          $.ajax(self.baseApiUrl, { data: params }).done(function (data) {
            $resultsLow.text(data.low);
            $resultsHigh.text(data.high);
            $resultsInsurance.text(data.insurance);
            $resultsFacility.text(data.hospital);
            $resultsProcedure.text(data.procedure_name);
            $landingPage.hide();
            $results.show();
            $('html,body').animate({
              scrollTop: $costEstimator.offset().top - self.topOffset
            }, 'slow');
          }).always(function () {
            self.setBusy($costEstimator, false);
          });
        });
        /**
         * Reset all dropdowns except the first. Set the first's value to the empty placeholder option.
         */
        $startAgain.bind('click', function () {
          $startAgain.attr('disabled', 'disabled');
          $results.hide();
          dropdowns.forEach(function ($dropdown) {
            var index = dropdowns.indexOf($dropdown);
            if (index > 0) {
              $dropdown.attr('disabled', 'disabled');
              $dropdown.trigger('change.select2');
              self.resetDropdown($dropdown);
            }
            $dropdown.val(self.placeholderOption);
            $dropdown.trigger('change.select2');
          });
        });
        $resultsGetAnotherEstimate.bind('click', function (e) {
          e.preventDefault();
          $results.hide();
          $landingPage.show();
          $startAgain.trigger('click');
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* global nwdsi */
(function testScript($, Drupal) {
  var content_list_carousel_options = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: '<i class="content-list__carousel-btn btn--prev icon--angle-thin"></i>',
    nextArrow: '<i class="content-list__carousel-btn btn--next icon--angle-thin"></i>',
    mobileFirst: true,
    useCSS: false,
    useTransform: true,
    respondTo: 'window',
    infinite: false,
    dots: false,
    responsive: [{
      breakpoint: nwdsi.settings.breakpoints.md,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3
      }
    }, {
      breakpoint: nwdsi.settings.breakpoints.sm,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2
      }
    }]
  };

  var content_list_carousel_options_three = {};
  $.extend(true, content_list_carousel_options_three, content_list_carousel_options);

  var content_list_carousel_options_four = {};
  $.extend(true, content_list_carousel_options_four, content_list_carousel_options);
  content_list_carousel_options_four.responsive[0].settings.slidesToShow = 4;
  content_list_carousel_options_four.responsive[0].settings.slidesToScroll = 4;

  Drupal.behaviors.content_list_carousel = {
    attach: function attach(context) {
      $('.content-list__carousel--display3', context).slick(content_list_carousel_options_three);

      $('.content-list__carousel--display4', context).slick(content_list_carousel_options_four);
    }
  };

  Drupal.behaviors.support_content_list_carousel = {
    attach: function attach(context) {
      // Execute if the window changes.
      $(window).on('load resize orientationchange', function supportCarouselCheckWidth() {
        // Define window width
        var windowWidth = $(window).width();
        // Apply the carousel settings to all matching elements.
        $('.content-list--support .smart-grid', context).each(function supportAddCarousel() {
          // Store each matching element in temporary memory.
          var $carousel = $(this);
          // Unslick screen sizes over 768px.
          if (windowWidth > 768) {
            if ($carousel.hasClass('slick-initialized')) {
              $carousel.slick('unslick');
            }
          } else {
            /* eslint-disable no-lonely-if */
            if (!$carousel.hasClass('slick-initialized')) {
              $carousel.slick({
                arrows: false,
                accessibility: true,
                autoplay: true,
                autoplaySpeed: 6000,
                dots: true,
                fade: true,
                mobileFirst: true,
                infinite: true
              });
            }
            /* eslint-enable no-lonely-if */
          }
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function contentlistTeaserFactoidScript($, Drupal) {
    if (!$('.content-list.card-group').length) return;
    Drupal.behaviors.contentlistTeaserFactoidScript = {
        attach: function attach(context) {
            // get the teaser or factiod elements
            var $cardGroups = $('.content-list.card-group:not(.card-group--support)', context);
            if (!$cardGroups.length || nwdsi.isMobile()) return;
            window.addEventListener('load', function () {
                $cardGroups.each(function (i, e) {
                    // find the card__contents, find smartgrid width and height
                    // if smartgrid width breaks to two cols at 533px then divide wrapper height in half
                    var $e = $(e),
                        $contents = $e.find('.card__content'),
                        $smartgrid = $e.find('.smart-grid'),
                        smartgridWidth = $smartgrid.width(),
                        smartgridHeight = smartgridWidth <= 533 ? $smartgrid.height() / 2 : $smartgrid.height();
                    $contents.each(function (i, e) {
                        // find out if image is included and adjust card__content height
                        var $e = $(e),
                            $img = $e.parent().find('.card__media img'),
                            imgHeight = $img ? $img.height() : false,
                            newHeight = imgHeight ? smartgridHeight - imgHeight : smartgridHeight;
                        // set card__content height
                        $e.css({ 'min-height': newHeight + 'px', 'height': 'auto' });
                    });
                });
            });
        }
    };
})(jQuery, Drupal);
'use strict';

(function eventsAjaxScript($, Drupal) {
  if (!$('[events-ajax-url]').length) return;
  Drupal.behaviors.eventsAjax = {
    attach: function attach(context) {
      // get the event component elements that use ajax
      var $events_wrapper = $('[events-ajax-url]', context);

      // Function to generate and return the HTML.
      // Accepts an object as a parameter
      var createSingleHtml = function createSingleHtml(data) {
        var html = '<div class="container component-space--top-sm component-space--bottom-sm">' + '<div class="row">';
        for (var i = 0; i < data.events.length; i++) {
          var dateArr = data.events[i].datetime.start.date.split('-');
          var month = nwdsi.convertMonthNumber(dateArr[1], 'short');
          var day = dateArr[2];
          var time = data.events[i].datetime.start.time;
          var miltaryTime = nwdsi.convertTimeFrom12to24(time);
          var timestamp = data.events[i].datetime.start.date + ' ' + miltaryTime;
          var name = data.events[i].name ? data.events[i].name : '';
          var content = data.events[i].content ? data.events[i].content : '';
          var url = data.events[i].url ? data.events[i].url : '';
          var target = data.events[i].target ? data.events[i].target : '_blank';
          var address_1 = data.events[i].venue && data.events[i].venue.street_address_1 ? data.events[i].venue.street_address_1 : '';
          var address_2 = data.events[i].venue && data.events[i].venue.street_address_2 ? data.events[i].venue.street_address_2 : '';
          var city = data.events[i].venue && data.events[i].venue.city ? data.events[i].venue.city : '';
          var state = data.events[i].venue && data.events[i].venue.state ? data.events[i].venue.state : '';
          var zip = data.events[i].venue && data.events[i].venue.zip ? data.events[i].venue.zip : '';
          var hasExternalLink = data.events[i].show_external_link_icon;
          html += '<div class="card card--full-width card__ajax-version">' + '<div class="card__media col-sm-6 col-md-6 col-lg-5 card__media--full-width">' + '<div class="date-box date-box--default date-box--spacing">' + '<div class="date-box__info">' + '<time class="date-box__date" datetime="' + timestamp + '"><span class="date-box__month">' + month + '</span> <span class="date-box__day">' + day + '</span> <span class="date-box__time"><i class="icon--clock" aria-hidden="true"></i>' + time + '</span></time>' + '</div>' + '</div>' + '</div>' + '<div class="card__content col-sm-8 col-md-6">' + '<div class="card__sub-head">' + '<h5 class="typog-quinary exclude-body-formatting">Event</h5>' + '</div>' + '<div class="card__title"><a href="' + url + '" target="' + target + '">' + name;
          if (hasExternalLink) html += '<span class="fas fa-external-link-square card__title--external-link"></span>';
          html += '</a></div>' + '<div class="card__summary typog-body">' + content + '</div>' + '<div class="card__event-address typog-body">';
          if (address_1) {
            html += address_1 + '<br/>';
          }
          if (address_2) {
            html += address_2 + '<br/>';
          }
          if (city) {
            html += city + ', ';
          }
          if (state) {
            html += state;
          }
          if (city || state) {
            html += ' ' + zip;
          } else {
            html += zip;
          }
          html += '</div>' + '<a href="' + url + '" class="link link--cta card__cta';
          if (hasExternalLink) {
            html += ' remove-icon__link--cta events-cta__external-link-square" target=' + target + '">Register for this event<span class="fas fa-external-link-square card__title--external-link"></span></a>';
          } else {
            html += '" target="' + target + '">Register for this event</a>';
          }
          html += '</div>' + '</div>';
        }
        html += '</div>' + '</div>';

        return html;
      };

      var createCarouselHtml = function createCarouselHtml(data) {
        var headline = data.header_options.headline ? data.header_options.headline : '';
        var headerBody = data.header_options.body_plain ? data.header_options.body_plain : '';
        var hasExternalLinkHeader = data.header_options.show_external_link_icon;
        var ctaLinkText = void 0;
        var ctaLinkUrl = void 0;
        console.log('GET EXTERNAL LINK PARAM CAROUSEL');
        console.log(data.header_options);
        var ctaLinkTarget = data.header_options.open_link_in_new_tab === 1 ? '_blank' : '_self';
        if (data.header_options.link) {
          ctaLinkText = data.header_options.link.title;
          ctaLinkUrl = data.header_options.link.url;
        }
        var html = '<div class="container component-space--top-sm component-space--bottom-sm">' + '<div class="row">' + '<div class="container">' + '<div class="row">' + '<div class="content-list-carousel col-xs-12">';
        if (headline || headerBody) {
          html += '<div class="content-list__carousel--header">';
          if (headline) {
            html += '<div class="content-list-carousel__title-only">' + '<div class="list-header">' + '<div class="list-header__title ">' + headline + '</div>' + '</div>' + '</div>';
          }
          if (headerBody) {
            html += '<div class="content-list-carousel__header-body">' + '<div class="list-header-body">' + '<div class="list-header__body ">' + headerBody + '</div>' + '</div>' + '</div>';
          }
          if (ctaLinkText && !hasExternalLinkHeader) {
            html += '<a href="' + ctaLinkUrl + '" class="link link--view-more list-header__link" target="' + ctaLinkTarget + '">' + ctaLinkText + '</a>';
          } else if (ctaLinkText && hasExternalLinkHeader) {
            html += '<a href="' + ctaLinkUrl + '" class="link link--view-more list-header__link remove-icon__link--cta" target="' + ctaLinkTarget + '">' + ctaLinkText + '<span class="fas fa-external-link-square events-cta__external-link-square"></span></a>';
          }
          html += '</div>';
        }
        html += '<div class="content-list__carousel content-list__carousel--display3 content-list__list">';
        for (var i = 0; i < data.events.length; i++) {
          var dateArr = data.events[i].datetime.start.date.split('-');
          var month = nwdsi.convertMonthNumber(dateArr[1], 'short');
          var day = dateArr[2];
          var time = data.events[i].datetime.start.time;
          var miltaryTime = nwdsi.convertTimeFrom12to24(time);
          var timestamp = data.events[i].datetime.start.date + ' ' + miltaryTime;
          var name = data.events[i].name ? data.events[i].name : '';
          var content = data.events[i].content ? data.events[i].content : '';
          var url = data.events[i].url ? data.events[i].url : '';
          var target = data.events[i].target ? data.events[i].target : '_blank';
          var hasExternalLink = data.events[i].show_external_link_icon;
          console.log('HAS EXTERNAL LINK EVENTS CAROUSEL: ' + headline);
          console.log(hasExternalLink);
          html += '<div class="content-list__carousel-item">' + '<div class="card  card--stacked">' + '<div class="card__content card__content--stacked">' + '<div class="card__header-date-wrapper">' + '<time class="" datetime="' + timestamp + '">' + '<span class="card__sub-head-date">' + '<span class="card__sub-head-month">' + month + '</span>' + '<span class="card__sub-head-day">' + day + '</span>' + '</span>' + '<span class="card__sub-head-time">' + time + '</span>' + '</time>' + '</div>' + '<div class="card__title">' + '<a href="' + url + '" tabindex="0" target="' + target + '">' + name;
          if (hasExternalLink) html += '<span class="fas fa-external-link-square card__title--external-link"></span>';
          html += '</a>' + '</div>' + '<div class="card__summary typog-body">' + content + '</div>' + '</div>' + '</div>' + '</div>';
        }
        html += '</div>' + '</div>' + '</div>' + '</div>' + '</div>';
        return html;
      };

      var createListHtml = function createListHtml(data) {
        var headline = data.header_options.headline;
        var headerBody = data.header_options.body_plain;
        var hasExternalLinkHeader = data.header_options.show_external_link_icon;
        var ctaLinkText = void 0;
        var ctaLinkUrl = void 0;
        var ctaLinkTarget = data.header_options.open_link_in_new_tab === 1 ? '_blank' : '_self';
        if (data.header_options.link) {
          ctaLinkText = data.header_options.link.title;
          ctaLinkUrl = data.header_options.link.url;
        }
        var html = '<div class="content-list container">' + '<div class="content-list__list content-list__list--results">';
        '<div class="row">';
        if (headline || headerBody) {
          html += '<div class="content-list__header-wrap">';
          if (headline) {
            html += '<div class="content-list__title-only">' + '<div class="list-header">' + '<div class="list-header__title ">' + headline + '</div>' + '</div>' + '</div>';
          }
          if (headerBody) {
            html += '<div class="content-list__header-body">' + '<div class="list-header-body">' + '<div class="list-header__body ">' + headerBody + '</div>' + '</div>' + '</div>';
          }
          if (ctaLinkText && !hasExternalLinkHeader) {
            html += '<a href="' + ctaLinkUrl + '" class="link link--view-more list-header__link" target="' + ctaLinkTarget + '">' + ctaLinkText + '</a>';
          } else if (ctaLinkText && hasExternalLinkHeader) {
            html += '<a href="' + ctaLinkUrl + '" class="link link--view-more list-header__link remove-icon__link--cta events-cta__external-link-square" target="' + ctaLinkTarget + '">' + ctaLinkText + '<span class="fas fa-external-link-square card__title--external-link"></span></a>';
          }
          html += '</div>';
        }
        html += '<div class="event-listing-content-list--container col-md-12 col-lg-12">';
        for (var i = 0; i < data.events.length; i++) {
          var dateArr = data.events[i].datetime.start.date.split('-');
          var month = nwdsi.convertMonthNumber(dateArr[1], 'short');
          var day = dateArr[2];
          var time = data.events[i].datetime.start.time;
          var miltaryTime = nwdsi.convertTimeFrom12to24(time);
          var timestamp = data.events[i].datetime.start.date + ' ' + miltaryTime;
          var name = data.events[i].name ? data.events[i].name : '';
          var content = data.events[i].content ? data.events[i].content : '';
          var url = data.events[i].url ? data.events[i].url : '';
          var target = data.events[i].target ? data.events[i].target : '_blank';
          var address_1 = data.events[i].venue && data.events[i].venue.street_address_1 ? data.events[i].venue.street_address_1 : '';
          var address_2 = data.events[i].venue && data.events[i].venue.street_address_2 ? data.events[i].venue.street_address_2 : '';
          var city = data.events[i].venue && data.events[i].venue.city ? data.events[i].venue.city : '';
          var state = data.events[i].venue && data.events[i].venue.state ? data.events[i].venue.state : '';
          var zip = data.events[i].venue && data.events[i].venue.zip ? data.events[i].venue.zip : '';
          var hasSpeakers = data.events[i].speakers;
          var hasExternalLink = data.events[i].show_external_link_icon;
          html += '<div class="content-list__list-item row">' + '<div class="card  card--full-width">' + '<div class="card__media col-sm-6 col-md-2 card__media--event-listing card__media--full-width">' + '<div class="date-box date-box--default ">' + '<div class="date-box__info">' + '<time class="date-box__date" datetime="' + timestamp + '"><span class="date-box__month">' + month + '</span> <span class="date-box__day">' + day + '</span> <span class="date-box__time"><i class="icon--clock" aria-hidden="true"></i> ' + time + '</span></time>' + '</div>' + '</div>' + '</div>' + '<div class="card__content card__content--event-listing col-sm-6 col-md-9">' + '<div class="card__title">' + '<a href="' + url + '" target="' + target + '">' + name;
          console.log('HAS EXTERNAL LINK LIST: ' + headline);
          console.log(hasExternalLink);
          if (hasExternalLink) html += '<span class="fas fa-external-link-square card__title--external-link"></span>';
          html += '</a>' + '</div>' + '<div class="card__summary typog-body">' + content + '</div>';
          if (hasSpeakers) {
            html += '<div class="card__speakers typog-body"><span class="card_speakers--label">Speaker(s): </span>' + hasSpeakers.join(", ") + '</div>';
          }
          if (address_1 || address_2 || city || state || zip) {
            html += '<div class="card__location typog-body"><span class="card_location--label">Location: </span>';
            if (address_1) {
              html += address_1 + '<br/>';
            }
            if (address_2) {
              html += address_2 + '<br/>';
            }
            if (city) {
              html += city + ', ';
            }
            if (state) {
              html += state;
            }
            if (city || state) {
              html += ' ' + zip;
            } else {
              html += zip;
            }
            html += '</div>';
          }
          html += '</div>' + '</div>' + '</div>';
        }
        html += '</div>' + '</div>' + '</div>' + '</div>';
        return html;
      };

      $events_wrapper.each(function (i, e) {
        // get the component
        var eventComponent = $(e);
        // get the api_url from the data attribute
        var api_url = eventComponent.attr('events-ajax-url') + '?=' + nwdsi.generateUniqueId();
        // go get the endpoint for the event
        $.ajax({
          type: "GET",
          url: decodeURIComponent(api_url),
          dataType: "json",
          success: function success(data) {
            // console.log(data);
            if (data.events.length <= 0) {
              eventComponent.addClass('events-ajax--no-events').removeClass('spinner');
            } else {
              var loadedClass = 'ajax-loaded';
              switch (data.display_type) {
                case 'single':
                  eventComponent.html(createSingleHtml(data)).removeClass('spinner');
                  setTimeout(function () {
                    eventComponent.addClass(loadedClass);
                  }, 300);
                  break;

                case 'carousel':
                  eventComponent.html(createCarouselHtml(data)).removeClass('spinner');
                  setTimeout(function () {
                    eventComponent.addClass(loadedClass);
                  }, 300);
                  var content_list_carousel_options = {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    arrows: true,
                    prevArrow: '<i class="content-list__carousel-btn btn--prev icon--angle-thin"></i>',
                    nextArrow: '<i class="content-list__carousel-btn btn--next icon--angle-thin"></i>',
                    mobileFirst: true,
                    useCSS: false,
                    useTransform: true,
                    respondTo: 'window',
                    infinite: false,
                    dots: false,
                    responsive: [{
                      breakpoint: nwdsi.settings.breakpoints.md,
                      settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3
                      }
                    }, {
                      breakpoint: nwdsi.settings.breakpoints.sm,
                      settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2
                      }
                    }]
                  };
                  var $carousel = $events_wrapper.find('.content-list__carousel--display3');
                  $carousel.not('.slick-initialized').slick(content_list_carousel_options);
                  break;

                case 'listing':
                  eventComponent.html(createListHtml(data)).removeClass('spinner');
                  setTimeout(function () {
                    eventComponent.addClass(loadedClass);
                  }, 300);
                  break;

                default:
                // tbd what to do if none of the types qualify
              }
            }
          }
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadaboutyourdoctorScript($, Drupal) {
  Drupal.behaviors.fadprofileAbout = {
    state: {
      isMobile: '',
      isExpanded: false,
      isCutOff: false,
      mobileLineHeight: 20,
      desktopLineHeight: 26
    },

    checkIfMobile: function checkIfMobile() {
      if (nwdsi.isMobile()) {
        this.state.isMobile = true;
      } else {
        this.state.isMobile = false;
      }
    },
    change: function change(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }

      if (this.state.isCutOff) {
        this.$aboutWrapper.find('.fad-physician-profile__body--about').addClass('body-compressed');
      } else {
        this.$aboutWrapper.find('.fad-physician-profile__body--about').removeClass('body-compressed');
        this.$aboutWrapper.find('.fad-physician-profile__body-button').addClass('hidden');
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$aboutWrapper = $('.fad-physician-profile__about', context);
      var $aboutSummaryText = this.$aboutWrapper.find('.fad-physician-profile__body--about');
      var textHeight = $aboutSummaryText.height();

      if (this.state.isMobile && textHeight / this.state.mobileLineHeight > 6) {
        this.change({ isCutOff: true });
      } else if (!this.state.isMobile && textHeight / this.state.desktopLineHeight > 6) {
        this.change({ isCutOff: true });
      } else {
        this.change({ isCutOff: false });
      }

      // When show more or show less button text is clicked
      this.$aboutWrapper.on('click', 'button', function (e) {
        var $button = $(e.currentTarget);

        _this.state.isExpanded = !_this.state.isExpanded;
        if (!_this.state.isMobile) {
          if (_this.state.isExpanded) {
            $button.find('span').html('Read less about ');
            $button.find('.fal').removeClass('fa-plus-circle').addClass('fa-minus-circle');
            $aboutSummaryText.addClass('show-all');
          } else {
            $button.find('span').html('Read more about ');
            $button.find('.fal').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            $aboutSummaryText.removeClass('show-all');
          }
        } else {
          if (_this.state.isExpanded) {
            $button.find('span').html('Read less');
            $button.find('.fal').removeClass('fa-plus-circle').addClass('fa-minus-circle');
            $aboutSummaryText.addClass('show-all');
          } else {
            $button.find('span').html('Read more');
            $button.find('.fal').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            $aboutSummaryText.removeClass('show-all');
          }
        }
      });

      this.checkIfMobile();
      $(window).on('resize', function () {
        _this.checkIfMobile();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadanchorwtabsScript($, Drupal) {
  Drupal.behaviors.fadanchorwtabs = {
    attach: function attach(context) {
      var $tabbed_displays_v2 = $('[id^=tabbed_component-v2-]', context);
      var $set_first_active = $('.anchors-nav-active-first', context);
      if (!$tabbed_displays_v2.length) return;
      var $tabbed_display_links = $($tabbed_displays_v2).find(' > li > a');
      $tabbed_display_links.on('click', function (e) {
        if ($(this).parent().hasClass('active')) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      });
      $tabbed_displays_v2.tabCollapse({ operate_independantly: true });
      // set the first nav item active
      if (!$set_first_active.length) return;
      var $nav = $('[id^=anchors-nav]', context);
      var $anchors = $nav.find('ul > li > a');
      var $first = $anchors.first();
      $first.addClass('active');
      $anchors.on('click', function () {
        $first.removeClass('active');
      });
      if (nwdsi.isMobile()) {
        $tabbed_displays_v2.on('shown-accordion.bs.tabcollapse', function () {
          var $mobileParents = $('.tabbed-display--tab-bar-v2 .panel-group', context);
          $mobileParents.each(function (i, e) {
            var $panels = $(e).find('.panel-default');
            $panels.each(function (i, e) {
              var $panel_collapses = $(e).find('.panel-collapse', context);
              $panel_collapses.each(function (i, e) {
                var $self = $(e);
                var classes = ['.collapse', '.in'];
                if ($self.is(classes.join(""))) {
                  $self.parent().find('.panel-heading a').attr('aria-expanded', 'true');
                }
              });
            });
          });
        });
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadprofileBodySectionScript($, Drupal) {
  Drupal.behaviors.fadprofileBodySection = {
    change: function change() {
      if (window.matchMedia('(min-width: 768px)').matches) {
        // If desktop, disable accordian
        this.$parentSelector.find('.fad-physician-profile__accordion-content').removeClass('collapse');
        // this.$parentSelector.find('#fad-physician-profile--accordian-xs').collapse('dispose');
      } else if (window.matchMedia('(max-width: 768px)').matches) {
        // If mobile, enable accordian
        this.$parentSelector.find('.fad-physician-profile__accordion-content').addClass('collapse');
        // this.$parentSelector.find('#fad-physician-profile--accordian-xs').collapse('hide');
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('.fad-physician-profile__wrapper', context);
      this.change();
      $(window).on('resize', function () {
        _this.change();
      });

      this.$parentSelector.find('.fad-physician-profile__title-xs a').on('click', function (e) {
        e.preventDefault();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadGalleryScript($, Drupal) {
  Drupal.behaviors.fadGalleryPrimary = {
    change: function change() {
      if (nwdsi.isMobile()) {
        this.$fadGallery.addClass('gallery__full-width');
      } else {
        var $titles = this.$parentSelector.find('.card__content--gallery-left .typog-content-title');
        $titles.each(function (i, el) {
          var $el = $(el);
          var truncatedText = $el.text();
          if (truncatedText.length > 60) {
            $el.text(truncatedText.substring(0, 60) + '...');
          }
        });
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('.gallery--fad', context);
      this.$fadGallery = this.$parentSelector.find('.gallery__card');
      this.change();

      $(window).on('resize', function () {
        _this.change();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadlocationsinsuranceScript($, Drupal) {
  Drupal.behaviors.fadlocationsinsurance = {
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('.fad-physician-profile__wrapper', context);
      var $locationWrapper = this.$parentSelector.find('.fad-physician-profile__locations-insurance');

      $locationWrapper.on('click', 'button', function () {
        var href = $(_this).attr('data-url');
        window.location = href;
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function fadRatingsCommentsScript($, Drupal) {
  Drupal.behaviors.fadRatingsComments = {
    attach: function attach(context) {
      this.$parentSelector = $('#fad-physician-profile__comments', context);
      var $moreComments = this.$parentSelector.find('#fad-physician-profile__comments--view-more', context);
      var $viewMoreComments = this.$parentSelector.find('#fad-physician-profile__comments--view-more-btn', context);
      var $viewMoreCommentsBtn = this.$parentSelector.find('#fad-physician-profile__comments--view-more-btn button', context);
      var $originalBtntext = this.$parentSelector.find('#fad-physician-profile__comments--view-more-btn button', context).text();

      $('#section-ratings-quote').on('shown.bs.collapse', function () {
        $('.support-carousel__items').slick('resize');
      });

      $viewMoreComments.on('click', 'button', function () {
        $moreComments.toggleClass('viewing-more');
        if ($moreComments.hasClass('viewing-more')) {
          $viewMoreCommentsBtn.html('View fewer comments');
        } else {
          $viewMoreCommentsBtn.html('' + $originalBtntext);
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function findDoctor($, Drupal) {
  /* eslint-disable no-console, no-undef, no-unused-vars, func-names */
  /**
   * Drupal.behaviors.fad handles basic implemention of the FAD interface.
   *
   * @type {{attach(*): void}}
   */
  if (!$('#find-a-doctor').length) return;
  Drupal.behaviors.fad = {
    state: {
      formChange: false
    },

    attach: function attach(context) {
      var _this = this;

      this.$findAdoctorForm = $('#find-a-doctor', context);
      $(window).on('load', function () {
        var activeView = $('#fad--container', context).attr('data-visible-fad-tab');
        var mobile = Drupal.behaviors.fadMapWindow.checkMobile();
        Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);
        if (activeView === 'list') {
          $('#fad-results-default-view').val('list');
          $('html').removeClass('fad-mobile--map-view');
        } else if (activeView === 'map' && mobile) {
          $('#fad-results-default-view').val('map');
          $('html').addClass('fad-mobile--map-view');
          Drupal.behaviors.fadMap.loadMap(context);
        } else if (activeView === 'map') {
          $('#fad-results-default-view').val('map');
          $('html').removeClass('fad-mobile--map-view');
          Drupal.behaviors.fadMap.loadMap(context);
        }
      });

      // method for handling the defaultview
      var isParamPresent = function isParamPresent(name) {
        return window.location.href.indexOf('default_view=') != -1;
      };
      var replaceParam = function replaceParam(name, oldValue, newValue) {
        return window.location.href.replace(name + '=' + oldValue, name + '=' + newValue);
      };
      var appendParam = function appendParam(name, value) {
        var separator = window.location.href.indexOf('?') === -1 ? '?' : '&';
        return '' + window.location.href + separator + name + '=' + value;
      };
      // Handle toggle between list and map view for FAD.
      $('.fad-sidebar--view-controls a.view-control', context).on('click', function () {
        // First, let's remove focus.
        $(this).blur();
        // Assign some variables that will help us determine what we want to do.
        var selectId = $(this).attr('data-action');
        var $fadContainer = $('#fad--container');
        var $fadResultsContainer = $fadContainer.find('#fad-results--container');
        var activeView = $fadContainer.attr('data-visible-fad-tab');
        // We've selected the other view, so operate.
        if (selectId !== activeView) {
          // Change the data attribute.
          // CSS handles showing/hiding the appropriate tab.
          $fadContainer.attr('data-visible-fad-tab', selectId);
          $('#fad-results-default-view').val(selectId);
          // Ensure we remove any active active classes.
          $('.fad-sidebar--view-controls a.view-control.active', context).removeClass('active');
          // Add the active class to this item we selected.
          // Also add it to any other controls (we have mobile and desktop controls)
          var activeLinks = 'a.view-control[data-action="' + selectId + '"]';
          $(activeLinks).addClass('active');
          // Handle the fact that when map is shown, the view is 100% width, and on
          // list view it is 'grid' width.
          var mobile = Drupal.behaviors.fadMapWindow.checkMobile();

          Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);
          if (selectId === 'list') {
            $fadResultsContainer.addClass('container--list').find('.fad-results').addClass('row');
            $('html').removeClass('fad-mobile--map-view');
            var newURL = isParamPresent('default_view') ? replaceParam('default_view', 'map', 'list') : appendParam('default_view', 'list');
            history.pushState('', '', newURL);
          } else if (selectId === 'map') {
            var $fadMapContainer = $fadResultsContainer.find('.fad-display--map');
            if (mobile) {
              $('html').addClass('fad-mobile--map-view');
            }
            // We are looking at the initial loading of the map view.
            if ($fadMapContainer.attr('data-fad-loaded') === 'false') {
              Drupal.behaviors.fadMap.loadMap(context);
              $fadMapContainer.attr('data-fad-loaded', 'true');
            }
            $fadResultsContainer.removeClass('container--list').find('.fad-results').removeClass('row');
            // update the url
            var _newURL = isParamPresent('default_view') ? replaceParam('default_view', 'list', 'map') : appendParam('default_view', 'list');
            history.pushState('', '', _newURL);
          }
        }
        return false;
      });

      // Handle opening/closing the search form on mobile map view.
      $('.fad-sidebar--view-controls a.search-view', context).on('click', function () {
        var $searchContainer = $('.fad-search--container', context);
        var searchDisplay = $searchContainer.css('display');
        var mobile = Drupal.behaviors.fadMapWindow.checkMobile();
        if (searchDisplay === 'none') {
          $searchContainer.addClass('map-search-visible');
          $(this).addClass('active');
          $(this).text('Close search');
          Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);
        } else {
          $searchContainer.removeClass('map-search-visible');
          $(this).removeClass('active');
          $(this).text('Change search');
          $(this).blur();
          Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);
        }
        return false;
      });

      // Handle opening/closing the filter form on mobile.
      $('.fad-sidebar--view-controls a.filter-view', context).on('click', function () {
        var $filterContainer = $('.fad-sidebar--content', context);
        var filterDisplay = $filterContainer.css('display');
        $('#fad--container', context).addClass('fad-results__filter-visible');
        if (filterDisplay === 'none') {
          $filterContainer.addClass('filters-visible').addClass('js-dont-close');
          $(this).addClass('active');
          $('html').addClass('fad-filters--visible');
        } else {
          $filterContainer.removeClass('filters-visible');
          $(this).removeClass('active');
          $(this).blur();
          $('html').removeClass('fad-filters--visible');
        }
        return false;
      });

      // Handle closing the filter form from the "Close" text/icon.
      $('.fad-sidebar--filter-controls a.close-filter-view', context).on('click', function () {
        if (_this.state.formChange) {
          // When close button is clicked, submit form
          _this.$findAdoctorForm.submit();
        } else {
          var $filterContainer = $('.fad-sidebar--content', context);
          $('#fad--container', context).removeClass('fad-results__filter-visible');
          $filterContainer.removeClass('filters-visible');
          $('.fad-sidebar--view-controls a.filter-view', context).removeClass('active');
          $(_this).blur();
          $('html').removeClass('fad-filters--visible');
          return false;
        }
      });

      // Handle clicking of physicians partners checkbox on mobile
      $('#northwell-physician-partners--checkbox-has-pp', context).on('click', function (e) {
        if (e.target.value == 'true') {
          e.target.value = 'false';
          setFalse();
        } else {
          e.target.value = 'true';
          setTrue();
        }
      });
      var setTrue = function setTrue() {
        $('input[name=physician_partners]').val('true');
      };
      var setFalse = function setFalse() {
        $('input[name=physician_partners]').val('false');
      };

      // Change state so we know if/when there has been a change to the form
      this.$findAdoctorForm.on('change', function () {
        _this.state.formChange = true;
      });
      // Change state so we know if/when there has been a change to the form
      this.$findAdoctorForm.on('click', '.filter-reset', function () {
        _this.state.formChange = false;
      });

      // On mobile, close/submit form when page EXCEPT filter block is clicked
      $('body').on('click', function (e) {
        var $filterContainer = $('.fad-sidebar--content', context);
        // .js-dont-close is added to the filter-block on mobile
        // If an element is clicked, check if its parent has the class .js-dont-close
        if (!$(e.target).closest('.js-dont-close').length && nwdsi.isMobile() && $filterContainer.hasClass('filters-visible')) {
          // Then check if there was a change to the form
          if (_this.state.formChange) {
            // If true, submit
            _this.$findAdoctorForm.submit();
          } else {
            // If false, close filter block.
            $filterContainer = $('.fad-sidebar--content', context);
            $('#fad--container', context).removeClass('fad-results__filter-visible');
            $filterContainer.removeClass('filters-visible');
            $('.fad-sidebar--view-controls a.filter-view', context).removeClass('active');
            $(_this).blur();
            $('html').removeClass('fad-filters--visible');
            return false;
          }
        }
      });

      // Assign a UNIQUE id to each fad map element. This is really only required
      // in order to show multiple samples in PL.
      // But this avoids a hard coded ID tag in the twig file for fad-map.twig.
      var fadMapDefaultId = 'fad--google-map';
      var fadMapIndex = 0;
      $('.fad--google-map', context).each(function () {
        var adjustedFadMapId = fadMapDefaultId + '--' + fadMapIndex;
        $(this).attr('id', adjustedFadMapId);
        $(this).attr('data-map-index', fadMapIndex);
        fadMapIndex += 1;
      });
    }
  };

  /**
   * Drupal.behaviors.fadMapWindow handles sizing the window/map appropriately.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.fadMapWindow = {
    attach: function attach(context) {
      // Check for initial screen size.
      var mobile = Drupal.behaviors.fadMapWindow.checkMobile(false);
      Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);

      $(window).on('resize', function () {
        // Check the size again on screen size changes.
        mobile = Drupal.behaviors.fadMapWindow.checkMobile(false);
        Drupal.behaviors.fadMapWindow.mobileBehaviors(mobile);
      });
    },
    checkMobile: function checkMobile() {
      var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var mobileRender = window.matchMedia('(max-width: 767px)');

      if (debug) {
        if (mobileRender.matches) {
          console.log('This appears to be a mobile screen size.');
        } else {
          console.log('This appears to NOT be a mobile screen size.');
        }
      }

      return mobileRender.matches;
    },
    mobileBehaviors: function mobileBehaviors(m, context) {
      if (m) {
        var $fadResults = $('#fad--container', context);

        var activeView = $fadResults.attr('data-visible-fad-tab');
        if (activeView === 'list') {
          $('html').removeClass('fad-mobile--map-view');
        } else if (activeView === 'map') {
          $('html').addClass('fad-mobile--map-view');
        }
        // We want to ensure that we only operate the following when we're viewing a
        // full representation of the map, including the wrapper, filter/search data
        // etc., so we will attach this to the container. This functionaity will work
        // on both a full page view, as well as the organism view of fad-results in PL.
        var $fadHtml = $('html');
        if ($fadResults.size() > 0) {
          // Add a meaningful class in case we want to act upon it in our CSS.
          // We also need to act above in Drupal.behaviors.fad() when a user switches between
          // map and list view to add a class to the HTML element so we can hide/show the footer
          // accordingly in the appropriate view(s).
          $fadHtml.addClass('fad-mobile--html');

          // Most elements here will require checking for the height of elements via
          // JavaScript before assigning a height of the map to the full height of the
          // screen.
          var viewportHeight = $(window).height();
          // console.log(`Viewport Height: ${viewportHeight}`);

          // Drupal toolbar.
          var $toolbar = $('#toolbar-administration', context);
          var toolbarHeight = $toolbar.height();
          // console.log(`Toolbar Height: ${toolbarHeight}`);

          // Primary header.
          var $header = $('header.site-header', context);
          var headerHeight = $header.height();
          // console.log(`Header Height: ${headerHeight}`);

          // Page header.
          var $pageHeader = $('.page-header__wrapper', context);
          var pageHeaderHeight = $pageHeader.height();
          // console.log(`Page Header Height: ${pageHeaderHeight}`);

          var $searchWrapper = $('.fad-search--container', context);
          var searchDisplay = $searchWrapper.css('display');
          var searchWrapperHeight = void 0;
          if (searchDisplay === 'none') {
            searchWrapperHeight = 0;
          } else {
            searchWrapperHeight = $searchWrapper.height();
            // console.log(`FAD Search Height: ${searchWrapperHeight}`);
          }

          // This is the "Sidebar" element in desktop view. It houses all the filters as well as
          // the controls for the mobile interactions.
          var $fadControlBar = $('.fad-sidebar__wrapper', context);
          var fadControlBarHeight = $fadControlBar.height();
          // console.log(`Control Bar Height: ${fadControlBarHeight}`);

          // This element has a default height of 800px assigned to account for the desktop designs.
          // This will be overwritten by our logic on mobile.
          var $fadMap = $('.fad--google-map', context);
          var elementHeights = fadControlBarHeight + headerHeight + pageHeaderHeight + toolbarHeight + searchWrapperHeight;
          var adjustedMapHeight = viewportHeight - elementHeights;
          // DO the height adjustment.
          $fadMap.css('height', adjustedMapHeight);
          // console.log(`Elements Total Height: ${elementHeights}`);
          // console.log(`Adjusted Map Height: ${adjustedMapHeight}`);
        }
      } else {
        $('html')
        // Ensure we've removed the mobile class.
        .removeClass('fad-mobile--html')
        // Ensure we've removed the mobile map class.
        .removeClass('fad-mobile--map-view')
        // Ensure we've removed the filter view class.
        .removeClass('fad-filters--visible');
        $('.fad-sidebar--content', context).removeClass('filters-visible');
        // Remove any inline styles regarding the height of the map applied for mobile view.
        $('.fad--google-map').css('height', '');
      }
    }
  };

  /**
   * Drupal.behaviors.fadMap handles rendering the actual FAD map.
   *
   * @type {{attach(*): void}}
   */
  Drupal.behaviors.fadMap = {
    attach: function attach(context) {
      var mapsApiLoaded = false;
      if ((typeof google === 'undefined' ? 'undefined' : _typeof(google)) === 'object' && _typeof(google.maps) === 'object') mapsApiLoaded = true;
      var api = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyByobPcaArIweKdpYh_LYqORmjXrz7TlUk';
      var $fadMapElement = $('.fad--google-map', context);
      var fadMapNumber = $fadMapElement.size();
      // console.log(`Found: ${fadMapNumber} FAD mapping elements on the page..`);
      // Ensure we haven't already loaded the Maps API.
      if (!mapsApiLoaded && fadMapNumber > 0) {
        // console.log('Loading GoogleMaps API from _fad-results.js...');
        // Load the Script.
        $.getScript(api, function () {
          // Ensure we know we've now loaded it to avoid it running again.
          mapsApiLoaded = true;
        });
      } else {
        Drupal.behaviors.fadMap.loadMap(context);
      }
    },
    loadMap: function loadMap(context) {
      $('.fad--google-map', context).each(function () {
        var fadMapId = $(this).attr('id');
        var fadMapIndex = $(this).attr('data-map-index');
        // console.log(`Loading: fadMapId: ${fadMapId}`);
        var fadMap = new northwell.Map(fadMapId);
        // console.log(fadMapLocations);
        var locations = mapLocations[fadMapIndex];
        fadMap.addLocations(locations);
        fadMap.initializeMap();
      });
    }
  };
  /* eslint-enable no-console, no-undef, no-unused-vars */
})(jQuery, Drupal);
'use strict';

(function fadsearchformScript($, Drupal) {
  if (!$('#find-a-doctor').length) return;
  Drupal.behaviors.findDoctorFormActions = {
    state: {
      isSelected: true,
      clearFilters: false
    },
    change: function change(newState) {
      if (!nwdsi.isIE()) {
        this.state = Object.assign({}, this.state, newState);
      } else if (nwdsi.isIE()) {
        this.state = $.extend(this.state, newState);
      }
      // Desktop: Form submits on input, dropdown, checkbox change
      // Mobile, form submits when submit button is clicked.
      if (this.state.isSelected && !this.state.isMobile) {
        var $invisibleFormSubmit = this.$parentSelector.find('.invisible-form-submit');
        $invisibleFormSubmit.trigger('click');
        // jQuery('.invisible-form-submit')[0].click();
      }

      // If FILTERS are cleared
      if (this.state.isMobile && this.state.clearFilters) {
        var $filtersWrapper = this.$parentSelector.find('.fad-filters');
        // Clear selection event is attached to $('.select2-selection__arrow')
        // so we click that button when the reset filters button is clicked.
        $filtersWrapper.find('.select2-selection__arrow').trigger('click');
        // Clearing selection opens dropdowns by default but we want to keep it closed
        $filtersWrapper.find('select').select2('close');
        // Uncheck checkboxes
        $filtersWrapper.find('input:checkbox').prop('checked', false);
        // Reset state
        this.state.clearFilters = false;
      }
    },
    attach: function attach(context) {
      var _this = this;

      this.$parentSelector = $('#fad--container', context);
      this.$findAdoctorForm = $('#find-a-doctor', context);

      var $primarySelectDropdown = this.$parentSelector.find('.typeahead-grouping-search');
      var $selectDropdowns = this.$parentSelector.find('select:not(#fad-search-form__typeahead)');

      var $sortResultsDropdown = this.$parentSelector.find('#search-doctors-select-sort');
      var $checkboxes = this.$parentSelector.find('.checkbox');
      var $zipInput = this.$parentSelector.find('#search-doctors-name-zip');
      var $pageButtons = this.$findAdoctorForm.find('button').not('.button--submit');
      var $resetButton = this.$parentSelector.find('.reset-filters');
      var $locationField = this.$parentSelector.find('.search-form__clear-selection-wrapper');

      var windowMatchMobile = window.matchMedia('(max-width: 768px)').matches;

      // Form submit actions
      $primarySelectDropdown.on('select2:select', function (e) {
        // e.params.data.group returns a string value of the selected term's group(term, specialty or provider)
        var selectedTermGroup = e.params.data.group;

        // Update the value of the hidden input field with the selected group
        _this.$findAdoctorForm.find('#search-doctors-field-query-type').val(selectedTermGroup);

        $sortResultsDropdown.val('relevancy');

        _this.change({ isSelected: true });
      });

      $selectDropdowns.on('change', function () {
        _this.change({ isSelected: true });
      });

      $checkboxes.on('change', function () {
        _this.change({ isSelected: true });
      });

      $zipInput.on('change', function () {
        _this.change({ isSelected: true });
      });

      // When clear selection button is clicked, empty field and submit
      $locationField.on('click', 'button', function (el) {
        el.preventDefault();
        $(el.currentTarget).addClass('hidden');
        $locationField.find('input').val('');
        _this.change({ isSelected: true });
      });

      // Page is wrapped in the form so we preventDefault()
      // on buttons on page so that the form does not submit
      $pageButtons.on('click', function (e) {
        e.preventDefault();
      });

      // Reset filters action
      $resetButton.on('click', function () {
        _this.change({ clearFilters: true });
      });

      /**
       *
       * @param isMobile[bool], window.matchMedia('(max-width: 768px)').matches
       *
       */
      var checkisMobile = function checkisMobile(isMobile) {
        switch (isMobile) {
          case true:
            _this.state.isMobile = true;
            break;
          case false:
            _this.state.isMobile = false;
            break;
          default:
        }
      };

      // Check if mobile
      checkisMobile(windowMatchMobile);

      //setting variables
      var zipField = $('#search-doctors-name-zip');
      var fullPlace = '';
      var longitude = '';
      var latitude = '';
      var url_check = window.location;
      var urlObject = new URL(url_check);
      var query_url = '';
      var query_location = '';
      var ds = drupalSettings;

      //locationiq ajax function that is run for new lat + lon that uses reverse geocode to get address data.
      function locationiq(lat, lon) {
        var iqKey = ds.locationiq.token;
        var ds_url = ds.locationiq.url;
        var iqURL = ds_url + '?key=' + iqKey + '&lat=' + lat + '&lon=' + lon + '&format=json';

        var xhr = new XMLHttpRequest();

        xhr.open('GET', iqURL, true);

        xhr.onload = function () {
          if (this.status == 200) {
            var locationData = JSON.parse(this.responseText);
            var city = locationData.address.quarter ? locationData.address.quarter : locationData.address.neighbourhood ? locationData.address.neighbourhood : locationData.address.city;
            var state = locationData.address.state;
            var zip = locationData.address.postcode;

            localStorage.setItem('zip', zip);
            localStorage.setItem('city', city);
            localStorage.setItem('state', state);

            fullPlace = localStorage.city + ', ' + localStorage.state + ' ' + localStorage.zip;
            localStorage.setItem('address', fullPlace);
            zipField.attr('value', fullPlace);
            $('.form-control').addClass('border-animate');
          }
        };
        xhr.send();
      }

      //the initial geolocation function. This will retrieve the users latitude + longitude
      if ('geolocation' in navigator) {
        // check if geolocation is supported/enabled on current browser
        navigator.geolocation.getCurrentPosition(function success(position) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          queryCheck();

          //a quick check to see if the latitude and longitude has changed from local storage before the locationiq query runs
          if ((localStorage.latitude != latitude || localStorage.longitude != longitude) && (query_location == null || query_location === '')) {
            locationiq(latitude, longitude);
          } else {
            // fullPlace = localStorage.city+', '+localStorage.state+' '+localStorage.zip;
            if (zipField && (query_location == null || query_location === '')) {
              zipField.attr('value', localStorage.address);
            } else {}
          }
          localStorage.setItem('latitude', latitude);
          localStorage.setItem('longitude', longitude);
        }, function error(error_message) {
          // for when getting location results in an error
          // localStorage.setItem("zip", 11040);
          // console.log("geoloco error");
          // zipField.attr("value", "New Hyde Park, NY 11040");
          // $(".form-control").addClass("border-animate");
        });
      } else {
        // geolocation is not supported
        // get your location some other way
        // console.log("no geoloco");
        // zipField.attr("value", "New Hyde Park, NY 11040");
      }

      function queryCheck() {
        url_check = window.location;
        urlObject = new URL(url_check);
        query_url = urlObject.searchParams.toString();
        query_location = urlObject.searchParams.get('location');
        console.log(query_url);
        console.log(query_location);
        if (query_location == null) {
          console.log('ITS NULL');
        }
      }
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is passing variables/functions to vendor library.
 */

(function testScript($, Drupal) {
  var context_iterator = 0; // This is a little misleading, it's not actually an iterator through contexts, rather it's just used for namespacing purposes
  Drupal.behaviors.gallery = {
    attach: function attach(context) {
      var $galleries = $('.gallery__active', context);
      var $gallery_navs = $('.gallery__nav', context);

      // Attempt to make each gallery unique by added a fake class that has its index appended to it.
      $galleries.each(function (i, gallery) {
        var $gallery = $(gallery);
        $gallery.toggleClass('gallery__active--' + context_iterator + '-' + i, true);
      });
      $gallery_navs.each(function (i, gallery_nav) {
        var $gallery_nav = $(gallery_nav);
        $gallery_nav.toggleClass('gallery__nav--' + context_iterator + '-' + i, true);
      });

      $galleries.each(function (i, gallery) {
        var $gallery = $(gallery);
        $gallery.slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          fade: true,
          asNavFor: '.gallery__nav--' + context_iterator + '-' + i,
          mobileFirst: true,
          useCSS: false,
          useTransform: false,
          respondTo: 'window',
          dots: true,
          dotsClass: 'gallery__dots hidden',
          adaptiveHeight: true,
          customPaging: function customPaging(slider, i) {
            var $status = $gallery.find('.card-media__current');
            $status.text(1 + '/' + slider.slideCount);
            return false;
          }
        }).on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {
          var $status = $gallery.find('.card-media__current');
          var i = (currentSlide ? currentSlide : 0) + 1;
          $status.text(i + '/' + slick.slideCount);
        }).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
          var $youtube = slick.$slides.eq(currentSlide).find('.card-media__iframe--youtube');
          var $limelight = slick.$slides.eq(currentSlide).find('div.limelight-player');
          if ($youtube.length) {
            $youtube.get(0).contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
          if ($limelight.length) {
            limelight_playpause($limelight);
          }
        });
      });

      $gallery_navs.each(function (i, gallery_nav) {
        var $gallery_nav = $(gallery_nav);
        $gallery_nav.slick({
          slidesToShow: 3,
          slidesToScroll: 1,
          asNavFor: '.gallery__active--' + context_iterator + '-' + i,
          focusOnSelect: true,
          mobileFirst: true,
          useTransform: true,
          respondTo: 'window',
          arrows: true,
          prevArrow: '<i class="gallery__btn btn--prev icon--angle-thin"></i>',
          nextArrow: '<i class="gallery__btn btn--next icon--angle-thin"></i>',
          responsive: [{
            breakpoint: nwdsi.settings.breakpoints.md,
            settings: {
              slidesToShow: 5,
              slidesToScroll: 1,
              vertical: true
            }
          }, {
            breakpoint: nwdsi.settings.breakpoints.sm,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
              vertical: true
            }
          }]
        });
      });

      // pause the player if user navigates away
      function limelight_playpause(player) {
        var playerInst = document.getElementById(player[0].id);
        if (LimelightPlayer.doGetCurrentPlayState().isPlaying) {
          playerInst.doPause();
        }
      }

      ++context_iterator;
    }
  };
})(jQuery, Drupal);
'use strict';

(function testScript($, Drupal) {
  Drupal.behaviors.hero_carousel = {
    attach: function attach(context) {
      $('.hero__carousel-items', context).each(function (i, hero) {
        var $hero = $(hero);
        $hero.slick({
          autoplay: true,
          autoplaySpeed: 11000,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          appendArrows: $hero.parents('.hero__carousel').find('.hero__carousel-buttons'),
          prevArrow: '<i class="hero__carousel-btn btn--prev icon--angle-thin"></i>',
          nextArrow: '<i class="hero__carousel-btn btn--next icon--angle-thin"></i>',
          fade: true,
          mobileFirst: true,
          useCSS: false,
          useTransform: false,
          respondTo: 'window',
          dots: true,
          dotsClass: 'hero__carousel-dots container'
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function infographicModal($, Drupal) {
  if (!$('.card--infographic').length) return;
  Drupal.behaviors.infographicModal = {
    attach: function attach(context) {
      var foundModal = false;
      var shareThisTimer = setInterval(function () {
        if (typeof __sharethis__ !== 'undefined') {
          clearInterval(shareThisTimer);
          Drupal.behaviors.infographicModal.shareThis.ready = true;
          __sharethis__.addEventListener('addthis.ready', function () {
            console.log('ShareThis API is fully loaded.');
          });
        }
        // check for modal, when present and the flag is not set run a method bootstrap hooks
        var infographicModalIdHash = $('.card--infographic a[data-toggle~=modal]', context).attr('data-target');
        var infographicModalId = infographicModalIdHash.substring(1, infographicModalIdHash.length);
        if ($(infographicModalIdHash).length && !foundModal) {
          foundModal = true;
          Drupal.behaviors.infographicModal.AddBSHooksCheckParams(infographicModalId);
        }
      }, 100);

      //find the links that open the modal and add the social share api as well as ga tracking
      $('a[data-toggle~=modal]', context).each(function (index, element) {
        $(this).on('click', function () {
          console.log('Modal Link Clicked');
          // load the sharethis script
          Drupal.behaviors.infographicModal.LoadScript();

          if (window.ga && ga.create) {
            ga('send', 'event', 'Infographics', 'modal-link-clicked', 'Modal Link', 'Clicked');
          }
        });
      });
    },

    loadedShare: false,
    ChangeUrl: function ChangeUrl(page, url) {
      if (typeof history.pushState !== 'undefined') {
        var obj = { Page: page, Url: url };
        history.pushState(obj, obj.Page, obj.Url);
      }
    },
    LoadScript: function LoadScript() {
      var sharethisScript = document.createElement("script");
      sharethisScript.id = "sharethisScript";
      sharethisScript.setAttribute("src", "https://platform-api.sharethis.com/js/sharethis.js#property=645a6fcbd42721001948372f&amp;product=sop");
      sharethisScript.setAttribute("type", "text/javascript");
      sharethisScript.setAttribute("async", true);
      sharethisScript.addEventListener("load", function () {
        console.log("Share This File Loaded");
      });
      console.log('add share script');
      document.head.appendChild(sharethisScript);
    },
    AddBSHooksCheckParams: function AddBSHooksCheckParams(modal) {
      console.log("AddBSHooks");
      console.log(modal);
      // Detect infographic parameter and fire up the modal.
      var urlParams = new URLSearchParams(window.parent.location.search);
      console.log(urlParams);
      if (urlParams.has('infographic') && $('#' + urlParams.get('infographic')).length > 0) {
        console.log('Autoshowing Modal: #' + urlParams.get('infographic'));

        $('#' + urlParams.get('infographic')).modal('show');
        Drupal.behaviors.infographicModal.LoadScript();
        Drupal.behaviors.infographicModal.loadedShare = true;
      }

      $('#' + modal).once('modal-url-show').on('show.bs.modal', function (e) {
        console.log('< Modal Shown ' + modal + ' >');

        Drupal.behaviors.infographicModal.shareThis.set(modal);

        Drupal.behaviors.infographicModal.ChangeUrl('Open Infographic', '?infographic=' + modal);

        if (Drupal.behaviors.infographicModal.loadedShare) window.__sharethis__.initialize();
        // ga('send', 'event', [eventCategory], [eventAction], [eventLabel],
        // [eventValue], [fieldsObject]);
        if (window.ga && ga.create) {
          ga('send', 'event', 'Infographics', 'modal-shown', 'Modal', '#' + modal + ' Shown');
        }
        // set flag to true that the sharethis was initialized
        Drupal.behaviors.infographicModal.loadedShare = true;
      });
      $('#' + modal).once('modal-url-hide').on('hide.bs.modal', function (e) {
        console.log('< Modal Hidden ' + modal + ' >');

        Drupal.behaviors.infographicModal.shareThis.set(false);

        Drupal.behaviors.infographicModal.ChangeUrl('Close Infographic', window.parent.location.origin + window.parent.location.pathname);

        // remove the sharethis panel on close of the infographic
        $('[id^=st-]').remove();
        // send Google Analytics
        if (window.ga && ga.create) {
          ga('send', 'event', 'Infographics', 'modal-hidden', 'Modal', '#' + modal + ' Hidden');
        }
      });
    },

    shareThis: {
      ready: false,
      set: function set(target) {
        if (Drupal.behaviors.infographicModal.shareThis.ready) {
          // console.log("Sharethis is ready!!!");
        } else {
            // console.log('sharethis is not ready!!!');
          }
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function insurancetoolsearchlocationScript($, Drupal) {
  Drupal.behaviors.insurancetoolsearchlocation = {
    state: {
      locationId: ''
    },
    attach: function attach(context) {
      var _this = this;

      // Scope form
      this.$insuranceToolForm = $('#insurance-tool-search-location', context);
      this.$parentSelector = $('.insurance-tool__search-location', context);

      this.$insuranceToolForm.on('change', function (e) {
        _this.state.locationId = _this.$parentSelector.find('#insurance-tool__dropdown').val();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function locationsajaxScript($, Drupal) {
  if (!$('.locations-ajax').length) return;
  Drupal.behaviors.locationsajax = {
    attach: function attach(context) {
      //setting variables
      var ds = drupalSettings;
      var zipField = $('#geolocations-zip');
      var keywordField = $('#search-locations-keywords');
      var show_boxes = ds.query_settings.dynamic_list.show_custom_category_boxes;
      var dataURL = ds.query_settings.dynamic_list.api_base_url;
      var dataType = '';
      var fullPlace = '';
      var longitude = '';
      var latitude = '';
      var parsnip = '';
      var turnip = '';
      var pagan = '';
      var query_url = '';
      var query_zip = '';
      var query_cat = '';
      var query_keywords = '';
      var query_type = '';
      var locURL = '';
      var set_passed = '';
      var setType = '';
      var getZip = '';
      var setZip = '';
      var total_locations_returned = '';
      var url_check = window.location;
      var urlObject = new URL(url_check);

      //on page load we are setting the initial state as '/locations' then we are loading the category tiles
      window.onload = function () {
        queryCheck();

        if (query_keywords) {
          keywordField.attr('value', query_keywords);
        } else {}
        query_cat = urlObject.searchParams.get('browse_categories');
        if (query_url) {
          //query_url = '?' + query_url;
          if (query_cat) {
            loadCategories();
          } else {
            loadLocations('query');
            $('#show-locations').addClass('tabs-text__item--active').siblings().removeClass('tabs-text__item--active');
          }
        } else {
          loadCategories();
        }
      };

      function queryCheck() {
        url_check = window.location;
        urlObject = new URL(url_check);
        query_url = urlObject.searchParams.toString();
        query_zip = urlObject.searchParams.get('zip');
        query_keywords = urlObject.searchParams.get('keywords');
        query_type = urlObject.searchParams.get('type');
      }

      //adding click events for the load loadtions & load categories functions
      $('#show-locations').on('click', loadLocations);
      $('.tabs-text').off('click', '#show-locations').on('click', '#show-locations', function () {
        history.pushState('locations', 'Locations', '?browse_all=true');
        loadLocations('browse');
      });
      if (show_boxes) {
        $('.tabs-text').off('click', '#show-categories').on('click', '#show-categories', function () {
          history.pushState('categories', 'Categories', '?browse_categories=true');
          loadCategories();
        });
      } else {
        $('#show-categories').css('display', 'none');
        $('#show-locations').addClass('tabs-text__item--active').siblings().removeClass('tabs-text__item--active');
      }
      $('.tabs-text').on('click', '.tabs-text__item', function () {
        $(this).addClass('tabs-text__item--active').siblings().removeClass('tabs-text__item--active');
      });
      $('.form-group--submit').on('click', '#geo_search_btn', function () {
        queryCheck();
        var search_type = typeof query_type === 'undefined' ? '' : query_type;
        $('#search-filter-type').attr('value', search_type);
        var user_zip = $('#geolocations-zip').val();
        localStorage.setItem('zip', user_zip);
      });

      //locationiq ajax function that is run for new lat + lon that uses reverse geocode to get address data.
      function locationiq(lat, lon) {
        // If the user searched and entered an empty zip
        // dont try to get the shared location as they could have 
        // tried to search intentionally without a zipcode.
        if (getQueryParam('zip') == '') {
          return;
        }

        var iqKey = ds.locationiq.token;
        var ds_url = ds.locationiq.url;
        var iqURL = ds_url + '?key=' + iqKey + '&lat=' + lat + '&lon=' + lon + '&format=json&normalizeaddress=1';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', iqURL, true);
        xhr.onload = function () {
          if (this.status == 200) {
            var locationData = JSON.parse(this.responseText);
            var city = locationData.address.village ? locationData.address.village : locationData.address.quarter ? locationData.address.quarter : locationData.address.neighbourhood ? locationData.address.neighbourhood : locationData.address.city;
            var state = locationData.address.state;
            var zip = locationData.address.postcode;

            localStorage.setItem('zip', zip);
            localStorage.setItem('city', city);
            localStorage.setItem('state', state);

            fullPlace = localStorage.city + ', ' + localStorage.state + ' ' + localStorage.zip;
            localStorage.setItem('address', fullPlace);
            zipField.attr('value', fullPlace);
            $('.search-locations--default-geolocation').addClass('border-animate');
            queryCheck();
            if (show_boxes) {
              if (query_url) {
                query_url = '?' + query_url;
                $('#show-locations').addClass('tabs-text__item--active').siblings().removeClass('tabs-text__item--active');
              }
            }
          }
        };
        xhr.send();
      }

      //the initial geolocation function. This will retrieve the users latitude + longitude
      if ('geolocation' in navigator) {
        // check if geolocation is supported/enabled on current browser
        navigator.geolocation.getCurrentPosition(function success(position) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;

          //a quick check to see if the latitude and longitude has changed from local storage before the locationiq query runs
          if (localStorage.latitude != latitude || localStorage.longitude != longitude) {
            locationiq(latitude, longitude);
          }
          localStorage.setItem('latitude', latitude);
          localStorage.setItem('longitude', longitude);
        }, function error(error_message) {
          // for when getting location results in an error
          // localStorage.setItem("zip", 11040);
          // zipField.attr("value", "New Hyde Park, NY 11040");
        });
      }

      //our loadLocations function that is triggered on tile clicks
      var loadLocations = function loadLocations(passed_type) {
        queryCheck();

        //reseting the categories data
        turnip = '';

        //setting the innerHTML to black to eliminate the chance of showing old data when the function runs
        document.getElementById('button-grid-locations').innerHTML = '';
        $('.tile-space').css('display', 'none');
        $('#wait-times-block').css({
          visibility: 'hidden',
          height: '0'
        });
        $('#locations-container').css('display', 'block');
        // $( ".skelly" ).css( "display", "block" );
        $('.graveyard').removeClass('doot-doot');
        $('.mobile-skeleton-container').removeClass('doot-doot');

        set_passed = '';
        setType = '';
        getZip = localStorage.address;
        setZip = typeof getZip === 'undefined' ? '' : '&zip=' + getZip;

        // Set query params.
        var query_params = query_url;

        // Search all locations, 
        // so remove any non default query params.
        if (passed_type == 'browse') {
          query_params = '';
        }
        // Search for locations by zip.
        else if (passed_type == 'query' && query_zip) {
            zipField.attr('value', '');
            zipField.attr('value', query_zip);
            getZip = query_zip;
          }
          // Search by category type.
          else {
              var query_param_zip = getQueryParam('zip');
              if (query_param_zip != '' || !issetQueryParam('zip') && isset(localStorage.address)) {
                zipField.attr('value', '');
                zipField.attr('value', localStorage.address);
                query_params += setZip;
              }
            }

        // Remove any default search params that are 
        // being provided as query params in the browser url.
        // e.g: "type" can be defined by the user, 
        //      but it can also be set as a default by the admin.
        //      So if it is user defined, replace the admin defined ones.
        locURL = replaceDefaultSearchParams(dataURL, query_params);

        // Make sure the proper delimieters are in place (? or &)
        locURL = setQueryParamDelimiter(locURL);

        var jax = new XMLHttpRequest();
        jax.open('GET', locURL, true);
        jax.onload = function () {
          if (this.status == 200) {
            var locations = JSON.parse(this.responseText);
            pagan = locations.pagination;
            var showing = pagan.showing;
            total_locations_returned = showing.total;

            // No results found.
            if (total_locations_returned == 0) {
              $('.no-results-locations').addClass('no-show-locations');
              $('.graveyard').addClass('doot-doot');
              $('.mobile-skeleton-container').addClass('doot-doot');
            }
            // Show results.
            else {
                $('.no-results-locations').removeClass('no-show-locations');
                var output = '';
                var pagination_output = '';
                var searchTitle = '';
                var user_defined_content_type = getQueryParam('type');
                if (isset(ds.query_settings.dynamic_list.content_types[user_defined_content_type])) {
                  searchTitle += 'Locations: ' + ds.query_settings.dynamic_list.content_types[user_defined_content_type];
                }
                parsnip = locations.results;
                document.getElementById('location-page-title').innerText = searchTitle;

                //setting the number of results that was pulled from API
                var showOut = '';
                showOut += 'Showing <strong>' + showing.start + ' - ' + showing.end + '</strong> of <strong>' + showing.total_formatted + '</strong> results';
                document.getElementById('location-page-showing').innerHTML = showOut;

                //loop to run through locations
                for (var i in parsnip) {
                  var loc_title = isset(parsnip[i].title) ? parsnip[i].title : '';
                  var loc_street = isset(parsnip[i].location) && isset(parsnip[i].location.street_address) ? parsnip[i].location.street_address : '';
                  var loc_suite = isset(parsnip[i].location) && isset(parsnip[i].location.suite) ? ', ' + parsnip[i].location.suite : '';
                  var loc_city = isset(parsnip[i].location) && isset(parsnip[i].location.city) ? parsnip[i].location.city : '';
                  var loc_state = isset(parsnip[i].location) && isset(parsnip[i].location.state_abbr) ? parsnip[i].location.state_abbr : '';
                  var loc_zip = isset(parsnip[i].location) && isset(parsnip[i].location.zip) ? parsnip[i].location.zip : '';
                  var loc_phone = isset(parsnip[i].location) && isset(parsnip[i].location.phone) ? parsnip[i].location.phone.formatted : '';
                  var loc_fax = isset(parsnip[i].location) && isset(parsnip[i].location.fax) ? parsnip[i].location.fax.formatted : '';
                  var loc_distance = isset(parsnip[i].location) && isset(parsnip[i].location.distance) ? parsnip[i].location.distance : '';
                  var display_summary = ds.query_settings.dynamic_list.show_summary;
                  var display_phone = ds.query_settings.dynamic_list.show_phone;
                  var display_fax = ds.query_settings.dynamic_list.show_fax;
                  var loc_summary = isset(parsnip[i].search_teaser) ? parsnip[i].search_teaser : '';
                  var loc_map = isset(parsnip[i].location) && isset(parsnip[i].location.map_url) ? parsnip[i].location.map_url : '';
                  var loc_directions = isset(parsnip[i].location) && isset(parsnip[i].location.directions_url) ? parsnip[i].location.directions_url : '';
                  var loc_checkin_url = isset(parsnip[i].location) && isset(parsnip[i].location.checkin_url) ? parsnip[i].location.checkin_url : '';
                  var loc_url = isset(parsnip[i].url) ? parsnip[i].url : '';

                  var checkInLink = '';
                  if (loc_checkin_url) {
                    checkInLink += '<div class="address__checkin">' + '<a href="' + loc_checkin_url + '" class="link link--check-in-online" target="_blank">' + '<i class="icon--clipboard " aria-hidden="false"></i>' + 'Book an appointment' + '</a>' + '</div>';
                  }

                  var address_html = '';
                  if (loc_street) {
                    address_html += '<div class="address__address">' + '<span class="address__street"><span>' + loc_street + loc_suite + '</span></span><span>' + loc_city + '</span>, <span>' + loc_state + '</span> <span>' + loc_zip + '</span>' + '</div>';
                  }

                  var phone_html = '';
                  if (loc_phone && display_phone != 'hidden') {
                    phone_html += '<div class="address__phone-wrapper">' + '<span class="phone-wrapper--text">Phone: </span>' + '<a href="tel:+' + parsnip[i].location.phone.unformatted + '" class="tel-link" rel="nofollow" title="Click to call ' + loc_phone + '"><span class="address__phone">' + loc_phone + '</span><span class="phone-wrapper__mobile--phone"><i class="fal fa-phone" aria-hidden="true"></i>Call</span></a>' + '</div>';
                  }

                  var fax_html = '';
                  if (loc_fax && display_fax != 'hidden') {
                    fax_html += '<div class="address__fax-wrapper">' + '<span class="fax-wrapper--text">Fax: </span>' + '<span class="address__fax">' + loc_fax + '</span>' + '</span>' + '</div>';
                  }

                  var distance_html = '';
                  if (loc_distance) {
                    distance_html += '<strong>' + loc_distance + ' miles away from ' + getZip + '</strong>';
                  }

                  var summary_html = '';
                  if (loc_summary && display_summary != 'hidden') {
                    summary_html += '<div class="card__summary typog-body">' + loc_summary + '</div>';
                  }

                  var map_html = '';
                  if (loc_map) {
                    map_html += '<div class="card-media">' + '<a href="' + loc_directions + '" target="_blank" class="card-media__link" title="Go to map">' + '<img src="' + loc_map + '" alt="' + loc_title + '">' + '</a>' + '</div>';
                  }

                  var directions_html = '';
                  if (loc_directions) {
                    directions_html += '<div class="address__directions">' + '<a href="' + loc_directions + '" class="link link--directions " target="_blank">' + '<i class="icon--pin " aria-hidden="true"></i>' + '<span class="hidden-xs">Get directions</span> <span class="hidden-sm hidden-md hidden-lg">Directions</span>' + '</a>' + '</div>';
                  }

                  //HTML output
                  // WOPS-3687 (WCAG 1.3.2 Meaningful Sequence): render card__content
                  // BEFORE card__media (the map) so the screen-reader / tab reading order
                  // is content-first (title, address, phone), with the supplementary map
                  // last. The visual layout is unchanged: on desktop `.card__media--full-width
                  // { order: 1 }` keeps the map on the right; on mobile the
                  // `.card--media-after-content` rule lifts the map back to the top.
                  output += '<div class="content-list__list-item row">' + '<div class="card  card--full-width card--media-after-content">' + '<div class="card__content col-sm-8 col-md-6">' + '<div class="card__title">' + '<a href="' + loc_url + '" target="' + (isExternalUrl(loc_url) ? '_blank' : '_self') + '">' + loc_title + '</a>' + '</div>' + '<div class="row card__address">' + '<div class="col-sm-8">' + '<div class="address">' + address_html + '<div>' + phone_html + '</div>' + '<div>' + fax_html + '</div>' + distance_html + directions_html + checkInLink + '</div>' + '</div>' + '</div>' + summary_html + '</div>' + '<div class="card__media col-sm-6 col-md-6 col-lg-5 card__media--full-width">' + map_html + '</div>' + '</div>' + '</div>';
                }

                //pagination output
                var page, page_url, page_text;
                for (var p in pagan.pages) {
                  page = pagan.pages[p];

                  if (typeof page.text === 'undefined') {
                    continue;
                  }

                  page_text = page.text;
                  page_url = '?' + page.url_params;

                  if (page.status == 'active') {
                    pagination_output += '<li class="pager-current">' + '<span class="pagination__current">' + page_text + '</span>' + '</li>';
                  } else if (page_text == 'next') {
                    pagination_output += '<li class="pager-next">' + '<a title="Go to next page" href="' + page_url + '">' + '<span class="pagination__text">next</span> <i class="fal fa-angle-right" aria-hidden="true"></i>' + '</a>' + '</li>';
                  } else if (page_text == 'last') {
                    pagination_output += '<li class="pager-last last">' + '<a title="Go to last page" href="' + page_url + '">' + '<span class="pagination__text">last</span>' + '<i class="fal fa-angle-double-right" aria-hidden="true"></i>' + '</a>' + '</li>';
                  } else if (page_text == 'first') {
                    pagination_output += '<li class="pager-first first">' + '<a title="Go to first page" href="' + page_url + '">' + '<i class="fal fa-angle-double-left" aria-hidden="true"></i> <span class="pagination__text">first</span>' + '</a>' + '</li>';
                  } else if (page_text == 'previous') {
                    pagination_output += '<li class="pager-previous">' + '<a title="Go to previous page" href="' + page_url + '">' + '<i class="fal fa-angle-left" aria-hidden="true"></i> ' + '<span class="pagination__text">previous</span>' + '</a>' + '</li>';
                  } else {
                    pagination_output += '<li class="pager-item">' + '<a title="Go to page ' + page_text + '" href="' + page_url + '">' + page_text + '</a>' + '</li>';
                  }
                }

                //running the skeleton blocks while the date is being loaded
                setTimeout(function () {
                  document.getElementById('ajax-pagination').innerHTML = pagination_output;
                  document.getElementById('ajax-content').innerHTML = output;
                  $('.search-results-bar__wrapper').css('display', 'block');
                  $('.graveyard').addClass('doot-doot');
                  $('.mobile-skeleton-container').addClass('doot-doot');
                }, 350);
              }
          }
        };
        jax.send();
      }; //end of loadLocations

      //loadCategories function to load the default tiles
      function loadCategories() {
        //resetting the locations inner data and various other HTML resets
        parsnip = '';
        $('.tile-space').css('display', 'block');
        $('#wait-times-block').css({
          visibility: 'visible',
          height: 'auto'
        });
        document.getElementById('ajax-content').innerHTML = '';
        document.getElementById('ajax-pagination').innerHTML = '';
        document.getElementById('location-page-title').innerText = '';
        document.getElementById('location-page-showing').innerHTML = '';
        $('#locations-container').css('display', 'none');
        $('.search-results-bar__wrapper').css('display', 'none');
        $('.no-results-locations').removeClass('no-show-locations');

        //starting new ajax request
        //var aj = new XMLHttpRequest();
        //aj.open('GET', dataURL, true);

        //aj.onprogress = function () {};

        //aj.onload = function () {
        //  if (this.status == 200) {
        //var categories = JSON.parse(this.responseText);
        var html_output = '';

        //quick check to make sure there are categories in the data returned.
        var catCheck = ds.query_settings.dynamic_list.show_custom_category_boxes;
        if (catCheck) {
          turnip = ds.query_settings.dynamic_list.custom_location_categories;
          for (var i in turnip) {
            var blankOpen = '';
            var linkOut = '';

            var fullUrl = turnip[i].url;
            var re = /^[^=]+=/;
            dataType = fullUrl.replace(re, '');

            var target = turnip[i].target == '_blank' ? true : false;
            if (target) {
              blankOpen = 'target="_blank"';
              linkOut = '<a href="' + turnip[i].url + '" ' + blankOpen + ' class="button-card__link" tabindex="1">';
            } else {
              blankOpen = '';
              linkOut = '<a id="ajaxLoad" data-type="' + dataType + '" class="button-card__link" tabindex="1">';
            }

            html_output += '<div class="button-card__wrapper color-trigger--' + turnip[i].color_trigger + ' button-card--border-bottom">' + linkOut + '<div class="button-card">' + '<i class="fal fa-' + turnip[i].icon_type + '"></i>' + '<div class="button-card__title">' + '<h4>' + turnip[i].title + '</h4>' + '</div>' + '</div>' + '</a>' + '</div>';
          }

          document.getElementById('button-grid-locations').innerHTML = html_output;

          $('#button-grid-locations').off('click', '#ajaxLoad').on('click', '#ajaxLoad', function () {
            var history_push = $(this).attr('data-type');

            $('#show-locations').addClass('tabs-text__item--active').siblings().removeClass('tabs-text__item--active');
            history.pushState(history_push, history_push, '?type=' + history_push);
            loadLocations(history_push);
          });
          $('.graveyard').addClass('doot-doot');
          $('.mobile-skeleton-container').addClass('doot-doot');
        } else {
          loadLocations();
        }
        //} else {
        //}
        //};
        //aj.send();
      } //end of loadCategories

      // Determine if a url is external or internal.
      function isExternalUrl(url) {
        var tmp = document.createElement('a');
        tmp.href = url;
        return tmp.host !== window.location.host;
      }

      // Check if a variable is set and not null.
      function isset(variable) {
        return typeof variable != "undefined" && variable != null ? true : false;
      }

      // Check if a query param is set.
      function issetQueryParam(param) {
        var searchParams = getQueryParams(window.location.search);
        return searchParams.has(param) ? true : false;
      }

      // Get all url query params.
      function getQueryParams(url) {
        return new URLSearchParams(url);
      }

      // Get specific url query param.
      function getQueryParam(param) {
        var searchParams = getQueryParams(window.location.search);
        return searchParams.get(param);
      }

      // Update the url to have proper delimiter so 
      // there is only one '?' and the rest are '&'.
      function setQueryParamDelimiter(url) {
        // Replace all question marks with ampersand.
        url = url.replace(new RegExp('[?]', 'g'), '&');
        // Replace any double ampersand with a single ampersand.
        url = url.replace(new RegExp('&&', 'g'), '&');
        // Replace the first ampersand with a question mark.
        url = url.replace('&', '?');
        return url;
      }

      // Removes params from a url.
      function removeURLParameter(param, url) {
        if (url.includes("?")) {
          url = decodeURI(url).split("?");
        } else {
          url = ['', url];
        }
        var path = '';
        path = url.length == 1 ? "" : url[1];
        path = path.replace(new RegExp("&?" + param + "\\[\\d*\\]=[\\w-?]+", "g"), "");
        path = path.replace(new RegExp("&?" + param + "=[\\w-?]+", "g"), "");
        path = path.replace(new RegExp("&?" + param + "=", "g"), "");
        path = path.replace(/^&/, "");
        return url[0] + (path.length ? "?" + path : "");
      }

      // Replaces default search params in a URL 
      // with ones defined by the user.
      function replaceDefaultSearchParams(url) {
        var query_params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.location.search;

        // Convert query params into an array.
        var params = getQueryParams(query_params);

        // Loop through query params and remove any that 
        // are already set in the default api url.
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var param = _step.value;

            // Remove the param from the url if 
            // there is an actual value being passed. 
            if (param[1]) {
              url = removeURLParameter(param[0], url);
            }
            // If the param is in the URL but no value is being passed, 
            // remove the param from the query params list.
            else {
                query_params = removeURLParameter(param[0], query_params);
              }
          }

          // Append the query params to the url.
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        url += '&' + query_params;

        return url;
      }

      $(window).bind('popstate', function (e) {
        var url_tail = typeof e.state === 'undefined' ? history.state : e.state;

        if (url_tail == null || url_tail == 'categories') {
          loadCategories();
        } else {
          loadLocations(history.state);
        }
      });
    }
  };
})(jQuery, Drupal);
"use strict";

(function masonryGridScript($, Drupal) {
  Drupal.behaviors.masonryGrid = {
    attach: function attach(context) {
      if (!$(".masonry-grid").length) return;
      var more_loaded = false;
      var checkParams = function checkParams(config) {
        var DEFAULT_GUTTER = 25;

        if (!config) {
          throw new Error("No config object has been provided.");
        }

        if (typeof config.useTransform !== "boolean") {
          config.useTransform = true;
        }

        if (typeof config.gutter !== "number") {
          config.gutter = DEFAULT_GUTTER;
        }

        if (!config.container) {
          error("container");
        }
        if (!config.items && !config.static) {
          error("items or static");
        }
      };

      /**
       * Handles invalid configuration object
       * errors.
       *
       * @param prop - a property with a missing value
       */
      var error = function error(prop) {
        throw new Error("Missing property '" + prop + "' in MagicGrid config");
      };

      /**
       * Finds the shortest column in
       * a column list.
       *
       * @param cols - list of columns
       *
       * @return shortest column
       */
      var getMin = function getMin(cols) {
        var min = cols[0];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = cols[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var col = _step.value;

            if (col.height < min.height) {
              min = col;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return min;
      };

      /**
       * @author emmanuelolaojo
       * @since 11/10/18
       *
       * The MagicGrid class is an
       * implementation of a flexible
       * grid layout.
       */

      var MagicGrid = function MagicGrid(config) {
        checkParams(config);

        if (config.container instanceof HTMLElement) {
          this.container = config.container;
          this.containerClass = config.container.className;
        } else {
          this.containerClass = config.container;
          this.container = document.querySelector(config.container);
        }

        this.items = this.container.children;
        this.static = config.static || false;
        this.size = config.items;
        this.gutter = config.gutter;
        this.maxColumns = config.maxColumns || false;
        this.useMin = config.useMin || false;
        this.useTransform = config.useTransform;
        this.animate = config.animate || false;
        this.started = false;

        this.init();
      };

      /**
       * Initializes styles
       *
       * @private
       */
      MagicGrid.prototype.init = function init() {
        if (!this.ready() || this.started) {
          return;
        }

        this.container.style.position = "relative";

        for (var i = 0; i < this.items.length; i++) {
          var style = this.items[i].style;

          style.position = "absolute";

          if (this.animate) {

            style.transition = (this.useTransform ? "transform" : "top, left") + " 0.9s ease";
          }
        }

        this.started = true;
      };

      /**
       * Calculates the width of a column.
       *
       * @return width of a column in the grid
       * @private
       */
      MagicGrid.prototype.colWidth = function colWidth() {
        return this.items[0].getBoundingClientRect().width + this.gutter;
      };

      /**
       * Initializes an array of empty columns
       * and calculates the leftover whitespace.
       *
       * @return {{cols: Array, wSpace: number}}
       * @private
       */
      MagicGrid.prototype.setup = function setup() {
        var width = this.container.getBoundingClientRect().width;
        var colWidth = this.colWidth();
        var numCols = Math.floor(width / colWidth) || 1;
        var cols = [];

        if (this.maxColumns && numCols > this.maxColumns) {
          numCols = this.maxColumns;
        }

        for (var i = 0; i < numCols; i++) {
          cols[i] = {
            height: 0,
            index: i
          };
        }

        var wSpace = width - numCols * colWidth + this.gutter;

        return {
          cols: cols,
          wSpace: wSpace
        };
      };

      /**
       * Gets the next available column.
       *
       * @param cols list of columns
       * @param i index of dom element
       *
       * @return {*} next available column
       * @private
       */
      MagicGrid.prototype.nextCol = function nextCol(cols, i) {
        if (this.useMin) {
          return getMin(cols);
        }

        return cols[i % cols.length];
      };

      /**
       * Positions each item in the grid, based
       * on their corresponding column's height
       * and index then stretches the container to
       * the height of the grid.
       */
      MagicGrid.prototype.positionItems = function positionItems() {
        var ref = this.setup();
        var cols = ref.cols;
        var wSpace = ref.wSpace;
        var maxHeight = 0;
        var colWidth = this.colWidth();
        var i = 0;
        var first_col_set = 0;

        if (more_loaded) {
          first_col_set = this.items.length;
        } else {
          first_col_set = 6;
        }

        wSpace = Math.floor(wSpace / 2);

        for (i = 0; i < this.items.length; i++) {
          var col = this.nextCol(cols, i);
          var item = this.items[i];
          var topGutter = col.height ? this.gutter : 0;
          var left = col.index * colWidth + wSpace + "px";
          var top = col.height + topGutter + "px";

          if (this.useTransform) {
            item.style.transform = "translate(" + left + ", " + top + ")";
          } else {
            item.style.top = top;
            item.style.right = left;
          }

          if (i < first_col_set) {
            col.height += item.getBoundingClientRect().height + topGutter;
          }

          if (col.height > maxHeight) {
            maxHeight = col.height;
          }
        }

        this.container.style.height = maxHeight + "px";
      };

      /**
       * Checks if every item has been loaded
       * in the dom.
       *
       * @return {Boolean} true if every item is present
       */
      MagicGrid.prototype.ready = function ready() {
        if (this.static) {
          return true;
        }
        return this.items.length >= this.size;
      };

      /**
       * Periodically checks that all items
       * have been loaded in the dom. Calls
       * this.listen() once all the items are
       * present.
       *
       * @private
       */
      MagicGrid.prototype.getReady = function getReady() {
        var this$1 = this;

        var interval = setInterval(function () {
          this$1.container = document.querySelector(this$1.containerClass);
          this$1.items = this$1.container.children;

          if (this$1.ready()) {
            clearInterval(interval);

            this$1.init();
            this$1.listen();
          }
        }, 100);
      };

      /**
       * Positions all the items and
       * repositions them whenever the
       * window size changes.
       */
      MagicGrid.prototype.listen = function listen() {
        var this$1 = this;

        if (this.ready()) {
          var timeout;

          window.addEventListener("resize", function () {
            if (!timeout) {
              timeout = setTimeout(function () {
                this$1.positionItems();
                timeout = null;
              }, 200);
            }
          });

          this.positionItems();
        } else {
          this.getReady();
        }
      };

      var nh_gutter = 0;

      if (nwdsi.isMobile()) {
        nh_gutter = 30;
      } else {
        nh_gutter = 15;
      }

      // console.log(nh_gutter);

      var magicGrid = new MagicGrid({
        container: '.masonry-container',
        animate: true,
        useTransform: true,
        gutter: nh_gutter,
        items: 15,
        static: true,
        useMin: false,
        maxColumns: 3
      });

      magicGrid.listen();

      setTimeout(function () {
        // reposition items
        magicGrid.positionItems();
      }, 350);

      var layTheBricks = function layTheBricks(target, event) {
        $(".constellation__1").addClass("engage");
        $(".constellation__2").addClass("engage");
        $(".constellation__3").addClass("engage");
        $(".col-md-6").addClass("engage");
        $(".masonry-item").addClass("engage");
        $(".load-more-btn").addClass("engage");
      };

      $(document).ready(function () {
        $("#loadmore").on('click', function () {
          $(".fresh-batch").addClass("re-engage");
          more_loaded = true;
          magicGrid.positionItems();
          $(".load-more-btn").fadeOut("fast");
        });
      });

      nwdsi.whenVisibleObserver({
        "selector": ".masonry-grid",
        "callback": layTheBricks,
        "callbackEvent": "inview",
        "options": {
          "rootMargin": "-40px"
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function mobiletrayScript($, Drupal) {
  Drupal.behaviors.mobiletrays = {
    attach: function attach(context) {
      //OLD CODE that I want to leave in, just in case Syllable decide to make any drastic changes.
      // function checkIframeLoaded() {
      //   const iframe = document.getElementById('syllable-frame');
      //   // Get a handle to the iframe element
      //   if (iframe != null) {
      //     const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      //     iframe.style.zIndex = '0';

      //     const chatContainer = document.getElementById('syllable-container');
      //     chatContainer.style.zIndex = '0';

      //     // Check if loading is complete
      //     if (iframeDoc.readyState == 'complete') {
      //       iframe.contentWindow.onload = function () {
      //         console.log('I am loaded');
      //         destroyButton();
      //       };
      //       // The loading is complete, call the function we want executed once the iframe is loaded
      //       return;
      //     }
      //   }

      //   // If we are here, it is not loaded. Set things up so we check the status again in 100 milliseconds
      //   window.setTimeout(checkIframeLoaded, 500);
      // }

      // function destroyButton() {
      //   const chat_btn = document
      //     .getElementById('syllable-frame')
      //     .contentWindow.document.getElementById('SyllableButton');

      //   console.log(':D');

      //   //hide the inner iFrame syllable button
      //   chat_btn.style.display = 'none';
      // }

      // window.onload = function () {
      //   checkIframeLoaded();
      // };

      if (window.location.href.indexOf('find-a-doctor') > -1) {
        var firstTray = document.querySelector('.site-header #site-links .mobile-tray');
        if (firstTray) firstTray.style.display = 'none';

        var trayCheck = document.getElementById('fad-tray-phone');
        if (!trayCheck) {
          document.body.classList.remove('syllable-bot-closed');
        }
      }

      var allTray = document.getElementById('fad-profile-tray');
      if (allTray) {
        document.body.classList.add('tray-active');
      }

      // $('.open_syllable').on('click', function () {
      //   // $('#syllable-container').addClass('chat-open');

      //   window.Syllable.open();
      // });
    }
  };
})(jQuery, Drupal);
'use strict';

(function patientProfileScript($, Drupal, drupalSettings) {
  // if not on patient profile page or dfd-to-fmh redirect page, stop execution
  if (window.location.pathname !== '/manage-your-care/patient-portal' && window.location.pathname !== '/dfd-to-fmh') return;
  Drupal.behaviors.patientProfile = {
    attach: function attach(context) {
      // the redirect page is needed so all the gigya and drupal variables exist
      if (window.location.pathname === '/dfd-to-fmh') {
        if (gigya) {
          gigya.accounts.getAccountInfo({
            callback: function callback(response) {
              if (response.errorCode === 0) {
                // post audit log
                gigya.accounts.getJWT({
                  callback: function callback(jwtRes) {
                    jQuery.ajax({
                      type: 'post',
                      url: drupalSettings.dpx_api_url + '/audit-log/dfd-to-fmh',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + jwtRes.id_token
                      },
                      data: '{"auditMessage": "DFD to FMH saml/sso handoff"}'
                    }).then(function (data, textStatus, jqXHR) {
                      // The below call can be used for IDP initiated login.
                      // https://developers.gigya.com/display/GD/fidm.saml.initSSO+JS
                      gigya.fidm.saml.initSSO({
                        spName: drupalSettings.northwell_gigya.saml_sso_spname,
                        redirectURL: drupalSettings.northwell_gigya.saml_sso_redirecturl
                      });
                    });
                  },
                  expiration: 180
                }); // end of getJWT
              } else {
                // user is logged out, send to fmh without doing sso/saml
                window.location = drupalSettings.northwell_gigya.saml_sso_fmh_url;
              }
              return false;
            },
            expiration: 180
          }); // end of getAccountInfo
        }
      } else if (window.location.pathname === '/manage-your-care/patient-portal') {
        // Handles callback to a gigya events.
        var updateLinkHref = function updateLinkHref(action) {
          // Get the Launch FollowMyHealth link.
          var fmhLink = document.querySelector('[href*="https://northwellhealth.followmyhealth.com"]');
          var dashboardLink = document.querySelector('[href*="dashboard?redirectFMH"]');
          if (fmhLink && action === 'login') {
            fmhLink.href = '/dashboard?redirectFMH=true';
          } else if (dashboardLink && action === 'logout') {
            dashboardLink.href = 'https://northwellhealth.followmyhealth.com';
          }
        };
        // Check if user is logged in and update the FMH link with the dashboard redirect URL
        /*gigya.accounts.getAccountInfo({
          callback: (response) => {
            if (response.errorCode !== 403005) {
              updateLinkHref('login');
            }
          },
        });
        gigya.accounts.addEventHandlers({
          onLogin: () => {
            updateLinkHref('login');
          },
          onLogout: () => {
            updateLinkHref('logout');
          },
        });*/
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
'use strict';

(function priceTransparencyScript($, Drupal) {
  if ($('#price-trans-tool_top').length === 0) return;
  Drupal.behaviors.priceTransparency = {
    baseApiUrl: '/api/price-transparency-tool',
    topOffset: 100,
    placeholderOption: 'none',
    calculated: false,
    getParamName: function getParamName($element) {
      var prefix = 'price-trans-tool--';
      var key = $element.attr('class').split(' ').filter(function (str) {
        return str.startsWith(prefix);
      }).shift().substring(prefix.length);
      var pair = {};
      pair[key] = $element.val() || $element.attr('value');
      return pair;
    },

    /**
     * Removes all options from a dropdown save the empty placeholder option. Also disables the dropdown.
     *
     * @param $dropdown
     */
    resetDropdown: function resetDropdown($dropdown) {
      $dropdown.attr('disabled', 'disabled');
      $dropdown.children('option').slice(1).each(function () {
        var $option = $(this);
        $option.remove();
      });
    },
    dropdownsComplete: function dropdownsComplete(dropdowns) {
      var areComplete = void 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = dropdowns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var $dropdown = _step.value;

          if ($dropdown.val() === 'none') {
            areComplete = false;
            break;
          } else {
            areComplete = true;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return areComplete;
    },
    setBusy: function setBusy($priceTransparencyTool, value) {
      if (value) {
        $priceTransparencyTool.addClass('busy');
      } else {
        $priceTransparencyTool.removeClass('busy');
      }
    },
    changeHandler: function changeHandler($priceTransparencyTool, dropdowns, index, $calculate, $startAgain, $results) {
      var self = this;
      var nextIndex = index + 1;
      var dependentDropdowns = dropdowns.slice(nextIndex);
      var lastIndex = dropdowns.length - 1;
      return function () {
        var value = dropdowns[index].val();
        // removed this because it did not work in IE11
        // const params = Object.assign.apply(this, dropdowns
        //   .slice(0, nextIndex)
        //   .map(self.getParamName)
        // );
        var ddArr = dropdowns.slice(0, nextIndex).map(self.getParamName);
        var params = ddArr.reduce(function (r, o) {
          Object.keys(o).forEach(function (k) {
            r[k] = o[k];
          });
          return r;
        }, {});
        /**
         * If the user selects the empty "placeholder" option, be sure to reset all dependent dropdowns and return from
         * this function immediately.
         */
        if (value === self.placeholderOption) {
          dependentDropdowns.forEach(function ($dropdown) {
            self.resetDropdown($dropdown);
          });
          return;
        }
        /**
         * Allow folks to clear their selections.
         */
        $startAgain.removeAttr('disabled');
        /**
         * If the user has changed the last dropdown, we have enough info now to calculate. If they changed any
         * previous dropdown, the last dropdown will either have not been selected yet OR it will have been
         * reset by a change in the current dropdown, rendering the last dropdown disabled or unselected.
         */
        if (self.dropdownsComplete(dropdowns) /*&& self.calculated !== 'calculated'*/) {
            $calculate.removeAttr('disabled');
            return;
          } else {
          $calculate.attr('disabled', 'disabled');
        }
        /**
         * Remove any previously calculated results.
         */
        $results.hide('slow');
        self.setBusy($priceTransparencyTool, true);
        $.ajax(self.baseApiUrl, { data: params }).done(function (data) {
          if (index < dropdowns.length) {
            dependentDropdowns.forEach(function ($dropdown) {
              var dependentIndex = dependentDropdowns.indexOf($dropdown);
              self.resetDropdown($dropdown);
              $dropdown.val(self.placeholderOption);
              data.forEach(function (option) {
                $dropdown.append(new Option(option, option, false, false));
              });
              if (dependentIndex === 0) {
                $dropdown.removeAttr('disabled');
              }
              $dropdown.trigger('change.select2');
            });
          }
        }).always(function () {
          self.setBusy($priceTransparencyTool, false);
        });
      };
    },
    attach: function attach(context) {
      var $priceTransTools = $('.price-trans-tool', context);
      if (!$priceTransTools.length) return;
      var self = this;
      $priceTransTools.each(function () {
        var $priceTransparencyTool = $(this);
        var $hospitals = $('.price-trans-tool--hospital', $priceTransparencyTool);
        var $patientTypes = $('.price-trans-tool--patient-type', $priceTransparencyTool);
        var $serviceTypes = $('.price-trans-tool--service-type', $priceTransparencyTool);
        var $procedures = $('.price-trans-tool--procedure', $priceTransparencyTool);
        var $calculate = $('.price-trans-tool--calculate', $priceTransparencyTool);
        var $startAgain = $('.price-trans-tool--start-again', $priceTransparencyTool);
        var $results = $('.price-trans-tool--results', $priceTransparencyTool);
        var $resultsCalculated = $('.price-trans-tool--results--calculated', $results);
        var dropdowns = [$hospitals, $patientTypes, $serviceTypes, $procedures];
        /**
         * "Calculate" should be disabled initially.
         */
        $calculate.attr('disabled', 'disabled');
        /**
         * "Start Again" should be disabled initially.
         */
        $startAgain.attr('disabled', 'disabled');
        /**
         * Results should be hidden initially.
         */
        $results.hide('slow');
        /**
         * First dropdown should be disabled initially. Add change handlers to all dropdowns.
         */
        dropdowns.forEach(function ($dropdown) {
          var index = dropdowns.indexOf($dropdown);
          if (index > 0) {
            $dropdown.attr('disabled', 'disabled');
            $dropdown.trigger('change.select2');
          }
          $dropdown.bind('change keyup', self.changeHandler($priceTransparencyTool, dropdowns, index, $calculate, $startAgain, $results));
        });
        $calculate.bind('click', function () {
          // removed because did not work in IE11
          // const params = Object.assign.apply(this, dropdowns.map(self.getParamName));
          Drupal.behaviors.priceTransparency.calculated = 'calculated';
          var ddArr = dropdowns.map(self.getParamName);
          var params = ddArr.reduce(function (r, o) {
            Object.keys(o).forEach(function (k) {
              r[k] = o[k];
            });
            return r;
          }, {});

          self.setBusy($priceTransparencyTool, true);
          $calculate.attr('disabled', 'disabled');
          $.ajax(self.baseApiUrl, { data: params }).done(function (data) {
            if (data.result === 'n/a') {
              $resultsCalculated.html('<span class="price-trans-tool--error">Something went wrong, click "Start again" to clear the form.</span>');
            } else {
              $resultsCalculated.text('Rate ' + data.result + '.00');
            }
            $results.show('slow');
          }).always(function () {
            self.setBusy($priceTransparencyTool, false);
          });
          return false;
        });
        /**
         * Reset all dropdowns except the first. Set the first's value to the empty placeholder option.
         */
        $startAgain.bind('click', function (e) {
          e.preventDefault();
          $startAgain.attr('disabled', 'disabled');
          $results.hide('slow');
          Drupal.behaviors.priceTransparency.calculated = '';
          dropdowns.forEach(function ($dropdown) {
            var index = dropdowns.indexOf($dropdown);
            if (index > 0) {
              $dropdown.attr('disabled', 'disabled');
              $dropdown.trigger('change.select2');
              self.resetDropdown($dropdown);
            }
            $dropdown.val(self.placeholderOption);
            $dropdown.trigger('change.select2');
          });
          $('html,body').animate({
            scrollTop: $priceTransparencyTool.offset().top - self.topOffset
          }, 'slow');
        });
      });
    }
  };
})(jQuery, Drupal);
"use strict";

(function publicationheaderScript($, Drupal) {
  Drupal.behaviors.publicationheader = {
    attach: function attach(context) {}
  };
})(jQuery, Drupal);
"use strict";

(function samlSsoErrorScript($, Drupal) {
  var samlError = $(".sso-saml-login-error");
  if (!samlError.length) return; //targeting error div on sso-login-error page
  Drupal.behaviors.samlSsoError = {
    attach: function attach(context) {

      //get error from url vars.  example error url below
      //http://www.dev.northwell-d8.kube.p2devcloud.com/sso-login-error?error=%7B%22errorCode%22:400006%2c%22errorMessage%22:%22Invalid+parameter+value%22%2c%22callId%22:%222232323ee4244056bcd1b2ba2aaba724%22%2c%22errorDetails%22:%22Invalid+argument:+loginToken+is+missing%22%2c%22errorDescription%22:%22Invalid+argument:+loginToken+is+missing%22%7D
      var decodedUrl = decodeURIComponent(window.location.href);

      var errorHTML = "";
      //grab everything after "sso-login-error?error="
      var urlParts = decodedUrl.split("sso-login-error?error=");
      if (urlParts[1]) {
        //this will contain all the error details in a json string
        /*
        example errorObj object
        {
          errorCode: 400006
          errorDescription: "Invalid+argument:+loginToken+is+missing"
          errorDetails: "Invalid+argument:+loginToken+is+missing"
          errorMessage: "Invalid+parameter+value"
        }
        */

        var errorObj = JSON.parse(urlParts[1]);

        if (errorObj.errorDescription) {
          errorObj.errorDescription = errorObj.errorDescription.replace(/\+/g, " ");
          errorHTML += "<li>Error Description: " + errorObj.errorDescription + "</li>";
        }

        if (errorObj.errorDetails) {
          errorObj.errorDetails = errorObj.errorDetails.replace(/\+/g, " ");
          errorHTML += "<li>Error Details: " + errorObj.errorDetails + "</li>";
        }

        if (errorObj.errorMessage) {
          errorObj.errorMessage = errorObj.errorMessage.replace(/\+/g, " ");
          errorHTML += "<li>Error Message: " + errorObj.errorMessage + "</li>";
        }

        if (errorObj.errorCode) {
          errorHTML += "<li>Error Code: " + errorObj.errorCode + "</li>";
        }
      } else {
        console.log("No error details exist");
      }

      if (errorHTML === "") {
        errorHTML = "<li>An unknown error occurred.</li>";
      }

      samlError.find('.sso-saml-login-error-text').html("<ul>" + errorHTML + "</ul>");
    }
  };
})(jQuery, Drupal);
'use strict';

(function searchmodalScript($, Drupal) {
  Drupal.behaviors.searchmodal = {
    filterSearch: function filterSearch() {
      var _this = this;

      var $resultsList = this.$accordionSearch.find('.accordion-search__panel');
      var $clearButton = this.$accordionSearch.find('.accordion-search__clear-input');

      var escapeRegExp = function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      };

      this.$accordionSearch.on('keyup', '.accordion-search__input', function (e) {
        // Grab input value
        var term = $(e.currentTarget).val();
        if (term.length === 0) {
          $clearButton.css('display', 'none');
        } else {
          $clearButton.css('display', 'block');
        }
        // Loop through each results to check if search term matches result data
        $resultsList.each(function (index, item) {
          var search = new RegExp(escapeRegExp(term), "ig");
          var resultsText = $(item).data('value');
          if (resultsText.match(search)) {
            $(item).removeClass('hidden');
          } else {
            $(item).addClass('hidden');
          }
        });
      }).on('click', '.accordion-search__clear-input', function (e) {
        e.preventDefault();
        // Clear search input
        _this.$accordionSearch.find('input').val('').trigger('keyup');
        // Focus on input
        _this.$accordionSearch.find('input').trigger('focus');
      });
    },
    modalInit: function modalInit(context) {
      var _this2 = this;

      // Remove '.fade' class so that bootstrap's 'shown.bs.modal' fires correctly
      this.$searchModal.removeClass('fade');

      $('#search-modal', context).on('shown.bs.modal', function (el) {
        _this2.$accordionSearch = $(el.currentTarget).find('.accordion-search');
        _this2.filterSearch();
      });
    },
    attach: function attach(context) {
      var _this3 = this;

      this.$searchModal = $('#search-modal', context);

      $('.search-modal__open', context).on('click', function () {
        _this3.modalInit();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function selecttoggleScript($, Drupal) {
  Drupal.behaviors.selecttoggle = {
    attach: function attach(context) {
      if (!$('#select-toggle').length) return;
      var $panels = $('.select-toggle-panel');
      $('#select-toggle__select').on('select2:select', function (e) {
        var $option = $(e.currentTarget).find('option:selected').val();
        var newIndex = Number($option) - 1;
        var $openPanel = $panels.hasClass('select-toggle-show');
        if ($($panels[newIndex]) === $openPanel) return;
        $panels.removeClass('select-toggle-show').hide();
        $($panels[newIndex]).fadeIn('slow').addClass('select-toggle-show');
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function sfmsformsScript($, Drupal) {
  Drupal.behaviors.sfmcforms = {
    attach: function attach(context) {
      var SFMCformIDs = [];
      var $SFMCforms = "sfmc-forms";
      var $SFMCformPlaceholders = $('.' + $SFMCforms);
      // check for touch devices for special handling
      var isTouch = $('html.touchevents').length || 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

      // bailout
      if (!$SFMCformPlaceholders.length > 0) return;
      $SFMCformPlaceholders.each(function (i, e) {
        var $placeholder = $(e);
        var thisId = $placeholder.attr('data-id');
        SFMCformIDs.push(thisId);

        var mPlaceholder = e,
            options = {
          childList: true
        },
            observer = new MutationObserver(mCallback);

        function mCallback(mutations) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = mutations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var mutation = _step.value;

              if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0) {
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                    for (var _iterator2 = mutation.addedNodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var node = _step2.value;

                      if (node.nodeName === 'FORM') {
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                          for (var _iterator3 = node[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var item = _step3.value;

                            if (item.nodeName === 'SELECT') {
                              if (!isTouch) {
                                setSelects();
                              } else {
                                $(item).prop('disabled', false);
                              }
                              observer.disconnect();
                            }
                          }
                        } catch (err) {
                          _didIteratorError3 = true;
                          _iteratorError3 = err;
                        } finally {
                          try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                              _iterator3.return();
                            }
                          } finally {
                            if (_didIteratorError3) {
                              throw _iteratorError3;
                            }
                          }
                        }
                      }
                    }
                  } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                      }
                    } finally {
                      if (_didIteratorError2) {
                        throw _iteratorError2;
                      }
                    }
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }

        observer.observe(mPlaceholder, options);
      });

      var setSelects = function setSelects() {
        var $SFMCselects = $('.sfmc-form-select');
        // Set Select2 theme to add class to select2 wrapper.
        $.fn.select2.defaults.set("theme", "nwdsi");
        $SFMCselects.select2({
          minimumResultsForSearch: -1
        });
        $SFMCselects.prop('disabled', false);
        var $SFMCarrow = $SFMCselects.find("+ .select2-container .select2-selection__arrow");

        function handleDropdowns(e) {
          //console.log('handledropdowns');
          var $thisselect2 = $(e.target).parents(".select2-container").prev();
          //console.log($thisselect2 );
          // simulate allowClear

          // If they click the "x" icon to clear/remove their current option
          // then reset the dropdown.

          // Since the icon is changed via pseudo-content there is no way to detect it via JavaScript
          // therefore we check if the container has the .select2-container--selected class

          if ($thisselect2.find("+ .select2-container").hasClass("select2-container--selected")) {
            // $select2.val('').trigger('change');

            // the value reset thing to isolate placeholder didn't work
            // // Presuming the first option is the default, return its value attribute
            // // so that it properly disappears.
            // //$select2.find('option').first().attr('value', '').prop('value', '');
            $thisselect2.find(":selected").prop("selected", false).trigger("change");
            $thisselect2.select2("close");
            $thisselect2.select2("open");
          }

          // was testing their allowClear feature, what if I had their 'x' and click it?
          // too much of a pain to figure out
          // console.log('doh!');
          // //e.preventDefault();
          // var $clear = $select2.find('+ .select2-container .select2-selection__clear');
          // if ($clear.length) {
          //    console.log('I FOUND YE');
          //    $clear.trigger('mousedown'); // https://github.com/select2/select2/blob/master/src/js/select2/selection/allowClear.js
          // }
        }
        $SFMCarrow.on('click', function (event) {
          handleDropdowns(event);
        });

        // Provide a way to determine if a selection has been made
        // we can use this to swap the icon for example
        $SFMCselects.on("change", function (e, obj) {
          var $this = $(this);
          var option = $this.prop("selectedIndex");
          var $select2_container = $this.next(".select2-container");

          // If it's the first (presumed default) option that's selected then who cares
          if (option === 0) {
            $select2_container.removeClass("select2-container--selected");
            // If it's not the first option, then we provide a class so we can do stuff, e.g. convert the down arrow icon to a remove icon
          } else {
            // the value reset thing to isolate placeholder didn't work
            // // If this has the placeholder feature,
            // // we presume we still want the first option viewable,
            // // to do that we remove its value attribute.
            // if (Boolean($this.attr('placeholder'))) {
            //    console.log('hi');
            //    $this.find('option').first().removeAttr('value');
            // }
            $select2_container.toggleClass("select2-container--selected", true);
          }
        }).change();

        $SFMCselects.filter(".js-submit-on-change").each(function (i, select2) {
          var $select2 = $(this);
          var name = $select2.attr("name");
          var form_selector = $select2.attr("data-form");
          var $form = false;
          var $matching_field = false;

          // Update/add equivalent form field to external form if any
          if (form_selector && name) {
            $form = $(form_selector);
            if ($form.length) {
              $matching_field = $form.find('[name=' + name + ']');
              if ($matching_field.length) {
                $matching_field.val($select2.val());
              } else {
                $matching_field = $('<input type="hidden" name="' + name + '"/>').val($select2.val()).appendTo($form);
              }
            } else {
              $form = false;
            }
          }

          $select2.on("change", function (e) {
            var $form = false;
            var $matching_field = false;

            // Update external form if any.
            // Repeat of the above in case the selector leads to a different or
            // multiple forms.
            if (form_selector && name) {
              $form = $(form_selector);
              if ($form.length) {
                $matching_field = $form.find('[name=' + name + ']');
                if ($matching_field.length) {
                  $matching_field.val($select2.val());
                } else {
                  $matching_field = $('<input type="hidden" name="' + name + '"/>').val($select2.val()).appendTo($form);
                }
              } else {
                $form = false;
              }
            }

            if (!$form) {
              $form = $select2.parents("form");
            }

            // In the case of multiple applicable forms, pick the first one that's visible.
            $form = $form.filter(":visible").first();

            // console.log('form.submit ', $form);
            $form.get(0).submit();
          });
        });
      };

      $(document).ready(function () {
        SFMCformIDs.forEach(function (id, index) {
          $SFMCformPlaceholders.load("https://cloud.email.northwellhealth.com/Form-" + id);
        });
      });
      // @run-at   document-start
      window.addEventListener('load', function () {
        //console.log('WINDOW LOADED FROM SALESFORCE.JS');
        //remove min height set on parent form div after page load.
        $SFMCformPlaceholders.css('min-height', '0');
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function stattickerMobileCarousel($, Drupal) {
  // bail if no group and no icon variant
  if (!$('.stat-ticker-group').length && !$('.stat-ticker__icon-variant').length) return;
  Drupal.behaviors.stattickerMobileCarousel = {
    attach: function attach(context) {
      // set up functions
      function attachHandlers() {
        $(context).find('.stat-ticker-group').each(function (i, e) {
          var $self = $(e);
          var $statickers = $self.find('.stat-ticker:not(.stat-ticker__no_content)');
          var $carousel = $self.find('.stat-ticker__mobile-carousel');
          $statickers.on('click', function () {
            var index = $(this).index();
            $carousel.slick('slickGoTo', index, true);
            $self.find('.stat-ticker__mobile-carousel-wrap').addClass('stat-ticker__show-mobile-carousel');
          });
        });
      }
      function removeHandlers() {
        $(context).find('.stat-ticker-group').each(function (i, e) {
          var $self = $(e);
          var $statickers = $self.find('.stat-ticker');
          $statickers.off('click');
        });
      }
      // Execute if the window changes.
      $(window).on('load resize orientationchange', function statickerMobileCarouselCheckWidth(e) {
        // bail if not mobile
        if (nwdsi.isMobile()) {
          attachHandlers();
        } else {
          removeHandlers();
        }
        // Apply the carousel settings to all matching elements.
        $(context).find('.stat-ticker__mobile-carousel').each(function slickInit() {
          // Define window width
          var windowWidth = $(window).width();
          // Store each matching element in temporary memory.
          var $carousel = $(this);
          // Unslick screen sizes over 768px.
          if (windowWidth > 768) {
            if ($carousel.hasClass('slick-initialized')) {
              $carousel.slick('unslick');
            }
          } else {
            /* eslint-disable no-lonely-if */
            if (!$carousel.hasClass('slick-initialized')) {
              $carousel.slick({
                slide: '.stat-ticker__mobile-carousel--item',
                arrows: true,
                prevArrow: '<i class="stat-ticker__mobile-carousel-btn btn--prev far fa-angle-left"></i>',
                nextArrow: '<i class="stat-ticker__mobile-carousel-btn btn--next far fa-angle-right"></i>',
                infinite: true,
                slidesToShow: 1,
                accessibility: true,
                autoplay: false,
                autoplaySpeed: 11000,
                dots: false,
                mobileFirst: true
              });
            }
            /* eslint-enable no-lonely-if */
          }
        });
      });
      // add event listener to close button
      $('.stat-ticker__mobile-carousel--close', context).on('click', function (event) {
        var $self = $(event.currentTarget);
        $self.closest('.stat-ticker__mobile-carousel-wrap').removeClass('stat-ticker__show-mobile-carousel');
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function supportArticleCarousel($, Drupal) {
  Drupal.behaviors.supportArticleCarousel = {
    attach: function attach(context) {
      // Execute if the window changes.
      $(window).on('load resize orientationchange', function supportCarouselCheckWidth() {
        // Apply the carousel settings to all matching elements.
        $(context).find('.support-article-content-featured__carousel-wrapper').each(function slickInit() {
          // Define window width
          var windowWidth = $(window).width();
          // Store each matching element in temporary memory.
          var $carousel = $(this);
          // Unslick screen sizes over 768px.
          if (windowWidth > 768) {
            if ($carousel.hasClass('slick-initialized')) {
              $carousel.slick('unslick');
            }
          } else {
            /* eslint-disable no-lonely-if */
            if (!$carousel.hasClass('slick-initialized')) {
              $carousel.slick({
                slide: '.support-article-content-featured--full',
                arrows: false,
                accessibility: true,
                autoplay: true,
                autoplaySpeed: 11000,
                dots: true,
                mobileFirst: true,
                fade: true
              });
            }
            /* eslint-enable no-lonely-if */
          }
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function supportHeroCarousel($, Drupal) {
  Drupal.behaviors.supportHeroCarousel = {
    attach: function attach(context) {
      $(context).find('.support-carousel__items').once('support-hero-carousel').each(function (i, hero) {
        var $hero = $(hero);
        $hero.slick({
          autoplay: true,
          autoplaySpeed: 11000,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          appendArrows: $hero.parents('.support-carousel').find('.support-carousel__buttons'),
          prevArrow: '<i class="support-carousel__btn btn--prev icon--angle-thin"></i>',
          nextArrow: '<i class="support-carousel__btn btn--next icon--angle-thin"></i>',
          fade: true,
          mobileFirst: true,
          useCSS: false,
          useTransform: false,
          respondTo: 'window',
          dots: true,
          dotsClass: 'support-carousel__dots'
        });
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function ($, Drupal) {
  /* eslint-disable no-console, no-undef, no-unused-vars, func-names, max-len, object-shorthand */

  'use strict';

  if (!$('.support-my-northwell').length) return;
  // NH Hospital API.
  var HOSPITAL_API = 'https://api.northwell.edu/v2/locations/search?type=hospitals&results_per_page=-1';
  // Google maps API.
  var MAP_API = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyByobPcaArIweKdpYh_LYqORmjXrz7TlUk';
  // Pattern lab theme path.
  var NWH_DDS = '/themes/custom/northwell_health_digital_design_system/nwh-dds/';

  /**
   * Hospital blacklist.
   *
   * This is a list of IDs used to exclude hospitals from the map based on matching IDs found in the Northwell API
   * and Drupal, thus excluding them from the application.
   *
   * This will need to be updated as location content is migrated to D8.
   * '<content_type>_<node_id>'
   */
  var blacklistedHospitals = ['northwell_d8_component_page_76566', // Crouse Hospital
  'northwell_d8_component_page_76591', // Maimonides Medical Center
  'northwell_d8_component_page_76596', // Mather Hospital
  'northwell_d8_component_page_76601', // Nassau University Medical Center
  'northwell_d8_component_page_76626', // Phelps Hospital
  'northwell_d8_component_page_76646', // South Oaks Hospital
  'northwell_d8_component_page_76001', // Boca Raton Regional Hospital
  'northwell_d8_component_page_71806', // Zucker Hillside Hospital
  'northwell_d8_component_page_69966', // Long Island Jewish Valley Stream
  'northwell_d8_component_page_69671', // Long Island Jewish Forest Hills
  'northwell_d8_component_page_76591', // Maimonides Medical Center
  'northwell_d8_component_page_76596', // Mather Hospital
  'northwell_d8_component_page_70061', // Plainview Hospital
  'northwell_d8_component_page_76601', // Nassau University Medical Center
  'northwell_d8_component_page_70151'];

  /**
   * Fires off the My Northwell Application.
   *
   * The API results are fetched and filtered, and then the chosen result is constructed and rendered.
   *
   * @type {{attach: Drupal.behaviors.myNorthwell.attach}}
   *    Attaches the listener to the form link.
   */
  Drupal.behaviors.myNorthwell = {
    attach: function attach(context) {
      var $context = $('.support-my-northwell', context);

      if (typeof google === 'undefined') {
        // Call Google maps API if script has not yet been loaded.
        $.getScript(MAP_API);
      }

      $('.card-group__change-button').removeAttr('target');

      $('#card-group__location-search', $context).once('search-for-hospitals').on('submit', function (e) {

        // Get zip code value from input field.
        var zipcode = $('#my-northwell-location-search').val();

        // Get hospital information from Northwell's API.
        $.getJSON(HOSPITAL_API, function (data) {

          // Blacklist filter util.
          var blacklistFilter = function blacklistFilter(id) {
            return !blacklistedHospitals.includes(id);
          };

          // Reduce response results per blacklisted hospitals.
          var filteredResponse = data.response.results.reduce(function (list, item) {
            if (blacklistFilter(item.id)) list.push(item);
            return list;
          }, []);

          // If the hospital has the same zip code as the one the user searched, then we add 'local: true'
          // which will help us later when we need to figure out where to center the map.
          var remappingHospitalsArray = function remappingHospitalsArray(item) {
            if (item.location.zip === zipcode) {
              item = {
                id: item.id,
                title: item.title,
                geo: {
                  latitude: item.location.address.latitude,
                  longitude: item.location.address.longitude
                },
                address: item.location.address,
                local: true
              };
            } else {
              item = {
                id: item.id,
                title: item.title,
                geo: {
                  latitude: item.location.address.latitude,
                  longitude: item.location.address.longitude
                },
                address: item.location.address,
                local: false
              };
            }
            return item;
          };

          // Remapping filtered hospital results.
          var hospitals = filteredResponse.map(remappingHospitalsArray);
          // Render hospitals on the map.
          Drupal.myNorthwell.renderMap($context, hospitals);
        });

        // Prevent form from submitting.
        e.preventDefault();
        e.stopPropagation();
      });
    }
  };

  /**
   * Namespace for My Northwell related JavaScript methods.
   *
   * @type {Object}
   */
  Drupal.myNorthwell = {};

  /**
   * Render hospital points on the map.
   *
   * @param $context
   * @param hospitals
   */
  Drupal.myNorthwell.renderMap = function ($context, hospitals) {
    // Hide My Northwell cards and replace with map.
    $('.card-group__card-wrapper', $context).hide();
    $('.content-list__grid', $context).append(Drupal.theme('myNorthwellContainer'));
    // $('#northwell-hospital-map').show();

    var local_hospitals = [];
    var currentInfoWindow = null;

    // Create map with initial settings.
    var map = new google.maps.Map(document.getElementById('northwell-hospital-map'), {
      center: { lat: 40.783706, lng: -73.704410 },
      zoom: 16,
      scrollwheel: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false
    });

    // A LatLngBounds instance represents a rectangle in geographical coordinates. We'll be
    // using this to zoom in on the hospitals near the zip code selected by user.
    var bounds = new google.maps.LatLngBounds();

    var base_url = void 0;
    // If pattern lab (local or outrigger) declare base_url.
    if (window.location.href.includes('watch-design.northwell.vm') || window.location.href.includes('localhost')) {
      base_url = '/';
    } else {
      base_url = NWH_DDS;
    }

    $.each(hospitals, function (index, value) {
      // Create and add marker for each hospital onto map.
      var marker = new google.maps.Marker({
        position: { lat: value.geo.latitude, lng: value.geo.longitude },
        map: map,
        icon: base_url + 'images/map-pin.png'
      });

      // Create hospital object for theme function.
      var hospital = {
        'id': value.id,
        'title': value.title,
        'street_address': value.address.street_address,
        'city': value.address.city,
        'state': value.address.state,
        'zip': value.address.zip
      };

      // Creates the popup with hospital info + select button.
      var infowindow = new google.maps.InfoWindow({
        content: Drupal.theme('myNorthwellPopup', hospital)
      });

      // If another infoWindow is open close that before you open a new one.
      marker.addListener('click', function () {
        if (currentInfoWindow != null) {
          currentInfoWindow.close();
        }
        infowindow.open(map, marker);
        currentInfoWindow = infowindow;
      });

      // If a hospital is located within the zip code provided, add it to the map bounds so
      // the map can be zoomed into this area.
      if (value.local === true) {
        var local_hospital = new google.maps.LatLng(value.geo.latitude, value.geo.longitude);
        local_hospitals.push(local_hospital);
        bounds.extend(local_hospital);
      }
    });

    // Don't zoom in too far on only one marker.
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.0005, bounds.getNorthEast().lng() + 0.0005);
      var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.0005, bounds.getNorthEast().lng() - 0.0005);
      bounds.extend(extendPoint1);
      bounds.extend(extendPoint2);
    }

    // Only do fitBounds if there are local hospitals.
    if (local_hospitals.length > 0) {
      google.maps.event.addListenerOnce(map, 'idle', function () {
        map.fitBounds(bounds);
      });
    } else {
      map.setZoom(10);
    }
  };

  /**
   * Load data based on chosen location id.
   *
   * Fetches Drupal content based on the assigned ID passed from the Popup.
   *
   * @param id
   *   The id assigned to the content.
   */
  Drupal.myNorthwell.loadData = function (id) {
    var $context = $('.support-my-northwell');
    var $cityWrapper = $('.card-group__my-city-wrapper', $context);
    var $cardWrapper = $('.card-group__card-wrapper', $context);
    var $cardGrid = $('.smart-grid', $cardWrapper);

    // Destory the slick slider because the data persists after ajax call.
    if ($cardGrid.hasClass('slick-initialized')) {
      $($cardGrid).slick('destroy');
    }

    $('.collapse', $context).collapse('toggle');
    $('p', $cityWrapper).remove();
    $cardGrid.empty();

    // Get JSON data from Foundation's drupal api.
    $.getJSON(Drupal.myNorthwell.determineEndpoint(id), function (data) {
      if (data.length !== 0) {
        // Update content accordingly.
        $('.card-group__my-city-wrapper span', $context).show();
        $('.card-group__location', $context).text(data.title);
        // Loop through results.
        $.each(data.content, function (index, value) {
          $cardGrid.append(Drupal.theme('myNorthwellCard', index, value));
        });
      } else {
        $('span', $cityWrapper).hide();
        $cityWrapper.prepend('<p>' + Drupal.t("I'm sorry, there is no data for this hospital.") + '</p>');
      }
    }).done(function () {
      $cardWrapper.show();
      $('#northwell-hospital-map').remove();
      // Initialize the slick slider with payload if viewing on small screen.
      if ($(window).width() <= 768 && !$cardGrid.is(':empty')) {
        Drupal.initSlickCarousel($('.card-group--my-northwell .smart-grid'));
      }
      Drupal.attachBehaviors();
    });
  };

  /**
   * Helper to determine what the API endpoint should be.
   *
   * @returns {string}
   *   A URL to request data from that's based on environment.
   */
  Drupal.myNorthwell.determineEndpoint = function (id) {
    // If pattern lab (local or outrigger), use the sample data.
    if (window.location.href.includes('watch-design.northwell.vm')) {
      return 'http://watch-design.northwell.vm:3050/source/_data/support/hospital-data.json';
    } else if (window.location.href.includes('localhost')) {
      return 'http://localhost:3050/source/_data/support/hospital-data.json';
    } else {
      return '/api/my-northwell/' + id;
    }
  };

  /**
   * Themes the map container.
   *
   * @returns {string}
   *   An HTML string for the map container.
   */
  Drupal.theme.myNorthwellContainer = function () {
    return '<div id="northwell-hospital-map"></div>';
  };

  /**
   * Themes the map popup/popover containing hospital info.
   *
   * @param hospital
   * @returns {string}
   *   An HTML string for the map popup.
   */
  Drupal.theme.myNorthwellPopup = function (hospital) {
    return '\n      <div class="support-my-northwell__popup">\n        <h5>' + hospital.title + '</h5>\n        <p>' + hospital.street_address + '<br>' + hospital.city + ', ' + hospital.state + ' ' + hospital.zip + '</p>\n        <a onClick="event.stopPropagation(); Drupal.myNorthwell.loadData(\'' + hospital.id + '\')" data-id="' + hospital.id + '" class="button--sm component-space--bottom-sm">' + Drupal.t('Choose') + '</a>\n      </div>';
  };

  /**
   * Themes each card containing factoids and or events for the chosen hospital.
   *
   * @param index
   * @param hospital
   * @returns {string}
   *   An HTML string for individual card markup.
   */
  Drupal.theme.myNorthwellCard = function (index, hospital) {
    var title_section = '';
    var cta_text = '';

    if (hospital.type === 'event') {
      var date = new Date(hospital.date);
      var month = date.toLocaleString('en-us', { month: 'short' });
      var day = date.getDate();
      var time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

      title_section = '\n        <div class="card__date-wrapper--my-northwell">\n          <div class="card__date-inner-wrapper--my-northwell">\n            <time datetime="' + hospital.date + '">\n              <span class="card__sub-head-date--my-northwell">\n                <span class="card__sub-head-month--my-northwell">' + month + '</span>\n                <span class="card__sub-head-day--my-northwell">' + day + '</span>\n              </span>\n              <span>\n                <i class="icon--clock typog-body" aria-hidden="true"></i>\n                <span class="card__sub-head-time--my-northwell typog-body"> ' + time + '</span>\n              </span>\n            </time>\n          </div>\n        </div>';
      // Set cta text to "View event" for events since users can't explicitly
      // set this value for event components.
      cta_text = 'View event';
    } else {
      title_section = '\n        <div class="card__title card__title--my-northwell">\n          <div class="typog-body">' + hospital.headline + '</div>\n        </div>';
      cta_text = hospital.cta.title;
    }

    // Need to alternate color.
    var color = '';
    if (index % 2 === 0) {
      color = 'blue-dark';
    } else {
      color = 'purple-dark';
    }
    var color_trigger = 'color-trigger--' + color;

    // Need to check for graphic.
    var graphic = '';
    var graphic_alt = '';
    if (hospital.graphic.sizes !== undefined) {
      graphic = hospital.graphic.sizes.default;
      graphic_alt = hospital.graphic.alt;
    }

    return '\n      <div class="card__card-wrapper card--my-northwell">\n        <div class="card card--stacked card--color-bg ' + color_trigger + '">\n          ' + title_section + '\n          <div class="card__media card__media--stacked">\n            <div class="card-media">\n              <img src="' + graphic + '" alt="' + graphic_alt + '">\n            </div>\n          </div>\n          <div class="card__content color-bg--switch style-alternate card__content--stacked">\n            <div class="card__summary typog-body">' + hospital.description + '</div>\n            <a href="' + hospital.cta.url + '" class="card__cta link--cta">' + cta_text + '</a>\n            <span class="notch--xs"></span>\n          </div>\n        </div>\n      </div>';
  };

  /* eslint-enable no-console, no-undef, no-unused-vars, func-names, max-len, object-shorthand */
})(jQuery, Drupal);
'use strict';

(function sponsorList($, Drupal) {
  Drupal.behaviors.support_list = {
    attach: function attach(context) {
      $('.support-sponsor__view-more', context).once('toggleSponsors').on('click', function toggleSponsors(e) {
        if ($(this).siblings('.support-sponsor__more-wrapper').hasClass('open')) {
          $(this).siblings('.support-sponsor__more-wrapper').removeClass('open');
          $(this).siblings('.support-sponsor__more-wrapper').slideUp('fast');
          $(this).text('View more');
        } else {
          $(this).siblings('.support-sponsor__more-wrapper').slideDown('normal');
          $(this).siblings('.support-sponsor__more-wrapper').addClass('open');
          $(this).text('View less');
        }
        e.preventDefault();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * nslij3-statics/js/paragraphs-item--tabbed-display.js
 */
(function tabbeddisplayScript($, Drupal) {
  Drupal.behaviors.tabbeddisplay = {
    attach: function attach(context) {
      var dot = function dot(str) {
        return String('.' + str);
      };

      var tabbed_display_component = 'tabbed-display';
      var $tabbed_display_components = $('.tabbed-display');
      // ideally we would pass in the parent element then get all nested
      // tabbed-displays under it - but here we are getting parent to
      // help with mobile methods
      var $tabbed_display_component_parent = $tabbed_display_components.first();
      var tabbed_display_ids = $tabbed_display_components.attr('id');
      var component_base_class = tabbed_display_component;
      var exclude_class = '.' + component_base_class + '__nav--plain';
      var callout_constant = '.' + component_base_class + '--mobile-callout';
      var list_item = '.' + component_base_class + '__nav-li';
      var list_item_link = '.' + component_base_class + '__nav-a';
      var tab_panel_wrap = '.' + component_base_class + '__displays';
      var tab_panel = component_base_class + '__display';
      var default_affix = '--default';
      var active_affix = '--active';
      var dragging_affix = '--dragging';
      var $doc = $(document);
      var $window = $(window);
      var activate_tab_event = 'tab-activated';
      var deactivate_tab_event = 'tab-deactivated';
      var drag_transition_duration = 300;
      var options = options || {};
      var _touchevents = void 0;

      if (typeof $.support.tests !== 'undefined') {
        _touchevents = $.support.tests.touchevents;
      } else {
        _touchevents = $('html').hasClass('touchevents');
      }

      // return the index of the element clicked
      // whether it is a tab or tab content
      var get_tab_index = function get_tab_index($el) {
        if ($el.is(list_item) || $el.is(dot(tab_panel))) {
          return $el.index();
        }
        return false;
      };

      // Foundation click event to trigger a tab and filter a view.
      $(context).find('.support a[href*="?tid"]').once('supportTabbedDisplay').each(function () {
        $(this).off('click').click(function triggerTabFilterView(event) {
          if (this.hash) {
            var hash = this.hash;
            var url = new URL(this.href);
            var arg = url.searchParams.get('tid');
            $('a[href="' + hash + '"]').click();
            var offsetHeader = $('.support-site-header').height();
            // Animate scroll position above the filters.
            $('html, body').stop().animate({ scrollTop: $(hash).offset().top - offsetHeader }, 500, "swing");
            var target = $('select[data-drupal-selector="edit-team"]');
            // Trigger staff view filter.
            $(target).val(arg).change();
          }
          event.preventDefault();
        });
      });

      // initialize the data object attached to the tabbed display
      // elements with the default tab components and their indexs
      $tabbed_display_components.each(function () {
        var $self = $(this);
        var $ul = $self.find('.tabbed-display__nav-list').first();
        var $default_li = $ul.find('.tabbed-display__nav-li--default');
        var component_id = $self.attr('id');
        var default_index = $default_li.index();
        options[component_id] = default_index;
        options.source = $default_li;
        options.tabbed_display = $self;
        options.tab = default_index;
        $self.data(options);
      });

      var get_active_tab = function get_active_tab() {
        return $(this).data('current-tab');
      };

      var is_active_tab = function is_active_tab(active_index, component_id) {
        var component_tab = Number($(this).data(component_id));
        return $(this).data(component_id) === active_index;
      };

      var deactivate_via_panel = function deactivate_via_panel(source) {
        // console.log('deactivate via panel');
        var $panel = $(this);

        $panel.parents(dot(tabbed_display_component)).trigger(deactivate_tab_event + dot(tabbed_display_component), {
          source: source,
          tab: get_tab_index($panel)
        });
      };

      var activate_via_panel = function activate_via_panel(source) {
        // console.log('activate via panel');
        var $panel = $(this);

        $panel.parents(dot(tabbed_display_component)).trigger(activate_tab_event + dot(tabbed_display_component), {
          source: source,
          tab: get_tab_index($panel)
        });
      };
      // Please do not mistaken this with activating a tab.
      var set_active_tab = function set_active_tab(active_index, component_id) {
        $(this).data(component_id, active_index);
      };

      // set the aria attributes on all the default selections
      $(list_item).attr('aria-selected', 'false').find('a').attr('aria-selected', 'false');
      $(list_item + default_affix).attr('aria-selected', 'true').find('a').attr('aria-selected', 'true');
      $(dot(tab_panel)).attr('aria-hidden', 'true');
      $(dot(tab_panel + default_affix)).attr('aria-hidden', 'false');
      // have left and right arrow keys shift focus among tab group when
      // container and list contents has focus
      $('.tabbed-display__nav-list', context).on('keydown', function (event) {
        var changeTabIndexBy = void 0;
        switch (event.keyCode) {
          case 37:
            changeTabIndexBy = -1;
            break;
          case 39:
            changeTabIndexBy = 1;
            break;
          default:
            return;
        }
        // TBD address accessibility after getting the tabs to work
        var currentTabIndex = get_active_tab.call($(event.currentTarget).closest(dot(tabbed_display_component)));
        var tabs = $(event.currentTarget).find('a');
        var newTabIndex = currentTabIndex + changeTabIndexBy;
        if (newTabIndex < 0) {
          newTabIndex = 0;
        }
        if (newTabIndex >= tabs.length) {
          newTabIndex = tabs.length - 1;
        }
        tabs.eq(newTabIndex).focus();
      });
      // !On tab click, Trigger tab activation
      $(list_item_link).on('click', function (e) {
        var $li = $(this).closest('li');
        var $tabbed_display = $li.closest(dot(tabbed_display_component));
        var tabbed_display = $tabbed_display.get(0);
        var tabbed_display_id = $tabbed_display.attr('id');
        var tab_index = get_tab_index.call(tabbed_display, $li);
        // Disable all this stuff for regular links
        if ($li.parents(exclude_class).length) {
          return true;
        }
        // prevent scrolling to the link, both are required
        e.stopPropagation();
        e.stopImmediatePropagation();
        // sample: {
        //  source: $li,
        //  tabbed_display: $tabbed_display,
        //  tab: tab_index,
        //  [tabbed_display_id]: tab_index
        // }
        options[tabbed_display_id] = tab_index;
        options.source = $li;
        options.tabbed_display = $tabbed_display;
        options.tab = tab_index;
        // do nothing if the current active tab is trying to be activated again;
        if (!$li.hasClass('tabbed-display__nav-li--active') && !$li.hasClass('tabbed-display__nav-li--default')) {
          $tabbed_display.trigger(activate_tab_event, options);
        }
        if (nwdsi.isMobile()) {
          // let firstClick = true;
          var is_nested = $(this).hasClass('tabbed-display__nav-a--nested-text');

          if (is_nested) {
            $tabbed_display_component_parent.find(dot(tab_panel + active_affix)).first().addClass('kill-after');
            $(this).closest(dot(component_base_class)).css('position', 'fixed');
            $(this).closest('.tabbed-display__nav-list').hide();
          }
        }
        return false; // prevent scrolling to the link
      });

      // !On '< Back' "link" click, Trigger tab de-activation
      if (nwdsi.isMobile()) {
        $('ul').find(' > li' + list_item + default_affix).removeClass('tabbed-display__nav-li' + default_affix);
        $(callout_constant + ' ' + dot(tab_panel)).on('click' + dot(component_base_class), function (e) {
          // e.stopPropagation();
          // e.stopImmediatePropagation();
          var $target = $(e.target);
          var tabbed_display_id = $(this).closest(dot(tabbed_display_component)).attr('id');
          if ($target.is(dot(tab_panel) + active_affix)) {
            //console.log('active panel has been clicked directly');
            $('#' + tabbed_display_id).trigger(deactivate_tab_event + dot(tabbed_display_component), {
              source: this,
              tab: get_tab_index($target)
            });
          }
        });
      }

      // A default tab + panel pair is set in the mark up via --default affix classes.
      // Remove them once a tab + panel pair is otherwise activated.
      var unset_default_classes = function unset_default_classes(component_id) {
        var $tabbed_display = $(this);
        var $tab_by_id = $('#' + component_id);
        if ($tabbed_display.data(component_id + 'removed-default') !== true) {
          $tab_by_id.find('ul').first().find(' > li' + list_item + default_affix).toggleClass('tabbed-display__nav-li' + default_affix, false);
          $tab_by_id.find(' > ' + tab_panel_wrap + ' > ' + dot(tab_panel) + default_affix).attr('aria-hidden', 'true').removeClass('kill-after');
          $tab_by_id.find(' > ' + tab_panel_wrap + ' > ' + dot(tab_panel) + default_affix).toggleClass(tab_panel + default_affix, false);
          $tab_by_id.find(' > ' + tab_panel_wrap + ' > ' + dot(tab_panel) + default_affix).hide();
          $tabbed_display.data(component_id + 'removed-default', true);
        }
      };
      var unset_active_classes = function unset_active_classes(component_id) {
        var $tabbed_display = $(this);
        var $tab_by_id = $('#' + component_id);
        var $active_list_item = $tab_by_id.find('ul').first().find('> li.tabbed-display__nav-li' + active_affix);
        var $active_tab_panels = $('#' + component_id + ' > ' + tab_panel_wrap + ' > ' + dot(tab_panel) + active_affix);
        $active_tab_panels.find('a').attr('tabindex', -1);
        $active_tab_panels.attr('aria-hidden', 'true');
        $active_tab_panels.toggleClass(tab_panel + active_affix, false);
        //$('body').removeClass('tabbed-display-panel--open');
        if (nwdsi.isMobile()) {
          // We need to do something different here on mobile so that the proper
          // subtab closes.
          // if ($active_tab_panels.length > 0) {
          //   // console.log($active_tab_panels);
          //   const $active_subtabs = $active_tab_panels.find('tabbed-display__display--active');
          //   console.log($active_subtabs);
          // }
        }
        if (!nwdsi.isMobile()) {
          $active_tab_panels.hide();
          $active_list_item.attr('aria-selected', 'false').find('a').attr('aria-selected', 'false').attr('tabindex', -1);
          $active_list_item.toggleClass('tabbed-display__nav-li' + active_affix, false);
        }
      };
      var set_active_classes = function set_active_classes(tab_index, component_id) {
        var $tab_by_id = $('#' + component_id);
        var $activating_list_item = $tab_by_id.find('ul').first().find(' > li').eq(tab_index);
        var $activating_tab_panel = $('#' + component_id + ' > ' + tab_panel_wrap + ' > ' + dot(tab_panel)).eq(tab_index);
        $activating_tab_panel.toggleClass(tab_panel + active_affix, true);
        $activating_tab_panel.attr('aria-hidden', 'false');
        $activating_tab_panel.find('a').attr('tabindex', 0);
        // $('body').addClass('tabbed-display-panel--open');
        if (!nwdsi.isMobile()) {
          $activating_tab_panel.fadeIn();
          $activating_list_item.toggleClass('tabbed-display__nav-li' + active_affix, true);
          $activating_list_item.attr('aria-selected', 'true').find('a').attr('aria-selected', 'true').attr('tabindex', 0);
        }
        if (nwdsi.isMobile()) {
          // var $htmlbody = $("html, body");
          // console.log("b4");
          // console.log($("html").offset().top);
          // console.log($("body").offset().top);
          // $htmlbody.animate({scrollTop:0}, '500');
          // console.log("aftr");
          // console.log($("html").offset().top);
          // console.log($("body").offset().top);
          // $('html,body').animate(0, 0);
          // setTimeout(window.scrollTo(0, 0),100);
        }
      };

      // !Tab activation trigger
      $doc.on(activate_tab_event + dot(tabbed_display_component), dot(tabbed_display_component), function (e, data) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        var $li = void 0;
        var $this_tabbed_display = data && data.tabbed_display ? data.tabbed_display : $(this);
        // TBD get the tabbed display id but make sure we need it here
        var tabbed_display_id = $this_tabbed_display.attr('id');

        if (data && data.source && data.source instanceof Node) {
          $li = $(data.source);
        } else if (data && typeof data[tabbed_display_id] !== 'undefined') {
          $li = $this_tabbed_display.find(list_item).not(list_item + ' ' + list_item).eq(data[tabbed_display_id]);
        } else {
          $li = $this_tabbed_display.find(list_item).first();
        }
        var active_index = get_tab_index.call(this, $li, tabbed_display_id);

        // Remove --default classes
        unset_default_classes.call(this, tabbed_display_id);

        // Remove concurrent --active classes
        unset_active_classes.call(this, tabbed_display_id);

        // Apply --active class
        set_active_classes.call(this, active_index, tabbed_display_id);

        // Set current tab
        set_active_tab.call(this, active_index, tabbed_display_id);
      });

      $doc.on(deactivate_tab_event + dot(tabbed_display_component), dot(tabbed_display_component), function (e, data) {
        // console.log('tab activated: ', e, data);
        e.stopPropagation();
        e.stopImmediatePropagation();

        var $panel = void 0;
        var $this_tabbed_display = data && data.tabbed_display ? data.tabbed_display : $(this);
        var this_tabbed_display_id = $this_tabbed_display.attr('id');
        if (data) {
          if (typeof data[this_tabbed_display_id] !== 'undefined') {
            $panel = $(this).find(dot(tab_panel)).eq(data[this_tabbed_display_id]);
          } else if (data.source && data.source instanceof Node) {
            $panel = $(data.source);
          }
        }
        if (!$panel) {
          return;
        }

        // remove fixed style from mobile nested tab
        var is_nested = $this_tabbed_display.hasClass('tabbed-display__nested-text');
        if (is_nested) {
          var $ul = $('#' + this_tabbed_display_id).find('> .tabbed-display__nav .tabbed-display__nav-list');
          $tabbed_display_component_parent.find(dot(tab_panel + active_affix)).first().removeClass('kill-after');
          $ul.show();
          $this_tabbed_display.css('position', 'static');
        }

        // unset all when this is kind of only meant to unset one? uh...
        // console.log('unset classes: ' + this_tabbed_display_id);
        unset_active_classes.call(this, this_tabbed_display_id);
        set_active_tab.call(this, null, this_tabbed_display_id);
      });
      // Activation should only happen based on some kind of actual event.
      // Either way, this model of activating Tab #1 to provide a default had
      // worked on desktop but with mobile it is a problem.
      //$tabbed_displays.trigger('tab-activated');

      // !Callout drag/swipe events
      if (nwdsi.isMobile()) {

        var $body = $('body');

        //const fix_mobile_scroll_timer = 0;
        $doc.on(activate_tab_event + dot(tabbed_display_component), dot(tabbed_display_component), function (e, data) {
          // prevent scrolling to the link, both are required
          e.stopPropagation();
          e.stopImmediatePropagation();
          $body.toggleClass('tabbed-display--mobile-callout--open', true);
        });

        $doc.on(deactivate_tab_event + dot(tabbed_display_component), dot(tabbed_display_component), function (e, data) {
          // prevent scrolling to the link, both are required
          e.stopPropagation();
          e.stopImmediatePropagation();
          $body.toggleClass('tabbed-display--mobile-callout--open', false);
        });
        // end mobile callout additions
      }

      // code for dropdowns on the leadership profile tabs. used in conjunction with code in _tabbed-display--nested-dynamic.twig
      var radios = document.getElementsByName('rd');
      var currentRadio;
      var x = 0;
      for (x = 0; x < radios.length; x++) {
        radios[x].onclick = function () {
          if (currentRadio == this) {
            this.checked = false;
            currentRadio = null;
          } else {
            currentRadio = this;
          }
        };
      }
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is based from:
 * nslij3-statics/js/paragraphs-item--timeline.js
 */
(function timelineScript($, Drupal) {
  Drupal.behaviors.timeline = {
    attach: function attach(context) {
      var timeline = $('.timeline', context);
      var timelineNav = timeline.parents('.timeline__wrapper').find('.timeline__navigation');
      var timelineSlider = timeline.parents('.timeline__wrapper').find('.timeline__slider');
      var timelineNavItems = timelineNav.find('span');

      function debounce(func, wait, immediate) {
        var timeout = void 0;
        return function () {
          var env = this;
          var args = arguments;
          var later = function later() {
            timeout = null;
            if (!immediate) func.apply(env, args);
          };
          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(env, args);
        };
      }

      timeline.slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        appendArrows: '.timeline__overflow',
        nextArrow: '<a class="timeline__carousel-btn btn--next icon--angle-thin" role="button" aria-label="Next"></a>',
        prevArrow: '<a class="timeline__carousel-btn btn--prev icon--angle-thin" role="button" aria-label="Previous"></a>',
        responsive: [{
          breakpoint: 767,
          settings: {
            arrows: false
          }
        }]
      });

      timelineNavItems.on('click', function () {
        timeline.slick('slickGoTo', parseInt($(this).attr('data-itemindex'), 10));
      });

      var debounceSlider = debounce(function (event, ui) {
        timeline.slick('slickGoTo', ui.value);
      }, 100);

      timelineSlider.slider({
        min: 0,
        max: timelineNavItems.length - 1,
        slide: debounceSlider
      });

      // Update the navigation bar after slide change
      timeline.on('afterChange', function (event, slick, currentSlide) {
        timelineNavItems.removeClass('selected');
        timelineNavItems.eq(currentSlide).addClass('selected');
        timelineSlider.slider('value', currentSlide);
      });

      // Initialize that the first slide is active
      timelineNavItems.eq(0).addClass('selected');
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/* global window */
(function tabbedsearchScript($, Drupal) {
  Drupal.behaviors.tabbedsearch = {
    attach: function attach(context) {
      $('.tabbed-search li > a', context).on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');
      }).on('shown.bs.tab', function (e) {
        // build up to auto focus
        var $tab_link = $(e.target);

        // copy tab.js
        var selector = $tab_link.data('target');

        if (!selector) {
          selector = $tab_link.attr('href');
          selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $panel = $(selector);

        //console.log('panel!!', $panel, $panel.is(':visible'));

        if ($panel.length) {
          //console.log('auto focus!');
          window.nwdsi.focus_first_field($panel.find('.search-form:not(.hidden)'));
        }
      });

      var $selectOption = $('.tabbed-header__select > select');
      var $selectTabs = $('.tabbed-search li a');

      $($selectOption).on('change', function (e) {
        $($selectTabs).eq($(this).val()).tab('show');
      });

      $('.tabbed-search--mobile .tabbed-search__mobile-button', context).on('click', function (e) {
        e.preventDefault();
        $('html, body').scrollTop(0);
        $('.site-nav__toggle-search').click();
      });

      // This used to be in navigation.js, have moved it here. Tabbed search isn't
      // actually used in the search nav, however. So if `context` here one day
      // becomes actually limited to instances of tabbed search, we'll have to figure
      // where to put or duplicate this.
      //
      // It also appears in search forms in dynamic list pages, see Find a doctor example.
      //

      // Swap forms on click
      $('.tabs-text__swap-form', context).on('click', function (e) {
        e.preventDefault();

        var $search_form = $(this).parents('.search-form');
        var tab_item_selector = '.tabs-text__item';

        // simulate focus_first_field to figure out whether to focus a field or the button
        var $root = $search_form.toggleClass('hidden', true).siblings('.search-form').first().toggleClass('hidden', false);
        var $input = $root.find('select, input').not(':hidden, .tt-hint').first();

        if ($input.length && !$input.is('.select2-hidden-accessible')) {
          // below function is to auto focus
          window.nwdsi.focus_first_field($root);
        } else {
          var activated_tab_index = $search_form.find(tab_item_selector).index(this);
          $root.find(tab_item_selector).eq(activated_tab_index).focus();
        }
      });

      if ($('.interstitial-fad').length) {
        var urlEdit = function urlEdit(location) {
          $('a.button-card__link').each(function () {
            var $this = $(this);
            var _href = $this.attr('href');
            $this.attr('href', _href + '&location=' + location);
          });
        };

        //locationiq ajax function that is run for new lat + lon that uses reverse geocode to get address data.


        var locationiq = function locationiq(lat, lon) {
          var iqKey = ds.locationiq.token;
          var ds_url = ds.locationiq.url;
          var iqURL = ds_url + '?key=' + iqKey + '&lat=' + lat + '&lon=' + lon + '&format=json';

          var xhr = new XMLHttpRequest();

          xhr.open('GET', iqURL, true);

          xhr.onload = function () {
            if (this.status == 200) {
              var locationData = JSON.parse(this.responseText);
              var city = locationData.address.quarter ? locationData.address.quarter : locationData.address.neighbourhood ? locationData.address.neighbourhood : locationData.address.city;
              var state = locationData.address.state;
              var zip = locationData.address.postcode;

              localStorage.setItem('zip', zip);
              localStorage.setItem('city', city);
              localStorage.setItem('state', state);

              fullPlace = localStorage.city + ', ' + localStorage.state + ' ' + localStorage.zip;
              localStorage.setItem('address', fullPlace);
              zipField.attr('value', fullPlace);
              urlEdit(localStorage.address);
              $('.form-control').addClass('border-animate');
            }
          };
          xhr.send();
        };

        //the initial geolocation function. This will retrieve the users latitude + longitude


        //setting variables
        var zipField = $('#search-doctors-zip-interstitial');
        var fullPlace = '';
        var longitude = '';
        var latitude = '';
        var ds = drupalSettings;

        if ('geolocation' in navigator) {
          // check if geolocation is supported/enabled on current browser
          navigator.geolocation.getCurrentPosition(function success(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            //a quick check to see if the latitude and longitude has changed from local storage before the locationiq query runs
            if (localStorage.latitude != latitude || localStorage.longitude != longitude) {
              locationiq(latitude, longitude);
            } else {
              // fullPlace = localStorage.city+', '+localStorage.state+' '+localStorage.zip;
              if (localStorage.address) {
                zipField.attr('value', localStorage.address);
                urlEdit(localStorage.address);
              } else {}
            }
            localStorage.setItem('latitude', latitude);
            localStorage.setItem('longitude', longitude);
          }, function error(error_message) {
            // for when getting location results in an error
            // localStorage.setItem("zip", 11040);
            // console.log("geoloco error");
            // zipField.attr("value", "New Hyde Park, NY 11040");
            // $(".form-control").addClass("border-animate");
          });
        } else {
          // geolocation is not supported
          // get your location some other way
          // console.log("no geoloco");
          // zipField.attr("value", "New Hyde Park, NY 11040");
        }
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function waittimegroupScript($, Drupal, settings) {
  Drupal.behaviors.waitTimeGroup = {
    attach: function attach(context, settings) {
      var This = this;

      This.$waitTimeGroup = $('.wait-time-group', context);
      if (!This.$waitTimeGroup.length) {
        return false;
      }

      This.$waitTimeGroup.find('.wait-time-group__inner').once('waitTimeGroup').each(function () {
        var $carousel = $(this);

        // Update the feed type to "ed" in order to show the "Emergency care" tab between 12:00 am and 8:00 am.
        var date = new Date();
        var hour = date.getHours();
        if (hour >= 0 && hour < 8) {
          $carousel.attr('data-feed-type', 'ed');
          $('.toggle-switch a', This.$waitTimeGroup).removeClass('active');
          $('.toggle-switch a[data-feed-type="ed"]', This.$waitTimeGroup).addClass('active');
        }

        // Init the carousel on page loaded    
        This.renderCarousel($carousel);

        // Auto refresh the carousel in a specific periiod
        var refresh = $carousel.attr('data-refresh');
        window.setInterval(function (context, settings) {
          This.renderCarousel($carousel);
        }, refresh * 1000);

        // The 'Urgent care' and 'Emergency department' switcher buttons
        $('.toggle-switch a', This.$waitTimeGroup).on('click', function () {
          // Do nothing if the link is disabled
          if ($(this).hasClass('disabled')) {
            return false;
          }

          // Update the 'active' class
          $('.toggle-switch a', This.$waitTimeGroup).removeClass('active');
          $(this).addClass('active');

          // Update the feed type
          $carousel.attr('data-feed-type', $(this).data('feed-type'));

          // Rerender the carousel
          This.renderCarousel($carousel);
        });

        // The 'Use my location' button 
        $('#wait-use-geo-for-carousel', This.$waitTimeGroup).on('click', function () {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function success(position) {
              // Get the user's latitude and longitude
              var latitude = position.coords.latitude;
              var longitude = position.coords.longitude;
              localStorage.setItem('latitude', latitude);
              localStorage.setItem('longitude', longitude);

              // Rerender the carousel
              This.renderCarousel($carousel);
            }, function error(error_message) {
              console.log(error_message);
            });
          }
        });
      });
    },
    renderCarousel: function renderCarousel($carousel) {
      // Read parameters for the API call.
      var limit = $carousel.attr('data-limit');
      limit = limit || 30;
      var feedType = $carousel.attr('data-feed-type');
      feedType = feedType === 'ed' ? 'ed' : 'uc';
      var useLocation = $carousel.attr('data-use-location');
      var radius = $carousel.attr('data-radius');
      radius = radius || 5000;
      var sort = $carousel.attr('data-sort');
      sort = sort || 'name_asc';

      // Prepare the URL parameters
      var params = [];
      params.push('grouped=1');
      params.push('hide_na=1');
      params.push('type=' + feedType);
      params.push('limit=' + limit);
      params.push('radius=' + radius);
      if (useLocation) {
        var latitude = localStorage.getItem('latitude');
        var longitude = localStorage.getItem('longitude');
        if (latitude && longitude) {
          params.push('latitude=' + latitude);
          params.push('longitude=' + longitude);
          sort = 'distance_asc';

          $('#wait-use-geo-for-carousel > i').attr('class', 'fal fa-sync');
          $('#wait-use-geo-for-carousel > .txt').text('Reset my location');
        } else {
          $('#wait-use-geo-for-carousel > i').attr('class', 'fal fa-location-dot');
          $('#wait-use-geo-for-carousel > .txt').text('Use my location');
        }
      }
      params.push('sort=' + sort);

      // Make the Ajax call into the API.
      var waitTimeApiUrl = drupalSettings.api.url ? drupalSettings.api.url : 'https://api.northwell.edu/v1/wait-times/all?';
      $.ajax({
        url: waitTimeApiUrl + '/wait-times/all?' + params.join('&'),
        type: 'GET',
        success: function success(data) {
          if (data.code == '200') {
            // If no any 'Urgent care' items available, then show the 'Emergency care' tab by default.
            if (data.response.wait_times.all_uc_are_closed || data.response.wait_times.open.length === 0) {
              // Disable the 'Urgent care' tab
              $carousel.parent('.wait-time-group').find('.toggle-switch a[data-feed-type="uc"]').addClass('disabled');

              // Switch to the 'Emergency care' tab
              if (data.query.type === 'uc') {
                $carousel.parent('.wait-time-group').find('.toggle-switch a[data-feed-type="ed"]').trigger('click');
                return;
              }
            }

            // Update the wait time items
            var waitTimeItems = {
              open: data.response.wait_times.open,
              closed: data.response.wait_times.closed,
              unavailable: data.response.wait_times.unavailable,
              total: data.response.wait_times.total
            };
            $carousel.hide().html(Drupal.behaviors.waitTimeGroup.templateResult(waitTimeItems)).fadeIn(500);

            // Destroy the carousel
            if ($carousel.hasClass('slick-initialized')) {
              $carousel.slick('removeSlide', null, null, true);
              $carousel.slick('unslick');
            }
            // Rebuild the carousel
            var carouselOptions = {
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: true,
              prevArrow: '<i class="wait-time-group__carousel-btn btn--prev icon--angle-thin"></i>',
              nextArrow: '<i class="wait-time-group__carousel-btn btn--next icon--angle-thin"></i>',
              mobileFirst: true,
              accessibility: true,
              useCSS: false,
              useTransform: true,
              respondTo: 'window',
              infinite: false,
              dots: false,
              autoplay: false,
              autoplaySpeed: 3000,
              adaptiveHeight: true,
              responsive: [{
                breakpoint: nwdsi.settings.breakpoints.sm,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 2,
                  adaptiveHeight: true
                }
              }, {
                breakpoint: nwdsi.settings.breakpoints.md,
                settings: {
                  slidesToShow: 3,
                  slidesToScroll: 3,
                  adaptiveHeight: true
                }
              }]
            };
            $carousel.slick(carouselOptions);
            $carousel.slick('refresh');
            // Back to the first slide
            $carousel.slick('slickGoTo', 0);
          }
        },
        error: function error(e) {
          console.log(e.message);
        }
      });
    },
    templateResult: function templateResult(items) {
      var output = [];
      items.open.forEach(function (item, index) {
        output.push('<div class="wait-time-group__unit">');
        output.push('<div class="wait-time-group__time">');

        output.push('<div class="wait-time">');
        output.push('<span class="wait-time__numeric">' + item.average_wait_time_string.replace(/[^0-9+]/g, '') + '</span><span class="wait-time__unit">min</span>');
        output.push('</div>');

        output.push('<div class="wait-time-group__link">');
        output.push('<div class="name"><a href="' + item.website + '" aria-label="" tabindex="0" target="_blank">' + item.name + '</a></div>');
        var subtitle = '';
        switch (item.type) {
          case 'uc':
            subtitle = 'Northwell Health - GoHealth Urgent Care Center';
            break;
          case 'ed':
            subtitle = 'Northwell Health';
            break;
          case 'lab':
            subtitle = 'Patient Service Center';
            break;
        }
        output.push('<div class="subtitle">' + subtitle + '</div>');
        output.push('</div>');

        output.push('</div>');
        output.push('</div>');
      });

      return output.join('');
    }
  };
})(jQuery, Drupal, drupalSettings);
'use strict';

(function waittimesfullwidthScript($, Drupal) {
  Drupal.behaviors.waittimesfullwidth = {
    attach: function attach(context, settings) {
      if (!$('.wait-times-full-width').length) return;

      var current_type = $('.active-times').attr('data-type');

      //GEOLOCATION code
      //setting variables
      var zipField = $('#wait-times-zip');
      var fullPlace = '';
      var longitude = '';
      var latitude = '';
      var ds = drupalSettings;

      //locationiq ajax function that is run for new lat + lon that uses reverse geocode to get address data.
      function locationiq(lat, lon) {
        var iqKey = ds.locationiq.token;
        var ds_url = ds.locationiq.url;
        var iqURL = ds_url + '?key=' + iqKey + '&lat=' + lat + '&lon=' + lon + '&format=json';

        var xhr = new XMLHttpRequest();

        xhr.open('GET', iqURL, true);

        xhr.onload = function () {
          if (this.status == 200) {
            var locationData = JSON.parse(this.responseText);
            var city = locationData.address.quarter ? locationData.address.quarter : locationData.address.neighbourhood ? locationData.address.neighbourhood : locationData.address.city;
            var state = locationData.address.state;
            var zip = locationData.address.postcode;

            localStorage.setItem('zip', zip);
            localStorage.setItem('city', city);
            localStorage.setItem('state', state);

            fullPlace = localStorage.city + ', ' + localStorage.state + ' ' + localStorage.zip;
            localStorage.setItem('address', fullPlace);
            zipField.attr('value', zip);
          }
        };
        xhr.send();
      }

      document.getElementById('wait-use-geo').onclick = function useGeo() {
        //the initial geolocation function. This will retrieve the users latitude + longitude
        if ('geolocation' in navigator) {
          // check if geolocation is supported/enabled on current browser
          navigator.geolocation.getCurrentPosition(function success(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            //a quick check to see if the latitude and longitude has changed from local storage before the locationiq query runs
            if (localStorage.latitude != latitude || localStorage.longitude != longitude) {
              locationiq(latitude, longitude);
            } else {
              // fullPlace = localStorage.city+', '+localStorage.state+' '+localStorage.zip;
              if (zipField) {
                zipField.attr('value', localStorage.zip);
                Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings);
                // Switch back to first tab on zip code submission
                $('.wait-time-fw > .wait-time-fw__inner').slick('slickGoTo', 0);
              } else {}
            }
            localStorage.setItem('latitude', latitude);
            localStorage.setItem('longitude', longitude);
          }, function error(error_message) {
            console.log(error_message);
          });
        } else {
          // geolocation is not supported
          // get your location some other way
          // console.log("no geoloco");
          // zipField.attr("value", "New Hyde Park, NY 11040");
        }
      }; //end of geolocation code

      document.getElementById('wt-icon-search').onclick = function () {
        var zipVal = document.getElementById('wait-times-zip').value;
        if (typeof zipVal !== 'undefined' && zipVal !== '' && zipVal !== null) {
          localStorage.setItem('zip', zipVal);
          Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings);
          // Switch back to first tab on zip code submission
          $('.wait-time-fw > .wait-time-fw__inner').slick('slickGoTo', 0);
        }
      };

      document.getElementById('wait-times-zip').onkeyup = function (e) {
        if (!e) e = window.event;
        var keyCode = e.code || e.key;
        if (keyCode == 'Enter') {
          var zipVal = e.target.value;
          if (typeof zipVal !== 'undefined' && zipVal !== '' && zipVal !== null) {
            localStorage.setItem('zip', zipVal);
            Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings);
            // Switch back to first tab on zip code submission
            $('.wait-time-fw > .wait-time-fw__inner').slick('slickGoTo', 0);
          }
          return false;
        }
      };

      // Init
      Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings);

      // Get the refresh time and set interval
      var refresh = $('.wait-time-fw > .wait-time-fw__inner', context).attr('data-refresh');
      if (!refresh) return;
      window.setInterval(function (context, settings) {
        Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings);
      }, refresh * 1000);

      //this is a function that triggers after slick change and is responsible for looping back to the first slide
      $('.wait-time-fw > .wait-time-fw__inner', context).on('afterChange', function (event, slick, currentSlide, nextSlide) {
        //we check for -1 because 1 slide show per scroll
        if (slick.slideCount - 1 == currentSlide) {
          setTimeout(function () {
            $('.wait-time-fw > .wait-time-fw__inner', context).slick('slickGoTo', 0);
          }, 6000); //6000 because 6 seconds is the interval set by UX
        }
      });

      //toggle switch code
      $(function () {
        $('.switch-btn').on('click', function () {
          $('.switch-btn').toggleClass('active-times');
          current_type = $('.active-times').attr('data-type');
          var ed_link = $('#ed').attr('data-url');
          var uc_link = $('#uc').attr('data-url');

          if (current_type == 'uc') {
            $('#wt-title').text('Urgent care wait times');
            $('#all_times').attr('href', uc_link);
          } else {
            $('#wt-title').text('Emergency department wait times');
            $('#all_times').attr('href', ed_link);
          }

          //resetting the slick options here
          var content_list_carousel_options = {
            slidesToShow: 1,
            slidesToScroll: 1,
            rows: 4,
            arrows: false,
            mobileFirst: true,
            accessibility: true,
            useCSS: false,
            useTransform: true,
            respondTo: 'window',
            infinite: false,
            vertical: false,
            dots: true,
            autoplay: true,
            autoplaySpeed: 6000,
            verticalSwiping: false
          };

          //the order here is very important. We first destroy the old slider and remove slides. Then fetch data, then rebuild the new slider with fresh data.
          $('.wait-time-fw > .wait-time-fw__inner', context).slick('unslick'); //destroy
          $('.wait-time-fw > .wait-time-fw__inner', context).slick('slickRemove', null, null, true); //remove all slides, prevents dupes

          Drupal.behaviors.waittimesfullwidth.fetch_data(context, settings); //refetching data on type change
          $('.wait-time-fw > .wait-time-fw__inner', context).slick(content_list_carousel_options); //rebuild slider
          $('.wait-time-fw > .wait-time-fw__inner', context).slick('slickGoTo', 0); //go to first slide
        });
      });
    },
    fetch_data: function fetch_data(context, settings) {
      // Load all the wait time groups in the context.
      var $wait_time_groups = $('.wait-time-fw', context);
      if ($wait_time_groups.length) {
        var wt_api_url = drupalSettings.api.url ? drupalSettings.api.url : 'https://api.northwell.edu/v1';
        // Loop throught each wait time group present.
        $wait_time_groups.children('.wait-time-fw__inner').each(function (i, waittimesfullwidth) {
          var $wait_time_group = $(waittimesfullwidth);
          if (!$wait_time_group.length) {
            return;
          }

          var type = $('.active-times').attr('data-type');

          // Read parameters for the API call.
          var limit = $wait_time_group.attr('data-limit');
          var feed_type = type;
          //TODO assign the location from the geo variable
          var use_location = true;
          var zipcode = localStorage.getItem('zip');
          var sort = $wait_time_group.attr('data-sort');

          // Prepare the URL parameters
          var params = [];
          if (limit) {
            // We cannot apply a limit since it has a conflict with on open/close locations
            // params.push('limit=' + limit);
          }
          if (use_location) {
            if (zipcode) {
              params.push('zipcode=' + zipcode);
            }
            params.push('radius=' + 5000);
          }
          if (feed_type !== 'all') {
            params.push('type=' + feed_type);
          }
          if (sort !== 'average_wait_time_asc') {
            params.push('sort=' + sort);
          }

          // Temp Data cause endpoint broke
          var tempData =
          // Make the Ajax call into the API.
          // @TODO : Make the URL configurable
          $.ajax({
            url: wt_api_url + '/wait-times/all?grouped=0&' + params.join('&'),
            type: 'GET',
            success: function success(data) {
              if (data.code == '200') {
                // Facility waiting time data
                var facility_data = {
                  open_facilities: data.response.wait_times.open,
                  all_facilities: data.response.wait_times.all,
                  closed_facilities: data.response.wait_times.closed,
                  unavailable_facilities: data.response.wait_times.unavailable,
                  total: data.response.wait_times.total
                };

                // Fill the wait time data.
                for (var j = 0; j < limit; j++) {
                  var $block = $('div[data-position="' + (j + 1) + '"]', context);
                  var facility_wait_time_data = facility_data.all_facilities[j];
                  Drupal.behaviors.waittimesfullwidth.update_wait_time($block, facility_wait_time_data);
                }

                // Hide the facility wait time block if nothing or less than requested returned
                if (facility_data.total < limit) {
                  var i = limit;
                  for (; i > facility_data.total; i--) {
                    var _$block = $('div[data-position="' + i + '"]', context);
                    _$block.hide();
                  }
                }

                var content_list_carousel_options = {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  rows: 4,
                  arrows: false,
                  mobileFirst: true,
                  accessibility: true,
                  useCSS: false,
                  useTransform: true,
                  respondTo: 'window',
                  infinite: false,
                  vertical: false,
                  dots: true,
                  autoplay: true,
                  autoplaySpeed: 6000,
                  verticalSwiping: false
                };
                var $carousel = $('.wait-time-fw > .wait-time-fw__inner', context);
                $carousel.not('.slick-initialized').slick(content_list_carousel_options);
              }
            },
            error: function error(e) {
              console.log(e.message);
            }
          });
        });
      }
    },
    update_wait_time: function update_wait_time($block, facility_wait_time_data) {
      // Fade out on receiving data
      $block.fadeOut(500, function () {
        // Update waiting text eg "5 min"
        var wait_time_string = '';

        if (facility_wait_time_data.status === 'closed') {
          wait_time_string = 'Closed';
        } else if (facility_wait_time_data.average_wait_time_string === 'n/a') {
          wait_time_string = 'Unavailable';
        } else {
          wait_time_string = facility_wait_time_data.average_wait_time_string;
        }
        $block.find('.wait-time').html(wait_time_string.replace(/(\d+)/, '<span class="wait-time__numeric">$1</span>'));

        // Update link href, target, and content
        var $wait_time_link = $block.find('.wait-time-fw__link a');
        $wait_time_link.attr('href', facility_wait_time_data.website);
        if (facility_wait_time_data.type) {
          $wait_time_link.attr('target', '_blank');
        } else {
          $wait_time_link.removeAttr('target');
        }
        //if its an urgent care, we add the span for generic urgent care copy in
        $wait_time_link.html(facility_wait_time_data.name + (facility_wait_time_data.type == 'uc' ? '<span class="uc-name">Northwell Health-GoHealth Urgent Care Center</span>' : ''));
        // Fade In the block
        $block.fadeIn(500);
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/**
 * This is an Immediately Invoked Function Expression (IIFE) that creates a ticker animation for a set of statistics.
 * It leverages jQuery and Drupal.
 *
 * @param {Object} $ - The jQuery object.
 * @param {Object} Drupal - The Drupal object.
 */
(function xlStatTicker($, Drupal) {
  // Select all elements with the class 'xl-stat-ticker'
  var xlStats = document.querySelectorAll('.xl-stat-ticker');

  /**
   * This function formats a number by adding commas as thousand separators.
   *
   * @param {string} input - The number to format as a string.
   * @returns {string} - The formatted number as a string.
   */
  var STEPS = 100;
  var ANIMATION_DURATION = 500;
  var DECIMAL_PLACES = 3;

  var formatNumber = function formatNumber(input) {
    var num = parseFloat(input);
    if (isNaN(num)) {
      throw new Error('Invalid input');
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  /**
   * This function animates the statistics ticker.
   *
   * @param {Object} xlStat - The statistic to animate.
   * @param {boolean} shouldAnimate - A flag to determine if the animation should occur.
   */
  var animateXlStat = async function animateXlStat(xlStat) {
    var shouldAnimate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var xlStatNumber = xlStat.querySelector('.xl-stat__stat');
    // The number we want to animate to
    var numberTarget = xlStat.dataset.statNumber;
    // The number we will increment with
    var incrementedNumber = void 0;
    // The number of decimals we want to show to keep the animation consistent
    var providedTargetDecimals = void 0;

    // If the number target isn't defined or not a number do not attempt to animate it
    if (isNaN(numberTarget) || numberTarget === '' || numberTarget === undefined) return;

    // Convert the string to a number
    numberTarget = parseFloat(numberTarget);

    // Determine the increment and store the current number
    var increment = numberTarget / STEPS;
    var currentNumber = xlStatNumber.innerText ? xlStatNumber.innerText : 0;

    // Check if the number provided contains decimals and if so track how many decimals where provided
    var isDecimal = numberTarget !== Math.floor(numberTarget);
    providedTargetDecimals = isDecimal === true ? nwdsi.countDecimals(numberTarget) : 0;

    var animate = function animate(timestamp) {
      if (!xlStat.start) xlStat.start = timestamp;
      var progress = timestamp - xlStat.start;
      var fraction = Math.min(progress / ANIMATION_DURATION, 1);
      incrementedNumber = currentNumber + increment * fraction;

      if (incrementedNumber < numberTarget) {
        xlStatNumber.innerText = formatNumber(isDecimal ? incrementedNumber.toFixed(providedTargetDecimals) : Math.round(incrementedNumber));
        currentNumber = incrementedNumber;
        requestAnimationFrame(animate);
      } else {
        xlStatNumber.innerText = formatNumber(numberTarget);
      }
    };

    if (shouldAnimate) {
      requestAnimationFrame(animate);
    } else {
      xlStatNumber.innerText = formatNumber(numberTarget);
    }
  };

  if (!xlStats.length) return;
  Drupal.behaviors.xlStatTicker = {
    attach: function attach(context) {
      var showOnlyStatic = nwdsi.isMobile() ? true : false;

      var setXlStatTickers = function setXlStatTickers() {
        var xlStatTickers = context.querySelectorAll('.xl-stat-ticker');
        xlStatTickers.forEach(function (xlStatTicker) {
          setXlStatTicker(xlStatTicker, false);
        });
      };

      var setXlStatTicker = function setXlStatTicker(currentElement) {
        var xlStats = currentElement.querySelectorAll('.xl-stat');
        xlStats.forEach(function (xlStat, index) {
          if (!showOnlyStatic) {
            setTimeout(function () {
              xlStat.classList.add('xl-stat--show');
              xlStat.classList.add('xl-stat--animate');
              animateXlStat(xlStat);
            }, 500 * index);
          } else {
            xlStat.classList.add('xl-stat--show');
            xlStat.classList.add('xl-stat--animate');
            animateXlStat(xlStat, false);
          }
        });
      };

      if (showOnlyStatic) {
        setXlStatTickers();
      } else {
        nwdsi.whenVisibleObserver({
          "selector": ".xl-stat-ticker",
          "callback": setXlStatTicker,
          "callbackEvent": "inview"
        });
      }

      $(window).on('resize orientationchange', _.debounce(function () {
        showOnlyStatic = true;
        setXlStatTickers();
      }));
    }
  };
})(jQuery, Drupal);
'use strict';

(function formDateList($, Drupal) {
  'use strict';

  Drupal.behaviors.formDateList = {
    attach: function attach(context) {
      $('input[name="date_of_birth_3f[year]"]', context).attr('placeholder', 'Year');
      $('select[name="date_of_birth_3f[month]"]', context).select2();
      $('select[name="date_of_birth_3f[day]"]', context).select2();
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * nslij3-statics/js/vendors/bootstrap-multiselect/_bootstrap-multiselect-init.js
 */

(function formDatepicker($, Drupal) {
  Drupal.behaviors.formDatepicker = {
    attach: function attach(context) {
      $('input.hasDatepicker').datepicker();
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is brought over from:
 * nslij3-statics/js/vendors/bootstrap-multiselect/_bootstrap-multiselect-init.js
 */

(function mainThemeScript($, Drupal) {
  Drupal.behaviors.multiselect = {
    attach: function attach(context) {
      var $selects = $('select.multiselect, select[multiple]', context).not('.js-dont-multiselect');
      if (!$selects.length) return;
      var $mktoMultiselects = $('select[multiple].mktoField', context);
      var icon_reset = function icon_reset() {
        // Was the remove icon clicked and this multiselect
        // marked for clearing?
        // check if it happened within the last 10ms
        var reset_time = this.$button.data('reset-me');
        if (reset_time) {
          this.$button.removeData('reset-me');

          if (Date.now() - reset_time <= 10) {
            this.$select.multiselect('deselectAll', false); //val('').trigger('change');
            this.$select.multiselect('updateButtonText');

            return true;
          }
        }
      };

      // If marketo multi select remove the first option
      $mktoMultiselects.each(function (i, e) {
        var $e = $(e);
        if (!$e.parent().hasClass('select-customized')) {
          $e.find('option').get(0).remove();
          $e.parent().addClass('select-customized');
        }
      });
      var options = {};
      options.enableHTML = true;
      options.numberDisplayed = 1;
      options.maxHeight = 200;
      if ($('#search-multiselect-ajax').length === 0) options.nonSelectedText = '--Select--';
      options.buttonContainer = '<div class="multiselect-btn-group" />';
      options.templates = {
        li: '<li><a tabindex="0"><div class="checkbox checkbox-success checkbox-inline"><label></label></div></a></li>'
      };
      options.button_label = function (option) {
        var $option = $(option);
        var label = $option.attr('label') !== undefined ? $option.attr('label') : $option.html();
        if (!$.trim(label).length) {
          label = $('#search-multiselect-ajax').length === 0 ? this.nonSelectedText : drupalSettings.multiselectPlaceholder ? drupalSettings.multiselectPlaceholder : '';
          var $label = $option.parents('label');
          if ($label.length) {
            label = $.trim($label.text());
            if (!$.trim(label).length) label = $('#search-multiselect-ajax').length === 0 ? this.nonSelectedText : drupalSettings.multiselectPlaceholder ? drupalSettings.multiselectPlaceholder : '';
          }
        }
        return label;
      };
      options.buttonText = function (options, select) {
        var button_text = '';
        var icon = '';
        if (options.length == 0) {
          button_text = $('#search-multiselect-ajax').length === 0 ? this.nonSelectedText : drupalSettings.multiselectPlaceholder ? drupalSettings.multiselectPlaceholder : '';
          icon = '<i class="fal fa-angle-down"></i>';
        } else {
          if (options.length > this.numberDisplayed) {
            button_text = options.length + ' ' + this.nSelectedText;
          } else if (options.length === 1) {
            button_text = this.button_label(options[0]);
          } else {
            var selected = '';
            options.each(function () {
              selected += this.button_label(this) + ', ';
            });
            button_text = selected.substr(0, selected.length - 2);
          }

          icon = '<i class="fal fa-times"></i>';
        }
        return button_text + ' ' + icon;
      };
      options.onDropdownShow = function (e) {
        // this happens before dropdownshown
        var $i = this.$button.find('i');
        if (!$i.hasClass('fa-angle-down')) {
          icon_reset.bind(this, e)();
        }
      };
      options.onDropdownHidden = function (e) {
        // First check if the remove icon was probably clicked
        if (icon_reset.bind(this, e)()) {
          return; // if the above does its reset, it will return true
        }

        // Swap icons as needed
        var button_text = this.$button.find('.multiselect-selected-text').text().trim();
        var button_text_test = drupalSettings.multiselectPlaceholder ? drupalSettings.multiselectPlaceholder : nonSelectedText;
        if (button_text === button_text_test) {
          this.$button.find('i').attr('class', 'fal fa-angle-down');
        } else {
          this.$button.find('i').attr('class', 'fal fa-times');
        }
      };
      options.onChange = function (element, checked) {
        if (drupalSettings.multiselectVariant === 'vaccine_page') {
          var $hasShot = $('#has_booster_shot');
          var checkedCount = $(element[0]).parent().next('.multiselect-btn-group').find('input:checked').length;
          if (element[0].innerText === 'Johnson & Johnson (Janssen)' && checked && checkedCount === 1 || checkedCount === 1 && $(element[0]).parent().next('.multiselect-btn-group').find('input:checked')[0].defaultValue === 'johnson-johnson-janssen') {
            if ($hasShot.is(':checked')) {
              $hasShot.prop('checked', false).removeAttr('checked');
            }
            if ($hasShot.val() == 'true') {
              $hasShot.val(false);
            }
            $hasShot.prop('disabled', true);
          } else {
            $hasShot.prop('disabled', false);
          }
        }
      };
      $selects.multiselect(options);

      // Move checkbox to before label.
      $('.multiselect-container div.checkbox', context).each(function (index) {

        var id = 'multiselect-' + index,
            $input = $(this).find('input');

        // Associate the label and the input
        $(this).find('label').attr('for', id);
        $input.attr('id', id);

        // Remove the input from the label wrapper
        $input.detach();

        // Place the input back in before the label
        $input.prependTo($(this));

        $(this).click(function (e) {
          // Prevents the click from bubbling up and hiding the dropdown
          e.stopPropagation();
        });
      });

      $('.multiselect-btn-group', context).on('click', 'button', function (e) {
        var $button = $(e.currentTarget);
        var $i = $button.find('.fa-times');
        if ($i.length) {
          // This feature was originally built in Firefox where Event.offsetX and Event.offsetY
          // both properly reflect the position within the button tag.
          // In WebKit, the position is the actual <i> within which we've clicked, this is b/c
          // in FF the <i> itself is not the actual Event.target, the <button> is, whereas in
          // Webkit, the <i> is the actual Event.target.
          //
          // We may want to consider doing this differently as older versions of FF
          // may not even support the offsetX|Y properties on Events.
          // ...
          // meh.
          //
          var offsetX = e.offsetX;
          var offsetY = e.offsetY;
          if (offsetX && offsetY) {
            var i_pos = $i.position();

            // If this isn't how we originally designed this...
            // kick it and make it right, lulz
            if ($(e.target).is('i')) {
              offsetX += i_pos.left;
              offsetY += i_pos.top;
            }

            if (offsetX >= i_pos.left && offsetX <= i_pos.left + $i.width() && offsetY >= i_pos.top && offsetY <= i_pos.top + $i.height()) {
              //console.log('remove icon was clicked... probably');
              // I don't know how to find the multiselect object from here
              // but I can find the button.
              $button.data('reset-me', Date.now());
            }
          }
        }
      });

      // Remove styling from list elements.
      $('.multiselect-container').addClass('list-unstyled');

      // fix for IE
      var ua = window.navigator.userAgent;
      var ie = ua.indexOf('Trident/');
      if (ie > 0) {
        $('.multiselect-container').addClass('internet-explorer');
      }
    }
  };
})(jQuery, Drupal);
"use strict";

/* eslint-disable */
/**
 * Disabling ES6 linting on this file since it is based from:
 * nslij3-statics/js/paragraphs-item--navigation.js
 */

(function styleguidesidenavScript($, Drupal) {
  Drupal.behaviors.anchorsnavlanding = {
    attach: function attach(context) {

      if (!$('#anchors-landing-nav__container', context).length) {
        return;
      }

      var $nav = $(".anchors-landing-nav"),
          $slideLine = $(".menu-line"),
          $currentItem = $(".anchors-landing-nav__button--clickable--active");

      $(function () {

        if ($nav.height > 60) {
          $(this).addClass('double-flex-auto');
        }

        // Menu has active item
        if ($currentItem[0]) {
          $slideLine.css({
            "width": $currentItem.width(),
            "left": $currentItem.position().left,
            "top": $currentItem.position().top + 45
          });
        }

        // Underline transition
        // $($nav).find("li").hover(
        //   // Hover on
        //   function () {
        //     $slideLine.css({
        //       "width": $(this).width(),
        //       "left": $(this).position().left + 20,
        //       "top": $(this).position().top + 45
        //     });
        //   },
        //   // Hover out
        //   function () {
        //     if ($currentItem[0]) {
        //       // Go back to current
        //       $slideLine.css({
        //         "width": $currentItem.width(),
        //         "left": $currentItem.position().left,
        //         "top": $currentItem.position().top + 45
        //       });
        //     } else {
        //       // Disapear
        //       $slideLine.width(0);
        //     }
        //   }
        // );
      });

      //anchors-landing-nav
      var body = document.body;
      var html = document.documentElement;
      var height;
      var pageHeight = height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      // var adminBar = $('#toolbar-administration');
      // var adminAttribute = adminBar.attr("id");
      var navigationBar = $('.anchors-landing-nav__wrapper').eq(0);
      // var navigationBarAdmin = navigationBar.attr("data-admin-set",adminAttribute)
      var offsetTop = navigationBar.offset().top;
      var linkedComponents = navigationBar.find('.anchors-landing-nav__button--clickable');
      var ids = [];
      linkedComponents.each(function (i, e) {
        var target = $(this.hash);
        // If no an id attribute, then look for a name attribute.
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        ids.push($(target));
      });
      var selectActiveOnScroll = function selectActiveOnScroll(scrollY) {
        var scrollYoffset = scrollY + 80;
        var linkActive = false;
        for (var i = 0; i < ids.length; i++) {
          var $id = $(ids[i]);
          var $idNext = typeof ids[i + 1] != 'undefined' ? $(ids[i + 1]) : null;
          if (!$id.length) return; // if neither exist, fugeddabout it
          var aNextPos = $idNext != null ? $idNext.offset().top : pageHeight; // get the position of the next anchor element.
          if (scrollYoffset > $id.offset().top && scrollYoffset < aNextPos) {
            linkActive = true;
            linkedComponents.removeClass('anchors-landing-nav__button--clickable--active');
            linkedComponents.eq(i).addClass('anchors-landing-nav__button--clickable--active');
            linkedComponents.eq(i).blur();
            $currentItem = $(".anchors-landing-nav__button--clickable--active");
            // Menu has active item
            if ($currentItem[0]) {
              $slideLine.css({
                "width": $currentItem.width(),
                "left": $currentItem.position().left,
                "top": $currentItem.position().top + 45
              });
            }
          }
        }
        if (!linkActive) {
          linkedComponents.removeClass('anchors-landing-nav__button--clickable--active');
        }
      };
      // var toolbarEvents = function (handler,className){
      //    var $toolbarListener = $(handler)
      //    $toolbarListener.click(function(){
      //       console.log('clicked')
      //        if($toolbarListener.length){
      //            navigationBarAdmin.toggleClass(className)
      //         }
      //      })
      //   }
      // toolbarEvents('.toolbar-tab .toolbar-icon-menu','toolbar-active')
      // $(window).on('scroll', function (event) {
      //   if (window.scrollY > offsetTop) {
      //     // if(adminBar.length >=0){
      //     //   if (!navigationBarAdmin.hasClass('anchors-landing-nav__wrapper--sticky')) {
      //     //         navigationBarAdmin.addClass('anchors-landing-nav__wrapper--sticky')
      //     //     }
      //     //   }
      //     // if (!navigationBar.hasClass('anchors-landing-nav__wrapper--sticky')) {
      //     //   navigationBar.addClass('anchors-landing-nav__wrapper--sticky');
      //     // }
      //   } else if (window.scrollY < offsetTop) {

      //     // if(adminBar.length >=0){
      //     //   if (navigationBarAdmin.hasClass('anchors-landing-nav__wrapper--sticky')) {
      //     //         navigationBarAdmin.removeClass('anchors-landing-nav__wrapper--sticky')
      //     //     }
      //     //   }
      //     // if (navigationBar.hasClass('anchors-landing-nav__wrapper--sticky')) {
      //     //   navigationBar.removeClass('anchors-landing-nav__wrapper--sticky');
      //     // }
      //   }
      //   selectActiveOnScroll(window.scrollY);
      // });

      /**
       * We need to change the Foundation's sticky header, as not to conflict with the sticky anchor nav.
       */
      var unstickSupportHeader = function unstickSupportHeader() {
        var supportHeader = $('.support-site-header');

        if (supportHeader.length) {
          if ($(window).width() > 768) {
            // remove sticky styles.
            supportHeader.css({
              'position': 'relative',
              'top': '0'
            });
            $('.support.region-content').css('margin-top', '0');
          } else {
            // reapply sticky styles.
            supportHeader.css({
              'position': 'fixed',
              'top': ''
            });
          }
        }
      };

      $(window).on('load resize', function () {
        unstickSupportHeader();
      });
    }
  };
})(jQuery, Drupal);
'use strict';

(function styleguidesidenavScript($, Drupal) {
  Drupal.behaviors.anchorsnav = {
    attach: function attach(context) {
      // Attach Bootstrap Affix to anchors nav offset based on header height.
      $('.anchors-nav__mobile-wrapper', context).affix({
        offset: {
          top: function top() {
            var siblingNav = $('.sibling-nav__mobile-wrapper', context).outerHeight(true);
            var pageHeader = $('.page-header__wrapper', context).outerHeight(true);
            var totalHeight = siblingNav + pageHeader;
            return this.top = totalHeight;
          }
        }
      });
      // Do not conflict with styleguide scrollspy
      if (!$('#styleguide-sidenav').length) {
        // Use Bootstrap scrollspy for sidebar navigation.
        if (!nwdsi.isMobile()) {
          $('body').scrollspy({ target: '#anchors-nav', offset: 100 });
        }
      }

      // This will fix the issue of the anchor nav and the scroll spy becoming unsynchronized
      var scrollSpyEl = $("#anchors-nav.anchors-nav__affix-scrollspy", context);
      //variable to inspect if we have landed on the current page via the back or forward button
      var backButtonCheck = window.performance.getEntriesByType("navigation")[0].type === "back_forward";
      if (backButtonCheck) {
        //Github documentation states we must be at top page to refresh scroll spy
        $(window).scrollTop(0);
        scrollSpyEl.scrollspy('refresh');
      };

      $('#anchors-nav', context).on('activate.bs.scrollspy', function onScrollspyAnchorNav(context) {

        var $select = $('.anchors-nav__mobile', context).find('select');
        var $link = $(this).find('li.active a').attr('href');
        $select.find('option[value="' + $link + '"]').prop('selected', true);
        if ($(window).width() < 768) {
          var navHeight = $('.anchors-nav__mobile-wrapper', context).outerHeight(true);
          $($link)[0].scrollIntoView();
          scrollBy(0, -navHeight);
        }
      });

      var $anchorNavOptions = $('.anchors-nav__mobile .select2-exclude option', context);
      if ($(window).width() < 380) {
        $anchorNavOptions.each(function (index, element) {
          var optionString = $(element).text();
          // Save original text value as an attribute in case of a resize.
          $(element).attr('original-text', optionString);
          // Truncate and add ellipsis if text longer than 25 characters.
          if (optionString.length > 25) {
            $(element).text(optionString.substr(0, 24) + '...');
          }
        });
      }
      // Resize
      $(window).on('resize', function windowResize() {
        if ($(window).width() < 380) {
          $anchorNavOptions.each(function (index, element) {
            var optionString = $(element).text();
            // If original-text isn't already set, save the original text.
            if (typeof $(element).attr('original-text') === 'undefined') {
              $(element).attr('original-text', optionString);
            }
            // Truncate and add ellipsis if text longer than 25 characters.
            if (optionString.length > 25) {
              $(element).text(optionString.substr(0, 24) + '...');
            }
          });
        } else {
          $anchorNavOptions.each(function (index, element) {
            // Reset option text to the original text, if needed.
            if ($(element).text() !== $(element).attr('original-text')) {
              $(element).text($(element).attr('original-text'));
            }
          });
        }
      });

      $('.anchors-nav__mobile .select2-exclude', context).on('change', function (e) {
        var targetSelect = e.currentTarget;
        var parentComponent = $(targetSelect).closest('.anchors-nav');

        // Test if the links variant is present
        var isLinksVariant = $(parentComponent).hasClass('anchors-nav--links');

        // get the URL from the current option data attribute and open the url in a new tab
        if (isLinksVariant) {
          var currentTarget = e.target.value;
          var currentOption = document.querySelector('option[value=\'' + currentTarget + '\']');
          var currentLinkUrl = currentOption.dataset.url;
          var currentLinkTarget = currentOption.dataset.target;

          if (currentLinkUrl) {
            window.open(currentLinkUrl, currentLinkTarget ? currentLinkTarget : '_blank');
          }
        } else {
          var selectedValue = e.target.value;
          var offsetBuffer = 75;
          // The initial scroll to selection will be off because the anchors-nav
          // isn't fixed positioned yet.
          if (window.location.hash === '') {
            offsetBuffer = 150;
          }

          var scrollTopOffset = $('' + selectedValue).offset().top - offsetBuffer;

          // Animate the scroll.
          if (scrollTopOffset > 0) {
            $('html, body', context).animate({
              scrollTop: scrollTopOffset
            }, {
              duration: 400
            });
          }
          window.location = selectedValue;
        }
      });
    }
  };

  Drupal.behaviors.anchorsNavStickyScrollspy = {
    stickyAnchorsNav: function stickyAnchorsNav(context) {
      // we use this as a fallback script for IE
      if (nwdsi.isIE()) {
        var $firstFullWidth = $('.hero__full-width:last', context);
        var $footer = $('.footer__wrapper', context);
        var offsetBottom = $firstFullWidth.outerHeight() + $footer.outerHeight();
        this.$anchorsNavWrapper.affix({
          offset: {
            top: this.$anchorsNavWrapper.offset().top + 0,
            bottom: offsetBottom + 40
          }
        });
      }
    },
    stickyAnchorPosition: function stickyAnchorPosition(context) {
      var $adminBar = $('#toolbar-administration');
      var $navAnchor = $('aside.side-nav', context);
      var $navIndicator = $('.indicator', context);
      var $navCompressed = $('.root-site-header .compressed-nav').not('.site-header.micro-site-header-v2');
      // A position sticky element toggles between relative and fixed,
      // depending on the scroll position. It is positioned relative until a given offset position is met in the viewport
      // then it "sticks" in place (like position:fixed).
      if ($navAnchor.length >= 0 && $navIndicator.length) {
        $($navAnchor).css({
          top: $adminBar.length || $navCompressed.length ? 60 : 0,
          position: "sticky"
        });
      }
    },
    stickyAnchorSlidingLine: function stickyAnchorSlidingLine(context) {
      var topPos = void 0,
          newHeight = void 0,
          $el = void 0,
          $elScroll = void 0;
      var $slidingLine = $(".slidingLine", context);
      var $activeLine = $(".navbar.indicator li.active", context);
      var offsetY = $($activeLine).offset().top - 50;
      $slidingLine // Defining initial height and position
      .height($activeLine.outerHeight()).css("top", $activeLine.position().top);
      $('.navbar.indicator .nav li a').one("click", function (e) {
        $el = $(this);
        setTimeout(slideLineOnClick(), 1500);
      });
      $(window).on('scroll', function () {
        if ($(window).scrollTop() >= offsetY) {
          slideLineOnScroll();
        }
      });
      function slideLineOnClick() {
        // Set new height and position
        topPos = $el.position().top;
        newHeight = $el.outerHeight();
        //leverages css transition for precision timing between events
        $slidingLine.css({
          top: topPos,
          height: newHeight
        });
      }
      function slideLineOnScroll() {
        // Set new height and position
        $elScroll = $('.navbar.indicator .nav li.active');
        //leverages css transition for precision timing between events
        $slidingLine.css({
          top: $elScroll.position().top,
          height: $elScroll.outerHeight()
        });
      }
    },
    scrollspyAnchorsNav: function scrollspyAnchorsNav(item) {
      var itemOffset = $(item).offset().top - 50;
      var activeNav = $(item).attr('id');
      $(window).on('scroll', function () {
        if ($(window).scrollTop() >= itemOffset) {
          $('a[href="#' + activeNav + '"]').addClass('active');
          $('a:not([href="#' + activeNav + '"])').removeClass('active');
        }
      });
    },
    attach: function attach(context) {
      var _this = this;

      var $fad_nav = $(context).find('.fad-physician-profile');
      var $scrollspy_nav = $(context).find('.scrollspy-section');
      this.$anchorsNavWrapper = $(context).find('.anchors-nav__wrapper--affix nav');
      // Bail immediately if our widget doesn't exist, improves performance
      if (!this.$anchorsNavWrapper.length) {
        return false;
      }
      $fad_nav.each(function (i, item) {
        _this.scrollspyAnchorsNav(item);
      });
      $scrollspy_nav.each(function (i, item) {
        _this.scrollspyAnchorsNav(item);
      });
      $('.scrollspy-section', context).each(function (i, item) {
        _this.scrollspyAnchorsNav(item);
      });
      $('.scrollspy-section', context).each(function (i, item) {
        _this.scrollspyAnchorsNav(item);
      });
      this.stickyAnchorsNav(context);
      this.stickyAnchorPosition(context);
      this.stickyAnchorSlidingLine(context);
    }
  };
})(jQuery, Drupal);
"use strict";

(function flyout_nav($, Drupal) {
  Drupal.behaviors.flyout_nav = {
    attach: function attach(context) {
      var $flyoutNav = $('#flyout-nav');
      if (!$flyoutNav) return;
      var gigyaLoggedIn = ".gigya-logged-in";
      var flyoutLoggedIn = "#login-item";
      var flyoutLoggedInBack = "#login-screen-back";
      var flyoutBellLoggedIn = "#mobile_login_bell";
      var flyoutBellLoggedInBack = "#login-bell-screen-back";
      var gigyaLoggedInCheck = $(".main-nav__wrapper").find('#gigya-login-link');
      var myhealthTabCheck = window.drupalSettings && window.drupalSettings.dashboard && window.drupalSettings.dashboard.tabs && window.drupalSettings.dashboard.tabs.myhealth ? window.drupalSettings.dashboard.tabs.myhealth : false;
      // check if login has been de-activated in CMS
      // will remove in flyout menu based off main menu check
      !gigyaLoggedInCheck.length ? $('.flyout-only.login,.login-screen').hide() : $('.flyout-only.login,.login-screen').show();
      var sendAppInsightsData = function sendAppInsightsData() {
        if (gigya) {
          gigya.accounts.getAccountInfo({
            callback: function callback(response) {
              // check if notifications are present
              var readMsgs = "notchecked";
              if (northwell.getUnreadMessageCount) readMsgs = northwell.getUnreadMessageCount() > 0 ? "read" : "unread";
              // Check we're logged in.
              var gigUID = response.UID ? response.UID : null;
              if (typeof appInsights !== "undefined") {
                try {
                  appInsights.trackEvent({
                    name: "Button Clicked",
                    properties: {
                      Properties: {
                        gigyaUID: gigUID,
                        channel: "edu",
                        pageURL: window.location.href,
                        screenTitle: JSON.stringify(document.getElementsByTagName("title")[0].innerHTML),
                        testId: "Notifications-Icon-Bell",
                        readUnread: readMsgs
                      }
                    }
                  });
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error(e);
                }
              }
            }
          });
        }
      };
      var flyoutToggle = function flyoutToggle() {
        $('.login-screen').addClass('active');
      };
      var flyoutBellToggle = function flyoutBellToggle() {
        $('.login-bell-screen').addClass('active');
        sendAppInsightsData();
      };
      var flyoutToggleBack = function flyoutToggleBack() {
        $('.login-screen.active').removeClass('active');
      };
      var flyoutBellToggleBack = function flyoutBellToggleBack() {
        $('.login-bell-screen.active').removeClass('active');
      };
      if (gigyaLoggedIn.length >= 0) {
        $flyoutNav.on('click', flyoutLoggedIn, flyoutToggle);
        $flyoutNav.on('click', flyoutLoggedInBack, flyoutToggleBack);
        $flyoutNav.on('click', flyoutBellLoggedIn, flyoutBellToggle);
        $flyoutNav.on('click', flyoutBellLoggedInBack, flyoutBellToggleBack);
        if (myhealthTabCheck) {
          $('.myhealth-link-custom').removeClass('hidden');
        } else {
          $('.myhealth-link-custom').addClass('hidden');
        }
        if (typeof gigya !== 'undefined' && typeof gigya.accounts !== 'undefined' && typeof gigya.accounts.addEventHandlers !== 'undefined') {
          gigya.accounts.addEventHandlers({ onLogout: flyoutBellToggleBack });
        }
      }
    }
  };
})(jQuery, Drupal);
'use strict';

// (function mainnavScript($, Drupal) {
//   Drupal.behaviors.mainnav = {
//     attach(context) {
//       this.$navWrapper = $('.main-nav', context);
//       this.$firstLevelNavItem = this.$navWrapper.children('li');
//
//       this.$firstLevelNavItem.on('click',  (e) => {
//         $(e.currentTarget).find('.main-nav__secondary-nav-wrapper').toggleClass('show');
//         // $(e.currentTarget).find('a').toggleClass('active-parent-link');
//         $(e.delegateTarget).toggleClass('active').toggleClass('active-parent');
//         $this.$navWrapper.addClass('is-open');
//       });
//     },
//   };
// })(jQuery, Drupal);

(function mainnavScript($, Drupal) {
    Drupal.behaviors.mainnav = {
        attach: function attach(context) {
            var nestedLink = $('.nested-nav-mobile li a');
            if (!nestedLink.length) return;
            //show hide nested menu
            $(document).ready(function () {
                $('#nested-mobile-nav').click(function () {
                    $('.nested-dropdown-box').toggleClass('open');
                    $('.nested-nav-mobile').toggleClass('open');
                    $('.nested-icon').toggleClass('flip');
                });
                $('.sub-nav__toggle').click(function () {
                    $('.main-nav__secondary-nav-wrapper').toggleClass('open');
                    $('.sub-nav__toggle').toggleClass('flip');
                });
            });

            $(document).ready(function () {

                var current = location.href;
                $(nestedLink).each(function () {
                    var $this = $(this);
                    // if the current path is like this link, make it active
                    if ($this.attr('href') == current) {
                        $this.parent().addClass('active');
                        var s = $this.text();
                        $('.active-dropdown').html('| ' + s);
                        return false;
                    }
                });
            });
        }
    };
})(jQuery, Drupal);
'use strict';

(function sibling_nav($, Drupal) {
  Drupal.behaviors.sibling_nav = {
    attach: function attach(context) {
      //ps 438859 10.30.2020 get the height of child nav, then adjust gold underline conditionally
      var $childnavHeight = $('.sibling-nav__ul--fullwidth', context);
      if (!$childnavHeight.length) return;
      var $target = $childnavHeight;
      if ($childnavHeight.height() > 72) {
        //we add gold bar if height of child nav exceeds 72pixels,
        // else no gold bar, bar position is re-adjusted in css  
        $($target).addClass('goldbar-adjust');
        $target.find('.goldbar-adjust .sibling-nav__active .underline').css('background', '#ffba00');
      } else {
        $($target).removeClass('goldbar-adjust');
        $target.find('.sibling-nav__active .underline').css('background', '#ffba00');
      }
    }
  };
})(jQuery, Drupal);
'use strict';

/* eslint-disable */

// Modified from main DSI + The Well's navigation

(function supportNavigationScript($, Drupal) {

  Drupal.behaviors.supportnavigation = {

    navInitialized: false,

    /**
     * Creates the fixed navbar as a clone of the one located in the header.
     */
    createFixedNavbar: function createFixedNavbar(context) {
      if (Drupal.behaviors.supportnavigation.navInitialized) {
        return;
      }
      var nav = $('.support-site-header .site-header__navs-wrapper');
      var clone = nav.clone();
      clone.find('#support-main-nav').attr('id', 'support-main-nav--fixed').prepend('<li class="not-active li--logo"><a href="/"><img src="/themes/custom/northwell_health_digital_design_system/nwh-dds/images/nw_foundation_white.png" style="width: 150px;"></a>');
      // change the search button listener
      clone.find('a.site-nav__toggle-menu').removeAttr('data-toggle').removeAttr('data-target').removeClass('toggle-search--support-desktop').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 'fast');
      });
      clone.find('.search-header__wrapper').remove();

      var wrapper = $('<div class="fixed-navbar"></div>').append(clone);

      $('header.support-site-header').after(wrapper);

      Drupal.behaviors.supportnavigation.navInitialized = true;
    },

    attach: function attach(context) {
      Drupal.behaviors.supportnavigation.createFixedNavbar(context);

      var $body = $('body', context);
      var $site_nav = $('.support-site-header', context);
      var $site_links = $('[id=support-site-links],.fixed-navbar', context);
      window.$mm = $('[id=support-main-nav],[id=support-main-nav--fixed]', context);
      window.$sm = $('[id=support-search-nav]', context);

      // a class to make display: block stick when accessible mega menu
      // would otherwise remove it due to user interaction elsewhere on
      // the page.
      var sm_stick_form_class = 'form-focus';
      var mm_reveal_class = 'hover';

      // Mobile menu toggle.
      $site_nav.find('.site-header__top-nav .site-nav__toggle-menu').once('mobile-menu-toggle').on('click', function () {
        Drupal.behaviors.supportnavigation.closeSearch(context);
        Drupal.behaviors.supportnavigation.openMenu(context);
      });

      // Search icon on desktop toggle.
      $site_nav.find('.toggle-search--support-desktop').once('desktop-search-icon-toggle').on('click', function () {
        Drupal.behaviors.supportnavigation.closeMenu(context);
        Drupal.behaviors.supportnavigation.openSearch(context);
      });

      // Search icon on mobile toggle.
      $site_nav.find('.toggle-search--support-mobile').once('mobile-search-icon-toggle').on('click', function () {
        Drupal.behaviors.supportnavigation.closeMenu(context);
        Drupal.behaviors.supportnavigation.openSearch(context);
      });

      if ($('html', context).find('.search-header--support').last().css('display') == 'block') {
        $('html', context).addClass('openSearch');
      }

      var accessibleMegaMenu_options = {
        /* prefix for generated unique id attributes, which are required
         to indicate aria-owns, aria-controls and aria-labelledby */
        uuidPrefix: "accessible-megamenu",

        /* css class used to define the megamenu styling */
        menuClass: "accessible-megamenu-nav-menu",

        /* selector for the menu element within the nav */
        menuSelector: "#support-main-nav, #support-main-nav--fixed", //"ul.menu:first",

        /* css class for a top-level navigation item in the megamenu */
        topNavItemClass: "accessible-megamenu-nav-item",

        /* css class for a megamenu panel */
        panelClass: "accessible-megamenu-sub-nav",

        /* css class for a group of items within a megamenu panel */
        panelGroupClass: "accessible-megamenu-sub-nav-group",

        /* css class for the hover state */
        hoverClass: mm_reveal_class,

        /* css class for the focus state */
        focusClass: "focus",

        /* css class for the open state */
        openClass: "open"
      };

      if (nwdsi.isMobile()) {
        var subNavToggle = function subNavToggle($this) {
          var $sibs = $this.siblings();
          var $li = $this.parent();
          if ($sibs.hasClass('active-parent-link') || $li.hasClass(sm_stick_form_class)) {
            $li.removeClass(sm_stick_form_class);
            $sibs.removeClass('active-parent-link');
            $li.removeClass('active-parent');
            $li.removeClass('hover');
          } else {
            $li.find('> a').addClass('active-parent-link');
            $li.addClass('active-parent');
            $li.addClass('hover');
          }

          $li.siblings().removeClass('active-parent');
          $li.siblings().removeClass(sm_stick_form_class);
          $sibs.parents('#support-main-nav').addClass('is_open');
          $li.siblings().children().removeClass('active-parent-link');
        };

        $("[id=support-main-nav] li .sub-nav__toggle, [id=support-main-nav] li", context).once('mobile-submenu-toggle').click(function () {
          subNavToggle($(this).find('.sub-nav__toggle'));
        });
      } else {

        var sm_accessibleMegaMenu_options = $.extend(true, {}, accessibleMegaMenu_options);
        sm_accessibleMegaMenu_options.menuSelector = '#support-search-nav';

        // Prevent mousedown from working in medium+
        $mm.on('mousedown.accessible-megamenu', function (e) {
          if ($body.width() >= 992) {
            e.stopImmediatePropagation();
            return false;
          }
        });
        var $mm_nav = $site_links.find(".main-nav__wrapper");
        $mm_nav.accessibleMegaMenu(accessibleMegaMenu_options);
        // these conflict with menuAim
        $mm.off('mouseover.accessible-megamenu').off('mouseout.accessible-megamenu');

        $site_links.find('.search-nav__wrapper').accessibleMegaMenu(sm_accessibleMegaMenu_options);
        $sm.off('mouseover.accessible-megamenu').off('mouseout.accessible-megamenu');

        // For some odd reason hovering over select causes parent to lose focus
        var sm_stick_form_fn = function sm_stick_form_fn() {
          console.log('sm_stick_form_fn function');
          $(this).parents('li').toggleClass(sm_stick_form_class, true);
        };
        $sm.find('.form-control').on('focus', sm_stick_form_fn); // If you right click in an input to paste we lose the mega menu
        $sm.on('mousedown', '.' + sm_accessibleMegaMenu_options.topNavItemClass, function () {
          var $this = $(this);
          $this.siblings().removeClass(sm_stick_form_class);
          $this.toggleClass(sm_stick_form_class, true);
        });

        // On tab activation, auto focus to input if there is only one.
        $sm.on('panel-opened.accessible-megamenu', function (event, list_item, panel, hide, panelWasOpen) {
          var $this_sm = $(list_item).parents('#support-search-nav');
          $this_sm.data('last-opened.accessible-megamenu', list_item);

          if (!hide) {
            // Accessibility fix, keyboard commands toggle openClass but not our custom sticky class
            $this_sm.find('.' + sm_accessibleMegaMenu_options.topNavItemClass).not('.' + sm_accessibleMegaMenu_options.openClass).toggleClass(sm_stick_form_class, false);
            // Auto focus first field if non dropdown
            window.nwdsi.focus_first_field(panel);
          }
        });

        // menuAim for responsive mega dropdowns.
        var menuaim_options = {
          activate: function activate(li) {
            var $li = $(li);
            $li.toggleClass(mm_reveal_class, true);
          },
          deactivate: function deactivate(li) {
            $(li).removeClass(mm_reveal_class);
          },
          exitMenu: function exitMenu(ul) {
            return true;
          },
          tolerance: 20,
          submenuDirection: 'below',
          speed: 200
        };
        $mm.menuAim(menuaim_options);
      }
    },
    closeSearch: function closeSearch(context) {
      $('html', context).removeClass('openSearch');
      $('.search-header--support').slideUp('fast');
    },
    closeMenu: function closeMenu(context) {
      // This ONLY handles the mobile menu.
      // It does not apply to the hover display desktop version.
      if ($('html', context).hasClass('openNav')) {
        $('html', context).removeClass('openNav');
      }
    },
    openSearch: function openSearch(context) {
      if ($('html', context).hasClass('openSearch')) {
        // We should actually close this instead.
        Drupal.behaviors.supportnavigation.closeSearch(context);
      } else {
        $('.support-site-header .search-header--support').last().slideDown('normal');
        $('html', context).addClass('openSearch');
      }
    },
    openMenu: function openMenu(context) {
      // This ONLY handles the mobile menu.
      // It does not apply to the hover display desktop version.
      if ($('html', context).hasClass('openNav')) {
        Drupal.behaviors.supportnavigation.closeMenu(context);
      } else {
        $('html', context).addClass('openNav');
        // Scroll end user to the top of the page
        //$('html, body').animate({ scrollTop: 0 }, 'fast');
      }
    }
  };
})(jQuery, Drupal);
'use strict';

(function rootScript($, Drupal) {
  Drupal.behaviors.rootsite = {
    attach: function attach(context) {
      // Hide Header on on scroll down
      var didScroll;
      var lastScrollTop = 0;
      var delta = 5;
      var navbarHeight = 0;
      var rootDomain = drupalSettings.root_domain;

      $(document).ready(function () {
        if ($('.status-message').length) {
          navbarHeight = 335;
        } else {
          navbarHeight = 200;
        }
      });
      if ($('.site-header.micro-site-header,.site-header.old-nested-site').length && rootDomain) {
        // alert('FOUND EDU URL')
        $('div.name-text').wrap('<a href="' + rootDomain + '/dashboard" class="dashboard-url"></a>');
      }
      if ($('.site-header.micro-site-header-v2').length && rootDomain) {
        // TBD find the utility links and add root domain from drupal settings
        var $ddLinks = $('.utility-nav__gigya__links .gigya-links__item a, .mobile-login-nav__gigya__links .gigya-links__item a');
        $ddLinks.each(function (index, item) {
          var $item = $(item);
          var href = $item.attr('href');
          if (href[0] === 'j') return;
          $item.attr('href', rootDomain + href);
        });
      }

      $('.remove-button-style').on('click', function (e) {
        if (navbarHeight == 200) {
          navbarHeight = 455;
        } else if (navbarHeight == 335) {
          navbarHeight = 585;
        } else {
          navbarHeight = 200;
        }
        e.preventDefault();
      });

      $(document).on('scroll', _.throttle(function () {
        hasScrolled();
      }, 250));

      // setInterval(function () {
      //   if (didScroll) {
      //     hasScrolled();
      //     didScroll = false;
      //   }
      // }, 250);

      function hasScrolled() {
        var st = $(window).scrollTop();
        // console.log(st);

        // Make sure they scroll more than delta
        if (Math.abs(lastScrollTop - st) <= delta) return;

        // If they scrolled down and are past the navbar, add class .nav-hide.
        // This is necessary so you never see what is "behind" the navbar.
        if (st > lastScrollTop && st > navbarHeight) {
          // Scroll Down
          $('.main-nav__wrapper').addClass('nav-hide');
          $('.utility-nav__container').addClass('util-hide');
          $('.compressed-nav').addClass('decompress');
        } else {
          // Scroll Up
          if (st < navbarHeight) {
            $('.main-nav__wrapper').removeClass('nav-hide');
            $('.utility-nav__container').removeClass('util-hide');
            $('.compressed-nav').removeClass('decompress');
          }
        }

        lastScrollTop = st;
      }

      var go2topNavBtn = $('#btn-nav-gototop', context);
      var scrolling = false;

      // attach the click handler to the "go to top" button
      // to take the user to the top of the page, animated
      go2topNavBtn.on('click', function (e) {
        e.preventDefault();
        $('html,body').animate({
          scrollTop: 0
        }, 'slow');
        return false;
      });

      $(document).ready(function () {
        if (nwdsi.isMobile()) {} else {
          $('.go-to-top').css('display', 'none');
        }
      });

      /**
       * ACCESSIBILITY: Modal Dialog Pattern for Mega Menu
       *
       * Implements the WAI-ARIA Authoring Practices Dialog (Modal) pattern:
       * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
       *
       * Requirements:
       * 1. Escape key closes the dialog
       * 2. Focus moves into the dialog on open
       * 3. Tab/Shift+Tab cycle within the dialog (focus trap)
       * 4. Focus returns to the trigger element on close
       * 5. Child elements removed from tab order when dialog is hidden
       */
      $(document).ready(function () {
        var $megaMenu = $('.mega-menu');
        var $megaMenuLinks = $megaMenu.find('a, button, [tabindex]');
        var triggerElement = null; // tracks which element opened the menu

        // Store original tabindex values for restoration when menu opens
        var originalTabindexes = new Map();
        $megaMenuLinks.each(function () {
          var $element = $(this);
          var currentTabindex = $element.attr('tabindex');
          originalTabindexes.set(this, currentTabindex || '0');
        });

        /**
         * Toggle tabindex values for mega menu elements
         * @param {boolean} visible - Whether the mega menu should be focusable
         */
        function setMegaMenuTabindexes(visible) {
          $megaMenuLinks.each(function () {
            var $element = $(this);
            if (visible) {
              var originalTabindex = originalTabindexes.get(this);
              $element.attr('tabindex', originalTabindex);
            } else {
              $element.attr('tabindex', '-1');
            }
          });
        }

        /**
         * Get all focusable elements currently in the tab order within the mega menu.
         * @returns {jQuery} focusable elements
         */
        function getFocusableElements() {
          return $megaMenu.find('a[tabindex="0"], button:not(:disabled), input:not(:disabled), [tabindex="0"]').filter(':visible');
        }

        /**
         * Open the mega menu dialog.
         * @param {HTMLElement} trigger - the element that triggered the open
         */
        function openMegaMenu(trigger) {
          triggerElement = trigger;
          $('.mega-menu').addClass('show-mega');
          $('.overlay-menu').addClass('shoverlay');
          $('body').addClass('body-no-scroll');
          $('.mobile-tray').addClass('z-hide');
          setMegaMenuTabindexes(true);

          // Update trigger state — both desktop button and mobile burger link
          // expose aria-expanded so AT users hear the disclosure state.
          $('#chkMegaMenu').attr('aria-expanded', 'true');
          $('.mobile-burger-link').attr('aria-expanded', 'true');

          // APG: Move focus to first focusable element inside the dialog
          requestAnimationFrame(function () {
            var $focusable = getFocusableElements();
            if ($focusable.length) {
              $focusable.first().trigger('focus');
            }
          });
        }

        /**
         * Close the mega menu dialog and return focus to trigger.
         */
        function closeMegaMenu() {
          $('.mega-menu').removeClass('show-mega');
          $('.overlay-menu').removeClass('shoverlay');
          $('body').removeClass('body-no-scroll');
          $('.xs-lang-select-screen').removeClass('lang-select-active');
          $('.mobile-tray').removeClass('z-hide');
          $('.login-bell-screen').removeClass('active');
          $('#message-list-container-flyout').addClass('drawer-hidden');
          setMegaMenuTabindexes(false);

          // Update trigger state — both desktop button and mobile burger link
          $('#chkMegaMenu').attr('aria-expanded', 'false');
          $('.mobile-burger-link').attr('aria-expanded', 'false');

          // APG: Return focus to the element that triggered the dialog
          if (triggerElement) {
            $(triggerElement).trigger('focus');
            triggerElement = null;
          }
        }

        // Initialize: hide all mega menu links from tab order on page load
        setMegaMenuTabindexes(false);

        // APG: Escape key closes the dialog
        $(document).on('keydown', function (e) {
          if (e.key === 'Escape' && $megaMenu.hasClass('show-mega')) {
            e.preventDefault();
            closeMegaMenu();
          }
        });

        // APG: Focus trap — Tab/Shift+Tab cycle within the dialog
        $megaMenu.on('keydown', function (e) {
          if (e.key !== 'Tab') return;

          var $focusable = getFocusableElements();
          if ($focusable.length === 0) return;

          var $first = $focusable.first();
          var $last = $focusable.last();

          if (e.shiftKey) {
            // Shift+Tab on first element → wrap to last
            if (document.activeElement === $first[0]) {
              e.preventDefault();
              $last.trigger('focus');
            }
          } else {
            // Tab on last element → wrap to first
            if (document.activeElement === $last[0]) {
              e.preventDefault();
              $first.trigger('focus');
            }
          }
        });

        // Mega menu toggle button handler — reads aria-expanded as the source
        // of truth (a <button> handles both Enter and Space natively, so no
        // separate keydown shim is needed).
        $('#chkMegaMenu').click(function () {
          var isOpen = $(this).attr('aria-expanded') === 'true';
          if (isOpen) {
            closeMegaMenu();
          } else {
            openMegaMenu(this);
          }
        });

        // Overlay click handler
        $('.overlay-menu').click(function () {
          if ($megaMenu.hasClass('show-mega')) {
            closeMegaMenu();
          }
        });

        // Close button (X) handler
        $('.site-header__navs-wrapper .mega-menu .fa-times').click(function () {
          closeMegaMenu();
        });

        // Mobile burger menu handler
        $('.mobile-burger-link').click(function () {
          if ($megaMenu.hasClass('show-mega')) {
            closeMegaMenu();
          } else {
            openMegaMenu(this);
          }
        });

        if (nwdsi.isMobile()) {
          if (document.querySelector('.localize-translate #localize-btn') && document.querySelector('.localize-li-container-xs')) {
            document.querySelector('.localize-translate #localize-btn').removeAttribute('id');
            document.querySelector('.localize-li-container-xs').id = 'localize-btn';
          }
        }

        $('#localize-li-item').on('click', function (e) {
          $('.xs-lang-select-screen').addClass('lang-select-active');
        });

        $('.lang-text-wrapper').on('click', function (e) {
          $('.xs-lang-select-screen').removeClass('lang-select-active');
        });

        // Desktop/tablet: toggle the translate dropdown and update ARIA state
        $('#translate_item .utility-text').on('click', function () {
          var $wrapper = $('.utility-nav__translate');
          $wrapper.toggleClass('dd-open');
          var isOpen = $wrapper.hasClass('dd-open');
          $(this).attr('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close language dropdown on Escape and return focus to trigger
        $(document).on('keydown', function (e) {
          if (e.key === 'Escape' && $('.utility-nav__translate').hasClass('dd-open')) {
            $('.utility-nav__translate').removeClass('dd-open');
            $('#translate_item .utility-text').attr('aria-expanded', 'false').focus();
          }
        });

        // A11y: Enhance Localize.js language links with lang attrs and aria-selected.
        // Localize.js loads async so the global may not exist yet. We use a
        // persistent MutationObserver on #localize-btn (which is in the Twig
        // template) as the primary mechanism, plus Localize.on('setLanguage')
        // when available for language-switch updates.
        var langMap = { en: 'en', es: 'es', zh: 'zh', ko: 'ko' };
        var enhancePending = false;

        function enhanceLanguageLinks() {
          var $links = $('#translate_item .localize-widget a');
          if ($links.length === 0) return;

          var needsEnhance = false;
          $links.each(function () {
            if (!$(this).attr('lang')) needsEnhance = true;
          });
          if (!needsEnhance) return;

          $links.each(function () {
            var href = $(this).attr('href') || '';
            var match = href.match(/setLanguage\(['"](\w+)['"]\)/);
            if (match && langMap[match[1]]) {
              $(this).attr('lang', langMap[match[1]]);
            }
          });

          updateLanguageSelected();
        }

        function updateLanguageSelected(activeLang) {
          var currentCode = activeLang;
          if (!currentCode) {
            var currentLang = $('#current_lang').text().trim().toLowerCase();
            var langNameToCode = { english: 'en', espanol: 'es', español: 'es' };
            currentCode = langNameToCode[currentLang] || 'en';
          }

          $('#translate_item .localize-widget a').each(function () {
            var linkLang = $(this).attr('lang') || '';
            $(this).attr('aria-selected', linkLang === currentCode ? 'true' : 'false');
          });
        }

        function scheduleEnhance() {
          if (enhancePending) return;
          enhancePending = true;
          setTimeout(function () {
            enhancePending = false;
            enhanceLanguageLinks();
          }, 100);
        }

        // Primary: persistent MutationObserver on #localize-btn.
        // Catches initial widget injection and any Localize.js re-renders.
        enhanceLanguageLinks();
        var localizeBtn = document.getElementById('localize-btn');
        if (localizeBtn) {
          new MutationObserver(scheduleEnhance).observe(localizeBtn, { childList: true, subtree: true });
        }

        // Secondary: Localize.on('setLanguage') for language-switch updates.
        // Localize.js loads async, so this may not be available on first run.
        if (typeof Localize !== 'undefined' && Localize.on) {
          Localize.on('setLanguage', function (lang) {
            var langNames = { en: 'English', es: 'Espanol', zh: '中文(简体)', ko: '한국어' };
            var langName = langNames[lang] || lang;

            $('#translate_item .utility-text').attr('aria-label', 'Select language. Current language: ' + langName);

            enhanceLanguageLinks();
            updateLanguageSelected(lang);

            // Close dropdown
            $('.utility-nav__translate').removeClass('dd-open');
            $('#translate_item .utility-text').attr('aria-expanded', 'false');
          });
        }

        var tray = $('.mobile-tray');
        if (tray.length > 0 && !tray.hasClass('.z-hide')) {
          $('.drawer').addClass('tray-open');
        }
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/* global $, document */
/* eslint prefer-arrow-callback: ["error", { "allowNamedFunctions": true }] */
(function testScript($, Drupal) {
  Drupal.behaviors.styleguide_component = {
    attach: function attach(context) {
      $('[role^="tablist"] a', context).bind('click', function styleguideTabClick(event) {
        event.preventDefault();
        event.stopPropagation();

        var $closestLi = $(this).closest('li');
        var $closestLiControls = $closestLi.attr('aria-controls');

        $closestLi.siblings('li').each(function styleguideTabClosest() {
          var $closestSibling = $(this);
          var $closestSiblingControls = $closestSibling.attr('aria-controls');
          $('#' + $closestSiblingControls).attr('aria-hidden', 'true');
          $closestSibling.attr('aria-selected', 'false');
        });

        if ($closestLi.attr('aria-selected') === 'false') {
          $closestLi.attr('aria-selected', 'true');
          $('#' + $closestLiControls).attr('aria-hidden', 'false');
        } else {
          $closestLi.attr('aria-selected', 'false');
          $('#' + $closestLiControls).attr('aria-hidden', 'true');
        }
      });

      // On styleguide Page prevent links from linking off page.
      $('.styleguide-component a', context).not('.profile-card__professional-title-additional--toggle, .exclude-link-blocker').click(function linkPreventDefault() {
        return false;
      });
      $('.styleguide-component button[type=submit]', context).not('.exclude-link-blocker').click(function buttonPreventDefault() {
        return false;
      });
    }
  };
})(jQuery, Drupal);
'use strict';

/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// minimal template polyfill
(function () {
  'use strict';

  var needsTemplate = typeof HTMLTemplateElement === 'undefined';
  var brokenDocFragment = !(document.createDocumentFragment().cloneNode() instanceof DocumentFragment);
  var needsDocFrag = false;

  // NOTE: Replace DocumentFragment to work around IE11 bug that
  // causes children of a document fragment modified while
  // there is a mutation observer to not have a parentNode, or
  // have a broken parentNode (!?!)
  if (/Trident/.test(navigator.userAgent)) {
    (function () {

      needsDocFrag = true;

      var origCloneNode = Node.prototype.cloneNode;
      Node.prototype.cloneNode = function cloneNode(deep) {
        var newDom = origCloneNode.call(this, deep);
        if (this instanceof DocumentFragment) {
          newDom.__proto__ = DocumentFragment.prototype;
        }
        return newDom;
      };

      // IE's DocumentFragment querySelector code doesn't work when
      // called on an element instance
      DocumentFragment.prototype.querySelectorAll = HTMLElement.prototype.querySelectorAll;
      DocumentFragment.prototype.querySelector = HTMLElement.prototype.querySelector;

      Object.defineProperties(DocumentFragment.prototype, {
        'nodeType': {
          get: function get() {
            return Node.DOCUMENT_FRAGMENT_NODE;
          },
          configurable: true
        },

        'localName': {
          get: function get() {
            return undefined;
          },
          configurable: true
        },

        'nodeName': {
          get: function get() {
            return '#document-fragment';
          },
          configurable: true
        }
      });

      var origInsertBefore = Node.prototype.insertBefore;
      function insertBefore(newNode, refNode) {
        if (newNode instanceof DocumentFragment) {
          var child;
          while (child = newNode.firstChild) {
            origInsertBefore.call(this, child, refNode);
          }
        } else {
          origInsertBefore.call(this, newNode, refNode);
        }
        return newNode;
      }
      Node.prototype.insertBefore = insertBefore;

      var origAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function appendChild(child) {
        if (child instanceof DocumentFragment) {
          insertBefore.call(this, child, null);
        } else {
          origAppendChild.call(this, child);
        }
        return child;
      };

      var origRemoveChild = Node.prototype.removeChild;
      var origReplaceChild = Node.prototype.replaceChild;
      Node.prototype.replaceChild = function replaceChild(newChild, oldChild) {
        if (newChild instanceof DocumentFragment) {
          insertBefore.call(this, newChild, oldChild);
          origRemoveChild.call(this, oldChild);
        } else {
          origReplaceChild.call(this, newChild, oldChild);
        }
        return oldChild;
      };

      Document.prototype.createDocumentFragment = function createDocumentFragment() {
        var frag = this.createElement('df');
        frag.__proto__ = DocumentFragment.prototype;
        return frag;
      };

      var origImportNode = Document.prototype.importNode;
      Document.prototype.importNode = function importNode(impNode, deep) {
        deep = deep || false;
        var newNode = origImportNode.call(this, impNode, deep);
        if (impNode instanceof DocumentFragment) {
          newNode.__proto__ = DocumentFragment.prototype;
        }
        return newNode;
      };
    })();
  }

  // NOTE: we rely on this cloneNode not causing element upgrade.
  // This means this polyfill must load before the CE polyfill and
  // this would need to be re-worked if a browser supports native CE
  // but not <template>.
  var capturedCloneNode = Node.prototype.cloneNode;
  var capturedCreateElement = Document.prototype.createElement;
  var capturedImportNode = Document.prototype.importNode;
  var capturedRemoveChild = Node.prototype.removeChild;
  var capturedAppendChild = Node.prototype.appendChild;
  var capturedReplaceChild = Node.prototype.replaceChild;
  var capturedParseFromString = DOMParser.prototype.parseFromString;
  var capturedHTMLElementInnerHTML = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'innerHTML') || {
    /**
     * @this {!HTMLElement}
     * @return {string}
     */
    get: function get() {
      return this.innerHTML;
    },
    /**
     * @this {!HTMLElement}
     * @param {string}
     */
    set: function set(text) {
      this.innerHTML = text;
    }
  };
  var capturedChildNodes = Object.getOwnPropertyDescriptor(window.Node.prototype, 'childNodes') || {
    /**
     * @this {!Node}
     * @return {!NodeList}
     */
    get: function get() {
      return this.childNodes;
    }
  };

  var elementQuerySelectorAll = Element.prototype.querySelectorAll;
  var docQuerySelectorAll = Document.prototype.querySelectorAll;
  var fragQuerySelectorAll = DocumentFragment.prototype.querySelectorAll;

  var scriptSelector = 'script:not([type]),script[type="application/javascript"],script[type="text/javascript"]';

  function QSA(node, selector) {
    // IE 11 throws a SyntaxError with `scriptSelector` if the node has no children due to the `:not([type])` syntax
    if (!node.childNodes.length) {
      return [];
    }
    switch (node.nodeType) {
      case Node.DOCUMENT_NODE:
        return docQuerySelectorAll.call(node, selector);
      case Node.DOCUMENT_FRAGMENT_NODE:
        return fragQuerySelectorAll.call(node, selector);
      default:
        return elementQuerySelectorAll.call(node, selector);
    }
  }

  // returns true if nested templates cannot be cloned (they cannot be on
  // some impl's like Safari 8 and Edge)
  // OR if cloning a document fragment does not result in a document fragment
  var needsCloning = function () {
    if (!needsTemplate) {
      var t = document.createElement('template');
      var t2 = document.createElement('template');
      t2.content.appendChild(document.createElement('div'));
      t.content.appendChild(t2);
      var clone = t.cloneNode(true);
      return clone.content.childNodes.length === 0 || clone.content.firstChild.content.childNodes.length === 0 || brokenDocFragment;
    }
  }();

  var TEMPLATE_TAG = 'template';
  var PolyfilledHTMLTemplateElement = function PolyfilledHTMLTemplateElement() {};

  if (needsTemplate) {

    var contentDoc = document.implementation.createHTMLDocument('template');
    var canDecorate = true;

    var templateStyle = document.createElement('style');
    templateStyle.textContent = TEMPLATE_TAG + '{display:none;}';

    var head = document.head;
    head.insertBefore(templateStyle, head.firstElementChild);

    /**
      Provides a minimal shim for the <template> element.
    */
    PolyfilledHTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);

    // if elements do not have `innerHTML` on instances, then
    // templates can be patched by swizzling their prototypes.
    var canProtoPatch = !document.createElement('div').hasOwnProperty('innerHTML');

    /**
      The `decorate` method moves element children to the template's `content`.
      NOTE: there is no support for dynamically adding elements to templates.
    */
    PolyfilledHTMLTemplateElement.decorate = function (template) {
      // if the template is decorated or not in HTML namespace, return fast
      if (template.content || template.namespaceURI !== document.documentElement.namespaceURI) {
        return;
      }
      template.content = contentDoc.createDocumentFragment();
      var child;
      while (child = template.firstChild) {
        capturedAppendChild.call(template.content, child);
      }
      // NOTE: prefer prototype patching for performance and
      // because on some browsers (IE11), re-defining `innerHTML`
      // can result in intermittent errors.
      if (canProtoPatch) {
        template.__proto__ = PolyfilledHTMLTemplateElement.prototype;
      } else {
        template.cloneNode = function (deep) {
          return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
        };
        // add innerHTML to template, if possible
        // Note: this throws on Safari 7
        if (canDecorate) {
          try {
            defineInnerHTML(template);
            defineOuterHTML(template);
          } catch (err) {
            canDecorate = false;
          }
        }
      }
      // bootstrap recursively
      PolyfilledHTMLTemplateElement.bootstrap(template.content);
    };

    // Taken from https://github.com/jquery/jquery/blob/73d7e6259c63ac45f42c6593da8c2796c6ce9281/src/manipulation/wrapMap.js
    var topLevelWrappingMap = {
      'option': ['select'],
      'thead': ['table'],
      'col': ['colgroup', 'table'],
      'tr': ['tbody', 'table'],
      'th': ['tr', 'tbody', 'table'],
      'td': ['tr', 'tbody', 'table']
    };

    var getTagName = function getTagName(text) {
      // Taken from https://github.com/jquery/jquery/blob/73d7e6259c63ac45f42c6593da8c2796c6ce9281/src/manipulation/var/rtagName.js
      return (/<([a-z][^/\0>\x20\t\r\n\f]+)/i.exec(text) || ['', ''])[1].toLowerCase();
    };

    var defineInnerHTML = function defineInnerHTML(obj) {
      Object.defineProperty(obj, 'innerHTML', {
        get: function get() {
          return getInnerHTML(this);
        },
        set: function set(text) {
          // For IE11, wrap the text in the correct (table) context
          var wrap = topLevelWrappingMap[getTagName(text)];
          if (wrap) {
            for (var i = 0; i < wrap.length; i++) {
              text = '<' + wrap[i] + '>' + text + '</' + wrap[i] + '>';
            }
          }
          contentDoc.body.innerHTML = text;
          PolyfilledHTMLTemplateElement.bootstrap(contentDoc);
          while (this.content.firstChild) {
            capturedRemoveChild.call(this.content, this.content.firstChild);
          }
          var body = contentDoc.body;
          // If we had wrapped, get back to the original node
          if (wrap) {
            for (var j = 0; j < wrap.length; j++) {
              body = body.lastChild;
            }
          }
          while (body.firstChild) {
            capturedAppendChild.call(this.content, body.firstChild);
          }
        },
        configurable: true
      });
    };

    var defineOuterHTML = function defineOuterHTML(obj) {
      Object.defineProperty(obj, 'outerHTML', {
        get: function get() {
          return '<' + TEMPLATE_TAG + '>' + this.innerHTML + '</' + TEMPLATE_TAG + '>';
        },
        set: function set(innerHTML) {
          if (this.parentNode) {
            contentDoc.body.innerHTML = innerHTML;
            var docFrag = this.ownerDocument.createDocumentFragment();
            while (contentDoc.body.firstChild) {
              capturedAppendChild.call(docFrag, contentDoc.body.firstChild);
            }
            capturedReplaceChild.call(this.parentNode, docFrag, this);
          } else {
            throw new Error("Failed to set the 'outerHTML' property on 'Element': This element has no parent node.");
          }
        },
        configurable: true
      });
    };

    defineInnerHTML(PolyfilledHTMLTemplateElement.prototype);
    defineOuterHTML(PolyfilledHTMLTemplateElement.prototype);

    /**
      The `bootstrap` method is called automatically and "fixes" all
      <template> elements in the document referenced by the `doc` argument.
    */
    PolyfilledHTMLTemplateElement.bootstrap = function bootstrap(doc) {
      var templates = QSA(doc, TEMPLATE_TAG);
      for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
        PolyfilledHTMLTemplateElement.decorate(t);
      }
    };

    // auto-bootstrapping for main document
    document.addEventListener('DOMContentLoaded', function () {
      PolyfilledHTMLTemplateElement.bootstrap(document);
    });

    // Patch document.createElement to ensure newly created templates have content
    Document.prototype.createElement = function createElement() {
      var el = capturedCreateElement.apply(this, arguments);
      if (el.localName === 'template') {
        PolyfilledHTMLTemplateElement.decorate(el);
      }
      return el;
    };

    DOMParser.prototype.parseFromString = function () {
      var el = capturedParseFromString.apply(this, arguments);
      PolyfilledHTMLTemplateElement.bootstrap(el);
      return el;
    };

    Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
      get: function get() {
        return getInnerHTML(this);
      },
      set: function set(text) {
        capturedHTMLElementInnerHTML.set.call(this, text);
        PolyfilledHTMLTemplateElement.bootstrap(this);
      },
      configurable: true,
      enumerable: true
    });

    // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-end.html#escapingString
    var escapeAttrRegExp = /[&\u00A0"]/g;
    var escapeDataRegExp = /[&\u00A0<>]/g;

    var escapeReplace = function escapeReplace(c) {
      switch (c) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case '\xA0':
          return '&nbsp;';
      }
    };

    var escapeAttr = function escapeAttr(s) {
      return s.replace(escapeAttrRegExp, escapeReplace);
    };

    var escapeData = function escapeData(s) {
      return s.replace(escapeDataRegExp, escapeReplace);
    };

    var makeSet = function makeSet(arr) {
      var set = {};
      for (var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
      }
      return set;
    };

    // http://www.whatwg.org/specs/web-apps/current-work/#void-elements
    var voidElements = makeSet(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

    var plaintextParents = makeSet(['style', 'script', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext', 'noscript']);

    /**
     * @param {Node} node
     * @param {Node} parentNode
     * @param {Function=} callback
     */
    var getOuterHTML = function getOuterHTML(node, parentNode, callback) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          {
            var tagName = node.localName;
            var s = '<' + tagName;
            var attrs = node.attributes;
            for (var i = 0, attr; attr = attrs[i]; i++) {
              s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
            }
            s += '>';
            if (voidElements[tagName]) {
              return s;
            }
            return s + getInnerHTML(node, callback) + '</' + tagName + '>';
          }
        case Node.TEXT_NODE:
          {
            var data = /** @type {Text} */node.data;
            if (parentNode && plaintextParents[parentNode.localName]) {
              return data;
            }
            return escapeData(data);
          }
        case Node.COMMENT_NODE:
          {
            return '<!--' + /** @type {Comment} */node.data + '-->';
          }
        default:
          {
            window.console.error(node);
            throw new Error('not implemented');
          }
      }
    };

    /**
     * @param {Node} node
     * @param {Function=} callback
     */
    var getInnerHTML = function getInnerHTML(node, callback) {
      if (node.localName === 'template') {
        node = /** @type {HTMLTemplateElement} */node.content;
      }
      var s = '';
      var c$ = callback ? callback(node) : capturedChildNodes.get.call(node);
      for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
        s += getOuterHTML(child, node, callback);
      }
      return s;
    };
  }

  // make cloning/importing work!
  if (needsTemplate || needsCloning) {

    PolyfilledHTMLTemplateElement._cloneNode = function _cloneNode(template, deep) {
      var clone = capturedCloneNode.call(template, false);
      // NOTE: decorate doesn't auto-fix children because they are already
      // decorated so they need special clone fixup.
      if (this.decorate) {
        this.decorate(clone);
      }
      if (deep) {
        // NOTE: use native clone node to make sure CE's wrapped
        // cloneNode does not cause elements to upgrade.
        capturedAppendChild.call(clone.content, capturedCloneNode.call(template.content, true));
        // now ensure nested templates are cloned correctly.
        fixClonedDom(clone.content, template.content);
      }
      return clone;
    };

    // Given a source and cloned subtree, find <template>'s in the cloned
    // subtree and replace them with cloned <template>'s from source.
    // We must do this because only the source templates have proper .content.
    var fixClonedDom = function fixClonedDom(clone, source) {
      // do nothing if cloned node is not an element
      if (!source.querySelectorAll) return;
      // these two lists should be coincident
      var s$ = QSA(source, TEMPLATE_TAG);
      if (s$.length === 0) {
        return;
      }
      var t$ = QSA(clone, TEMPLATE_TAG);
      for (var i = 0, l = t$.length, t, s; i < l; i++) {
        s = s$[i];
        t = t$[i];
        if (PolyfilledHTMLTemplateElement && PolyfilledHTMLTemplateElement.decorate) {
          PolyfilledHTMLTemplateElement.decorate(s);
        }
        capturedReplaceChild.call(t.parentNode, cloneNode.call(s, true), t);
      }
    };

    // make sure scripts inside of a cloned template are executable
    var fixClonedScripts = function fixClonedScripts(fragment) {
      var scripts = QSA(fragment, scriptSelector);
      for (var ns, s, i = 0; i < scripts.length; i++) {
        s = scripts[i];
        ns = capturedCreateElement.call(document, 'script');
        ns.textContent = s.textContent;
        var attrs = s.attributes;
        for (var ai = 0, a; ai < attrs.length; ai++) {
          a = attrs[ai];
          ns.setAttribute(a.name, a.value);
        }
        capturedReplaceChild.call(s.parentNode, ns, s);
      }
    };

    // override all cloning to fix the cloned subtree to contain properly
    // cloned templates.
    var cloneNode = Node.prototype.cloneNode = function cloneNode(deep) {
      var dom;
      // workaround for Edge bug cloning documentFragments
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8619646/
      if (!needsDocFrag && brokenDocFragment && this instanceof DocumentFragment) {
        if (!deep) {
          return this.ownerDocument.createDocumentFragment();
        } else {
          dom = importNode.call(this.ownerDocument, this, true);
        }
      } else if (this.nodeType === Node.ELEMENT_NODE && this.localName === TEMPLATE_TAG && this.namespaceURI == document.documentElement.namespaceURI) {
        dom = PolyfilledHTMLTemplateElement._cloneNode(this, deep);
      } else {
        dom = capturedCloneNode.call(this, deep);
      }
      // template.content is cloned iff `deep`.
      if (deep) {
        fixClonedDom(dom, this);
      }
      return dom;
    };

    // NOTE: we are cloning instead of importing <template>'s.
    // However, the ownerDocument of the cloned template will be correct!
    // This is because the native import node creates the right document owned
    // subtree and `fixClonedDom` inserts cloned templates into this subtree,
    // thus updating the owner doc.
    var importNode = Document.prototype.importNode = function importNode(element, deep) {
      deep = deep || false;
      if (element.localName === TEMPLATE_TAG) {
        return PolyfilledHTMLTemplateElement._cloneNode(element, deep);
      } else {
        var dom = capturedImportNode.call(this, element, deep);
        if (deep) {
          fixClonedDom(dom, element);
          fixClonedScripts(dom);
        }
        return dom;
      }
    };
  }

  if (needsTemplate) {
    window.HTMLTemplateElement = PolyfilledHTMLTemplateElement;
  }
})();
"use strict";

(function () {
  /*
  
   Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
   This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   Code distributed by Google as part of the polymer project is also
   subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
  */
  'use strict';
  (function () {
    function f() {}function p(a, b) {
      if (!a.childNodes.length) return [];switch (a.nodeType) {case Node.DOCUMENT_NODE:
          return J.call(a, b);case Node.DOCUMENT_FRAGMENT_NODE:
          return K.call(a, b);default:
          return L.call(a, b);}
    }var q = "undefined" === typeof HTMLTemplateElement,
        A = !(document.createDocumentFragment().cloneNode() instanceof DocumentFragment),
        B = !1;/Trident/.test(navigator.userAgent) && function () {
      function a(c, g) {
        if (c instanceof DocumentFragment) for (var r; r = c.firstChild;) {
          d.call(this, r, g);
        } else d.call(this, c, g);return c;
      }B = !0;var b = Node.prototype.cloneNode;Node.prototype.cloneNode = function (c) {
        c = b.call(this, c);this instanceof DocumentFragment && (c.__proto__ = DocumentFragment.prototype);return c;
      };DocumentFragment.prototype.querySelectorAll = HTMLElement.prototype.querySelectorAll;DocumentFragment.prototype.querySelector = HTMLElement.prototype.querySelector;Object.defineProperties(DocumentFragment.prototype, { nodeType: { get: function get() {
            return Node.DOCUMENT_FRAGMENT_NODE;
          }, configurable: !0 }, localName: { get: function get() {},
          configurable: !0 }, nodeName: { get: function get() {
            return "#document-fragment";
          }, configurable: !0 } });var d = Node.prototype.insertBefore;Node.prototype.insertBefore = a;var e = Node.prototype.appendChild;Node.prototype.appendChild = function (c) {
        c instanceof DocumentFragment ? a.call(this, c, null) : e.call(this, c);return c;
      };var h = Node.prototype.removeChild,
          k = Node.prototype.replaceChild;Node.prototype.replaceChild = function (c, g) {
        c instanceof DocumentFragment ? (a.call(this, c, g), h.call(this, g)) : k.call(this, c, g);return g;
      };Document.prototype.createDocumentFragment = function () {
        var c = this.createElement("df");c.__proto__ = DocumentFragment.prototype;return c;
      };var l = Document.prototype.importNode;Document.prototype.importNode = function (c, g) {
        g = l.call(this, c, g || !1);c instanceof DocumentFragment && (g.__proto__ = DocumentFragment.prototype);return g;
      };
    }();var v = Node.prototype.cloneNode,
        C = Document.prototype.createElement,
        M = Document.prototype.importNode,
        N = Node.prototype.removeChild,
        t = Node.prototype.appendChild,
        w = Node.prototype.replaceChild,
        O = DOMParser.prototype.parseFromString,
        P = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "innerHTML") || { get: function get() {
        return this.innerHTML;
      }, set: function set(a) {
        this.innerHTML = a;
      } },
        Q = Object.getOwnPropertyDescriptor(window.Node.prototype, "childNodes") || { get: function get() {
        return this.childNodes;
      } },
        L = Element.prototype.querySelectorAll,
        J = Document.prototype.querySelectorAll,
        K = DocumentFragment.prototype.querySelectorAll,
        R = function () {
      if (!q) {
        var a = document.createElement("template"),
            b = document.createElement("template");b.content.appendChild(document.createElement("div"));
        a.content.appendChild(b);a = a.cloneNode(!0);return 0 === a.content.childNodes.length || 0 === a.content.firstChild.content.childNodes.length || A;
      }
    }();if (q) {
      var m = document.implementation.createHTMLDocument("template"),
          D = !0,
          n = document.createElement("style");n.textContent = "template{display:none;}";var E = document.head;E.insertBefore(n, E.firstElementChild);f.prototype = Object.create(HTMLElement.prototype);var S = !document.createElement("div").hasOwnProperty("innerHTML");f.a = function (a) {
        if (!a.content && a.namespaceURI === document.documentElement.namespaceURI) {
          a.content = m.createDocumentFragment();for (var b; b = a.firstChild;) {
            t.call(a.content, b);
          }if (S) a.__proto__ = f.prototype;else if (a.cloneNode = function (d) {
            return f.c(this, d);
          }, D) try {
            F(a), G(a);
          } catch (d) {
            D = !1;
          }f.b(a.content);
        }
      };var T = { option: ["select"], thead: ["table"], col: ["colgroup", "table"], tr: ["tbody", "table"], th: ["tr", "tbody", "table"], td: ["tr", "tbody", "table"] },
          F = function F(a) {
        Object.defineProperty(a, "innerHTML", { get: function get() {
            return x(this);
          }, set: function set(b) {
            var d = T[(/<([a-z][^/\0>\x20\t\r\n\f]+)/i.exec(b) || ["", ""])[1].toLowerCase()];if (d) for (var e = 0; e < d.length; e++) {
              b = "<" + d[e] + ">" + b + "</" + d[e] + ">";
            }m.body.innerHTML = b;for (f.b(m); this.content.firstChild;) {
              N.call(this.content, this.content.firstChild);
            }b = m.body;if (d) for (e = 0; e < d.length; e++) {
              b = b.lastChild;
            }for (; b.firstChild;) {
              t.call(this.content, b.firstChild);
            }
          }, configurable: !0 });
      },
          G = function G(a) {
        Object.defineProperty(a, "outerHTML", { get: function get() {
            return "<template>" + this.innerHTML + "</template>";
          }, set: function set(b) {
            if (this.parentNode) {
              m.body.innerHTML = b;for (b = this.ownerDocument.createDocumentFragment(); m.body.firstChild;) {
                t.call(b, m.body.firstChild);
              }w.call(this.parentNode, b, this);
            } else throw Error("Failed to set the 'outerHTML' property on 'Element': This element has no parent node.");
          }, configurable: !0 });
      };F(f.prototype);G(f.prototype);f.b = function (a) {
        a = p(a, "template");for (var b = 0, d = a.length, e; b < d && (e = a[b]); b++) {
          f.a(e);
        }
      };document.addEventListener("DOMContentLoaded", function () {
        f.b(document);
      });Document.prototype.createElement = function () {
        var a = C.apply(this, arguments);"template" === a.localName && f.a(a);return a;
      };DOMParser.prototype.parseFromString = function () {
        var a = O.apply(this, arguments);f.b(a);return a;
      };Object.defineProperty(HTMLElement.prototype, "innerHTML", { get: function get() {
          return x(this);
        }, set: function set(a) {
          P.set.call(this, a);f.b(this);
        }, configurable: !0, enumerable: !0 });var U = /[&\u00A0"]/g,
          V = /[&\u00A0<>]/g,
          H = function H(a) {
        switch (a) {case "&":
            return "&amp;";case "<":
            return "&lt;";case ">":
            return "&gt;";case '"':
            return "&quot;";case "\xA0":
            return "&nbsp;";}
      };n = function n(a) {
        for (var b = {}, d = 0; d < a.length; d++) {
          b[a[d]] = !0;
        }return b;
      };var W = n("area base br col command embed hr img input keygen link meta param source track wbr".split(" ")),
          X = n("style script xmp iframe noembed noframes plaintext noscript".split(" ")),
          x = function x(a, b) {
        "template" === a.localName && (a = a.content);for (var d = "", e = b ? b(a) : Q.get.call(a), h = 0, k = e.length, l; h < k && (l = e[h]); h++) {
          a: {
            var c = l;var g = a;var r = b;switch (c.nodeType) {case Node.ELEMENT_NODE:
                for (var y = c.localName, u = "<" + y, Y = c.attributes, I = 0; g = Y[I]; I++) {
                  u += " " + g.name + '="' + g.value.replace(U, H) + '"';
                }u += ">";c = W[y] ? u : u + x(c, r) + "</" + y + ">";break a;case Node.TEXT_NODE:
                c = c.data;c = g && X[g.localName] ? c : c.replace(V, H);break a;case Node.COMMENT_NODE:
                c = "\x3c!--" + c.data + "--\x3e";break a;default:
                throw window.console.error(c), Error("not implemented");}
          }d += c;
        }return d;
      };
    }if (q || R) {
      f.c = function (a, b) {
        var d = v.call(a, !1);this.a && this.a(d);b && (t.call(d.content, v.call(a.content, !0)), z(d.content, a.content));return d;
      };var z = function z(a, b) {
        if (b.querySelectorAll && (b = p(b, "template"), 0 !== b.length)) {
          a = p(a, "template");for (var d = 0, e = a.length, h, k; d < e; d++) {
            k = b[d], h = a[d], f && f.a && f.a(k), w.call(h.parentNode, Z.call(k, !0), h);
          }
        }
      },
          Z = Node.prototype.cloneNode = function (a) {
        if (!B && A && this instanceof DocumentFragment) {
          if (a) var b = aa.call(this.ownerDocument, this, !0);else return this.ownerDocument.createDocumentFragment();
        } else this.nodeType === Node.ELEMENT_NODE && "template" === this.localName && this.namespaceURI == document.documentElement.namespaceURI ? b = f.c(this, a) : b = v.call(this, a);a && z(b, this);return b;
      },
          aa = Document.prototype.importNode = function (a, b) {
        b = b || !1;if ("template" === a.localName) return f.c(a, b);var d = M.call(this, a, b);if (b) {
          z(d, a);a = p(d, 'script:not([type]),script[type="application/javascript"],script[type="text/javascript"]');
          for (var e, h = 0; h < a.length; h++) {
            e = a[h];b = C.call(document, "script");b.textContent = e.textContent;for (var k = e.attributes, l = 0, c; l < k.length; l++) {
              c = k[l], b.setAttribute(c.name, c.value);
            }w.call(e.parentNode, b, e);
          }
        }return d;
      };
    }q && (window.HTMLTemplateElement = f);
  })();
}).call(self);

//# sourceMappingURL=template.min.js.map
//# sourceMappingURL=script.js.map
