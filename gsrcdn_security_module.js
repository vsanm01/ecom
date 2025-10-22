/**
 * GSRCDN Security Module
 * Version: 1.0.0
 * A standalone module for secure API requests with HMAC signature authentication
 */

(function(window) {
    'use strict';
    
    /**
     * GSRCDN Security Class
     */
    class GSRCDNSecurity {
        constructor(config = {}) {
            this.config = {
                scriptUrl: config.scriptUrl || '',
                apiToken: config.apiToken || '',
                hmacSecret: config.hmacSecret || '',
                debug: config.debug || false
            };
            
            // Check if CryptoJS is available
            if (typeof CryptoJS === 'undefined') {
                console.error('GSRCDN Security: CryptoJS is required. Please include it before this module.');
            }
        }
        
        /**
         * Configure the security module
         * @param {Object} config - Configuration object
         */
        configure(config) {
            this.config = { ...this.config, ...config };
        }
        
        /**
         * Compute HMAC SHA256 hash
         * @param {string} params - Parameters string to hash
         * @param {string} secret - Secret key for HMAC
         * @returns {string} HMAC hash
         */
        computeHMAC(params, secret) {
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJS is not available');
            }
            
            return CryptoJS.HmacSHA256(params, secret).toString();
        }
        
        /**
         * Create signature from parameters
         * @param {Object} params - Parameters object
         * @param {string} secret - Secret key for signature
         * @returns {string} Signature hash
         */
        createSignature(params, secret) {
            const sortedKeys = Object.keys(params).sort();
            const signatureString = sortedKeys
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            if (this.config.debug) {
                console.log('GSRCDN Signature String:', signatureString);
            }
            
            return this.computeHMAC(signatureString, secret);
        }
        
        /**
         * Make a secure request to the API
         * @param {Object} params - Request parameters
         * @param {Object} options - Additional options
         * @returns {Promise<Object>} Response data
         */
        async makeSecureRequest(params, options = {}) {
            try {
                // Use instance config or provided config
                const config = {
                    scriptUrl: options.scriptUrl || this.config.scriptUrl,
                    apiToken: options.apiToken || this.config.apiToken,
                    hmacSecret: options.hmacSecret || this.config.hmacSecret,
                    debug: options.debug !== undefined ? options.debug : this.config.debug
                };
                
                // Validate configuration
                if (!config.scriptUrl) {
                    throw new Error('Script URL is required');
                }
                if (!config.apiToken) {
                    throw new Error('API token is required');
                }
                if (!config.hmacSecret) {
                    throw new Error('HMAC secret is required');
                }
                
                // Add required parameters
                params.token = config.apiToken;
                params.timestamp = Date.now().toString();
                params.referrer = window.location.origin;
                params.origin = window.location.origin;
                
                // Create signature
                params.signature = this.createSignature(params, config.hmacSecret);
                
                // Build URL with parameters
                const url = new URL(config.scriptUrl);
                Object.keys(params).forEach(key => {
                    url.searchParams.append(key, params[key]);
                });
                
                if (config.debug) {
                    console.log('GSRCDN Request URL:', url.toString());
                    console.log('GSRCDN Request Params:', params);
                }
                
                // Make the request
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (config.debug) {
                    console.log('GSRCDN Response:', data);
                }
                
                // Check if request was successful
                if (data.status === 'success') {
                    return data;
                } else {
                    throw new Error(data.message || 'Request failed');
                }
                
            } catch (error) {
                console.error('GSRCDN Secure Request Error:', error);
                throw error;
            }
        }
        
        /**
         * Validate response signature (if server returns one)
         * @param {Object} response - Response object
         * @param {string} secret - Secret key for validation
         * @returns {boolean} True if signature is valid
         */
        validateResponse(response, secret) {
            if (!response.signature) {
                console.warn('GSRCDN: Response does not contain signature');
                return false;
            }
            
            const { signature, ...data } = response;
            const calculatedSignature = this.createSignature(data, secret || this.config.hmacSecret);
            
            return signature === calculatedSignature;
        }
        
        /**
         * Get current configuration (without sensitive data)
         * @returns {Object} Safe configuration object
         */
        getConfig() {
            return {
                scriptUrl: this.config.scriptUrl,
                debug: this.config.debug,
                hasToken: !!this.config.apiToken,
                hasSecret: !!this.config.hmacSecret
            };
        }
    }
    
    // Create global instance
    const gsrcdnSecurity = new GSRCDNSecurity();
    
    // Expose to window
    window.GSRCDNSecurity = GSRCDNSecurity;
    window.gsrcdnSecurity = gsrcdnSecurity;
    
    // Expose standalone functions for backward compatibility
    window.computeHMAC = (params, secret) => gsrcdnSecurity.computeHMAC(params, secret);
    window.createSignature = (params, secret) => gsrcdnSecurity.createSignature(params, secret);
    window.makeSecureRequest = (params, options) => gsrcdnSecurity.makeSecureRequest(params, options);
    
    if (gsrcdnSecurity.config.debug) {
        console.log('GSRCDN Security Module loaded successfully');
    }
    
})(window);
