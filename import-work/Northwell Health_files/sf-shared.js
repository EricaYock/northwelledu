// List of specific URL paths that should show the salesforce chat button on.
// Adding an astrix at the end will make it a wild card.
const paths_to_show_chat_button = [
  '/help*',
  '/northwellhealthapp'
];
const paths_to_show_chat_w_phi = [
  '/help*',
  '/patient-portal',
  '/northwellhealthapp'
];

const selectLanguage = () => {
  let user_selected_language = "en_US";
  let url_params = new URLSearchParams(window.location.search);

  // Check if a query param for locale exists.
  if (url_params.has('locale')) {
    user_selected_language = url_params.get('locale');
    Localize.setLanguage(user_selected_language)
  } else {
    user_selected_language = Localize.getLanguage();
  }

  return user_selected_language;
};

const getConfigEnv = () => {
  let configEnv;
  switch (window.drupalSettings.salesforce_chat.sf_env) {
    case 'prod':
      configEnv = 'prod';
      break;
    case 'entuat':
      configEnv = 'qa';
      break;
    case 'sit':
      configEnv = 'sit';
      break;
    case 'devint':
    default:
      configEnv = 'dev';
      break;
  }
  return configEnv;
};

const constructAppConfigRequest = (isAsync = true) => {
  const xhttp = new XMLHttpRequest();
  const url = `${window.drupalSettings.dpx_api_url}/app/config`;
  xhttp.open('POST', url, isAsync);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.timeout = 5000;
  return xhttp;
};

const makeRequest = (configType) => {
  const xhr = constructAppConfigRequest();
  return new Promise(function (resolve, reject) {
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject({
          status: xhr.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: xhr.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(`configType=${configType}`);
  });
}

const showChatWindow = () => {
  // Determine which pages should show the button
  let display_button = false;
  for (let path of paths_to_show_chat_w_phi) {
    // Check for a wildcard match
    if (path.indexOf('*')) {
      path = path.replace('*', '');
      if (window.location.href.indexOf(path) > -1) {
        display_button = true;
      }
    }
    // Check for an exact match
    else {
      if (window.location.pathname == path) {
        display_button = true;
      }
    }
  }

  return display_button;
};

const trackOpenChatAnalytics = () => {
  // Start App Insights Tracking
  try {
    if(gigya){
      gigya.accounts.getAccountInfo({
        callback: (response) => {
          // Check we're logged in.
          const gigUID = response.UID ? response.UID : null;
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
                      testId: "Help-Button-Chat",
                      }
                },
              });
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
            }
          }
        },
      });
    }
    // END App Insights Tracking
    // START Google Tag Manager Tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "salesforceChatbot",
      action: "open chat",
    });
    // END Google Tag Manager Tracking
  } catch (e) {
    console.log(e);
  }
};

// Salesforce chat
// Code below does not need to be different per environment
(function ($, Drupal, drupalSettings) {
  "use strict";
  let maximizedChat = false;

  // if the drupal module has disabled the chat, dont display.
  if (typeof drupalSettings.salesforce_chat.enabled !== 'undefined' && drupalSettings.salesforce_chat.enabled == false)
    return;

  if (location.search.indexOf("app-version") >= 0 && location.search.toLowerCase().indexOf("show-chat=true") > 0)
  {
    maximizedChat = true;
  }

  /* Function to add style to element */
  function addStyle(styles) {
    /* Create style document */
    let css = document.createElement("style");
    css.type = "text/css";

    if (css.styleSheet) {
      css.styleSheet.cssText = styles;
    } else {
      css.appendChild(document.createTextNode(styles));
    }
    /* Append style to the tag name */
    document.getElementsByTagName("head")[0].appendChild(css);
  }

  function getButtonText() {
    let btnText = '';
    const language = selectLanguage();
    switch (language) {
      case 'es':
        btnText = '¡Habla con nosotros!';
        break;
      case 'ko':
        btnText = '우리와 함께 채팅!';
        break;
      case 'ru':
        btnText = 'Поболтай с нами!';
        break;
      case 'zh':
        btnText = '和我们聊天!';
        break;
      default:
        btnText = 'Chat with us!';
        break;
    }
    return btnText;
  }

  function loadingChatButton(openChat=false) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('hide-chat') === 'true') {
      return;
    }
    if (!is_new_chat_open) {
      const btnText = getButtonText();
      setTimeout(() => {
        // check if SF chat frame is open
        if (!$('#embeddedMessagingFrame').length > 0) {
          $('.embeddedMessagingConversationButtonWrapper').append(`<div class="embeddedServiceHelpButton"><div class="helpButton"><button class="uiButton helpButtonEnabled" href="javascript:void(0)" aria-disabled="true"><span class="helpButtonLabel" id="helpButtonSpan" aria-live="polite" aria-atomic="true"><span class="message">${btnText}</span></span></button></div></div>`).on('click','.embeddedServiceHelpButton',launchNewChat);
          if (urlParams.get('from') === 'mynorthwell' && openChat) {
            $('.embeddedServiceHelpButton').trigger('click');
          }
        }
      }, 1000);
    }
  }

  let styles = ''

  /* chat bot style */
  if (maximizedChat) {
    styles =
    "body{padding-top: 0rem !important;}\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.minimizedContainer, .embeddedServiceSidebarMinimizedDefaultUI.minimizedContainer:hover, .embeddedServiceHelpButton .helpButton .uiButton { background-color: #fff !important; font-family: 'Arial', sans-serif; border-radius: 30px; color: #34383C !important; max-width: 18em !important; font-size: 14px !important; border: 0; height: 60px;}\n" +
    ".embeddedServiceSidebar, .embeddedServiceHelpButton { margin-left: auto; margin-right: auto; left: 0; right: 0; text-align: right; bottom: 0; height: 0; top: auto !important; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 1px solid #005290; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton { border-radius: 30px !important; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
    ".embeddedServiceHelpButton .helpButton, .embeddedServiceHelpButton.embeddedServiceBottomTabBar .helpButton { bottom: 30px; }\n" +
    ".embeddedServiceHelpButton .helpButton { position: absolute; }\n" +
    ".embeddedServiceHelpButton .embeddedServiceIcon { display: none !important; }\n" +
    ".embeddedServiceHelpButton .uiButton.helpButtonDisabled .helpButtonLabel::before { background: #717376; content: '\\f4b3'; height: 38px; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton.helpButtonDisabled { padding: 0 0 0 10px; width: 220px; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel { text-align: left; justify-content: left; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel::before { font-family: 'Font Awesome 6 Pro'; font-size: 1.10em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #9F28B5; color: #fff; border-radius: 20px; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { text-decoration: none; line-height: 20px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 0 !important; }\n" +
    ".helpButtonEnabled:focus .helpButtonLabel { text-decoration: none !important; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .content .message:focus, .embeddedServiceSidebarMinimizedDefaultUI .content .message:active, .embeddedServiceSidebarMinimizedDefaultUI .content .message:hover, .embeddedServiceSidebarMinimizedDefaultUI:focus, .embeddedServiceSidebarMinimizedDefaultUI .content .message { color: #34383C; text-decoration: none !important; font-size: 14px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover::before, .embeddedServiceHelpButton .helpButton .helpButtonEnabled:focus::before { background-color: inherit; opacity: 0; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover .helpButtonLabel::before { background: #fff; color: #003ca5; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover { color: #fff !important; background-color: #003ca5 !important; }\n" +
    "@media screen and ( max-width: 767px) {\n" +
    ".embedded-messaging .embeddedMessagingFrame { margin: 0 !important; max-height:calc(100vh)!important; max-width:calc(100vw)!important; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton.helpButtonDisabled { width: auto; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton { min-width: 3.4em !important; height: 60px !important; width: 60px !important; border-radius: 30px !important; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton { min-width: unset; width: 46px; padding: 0 0 0 13px; height: 60px; width: 60px; }\n" +
    ".embeddedServiceHelpButton { bottom: 60px; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton .message, .embeddedServiceHelpButton .uiButton .helpButtonLabel .message { display: none; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .minimizedText { margin-left: 9px; }\n" +
    "}\n" +
    ".embeddedServiceSidebar, .embeddedServiceSidebarButton, .embeddedServiceSidebarFormField {font-family: 'TheSans',sans-serif !important;}\n" +
    ".embeddedServiceSidebar {height: 60px;}\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI { bottom: 75px !important; position: absolute !important; width: auto !important; }\n" +
    ".embeddedServiceIcon.x-small svg { width: 18px !important; height: 18px !important; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton { height: 60px !important; border-radius: 30px !important;bottom: 40px; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .messageContent { justify-content: left !important;  }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .minimizedText { flex-direction: row !important; margin-left: 8px; } \n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .minimizedText::before {font-family: 'Font Awesome 6 Pro'; font-size: 1.5em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #9F28B5; color: #fff; border-radius: 20px;}\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .embeddedServiceIcon { display: none; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .content { padding: 0 !important; }\n" +
    "embeddedservice-chat-header svg.slds-icon-text-default { min-width: 20px; min-height: 20px; }\n" +
    ".embeddedServiceSidebarButton:focus { text-decoration:none !important; }";
  }
  else{
    styles =
    ".embeddedServiceSidebarMinimizedDefaultUI.minimizedContainer, .embeddedServiceSidebarMinimizedDefaultUI.minimizedContainer:hover, .embeddedServiceHelpButton .helpButton .uiButton { background-color: #fff !important; font-family: 'Arial', sans-serif; border-radius: 30px; color: #34383C !important; max-width: 18em !important; font-size: 14px !important; border: 0; height: 60px;}\n" +
    ".embeddedServiceSidebar, .embeddedServiceHelpButton { margin-left: auto; margin-right: auto; left: 0; right: 0; text-align: right; bottom: 0; height: 0; top: auto !important; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 1px solid #005290; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton { border-radius: 30px !important; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
    ".embeddedServiceHelpButton .helpButton, .embeddedServiceHelpButton.embeddedServiceBottomTabBar .helpButton { bottom: 30px; }\n" +
    ".embeddedServiceHelpButton .helpButton { position: absolute; }\n" +
    ".embeddedServiceHelpButton .embeddedServiceIcon { display: none !important; }\n" +
    ".embeddedServiceHelpButton .uiButton.helpButtonDisabled .helpButtonLabel::before { background: #717376; content: '\\f4b3'; height: 38px; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton.helpButtonDisabled { padding: 0 0 0 10px; width: 220px; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel { text-align: left; justify-content: left; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel::before { font-family: 'Font Awesome 6 Pro'; font-size: 1.10em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #9F28B5; color: #fff; border-radius: 20px; }\n" +
    ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { text-decoration: none; line-height: 20px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 0 !important; }\n" +
    ".helpButtonEnabled:focus .helpButtonLabel { text-decoration: none !important; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .content .message:focus, .embeddedServiceSidebarMinimizedDefaultUI .content .message:active, .embeddedServiceSidebarMinimizedDefaultUI .content .message:hover, .embeddedServiceSidebarMinimizedDefaultUI:focus, .embeddedServiceSidebarMinimizedDefaultUI .content .message { color: #34383C; text-decoration: none !important; font-size: 14px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover::before, .embeddedServiceHelpButton .helpButton .helpButtonEnabled:focus::before { background-color: inherit; opacity: 0; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover .helpButtonLabel::before { background: #fff; color: #003ca5; }\n" +
    ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover { color: #fff !important; background-color: #003ca5 !important; }\n" +
    "@media screen and ( max-width: 767px) {\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton.helpButtonDisabled { width: auto; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton { min-width: 3.4em !important; height: 60px !important; width: 60px !important; border-radius: 30px !important; }\n" +
    ".embeddedServiceHelpButton .helpButton .uiButton { min-width: unset; width: 46px; padding: 0 0 0 13px; height: 60px; width: 60px; }\n" +
    ".embeddedServiceHelpButton { bottom: 60px; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton .message, .embeddedServiceHelpButton .uiButton .helpButtonLabel .message { display: none; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .minimizedText { margin-left: 9px; }\n" +
    "}\n" +
    ".embeddedServiceSidebar, .embeddedServiceSidebarButton, .embeddedServiceSidebarFormField {font-family: 'TheSans',sans-serif !important;}\n" +
    ".embeddedServiceSidebar {height: 60px;}\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI { bottom: 75px !important; position: absolute !important; width: auto !important; }\n" +
    ".embeddedServiceIcon.x-small svg { width: 18px !important; height: 18px !important; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI.helpButton { height: 60px !important; border-radius: 30px !important;bottom: 40px; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .messageContent { justify-content: left !important;  }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI:not(.waiting) .minimizedText { flex-direction: row !important; margin-left: 8px; } \n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .minimizedText::before {font-family: 'Font Awesome 6 Pro'; font-size: 1.5em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #9F28B5; color: #fff; border-radius: 20px;}\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .embeddedServiceIcon { display: none; }\n" +
    ".embeddedServiceSidebarMinimizedDefaultUI .content { padding: 0 !important; }\n" +
    "embeddedservice-chat-header svg.slds-icon-text-default { min-width: 20px; min-height: 20px; }\n" +
    ".embeddedServiceSidebarButton:focus { text-decoration:none !important; }";
  }

  /* Function call to add style */
  window.onload = function () {
    initiateSalesForce();
    if (typeof Localize !== "undefined") {
      Localize.on("setLanguage", function(data) {
        // Ignore no-op events (Localize fires setLanguage during its own init).
        if (data.from === data.to) return;

        // If the page just reloaded for this exact language transition, Localize
        // is re-firing the event as it catches up to the persisted preference.
        // Don't reload again or we loop forever.
        // Sentinel keyed on target language only, because after reload Localize
        // fires with from=source (typically 'en'), not the previous selection.
        var sentinelKey = "sf_chat_lang_reload_to";
        try {
          if (sessionStorage.getItem(sentinelKey) === data.to) {
            sessionStorage.removeItem(sentinelKey);
            return;
          }
          sessionStorage.setItem(sentinelKey, data.to);
        } catch (e) {
          // sessionStorage blocked (private mode, cookie settings). Fall through;
          // at worst we reload once extra, which matches previous behavior.
        }

        console.log("setLanguage: from '" + data.from + "' to '" + data.to + "' [reloading]");
        window.location.reload();
      });
    }
  };

  function initiateSalesForce() {
    let isSFChatWithPHIEnabled = false;
    makeRequest('toggles').then(response => {
      const res = JSON.parse(response);
      const toggles = res?.mobileAppConfig?.[0]?.configJson;
      isSFChatWithPHIEnabled =
        toggles &&
        toggles.find(toggle => toggle?.sfChatWithPHI)?.sfChatWithPHI.enabled;
      const configType = isSFChatWithPHIEnabled ? 'helpCenterConfigV3' : 'helpCenterConfigV2';
      return makeRequest(configType);
    }).then(response => {
      const res = JSON.parse(response);
      const chatWithAgentConfig = res?.mobileAppConfig?.[0]?.configJson?.[0]?.chatWithAgentConfig?.[getConfigEnv()];
      if (isSFChatWithPHIEnabled) {
          // Salesforce chat with PHI integration
        if (showChatWindow()) {
          // New chat button styles
          if (maximizedChat) {
            styles =
              "body{padding-top: 0rem !important;}\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton { background-color: #fff !important; font-family: 'Arial', sans-serif; border-radius: 30px; color: #34383C !important; max-width: 18em !important; font-size: 14px !important; border: 0; height: 60px;}\n" +
              ".embeddedServiceHelpButton { margin-left: auto; margin-right: auto; left: 0; right: 0; text-align: right; bottom: 0; height: 0; top: auto !important; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 1px solid #005290; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton { border-radius: 30px !important; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
              ".embeddedServiceHelpButton .helpButton { bottom: 30px; right: 30px; }\n" +
              ".embeddedServiceHelpButton .helpButton { position: fixed; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel { text-align: left; justify-content: left; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel::before { font-family: 'Font Awesome 6 Pro'; font-size: 1.10em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #007BC2; color: #fff; border-radius: 20px; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { text-decoration: none; line-height: 20px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 0 !important; }\n" +
              ".helpButtonEnabled:focus .helpButtonLabel { text-decoration: none !important; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover::before, .embeddedServiceHelpButton .helpButton .helpButtonEnabled:focus::before { background-color: inherit; opacity: 0; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover .helpButtonLabel::before { background: #fff; color: #007BC2; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover { color: #fff !important; background-color: #007BC2 !important; }\n" +
              "@media screen and ( max-width: 767px) {\n" +
              ".embedded-messaging .embeddedMessagingFrame { margin: 0 !important; max-height:calc(100vh)!important; max-width:calc(100vw)!important; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton { min-width: unset; width: 46px; padding: 0 0 0 9px; height: 60px; width: 60px; }\n" +
              ".embeddedServiceHelpButton { bottom: 60px; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { display: none; }\n" +
              "}";
          }
          else {
            styles =
              ".embeddedServiceHelpButton .helpButton .uiButton { background-color: #fff !important; font-family: 'Arial', sans-serif; border-radius: 30px; color: #34383C !important; max-width: 18em !important; font-size: 14px !important; border: 0; height: 60px;}\n" +
              ".embeddedServiceHelpButton { margin-left: auto; margin-right: auto; left: 0; right: 0; text-align: right; bottom: 0; height: 0; top: auto !important; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 1px solid #005290; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton { border-radius: 30px !important; box-shadow: 0 0 12px 0 rgb(0 0 0 / 20%); }\n" +
              ".embeddedServiceHelpButton .helpButton { bottom: 30px; right: 30px; }\n" +
              ".embeddedServiceHelpButton .helpButton { position: fixed; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel { text-align: left; justify-content: left; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel::before { font-family: 'Font Awesome 6 Pro'; font-size: 1.10em; content: '\\f4ad'; speak: none; text-rendering: auto; font-weight: normal; font-variant: normal; text-transform: none; -webkit-font-smoothing: antialiased; padding: 10px; margin-right: 8px; background: #007BC2; color: #fff; border-radius: 20px; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { text-decoration: none; line-height: 20px; font-family: 'TheSans',sans-serif; font-weight: 600; }\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton:focus { outline: 0 !important; }\n" +
              ".helpButtonEnabled:focus .helpButtonLabel { text-decoration: none !important; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover::before, .embeddedServiceHelpButton .helpButton .helpButtonEnabled:focus::before { background-color: inherit; opacity: 0; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover .helpButtonLabel::before { background: #fff; color: #007BC2; }\n" +
              ".embeddedServiceHelpButton .helpButton .helpButtonEnabled:hover { color: #fff !important; background-color: #007BC2 !important; }\n" +
              "@media screen and ( max-width: 767px) {\n" +
              ".embeddedServiceHelpButton .helpButton .uiButton { min-width: unset; width: 46px; padding: 0 0 0 9px; height: 60px; width: 60px; }\n" +
              ".embeddedServiceHelpButton { bottom: 60px; }\n" +
              ".embeddedServiceHelpButton .uiButton .helpButtonLabel .message { display: none; }\n" +
              "}";
          }
          sf_chat_configs = chatWithAgentConfig;
          let head = document.getElementsByTagName('head')[0];
          let js = document.createElement("script");
          js.type = "text/javascript";
          js.addEventListener("load", initEmbeddedMessaging);
          js.src = sf_chat_configs.src;
          head.appendChild(js);
        }
      } else {
          // load embedded service js
        let script = document.createElement("script");
        script.src = "https://service.force.com/embeddedservice/5.0/esw.min.js";
        script.type = "text/javascript";
        script.addEventListener("load", init);
        document.getElementsByTagName("head")[0].appendChild(script);
        sfchat_configs = chatWithAgentConfig;
      }
      addStyle(styles);
    }).catch(err => {
      console.log(' >>>>>> error:', err);
    });
  };

  let sfchat_configs; // initialize existing salesforce configs
  let sf_chat_configs; // initialize new salesforce configs
  let is_new_chat_open = false;

  // Salesforce chat with PHI init func
  function initEmbeddedMessaging() {
    try {
        // Language Setting
        let user_selected_language = selectLanguage();
        if (user_selected_language !== 'es') {
          user_selected_language = 'en_US'
        }

        // TODO: refer to the old init block for further chat UI enhancement.

        embeddedservice_bootstrap.settings.language = user_selected_language;
        window.addEventListener("onEmbeddedMessagingReady", () => {
          embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields( { "LanguageCode" : user_selected_language } );
          // Hide the Emoji Button
          embeddedservice_bootstrap.settings.embeddedServiceConfig.embeddedServiceMessagingChannel.showEmojiSelection = false;
          // Hide the Attachment Button
          if (maximizedChat) {
            embeddedservice_bootstrap.settings.embeddedServiceConfig.attachments.endUserToAgent = false;
          }
          // Overwrite the chat header background color
          embeddedservice_bootstrap.settings.embeddedServiceConfig.branding.find(item => item.n == "headerColor").v = "#007BC2"
          // Overwrite the chat avatar background color
          embeddedservice_bootstrap.settings.embeddedServiceConfig.branding.find(item => item.n == "secondaryColor").v = "#009ADF";
          // Define the chatbot logo in the header
          embeddedservice_bootstrap.settings.embeddedServiceConfig.branding.find(item => item.n == "logoImage").v = window.location.origin + "/modules/custom/salesforce_chat/img/Northwell_Salesforce_chatbot_logo.png";

          if (typeof embeddedservice_bootstrap !== 'undefined') {
            if ($('#embeddedMessagingFrame').length > 0) {
              is_new_chat_open = true;
            }
            loadingChatButton(true);
          }

          if (is_new_chat_open) {
            is_new_chat_open = false;
            loadingChatButton();
          }
        });

        // TODO: modify event for analytics logging

        // Deployment Setting
        // Salesforce Company Org Id
        const deploymentId = sf_chat_configs?.deploymentId;

        // Embedded Service Deployment Name
        const deploymentName = sf_chat_configs?.deploymentName;

        // LWR site Environment specific URL for Embedded service deployment
        const deploymentSite = sf_chat_configs?.deploymentSite;

        // Environment Specific URL
        const deploymentSCRT = sf_chat_configs?.deploymentSCRT;
        // Override default behavior and hide the chat button at initialization
        embeddedservice_bootstrap.settings.hideChatButtonOnLoad = true;
        embeddedservice_bootstrap.init(
            deploymentId,
            deploymentName,
            deploymentSite,
            {
                scrt2URL: deploymentSCRT
            }
        );
    } catch (err) {
        console.error("Error loading Embedded Messaging: ", err);
    }
  };

  // Salesforce chat w|o PHI init func
  function init() {
    const initESW = function (gslbBaseURL) {
      var user_selected_language = selectLanguage();

      // Dynamic Button ID based on language
      var sf_button = sfchat_configs.buttonId.en;

      // Switch out copy based on language.
      var lang_translated_text = {};
      switch(user_selected_language) {
        case 'es':
        case 'es-US':
          lang_translated_text.prechat_disclaimer = "Somos conscientes de la importancia de proteger su información. No comparta información médica, personal o confidencial aquí, como detalles sobre su salud, tratamiento, diagnóstico, números de cuenta, contraseñas, número de seguro social, o información de tarjeta de crédito durante esta sesión. Podemos grabar o monitorear esta sesión.";
          lang_translated_text.disabledMinimizedText = "Horario de chat<br>8:00 am a 5:00 pm EST";
          lang_translated_text.defaultMinimizedText = "Comunícate con nosotros!";
          lang_translated_text.loadingText = "...Cargando";
          sf_button = sfchat_configs.buttonId.es;
          break;
        default:
          lang_translated_text.prechat_disclaimer = "We are mindful to protect your personal information. Please don't share any medical, personal or sensitive information here such as any details about your health, treatment or diagnosis, account numbers, passwords, social security number, or credit card information during this session.  We may record or monitor this session.";
          lang_translated_text.disabledMinimizedText = "Chat weekdays<br>8:00 am to 5:00 pm EST";
          lang_translated_text.defaultMinimizedText = "Chat with us!";
          lang_translated_text.loadingText = "...loading";
          break;
      }

      var show = false;
      embedded_svc.addEventHandler("afterMaximize", function (data) {
        if (!show) {
          show = true;
          var li2 = document.createElement("div");
          li2.style.color = "white";
          li2.style.backgroundColor = "#003ca5";
          li2.style.padding = "0px 14px 5px";
          li2.style.fontSize = "12px";
          li2.style.textAlign = 'left';
          li2.style.lineHeight = '18px';
          li2.appendChild(document.createTextNode(lang_translated_text.prechat_disclaimer));

          var sidebar = document.querySelector("div.formContent.embeddedServiceSidebarForm");
          sidebar.insertBefore(li2, sidebar.childNodes[0]);
        }
      });

      // Determine which pages should show the button
      var display_button = false;
      for (var path of paths_to_show_chat_button) {
        // Check for a wildcard match
        if (path.indexOf('*')) {
          path = path.replace('*', '');
          if (window.location.href.indexOf(path) > -1) {
            display_button = true;
          }
        }
        // Check for an exact match
        else {
          if (window.location.pathname == path) {
            display_button = true;
          }
        }
      }

      embedded_svc.settings.displayHelpButton = display_button;
      embedded_svc.settings.language = user_selected_language; //For example, enter 'en' or 'en-US'
      embedded_svc.settings.disabledMinimizedText = lang_translated_text.disabledMinimizedText;
      embedded_svc.settings.defaultMinimizedText = lang_translated_text.defaultMinimizedText;
      embedded_svc.settings.loadingText = lang_translated_text.loadingText;
      embedded_svc.settings.storageDomain = window.location.hostname;
      embedded_svc.settings.enabledFeatures = ["LiveAgent"];
      embedded_svc.settings.entryFeature = "LiveAgent";
      embedded_svc.addEventHandler("onHelpButtonClick", function (data) {
        trackOpenChatAnalytics();
      });

      embedded_svc.init(
        sfchat_configs.url1,
        sfchat_configs.url2,
        gslbBaseURL,
        sfchat_configs.orgId,
        "Live_Chat_Group",
        {
          baseLiveAgentContentURL: sfchat_configs.baseLiveAgentContentURL,
          deploymentId: sfchat_configs.deploymentId,
          buttonId: sf_button,
          baseLiveAgentURL: sfchat_configs.baseLiveAgentUrl,
          eswLiveAgentDevName: "Live_Chat_Group",
          isOfflineSupportEnabled: false,
        }
      );
    };
    if (!window.embedded_svc) {
      var s = document.createElement("script");
      s.setAttribute(
        "src",
        sfchat_configs.scriptSrc
      );
      s.onload = function () {
        initESW(null);
      };
      document.body.appendChild(s);
    } else {
      initESW("https://service.force.com");
    }
  }

  function launchNewChat() {
    $(this).hide();
    embeddedservice_bootstrap.utilAPI.showChatButton();
    embeddedservice_bootstrap.utilAPI.launchChat().then(() => {
      trackOpenChatAnalytics();
      is_new_chat_open = true;
    }).catch(() => {
      is_new_chat_open = false;
      loadingChatButton();
    });
  }

})(jQuery, Drupal, drupalSettings);
