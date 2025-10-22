/**
 * Google Drive Image Handler Library
 * Version: 1.0.0
 * 
 * A lightweight library for converting Google Drive share links to direct image URLs
 * that can be used in <img> tags and other web contexts.
 * 
 * Features:
 * - Converts Google Drive view/share links to direct image URLs
 * - Handles multiple Google Drive URL formats
 * - Fallback to placeholder images
 * - Batch conversion support
 * - URL validation
 * - Custom placeholder configuration
 * 
 * Usage:
 * GDriveImageHandler.convert(url) - Convert single URL
 * GDriveImageHandler.convertBatch(urls) - Convert multiple URLs
 * GDriveImageHandler.configure({ placeholder: 'custom-url' }) - Set custom placeholder
 */

(function(window) {
    'use strict';

    // ============================================
    // GDRIVE IMAGE HANDLER NAMESPACE
    // ============================================
    const GDriveImageHandler = {
        version: '1.0.0',
        config: {
            placeholder: 'https://via.placeholder.com/300x300?text=No+Image',
            defaultSize: 300,
            quality: 'high', // 'high', 'medium', 'low'
            debug: false
        }
    };

    // ============================================
    // CONFIGURATION METHOD
    // ============================================
    /**
     * Configure the GDrive Image Handler settings
     * @param {Object} options - Configuration options
     * @param {string} [options.placeholder] - Default placeholder image URL
     * @param {number} [options.defaultSize] - Default image size in pixels
     * @param {string} [options.quality] - Image quality (high, medium, low)
     * @param {boolean} [options.debug] - Enable debug logging
     */
    GDriveImageHandler.configure = function(options) {
        if (options && typeof options === 'object') {
            Object.assign(GDriveImageHandler.config, options);
            
            if (GDriveImageHandler.config.debug) {
                console.log('GDriveImageHandler: Configuration updated', GDriveImageHandler.config);
            }
        }
        return GDriveImageHandler;
    };

    // ============================================
    // EXTRACT FILE ID FROM GOOGLE DRIVE URL
    // ============================================
    /**
     * Extract Google Drive file ID from various URL formats
     * @param {string} url - Google Drive URL
     * @returns {string|null} File ID or null if not found
     */
    GDriveImageHandler.extractFileId = function(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        // Pattern 1: /d/FILE_ID/view or /d/FILE_ID/edit
        let match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
        if (match) {
            return match[1];
        }

        // Pattern 2: id=FILE_ID or ?id=FILE_ID
        match = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
        if (match) {
            return match[1];
        }

        // Pattern 3: /file/d/FILE_ID
        match = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
        if (match) {
            return match[1];
        }

        // Pattern 4: /open?id=FILE_ID
        match = url.match(/\/open\?id=([a-zA-Z0-9_-]{25,})/);
        if (match) {
            return match[1];
        }

        // Pattern 5: Direct file ID (25+ characters)
        if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
            return url;
        }

        return null;
    };

    // ============================================
    // CHECK IF URL IS GOOGLE DRIVE
    // ============================================
    /**
     * Check if URL is a Google Drive link
     * @param {string} url - URL to check
     * @returns {boolean} True if Google Drive URL
     */
    GDriveImageHandler.isGoogleDriveUrl = function(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        return url.includes('drive.google.com') || 
               url.includes('docs.google.com') ||
               /^[a-zA-Z0-9_-]{25,}$/.test(url);
    };

    // ============================================
    // BUILD DIRECT IMAGE URL
    // ============================================
    /**
     * Build direct image URL from file ID
     * @param {string} fileId - Google Drive file ID
     * @param {Object} [options] - URL options
     * @param {number} [options.size] - Image size in pixels
     * @param {string} [options.quality] - Image quality
     * @returns {string} Direct image URL
     */
    GDriveImageHandler.buildDirectUrl = function(fileId, options = {}) {
        const size = options.size || GDriveImageHandler.config.defaultSize;
        const quality = options.quality || GDriveImageHandler.config.quality;

        // Base direct URL
        let url = `https://drive.google.com/uc?export=view&id=${fileId}`;

        // Add size parameter (optional, for thumbnails)
        // Format: https://drive.google.com/thumbnail?id=FILE_ID&sz=w300-h300
        if (size && size !== 'full') {
            url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}-h${size}`;
        }

        return url;
    };

    // ============================================
    // CONVERT SINGLE URL
    // ============================================
    /**
     * Convert Google Drive URL to direct image URL
     * @param {string} url - Google Drive URL or file ID
     * @param {Object} [options] - Conversion options
     * @param {string} [options.placeholder] - Custom placeholder image
     * @param {number} [options.size] - Image size in pixels
     * @param {boolean} [options.returnOriginalIfNotDrive] - Return original URL if not Google Drive
     * @returns {string} Direct image URL or placeholder
     */
    GDriveImageHandler.convert = function(url, options = {}) {
        // Return placeholder for empty/invalid input
        if (!url || typeof url !== 'string') {
            const placeholder = options.placeholder || GDriveImageHandler.config.placeholder;
            if (GDriveImageHandler.config.debug) {
                console.log('GDriveImageHandler: Invalid URL, returning placeholder');
            }
            return placeholder;
        }

        // If already a direct Google Drive URL, return as-is
        if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/thumbnail?')) {
            if (GDriveImageHandler.config.debug) {
                console.log('GDriveImageHandler: Already direct URL:', url);
            }
            return url;
        }

        // Check if it's a Google Drive URL
        if (GDriveImageHandler.isGoogleDriveUrl(url)) {
            const fileId = GDriveImageHandler.extractFileId(url);
            
            if (fileId) {
                const directUrl = GDriveImageHandler.buildDirectUrl(fileId, options);
                
                if (GDriveImageHandler.config.debug) {
                    console.log('GDriveImageHandler: Converted', url, '->', directUrl);
                }
                
                return directUrl;
            } else {
                if (GDriveImageHandler.config.debug) {
                    console.warn('GDriveImageHandler: Could not extract file ID from:', url);
                }
                return options.placeholder || GDriveImageHandler.config.placeholder;
            }
        }

        // Not a Google Drive URL
        if (options.returnOriginalIfNotDrive) {
            if (GDriveImageHandler.config.debug) {
                console.log('GDriveImageHandler: Not a Google Drive URL, returning original');
            }
            return url;
        }

        // Return placeholder if configured to do so
        if (GDriveImageHandler.config.debug) {
            console.log('GDriveImageHandler: Not a Google Drive URL, returning placeholder');
        }
        return options.placeholder || GDriveImageHandler.config.placeholder;
    };

    // ============================================
    // CONVERT BATCH URLS
    // ============================================
    /**
     * Convert multiple Google Drive URLs at once
     * @param {Array<string>} urls - Array of Google Drive URLs
     * @param {Object} [options] - Conversion options
     * @returns {Array<string>} Array of direct image URLs
     */
    GDriveImageHandler.convertBatch = function(urls, options = {}) {
        if (!Array.isArray(urls)) {
            console.error('GDriveImageHandler: convertBatch expects an array');
            return [];
        }

        return urls.map(url => GDriveImageHandler.convert(url, options));
    };

    // ============================================
    // CONVERT OBJECT PROPERTIES
    // ============================================
    /**
     * Convert Google Drive URLs in object properties
     * @param {Object|Array} data - Object or array with image URLs
     * @param {Array<string>} fields - Field names containing image URLs
     * @param {Object} [options] - Conversion options
     * @returns {Object|Array} Data with converted URLs
     */
    GDriveImageHandler.convertInObject = function(data, fields = ['image', 'thumbnail', 'photo'], options = {}) {
        if (!data) {
            return data;
        }

        const convert = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => convert(item));
            }

            if (typeof obj === 'object' && obj !== null) {
                const converted = { ...obj };
                
                fields.forEach(field => {
                    if (converted[field]) {
                        converted[field] = GDriveImageHandler.convert(converted[field], options);
                    }
                });

                return converted;
            }

            return obj;
        };

        return convert(data);
    };

    // ============================================
    // VALIDATE FILE ID
    // ============================================
    /**
     * Validate if a string is a valid Google Drive file ID
     * @param {string} fileId - File ID to validate
     * @returns {boolean} True if valid file ID
     */
    GDriveImageHandler.isValidFileId = function(fileId) {
        return typeof fileId === 'string' && /^[a-zA-Z0-9_-]{25,}$/.test(fileId);
    };

    // ============================================
    // GET THUMBNAIL URL
    // ============================================
    /**
     * Get thumbnail URL for Google Drive image
     * @param {string} url - Google Drive URL or file ID
     * @param {number} [size=300] - Thumbnail size in pixels
     * @returns {string} Thumbnail URL
     */
    GDriveImageHandler.getThumbnail = function(url, size = 300) {
        return GDriveImageHandler.convert(url, { size: size });
    };

    // ============================================
    // PRELOAD IMAGE
    // ============================================
    /**
     * Preload Google Drive image
     * @param {string} url - Image URL to preload
     * @returns {Promise<string>} Promise that resolves when image loads
     */
    GDriveImageHandler.preload = function(url) {
        return new Promise((resolve, reject) => {
            const convertedUrl = GDriveImageHandler.convert(url, { returnOriginalIfNotDrive: true });
            const img = new Image();
            
            img.onload = () => {
                if (GDriveImageHandler.config.debug) {
                    console.log('GDriveImageHandler: Image preloaded:', convertedUrl);
                }
                resolve(convertedUrl);
            };
            
            img.onerror = (error) => {
                console.error('GDriveImageHandler: Failed to preload:', convertedUrl);
                reject(error);
            };
            
            img.src = convertedUrl;
        });
    };

    // ============================================
    // UTILITY: GET FILE INFO
    // ============================================
    /**
     * Get information about Google Drive URL
     * @param {string} url - Google Drive URL
     * @returns {Object} URL information
     */
    GDriveImageHandler.getUrlInfo = function(url) {
        const isGoogleDrive = GDriveImageHandler.isGoogleDriveUrl(url);
        const fileId = isGoogleDrive ? GDriveImageHandler.extractFileId(url) : null;
        const directUrl = fileId ? GDriveImageHandler.buildDirectUrl(fileId) : null;

        return {
            original: url,
            isGoogleDrive: isGoogleDrive,
            fileId: fileId,
            directUrl: directUrl,
            isValid: !!fileId
        };
    };

    // ============================================
    // SHORTHAND ALIAS (for backward compatibility)
    // ============================================
    window.convertDriveUrl = function(url) {
        return GDriveImageHandler.convert(url, { returnOriginalIfNotDrive: true });
    };

    // ============================================
    // EXPORT TO WINDOW
    // ============================================
    window.GDriveImageHandler = GDriveImageHandler;

    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() { return GDriveImageHandler; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = GDriveImageHandler;
    }

    // Log initialization
    if (typeof console !== 'undefined') {
        console.log(`GDriveImageHandler v${GDriveImageHandler.version} loaded successfully`);
    }

})(window);
