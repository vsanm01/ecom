/**
 * GSRCDN Security Module
 * Version: 1.0.0
 * A standalone module for secure API requests with HMAC signature authentication
 * 
 * Usage:
 * 1. Include CryptoJS before this module
 * 2. Configure: gsrcdnSecurity.configure({...})
 * 3. Use: await gsrcdnSecurity.makeSecureRequest({...})
 * 
 * Or use standalone functions:
 * - computeHMAC(params, secret)
 * - createSignature(params, secret)
 * - makeSecureRequest(params, options)
 */

(function(window) {
    'use strict';
    
    /**
     * Check if CryptoJS is available
     */
    if (typeof CryptoJS === 'undefined') {
        console.error('GSRCDN Security: CryptoJS is required. Please include https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js before this module.');
        return;
    }
    
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
        }
        
        /**
         * Configure the security module
         * @param {Object} config - Configuration object
         */
        configure(config) {
            this.config = { ...this.config, ...config };
            if (this.config.debug) {
                console.log('GSRCDN Security configured:', {
                    scriptUrl: this.config.scriptUrl,
                    hasToken: !!this.config.apiToken,
                    hasSecret: !!this.config.hmacSecret,
                    debug: this.config.debug
                });
            }
        }
        
        /**
         * Compute HMAC SHA256 hash
         * Matches server-side implementation
         * @param {string} params - Parameters string to hash
         * @param {string} secret - Secret key for HMAC
         * @returns {string} HMAC hash in hex format
         */
        computeHMAC(params, secret) {
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJS is not available');
            }
            
            try {
                const hash = CryptoJS.HmacSHA256(params, secret);
                const hexHash = hash.toString(CryptoJS.enc.Hex);
                
                if (this.config.debug) {
                    console.log('computeHMAC:', {
                        input: params,
                        secret: secret.substring(0, 10) + '...',
                        output: hexHash
                    });
                }
                
                return hexHash;
            } catch (error) {
                console.error('computeHMAC error:', error);
                throw error;
            }
        }
        
        /**
         * Create signature from parameters
         * Matches server-side implementation exactly
         * @param {Object} params - Parameters object
         * @param {string} secret - Secret key for signature
         * @returns {string} Signature hash
         */
        createSignature(params, secret) {
            try {
                // Sort keys alphabetically (critical for matching server)
                const sortedKeys = Object.keys(params).sort();
                
                // Create signature string: key1=value1&key2=value2
                const signatureString = sortedKeys
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                
                if (this.config.debug) {
                    console.log('createSignature:', {
                        params: params,
                        sortedKeys: sortedKeys,
                        signatureString: signatureString
                    });
                }
                
                // Compute HMAC
                const signature = this.computeHMAC(signatureString, secret);
                
                if (this.config.debug) {
                    console.log('createSignature result:', signature);
                }
                
                return signature;
            } catch (error) {
                console.error('createSignature error:', error);
                throw error;
            }
        }
        
        /**
         * Make a secure request to the API
         * @param {Object} params - Request parameters
         * @param {Object} options - Additional options (optional)
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
                    throw new Error('Script URL is required. Configure with gsrcdnSecurity.configure({scriptUrl: "..."})');
                }
                if (!config.apiToken) {
                    throw new Error('API token is required. Configure with gsrcdnSecurity.configure({apiToken: "..."})');
                }
                if (!config.hmacSecret) {
                    throw new Error('HMAC secret is required. Configure with gsrcdnSecurity.configure({hmacSecret: "..."})');
                }
                
                // Create a copy of params to avoid mutation
                const requestParams = { ...params };
                
                // Add required parameters
                requestParams.token = config.apiToken;
                requestParams.timestamp = Date.now().toString();
                requestParams.referrer = window.location.origin;
                requestParams.origin = window.location.origin;
                
                // Create signature (MUST be last, after all params are added)
                requestParams.signature = this.createSignature(requestParams, config.hmacSecret);
                
                // Build URL with parameters
                const url = new URL(config.scriptUrl);
                Object.keys(requestParams).forEach(key => {
                    url.searchParams.append(key, requestParams[key]);
                });
                
                if (config.debug) {
                    console.log('makeSecureRequest:', {
                        url: url.toString(),
                        params: requestParams,
                        signature: requestParams.signature
                    });
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
                    console.log('makeSecureRequest response:', data);
                }
                
                // Check if request was successful
                if (data.status === 'success') {
                    return data;
                } else {
                    throw new Error(data.message || 'Request failed');
                }
                
            } catch (error) {
                console.error('makeSecureRequest error:', error);
                throw error;
            }
        }
        
        /**
         * Validate response signature (if server returns one)
         * @param {Object} response - Response object
         * @param {string} secret - Secret key for validation (optional)
         * @returns {boolean} True if signature is valid
         */
        validateResponse(response, secret) {
            if (!response.signature) {
                console.warn('GSRCDN: Response does not contain signature');
                return false;
            }
            
            const { signature, ...data } = response;
            const calculatedSignature = this.createSignature(data, secret || this.config.hmacSecret);
            
            const isValid = signature === calculatedSignature;
            
            if (this.config.debug) {
                console.log('validateResponse:', {
                    received: signature,
                    calculated: calculatedSignature,
                    isValid: isValid
                });
            }
            
            return isValid;
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
    
    // Expose class and instance to window
    window.GSRCDNSecurity = GSRCDNSecurity;
    window.gsrcdnSecurity = gsrcdnSecurity;
    
    // ============================================
    // Standalone Functions (Backward Compatibility)
    // ============================================
    
    /**
     * Standalone computeHMAC function
     * @param {string} params - Parameters string to hash
     * @param {string} secret - Secret key for HMAC
     * @returns {string} HMAC hash
     */
    window.computeHMAC = function(params, secret) {
        return gsrcdnSecurity.computeHMAC(params, secret);
    };
    
    /**
     * Standalone createSignature function
     * @param {Object} params - Parameters object
     * @param {string} secret - Secret key for signature
     * @returns {string} Signature hash
     */
    window.createSignature = function(params, secret) {
        return gsrcdnSecurity.createSignature(params, secret);
    };
    
    /**
     * Standalone makeSecureRequest function
     * @param {Object} params - Request parameters
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response data
     */
    window.makeSecureRequest = async function(params, options) {
        return await gsrcdnSecurity.makeSecureRequest(params, options);
    };
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('%c GSRCDN Security Module v1.0.0 %c Loaded Successfully ', 
            'background:#2563eb;color:#fff;padding:3px 0;', 
            'background:#10b981;color:#fff;padding:3px 0;');
        console.log('Available functions: computeHMAC, createSignature, makeSecureRequest');
        console.log('Class instance: gsrcdnSecurity (use gsrcdnSecurity.configure({...}) to setup)');
    }
    
})(window);
