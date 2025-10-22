/**
 * GSRCDN Secure API Library
 * Version: 1.0.0
 * A secure client-side library for authenticated Google Apps Script requests
 * 
 * Dependencies: CryptoJS (for HMAC-SHA256)
 * CDN: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 */

(function(window) {
    'use strict';

    // ============================================
    // GSRCDN API CLASS
    // ============================================
    class GSRCDN {
        constructor(config = {}) {
            this.config = {
                scriptUrl: config.scriptUrl || '',
                apiToken: config.apiToken || '',
                hmacSecret: config.hmacSecret || '',
                rateLimitEnabled: config.rateLimitEnabled !== undefined ? config.rateLimitEnabled : true,
                maxRequests: config.maxRequests || 100,
                dataMasking: config.dataMasking || { enabled: false, fields: [] },
                checksumValidation: config.checksumValidation !== undefined ? config.checksumValidation : true,
                enforceHttps: config.enforceHttps !== undefined ? config.enforceHttps : true,
                debug: config.debug || false
            };

            // Validate configuration
            this.validateConfig();
        }

        // ============================================
        // CONFIGURATION VALIDATION
        // ============================================
        validateConfig() {
            if (!this.config.scriptUrl) {
                console.warn('GSRCDN: scriptUrl is not configured');
            }
            if (!this.config.apiToken) {
                console.warn('GSRCDN: apiToken is not configured');
            }
            if (!this.config.hmacSecret) {
                console.warn('GSRCDN: hmacSecret is not configured');
            }
            if (this.config.enforceHttps && this.config.scriptUrl && !this.config.scriptUrl.startsWith('https://')) {
                console.error('GSRCDN: HTTPS is enforced but scriptUrl is not using HTTPS');
            }
        }

        // ============================================
        // COMPUTE HMAC-SHA256
        // ============================================
        computeHMAC(data, secret) {
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJS is required but not loaded. Include: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
            }
            return CryptoJS.HmacSHA256(data, secret).toString();
        }

        // ============================================
        // CREATE SIGNATURE FROM PARAMETERS
        // ============================================
        createSignature(params, secret) {
            const sortedKeys = Object.keys(params).sort();
            const signatureString = sortedKeys
                .map(key => `${key}=${params[key]}`)
                .join('&');
            return this.computeHMAC(signatureString, secret);
        }

        // ============================================
        // SECURE API REQUEST
        // ============================================
        async makeSecureRequest(params) {
            if (!this.config.scriptUrl || !this.config.apiToken || !this.config.hmacSecret) {
                throw new Error('GSRCDN: API configuration incomplete. Please set scriptUrl, apiToken, and hmacSecret.');
            }

            try {
                // Add authentication parameters
                params.token = this.config.apiToken;
                params.timestamp = Date.now().toString();
                params.referrer = window.location.origin;
                params.origin = window.location.origin;
                
                // Create signature
                params.signature = this.createSignature(params, this.config.hmacSecret);

                // Build URL with query parameters
                const url = new URL(this.config.scriptUrl);
                Object.keys(params).forEach(key => {
                    url.searchParams.append(key, params[key]);
                });

                if (this.config.debug) {
                    console.log('GSRCDN: Making secure request');
                    console.log('URL:', url.toString());
                    console.log('Params:', params);
                }

                // Make the request
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (this.config.debug) {
                    console.log('GSRCDN: Response received', data);
                }

                if (data.status === 'success') {
                    return data;
                } else {
                    throw new Error(data.message || 'Request failed');
                }

            } catch (error) {
                console.error('GSRCDN: Request error', error);
                throw error;
            }
        }

        // ============================================
        // GET DATA (Convenience method)
        // ============================================
        async getData(dataType, additionalParams = {}) {
            return this.makeSecureRequest({
                action: 'getData',
                dataType: dataType,
                ...additionalParams
            });
        }

        // ============================================
        // ADD DATA (Convenience method)
        // ============================================
        async addData(dataType, data, additionalParams = {}) {
            return this.makeSecureRequest({
                action: 'addData',
                dataType: dataType,
                data: JSON.stringify(data),
                ...additionalParams
            });
        }

        // ============================================
        // UPDATE DATA (Convenience method)
        // ============================================
        async updateData(dataType, id, updates, additionalParams = {}) {
            return this.makeSecureRequest({
                action: 'updateData',
                dataType: dataType,
                id: id,
                updates: JSON.stringify(updates),
                ...additionalParams
            });
        }

        // ============================================
        // DELETE DATA (Convenience method)
        // ============================================
        async deleteData(dataType, id, additionalParams = {}) {
            return this.makeSecureRequest({
                action: 'deleteData',
                dataType: dataType,
                id: id,
                ...additionalParams
            });
        }

        // ============================================
        // UPDATE CONFIGURATION
        // ============================================
        updateConfig(newConfig) {
            this.config = {
                ...this.config,
                ...newConfig
            };
            this.validateConfig();
        }

        // ============================================
        // GET CURRENT CONFIGURATION
        // ============================================
        getConfig() {
            return { ...this.config };
        }
    }

    // ============================================
    // EXPOSE TO WINDOW
    // ============================================
    window.GSRCDN = GSRCDN;

    // ============================================
    // LEGACY SUPPORT (Standalone functions)
    // ============================================
    window.computeHMAC = function(data, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS is required but not loaded');
        }
        return CryptoJS.HmacSHA256(data, secret).toString();
    };

    window.createSignature = function(params, secret) {
        const sortedKeys = Object.keys(params).sort();
        const signatureString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return window.computeHMAC(signatureString, secret);
    };

    window.makeSecureRequest = async function(config, params) {
        if (!config || !config.scriptUrl || !config.apiToken || !config.hmacSecret) {
            throw new Error('Configuration incomplete');
        }

        const api = new GSRCDN(config);
        return api.makeSecureRequest(params);
    };

    // Log initialization
    if (console && console.log) {
        console.log('GSRCDN Secure API Library v1.0.0 loaded successfully');
    }

})(window);
