// This event will send data to App Insights 
// in the context of Epic, when logged into MyChart.
(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.behaviors.epicAppInsightsTracking = {
    // Check for jwt param in the url.
    attach: function(context, settings) {
      const query_string = window.location.search;
      const url_params = new URLSearchParams(query_string);
      const jwt_param = 'id_token';

      // Check if the token param exists.
      if (url_params.has(jwt_param)) {
        const jwt = url_params.get(jwt_param);
        const jwt_data = this.decodeJwt(jwt);
        // If epicMRN exists, send it to 
        // app insights as the authenticated user.
        if (jwt_data?.epicMRN) {
          appInsights.setAuthenticatedUserContext(jwt_data?.epicMRN);
        }
      }
    },

    // Decode jwt param.
    decodeJwt: function(token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('Invalid JWT format');
          return null;
        }

        const base64UrlPayload = parts[1];
        const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = atob(base64Payload);
        const payloadObject = JSON.parse(decodedPayload);

        return payloadObject;
      } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
