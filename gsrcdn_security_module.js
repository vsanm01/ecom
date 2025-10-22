(function(window) {
  'use strict';

  // GSRCDN Secure Request Library
  const GSRCDN = {
    // Configuration object (should be set by user)
    config: {
      apiToken: '',
      hmacSecret: '',
      scriptUrl: ''
    },

    // Initialize the library with configuration
    init: function(config) {
      this.config = {
        apiToken: config.apiToken || '',
        hmacSecret: config.hmacSecret || '',
        scriptUrl: config.scriptUrl || ''
      };
      return this;
    },

    // Compute HMAC-SHA256
    computeHMAC: function(params, secret) {
      if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS is required. Please include it before this library.');
      }
      return CryptoJS.HmacSHA256(params, secret).toString();
    },

    // Create signature from parameters
    createSignature: function(params, secret) {
      const sortedKeys = Object.keys(params).sort();
      const signatureString = sortedKeys
        .map(key => key + '=' + params[key])
        .join('&');
      return this.computeHMAC(signatureString, secret);
    },

    // Make secure request
    makeSecureRequest: async function(params) {
      try {
        // Validate configuration
        if (!this.config.apiToken || !this.config.hmacSecret || !this.config.scriptUrl) {
          throw new Error('GSRCDN not properly initialized. Call GSRCDN.init() first.');
        }

        // Add required parameters
        params.token = this.config.apiToken;
        params.timestamp = Date.now().toString();
        params.referrer = window.location.origin;
        params.origin = window.location.origin;
        
        // Create signature
        params.signature = this.createSignature(params, this.config.hmacSecret);

        // Build URL with parameters
        const url = new URL(this.config.scriptUrl);
        Object.keys(params).forEach(key => {
          url.searchParams.append(key, params[key]);
        });

        // Make request
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success') {
          return data;
        } else {
          throw new Error(data.message || 'Request failed');
        }
      } catch (error) {
        console.error('GSRCDN secure request error:', error);
        throw error;
      }
    }
  };

  // Export to window
  window.GSRCDN = GSRCDN;

})(window);
