/**
 * GSRCDN Secure Request Library
 * Version: 1.0.0
 * A lightweight library for making secure API requests with HMAC signatures
 */

(function(global) {
  'use strict';

  // Library namespace
  const GSRCDN = {
    version: '1.0.0',
    config: null,

    /**
     * Initialize the library with configuration
     * @param {Object} config - Configuration object
     * @param {string} config.apiToken - API token for authentication
     * @param {string} config.hmacSecret - HMAC secret for signing requests
     * @param {string} config.scriptUrl - Base URL for API requests
     */
    init: function(config) {
      if (!config.apiToken || !config.hmacSecret || !config.scriptUrl) {
        throw new Error('GSRCDN: Missing required configuration parameters');
      }
      this.config = config;
    },

    /**
     * Compute HMAC-SHA256 signature
     * @param {string} params - Parameters to sign
     * @param {string} secret - HMAC secret key
     * @returns {string} HMAC signature
     */
    computeHMAC: function(params, secret) {
      if (typeof CryptoJS === 'undefined') {
        throw new Error('GSRCDN: CryptoJS library is required. Please include it before this script.');
      }
      return CryptoJS.HmacSHA256(params, secret).toString();
    },

    /**
     * Create signature from parameters
     * @param {Object} params - Request parameters
     * @param {string} secret - HMAC secret key
     * @returns {string} Generated signature
     */
    createSignature: function(params, secret) {
      const sortedKeys = Object.keys(params).sort();
      const signatureString = sortedKeys.map(key => key + '=' + params[key]).join('&');
      return this.computeHMAC(signatureString, secret);
    },

    /**
     * Make a secure API request
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response data
     */
    makeSecureRequest: async function(params) {
      if (!this.config) {
        throw new Error('GSRCDN: Library not initialized. Call GSRCDN.init() first.');
      }

      try {
        // Add authentication and metadata
        params.token = this.config.apiToken;
        params.timestamp = Date.now().toString();
        params.referrer = window.location.origin;
        params.origin = window.location.origin;
        
        // Generate signature
        params.signature = this.createSignature(params, this.config.hmacSecret);

        // Build URL with query parameters
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
        console.error('GSRCDN: Secure request error:', error);
        throw error;
      }
    }
  };

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = GSRCDN;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() { return GSRCDN; });
  } else {
    // Browser global
    global.GSRCDN = GSRCDN;
  }

})(typeof window !== 'undefined' ? window : this);
