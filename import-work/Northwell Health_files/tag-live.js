(function(networkId) {
var automaticIntegrations = {"googleAnalytics":{"paramName":"g_cid"},"gaSessionId":{"paramName":"ga_session_id"}};

var cacheLifetimeDays = 7;

var customDataWaitForConfig = [
  { on: function() { return Invoca.Client.parseCustomDataField("Agency", "First", "URLParam", ""); }, paramName: "Agency", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("_evga_981d", "Last", "JavascriptDataLayer", "window.northwellInvocaHelpers.sfmcUserId"); }, paramName: "_evga_981d", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("_fbc", "Last", "Cookie", "_fbc"); }, paramName: "_fbc", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("_fbp", "Last", "Cookie", "_fbp"); }, paramName: "_fbp", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("adgroupid", "Last", "URLParam", ""); }, paramName: "adgroupid", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("call_sentiment_overall_label", "Unique", "URLParam", ""); }, paramName: "call_sentiment_overall_label", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("calling_page", "Last", "JavascriptDataLayer", "window.location.hostname + window.location.pathname"); }, paramName: "calling_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("calling_page_full", "Last", "JavascriptDataLayer", "window.location.href"); }, paramName: "calling_page_full", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("campaign_line_match", "Last", "URLParam", ""); }, paramName: "campaign_line_match", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("campaign_region", "Last", "URLParam", ""); }, paramName: "campaign_region", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("campaignid", "Last", "URLParam", ""); }, paramName: "campaignid", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("conversation_languages", "Last", "URLParam", ""); }, paramName: "conversation_languages", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("customer_id", "Last", "URLParam", ""); }, paramName: "customer_id", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("customer_journey", "Multi", "JavascriptDataLayer", "location.pathname"); }, paramName: "customer_journey", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("dclid", "Last", "URLParam", ""); }, paramName: "dclid", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("destination_time_zone", "Unique", "URLParam", ""); }, paramName: "destination_time_zone", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("dml_group", "Last", "JavascriptDataLayer", "window.northwellInvocaHelpers.dmlGroup"); }, paramName: "dml_group", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("final_phone_number", "Last", "URLParam", ""); }, paramName: "final_phone_number", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("first_page", "First", "JavascriptDataLayer", "window.location.href"); }, paramName: "first_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("ga_first_start_time", "First", "JavascriptDataLayer", "window.northwellInvocaHelpers.gtmStartTimestamp"); }, paramName: "ga_first_start_time", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("ga_last_start_time", "Last", "JavascriptDataLayer", "window.northwellInvocaHelpers.gtmStartTimestamp"); }, paramName: "ga_last_start_time", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("gbraid", "Last", "URLParam", ""); }, paramName: "gbraid", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("gclid", "Last", "URLParam", ""); }, paramName: "gclid", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("gclsrc", "Last", "URLParam", ""); }, paramName: "gclsrc", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("invoca_campaign", "Last", "URLParam", ""); }, paramName: "invoca_campaign", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("keyword", "Last", "URLParam", ""); }, paramName: "keyword", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("landing_host", "First", "JavascriptDataLayer", "window.location.hostname"); }, paramName: "landing_host", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("landing_page", "First", "JavascriptDataLayer", "window.location.hostname + window.location.pathname"); }, paramName: "landing_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("lookup_forward", "Last", "URLParam", ""); }, paramName: "lookup_forward", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("marketing_channel", "Last", "URLParam", ""); }, paramName: "marketing_channel", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("nw_session_id", "Last", "Cookie", "nw_session_id"); }, paramName: "nw_session_id", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("pk_utm_id", "Last", "URLParam", ""); }, paramName: "pk_utm_id", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("profile_name", "Last", "URLParam", ""); }, paramName: "profile_name", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("provider_id", "Last", "JavascriptDataLayer", "window.northwellInvocaHelpers.physicianNPI"); }, paramName: "provider_id", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("service_line", "Last", "URLParam", ""); }, paramName: "service_line", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("sfmc_event", "Last", "JavascriptDataLayer", "window.northwellInvocaHelpers.sfmcEventName"); }, paramName: "sfmc_event", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_campaign", "Last", "JavascriptDataLayer", "Invoca.Client.getCurrUTMs().utm_campaign"); }, paramName: "utm_campaign", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_content", "Last", "URLParam", ""); }, paramName: "utm_content", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_medium", "Last", "JavascriptDataLayer", "Invoca.Client.getCurrUTMs().utm_medium"); }, paramName: "utm_medium", fallbackValue: function() { return Invoca.PNAPI.currentPageSettings.poolParams.utm_medium || null; } },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_source", "Last", "JavascriptDataLayer", "Invoca.Client.getCurrUTMs().utm_source"); }, paramName: "utm_source", fallbackValue: function() { return Invoca.PNAPI.currentPageSettings.poolParams.utm_source || null; } },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_term", "Last", "URLParam", ""); }, paramName: "utm_term", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("wbraid", "Last", "URLParam", ""); }, paramName: "wbraid", fallbackValue: null }
];

var customDataWaitForConfigAnonymousFunctions = [
  { on: function() { return Invoca.Client.parseCustomDataField("_evga_981d", "Last", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.sfmcUserId); }) }, paramName: "_evga_981d", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("calling_page", "Last", "JavascriptDataLayer", function() { return (window.location.hostname + window.location.pathname); }) }, paramName: "calling_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("calling_page_full", "Last", "JavascriptDataLayer", function() { return (window.location.href); }) }, paramName: "calling_page_full", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("customer_journey", "Multi", "JavascriptDataLayer", function() { return (location.pathname); }) }, paramName: "customer_journey", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("dml_group", "Last", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.dmlGroup); }) }, paramName: "dml_group", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("first_page", "First", "JavascriptDataLayer", function() { return (window.location.href); }) }, paramName: "first_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("ga_first_start_time", "First", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.gtmStartTimestamp); }) }, paramName: "ga_first_start_time", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("ga_last_start_time", "Last", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.gtmStartTimestamp); }) }, paramName: "ga_last_start_time", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("landing_host", "First", "JavascriptDataLayer", function() { return (window.location.hostname); }) }, paramName: "landing_host", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("landing_page", "First", "JavascriptDataLayer", function() { return (window.location.hostname + window.location.pathname); }) }, paramName: "landing_page", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("provider_id", "Last", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.physicianNPI); }) }, paramName: "provider_id", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("sfmc_event", "Last", "JavascriptDataLayer", function() { return (window.northwellInvocaHelpers.sfmcEventName); }) }, paramName: "sfmc_event", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_campaign", "Last", "JavascriptDataLayer", function() { return (Invoca.Client.getCurrUTMs().utm_campaign); }) }, paramName: "utm_campaign", fallbackValue: null },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_medium", "Last", "JavascriptDataLayer", function() { return (Invoca.Client.getCurrUTMs().utm_medium); }) }, paramName: "utm_medium", fallbackValue: function() { return Invoca.PNAPI.currentPageSettings.poolParams.utm_medium || null; } },
  { on: function() { return Invoca.Client.parseCustomDataField("utm_source", "Last", "JavascriptDataLayer", function() { return (Invoca.Client.getCurrUTMs().utm_source); }) }, paramName: "utm_source", fallbackValue: function() { return Invoca.PNAPI.currentPageSettings.poolParams.utm_source || null; } }
];

var defaultCampaignId = "horizon";

var destinationSettings = {
  paramName: "call_forwarding_destination",
  matchLocalNumbers: false,
  matchTollFreeNumbers: false
};

var formTrackingEnabled = false;

var numbersToReplace = {
  "(833) GO-COHEN": null,
  "(833) SI-HEART": null,
  "(833) WBREAST": null,
  "(855) 60-LIVER": null,
  "(855) HEART-11": null,
  "(855) ORTHO-04": null,
  "(855) 37-NEURO": null,
  "(844) 56-NEURO": null,
  "(833) XREFLUX": null,
  "(844) 94-SPINE": null,
  "(833) W-BREAST": null,
  "(877) HEART-BEAT": null,
  "(877) HEART-BE": null,
  "833-64WOMEN": null,
  "(833) NWH-HIFU": null,
  "(833) 4GYN-ONC": null,
  "833-4GYN-ONC": null,
  "(888) NWH-IBDC": null,
  "(833) PSA-1600": null,
  "(833) 6-HERNIA": null,
  "(914) 418-CARE": null,
  "833-881-SKIN": null,
  "(844) 88-SPINE": null,
  "(833) CCDIRECT": null
};

var organicSources = false;

var reRunAfter = 10000;

var requiredParams = {"invoca_campaign":"*"};

var resetCacheOn = ['utm_campaign'];

var waitFor = 0;

var customCodeIsSet = (function() {
  Invoca.Client.customCode = function(options) {
    // params to be stored client side as part of the SSA migration
// this list must be kept in sync with any use of readInvocaData
// (g_cid + ga_session_id added: they are now set client-side from the URL below)
try {
  Invoca.Tools.allowedClientSideParams(['gclid', 'gcm_uid', 'g_cid', 'ga_session_id']);
} catch (error) {
  console.log(error);
}

function useGCM() {
  if (Invoca.Tools.readUrl("gclid") || Invoca.Tools.readInvocaData("gclid")) {
    return null;
  } else {
    return Invoca.Tools.readUrl("gcm_uid") ||
        Invoca.Tools.readCookie("gcm_uid") ||
        Invoca.Tools.readInvocaData("gcm_uid");
  }
}

options.destinationSettings.paramName = "invoca_detected_destination";
options.poolParams.gcm_uid = useGCM();
options.campaignIdOverrideParam = 'invoca_campaign';

// fallbackValue:null so a missing GA id reports blank instead of the default
// "not_found" -- "not_found" is a real value and would overwrite a good g_cid
// that the cross-domain block below re-asserts on param-less findcare pages.
options.integrations.googleAnalytics = { fallbackValue: null };

/* =====================================================================
   CROSS-DOMAIN ID INHERITANCE
   northwell.edu  ->  findcare.nuvancehealth.org (Kyruus)

   The northwell.edu link-decoration tag appends these params to the
   destination URL:
     nw_cid    = raw _ga cookie value             (e.g. "GA1.1.<cid>.<ts>")
     nw_sid    = raw _ga_<container> cookie value (e.g. "GS2.1.s<sid>$o...")
     invoca_id = the Invoca visitor id minted on northwell.edu

   By default the destination Invoca tag mints a NEW invoca_id and reads
   the destination's OWN GA ids, so nothing stitches back to the origin
   session. This block makes the tag adopt the passed-in ids instead.

   On origin / normal pages these URL params are absent, so every branch
   below is skipped and existing behavior is unchanged. Deploy this on
   the DESTINATION (findcare) tag, where the new id would otherwise be
   minted; running it on the origin is a harmless no-op.
   ===================================================================== */
try {
  /* --- PARSING: match the shape your same-domain g_cid/ga_session_id use ---
     Confirmed via live tag test: your captured values are PARSED
     ("<cid>.<ts>" and "<sid>"), so the raw nw_cid/nw_sid are parsed to match.

     --- RE-ASSERT on param-less pages ---
     On the decorated landing the value comes from the URL. On a deeper
     findcare page the URL params are gone and the GA integration finds no
     Northwell GA on that domain, so without this it would fall back to
     "not_found" and overwrite the good value. So we fall back to the value
     already persisted in the session (readInvocaData, enabled by adding
     these to allowedClientSideParams) and re-assert it via poolParams.
     The !== 'not_found' guard ensures a bad value never gets written back. */
  var parseGaClientId = function (raw) {
    if (!raw) return null;
    var m = raw.match(/^GA\d+\.\d+\.(.+)$/);   // "GA1.1.<cid>.<ts>" -> "<cid>.<ts>"
    return m ? m[1] : raw;                     // already parsed -> pass through
  };
  var parseGaSessionId = function (raw) {
    if (!raw) return null;
    var parts = raw.split('.');
    if (parts[0] === 'GS1') return parts[2] || null;                                      // GS1.1.<sid>.<...>
    if (parts[0] === 'GS2') return parts[2] ? parts[2].split('$')[0].substring(1) : null; // GS2.1.s<sid>$...
    return raw;                                // already parsed -> pass through
  };

  // 1) GA client id -> g_cid   (URL on landing, else the value already stitched into the session)
  var urlClientId = parseGaClientId(Invoca.Tools.readUrl('nw_cid')) ||
                    Invoca.Tools.readInvocaData('g_cid');
  if (urlClientId && urlClientId !== 'not_found') {
    options.poolParams.g_cid = urlClientId;
  }

  // 2) GA session id -> ga_session_id
  var urlSessionId = parseGaSessionId(Invoca.Tools.readUrl('nw_sid')) ||
                     Invoca.Tools.readInvocaData('ga_session_id');
  if (urlSessionId && urlSessionId !== 'not_found') {
    options.poolParams.ga_session_id = urlSessionId;
  }

  // 3) GA start-time timestamps -> ga_first_start_time / ga_last_start_time
  //    These fields read window.northwellInvocaHelpers.gtmStartTimestamp, which
  //    is fed by gtm.start (Date.now() at GTM container boot = a per-pageview
  //    LOAD timestamp). findcare/Kyruus has no GTM, so that helper tag never runs
  //    there and the fields have no source (null/not_found).
  //    Backfill the source instead of carrying anything across: keep the real
  //    gtm.start where it exists (northwell), otherwise stamp this pageview with
  //    Date.now() at customCode execution -- which is itself a genuine
  //    findcare-pageview load timestamp. The tag's own field config + First/Last
  //    attribution then work normally on both domains. No nw_ts needed: this is
  //    the findcare pageview's OWN time, not a value carried from northwell.
  window.northwellInvocaHelpers = window.northwellInvocaHelpers || {};
  if (!window.northwellInvocaHelpers.gtmStartTimestamp) {
    window.northwellInvocaHelpers.gtmStartTimestamp = Date.now();
  }

  // 4) Invoca visitor id -> overwrite the Invoca session id.
  //    poolParams CANNOT do this: the tag re-reads/mints invoca_id from its
  //    own session cache after poolParams are applied. So we write the URL
  //    value straight into the session cache before the tag reads it. This
  //    is the "check the URL, and if present overwrite the cookie id" step
  //    Invoca recommended for cross-domain.
  var urlInvocaId = Invoca.Tools.readUrl('invoca_id');
  if (urlInvocaId) {
    try {
      if (Invoca._Cache && Invoca._Cache.set) {
        Invoca._Cache.initialize();                             // load the session cache
        Invoca._Cache.set('session', 'invoca_id', urlInvocaId); // overwrite the id
      }
    } catch (e) { console.log('invoca_id cache override failed: ' + e); }
    // belt-and-suspenders: localStorage fallback + expose on this request
    try { window.localStorage.setItem('invoca_id', urlInvocaId); } catch (e) {}
    options.poolParams.invoca_id = urlInvocaId;
  }
} catch (error) {
  console.log('Cross-domain ID inheritance failed: ' + error);
}

/* ======================================================================
   SPA RE-SWAP
   Separate concern from the cross-domain stitch above. Lives here (in the
   customCode) on purpose: editing this publishes to northwell.edu AND
   findcare at once from the Invoca platform, with no Kyruus/Tealium ticket.
   It self-triggers, so it REPLACES the separate rerun tag and its
   fire-after ordering + custom-event triggers.

   Re-runs Invoca on: SPA navigation (pushState/replaceState/popstate) and
   any results re-render (MutationObserver). Throttled to ~1 run()/sec.
   Self-limiting: once numbers are swapped Invoca caches them, so repeat
   run()s send no requests and cause no further DOM mutations. No eligibility
   cookie-gate needed here -- the tag's own requiredParams gating makes run()
   a no-op when it shouldn't fire.

   Proven live on Kyruus/findcare: 11/11 numbers swapped on paginate. The
   MutationObserver is the piece that fixes the old retry-loop's race (it
   swapped some numbers and missed the rest because it cleared before the
   new rows rendered). NOTE: the observer is not in Invoca's support docs --
   it's the general "detect new content" mechanism behind their "call run()
   when content reloads" guidance; worth flagging to Invoca (Charlie/Kihana).
   ====================================================================== */
try {
  if (!window.__invocaSpaRerun) {
    window.__invocaSpaRerun = true;

    var __reRun = function () {
      try { if (window.Invoca && Invoca.PNAPI && Invoca.PNAPI.run) Invoca.PNAPI.run(); } catch (e) {}
    };

    // Throttle: leading + trailing, ~1/sec. A continuously re-rendering page
    // triggers at most one run() per second rather than starving or spamming.
    var __last = 0, __pending = null;
    var __schedule = function () {
      var wait = 1000 - (Date.now() - __last);
      if (wait <= 0) { __last = Date.now(); __reRun(); }
      else if (!__pending) {
        __pending = setTimeout(function () { __pending = null; __last = Date.now(); __reRun(); }, wait);
      }
    };

    // SPA navigation (pagination = pushState; filters/sorts often use
    // pushState/replaceState; back/forward = popstate).
    ['pushState', 'replaceState'].forEach(function (m) {
      var o = history[m];
      if (typeof o === 'function') {
        history[m] = function () { var r = o.apply(this, arguments); try { __schedule(); } catch (e) {} return r; };
      }
    });
    window.addEventListener('popstate', __schedule);

    // Results re-render. Fires AFTER new rows are committed, which is the
    // correctly-timed moment to re-swap and is what fixes the race.
    if ('MutationObserver' in window) {
      var __mo = new MutationObserver(__schedule);
      var __startObs = function () { __mo.observe(document.body, { childList: true, subtree: true }); };
      if (document.body) __startObs();
      else document.addEventListener('DOMContentLoaded', __startObs);
    }
  }
} catch (error) {
  console.log('SPA re-swap setup failed: ' + error);
}

return options;
  };

  return true;
})();

var generatedOptions = {
  active:              true,
  autoSwap:            true,
  cookieDays:          cacheLifetimeDays,
  country:             "US",
  dataSilo:            "us",
  defaultCampaignId:   defaultCampaignId,
  destinationSettings: destinationSettings,
  disableUrlParams:    ['call_treatment_ab_test_path','debug_notes','gcm_uid'],
  doNotSwap:           [],
  formTrackingEnabled: formTrackingEnabled,
  integrations:        automaticIntegrations,
  maxWaitFor:          waitFor,
  networkId:           networkId || null,
  numberToReplace:     numbersToReplace,
  organicSources:      organicSources,
  poolParams:          {},
  reRunAfter:          reRunAfter,
  requiredParams:      requiredParams,
  resetCacheOn:        resetCacheOn,
  waitForData:         customDataWaitForConfig,
  waitForDataAnonymousFunctions:  customDataWaitForConfigAnonymousFunctions
};

Invoca.Client.startFromWizard(generatedOptions);

})(1635);
