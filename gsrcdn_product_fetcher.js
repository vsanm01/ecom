/**
 * GSRCDN Product Fetcher v1.0.0
 * A reusable library for fetching and normalizing product data from Google Sheets via GSRCDN API
 * 
 * Dependencies:
 * - GSRCDN API Library (secure_api_cdn.js)
 * - GDriveImageHandler (gdrive-image-handler-cdn.js) - Optional but recommended
 * 
 * Usage:
 * <script src="https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/secure_api_cdn.js"></script>
 * <script src="https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/gdrive-image-handler-cdn.js"></script>
 * <script src="path/to/gsrcdn-product-fetcher.js"></script>
 * 
 * <script>
 * // Initialize GSRCDN first
 * GSRCDN.configure({
 *     scriptUrl: 'YOUR_SCRIPT_URL',
 *     apiToken: 'YOUR_TOKEN',
 *     hmacSecret: 'YOUR_SECRET'
 * });
 * 
 * // Basic usage
 * const products = await GSRCDNProductFetcher.fetch('products');
 * 
 * // With custom options
 * const products = await GSRCDNProductFetcher.fetch('products', {
 *     imageSize: 800,
 *     autoConvertDriveUrls: true,
 *     defaultImage: 'https://example.com/placeholder.jpg',
 *     onProgress: (loaded, total) => console.log(`${loaded}/${total}`),
 *     onError: (error) => console.error(error)
 * });
 * 
 * // Custom field mapping
 * GSRCDNProductFetcher.setFieldMapping({
 *     id: ['id', 'productId', 'ID'],
 *     title: ['title', 'name', 'productName'],
 *     price: ['price', 'cost', 'amount']
 * });
 * 
 * // Transform products after fetch
 * GSRCDNProductFetcher.setTransformer((product) => {
 *     product.discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
 *     return product;
 * });
 * </script>
 */

(function(global) {
    'use strict';

    const GSRCDNProductFetcher = {
        version: '1.0.0',
        
        // Default field mapping (supports multiple possible field names)
        defaultFieldMapping: {
            id: ['id', 'Id', 'ID', 'productId', 'ProductId'],
            title: ['title', 'Title', 'name', 'Name', 'productName', 'ProductName'],
            category: ['category', 'Category', 'cat', 'Cat'],
            price: ['price', 'Price', 'cost', 'Cost', 'amount', 'Amount'],
            originalPrice: ['originalPrice', 'OriginalPrice', 'oldPrice', 'OldPrice', 'listPrice', 'ListPrice'],
            image: ['image', 'Image', 'imageUrl', 'ImageUrl', 'img', 'Img'],
            rating: ['rating', 'Rating', 'stars', 'Stars'],
            reviews: ['reviews', 'Reviews', 'reviewCount', 'ReviewCount'],
            badge: ['badge', 'Badge', 'tag', 'Tag', 'label', 'Label'],
            featured: ['featured', 'Featured', 'isFeatured', 'IsFeatured'],
            description: ['description', 'Description', 'desc', 'Desc', 'details', 'Details'],
            stock: ['stock', 'Stock', 'inventory', 'Inventory', 'quantity', 'Quantity'],
            createdAt: ['createdAt', 'CreatedAt', 'created', 'Created', 'date', 'Date']
        },

        customFieldMapping: null,
        customTransformer: null,

        /**
         * Set custom field mapping
         * @param {Object} mapping - Custom field mapping object
         */
        setFieldMapping: function(mapping) {
            this.customFieldMapping = mapping;
        },

        /**
         * Reset field mapping to default
         */
        resetFieldMapping: function() {
            this.customFieldMapping = null;
        },

        /**
         * Set custom transformer function
         * @param {Function} transformer - Function to transform each product
         */
        setTransformer: function(transformer) {
            if (typeof transformer === 'function') {
                this.customTransformer = transformer;
            }
        },

        /**
         * Find value from multiple possible field names
         * @param {Object} item - Data item
         * @param {Array} possibleNames - Array of possible field names
         * @param {*} defaultValue - Default value if not found
         * @returns {*} Found value or default
         */
        _findValue: function(item, possibleNames, defaultValue = null) {
            for (let name of possibleNames) {
                if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
                    return item[name];
                }
            }
            return defaultValue;
        },

        /**
         * Normalize product data from array or object format
         * @param {Array|Object} item - Raw product data
         * @param {number} index - Product index
         * @param {Object} options - Fetch options
         * @returns {Object} Normalized product object
         */
        _normalizeProduct: function(item, index, options) {
            const mapping = this.customFieldMapping || this.defaultFieldMapping;
            let product;

            // Handle array format (from CSV/Sheet rows)
            if (Array.isArray(item)) {
                product = {
                    id: item[0] || 'PROD' + (index + 1),
                    title: item[1] || 'Unnamed Product',
                    category: item[2] || 'General',
                    price: parseFloat(item[3]) || 0,
                    originalPrice: parseFloat(item[4]) || 0,
                    image: item[5] || '',
                    rating: parseFloat(item[6]) || 4.5,
                    reviews: parseInt(item[7]) || 0,
                    badge: item[8] || 'Sale',
                    featured: item[9] === 'TRUE' || item[9] === true,
                    description: item[10] || '',
                    stock: parseInt(item[11]) || 10,
                    createdAt: item[12] || ''
                };
            } 
            // Handle object format
            else {
                product = {
                    id: this._findValue(item, mapping.id, 'PROD' + (index + 1)),
                    title: this._findValue(item, mapping.title, 'Unnamed Product'),
                    category: this._findValue(item, mapping.category, 'General'),
                    price: parseFloat(this._findValue(item, mapping.price, 0)) || 0,
                    originalPrice: parseFloat(this._findValue(item, mapping.originalPrice, 0)) || 0,
                    image: this._findValue(item, mapping.image, ''),
                    rating: parseFloat(this._findValue(item, mapping.rating, 4.5)) || 4.5,
                    reviews: parseInt(this._findValue(item, mapping.reviews, 0)) || 0,
                    badge: this._findValue(item, mapping.badge, 'Sale'),
                    featured: this._findValue(item, mapping.featured, false) === 'TRUE' || 
                              this._findValue(item, mapping.featured, false) === true,
                    description: this._findValue(item, mapping.description, ''),
                    stock: parseInt(this._findValue(item, mapping.stock, 10)) || 10,
                    createdAt: this._findValue(item, mapping.createdAt, '')
                };
            }

            // Process image URL
            if (options.autoConvertDriveUrls && typeof global.GDriveImageHandler !== 'undefined') {
                product.image = global.GDriveImageHandler.convert(product.image, options.imageSize) || 
                                options.defaultImage;
            } else if (!product.image || product.image.trim() === '') {
                product.image = options.defaultImage;
            }

            // Auto-calculate original price if not provided
            if (product.originalPrice <= product.price) {
                product.originalPrice = product.price * 1.3;
            }

            // Apply custom transformer if provided
            if (this.customTransformer) {
                product = this.customTransformer(product) || product;
            }

            return product;
        },

        /**
         * Fetch and normalize products from GSRCDN
         * @param {string} sheetName - Name of the sheet/table (default: 'products')
         * @param {Object} options - Configuration options
         * @returns {Promise<Array>} Array of normalized product objects
         */
        fetch: async function(sheetName = 'products', options = {}) {
            // Default options
            const config = {
                imageSize: options.imageSize || 400,
                autoConvertDriveUrls: options.autoConvertDriveUrls !== false, // true by default
                defaultImage: options.defaultImage || 'https://via.placeholder.com/300x300?text=No+Image',
                onProgress: options.onProgress || null,
                onError: options.onError || null,
                showNotification: options.showNotification !== false, // true by default
                notificationFn: options.notificationFn || null
            };

            try {
                // Check if GSRCDN is available
                if (typeof global.GSRCDN === 'undefined') {
                    throw new Error('GSRCDN library not found. Please include secure_api_cdn.js');
                }

                // Fetch data from GSRCDN
                const data = await global.GSRCDN.getData(sheetName);
                
                let rawProducts = [];
                if (data.data && Array.isArray(data.data)) {
                    rawProducts = data.data;
                } else if (Array.isArray(data)) {
                    rawProducts = data;
                }

                // Normalize products
                const products = rawProducts.map((item, index) => {
                    if (config.onProgress) {
                        config.onProgress(index + 1, rawProducts.length);
                    }
                    return this._normalizeProduct(item, index, config);
                });

                // Show success notification
                if (config.showNotification && products.length > 0) {
                    if (config.notificationFn) {
                        config.notificationFn('success', `Loaded ${products.length} products`);
                    } else if (typeof global.showNotification === 'function') {
                        global.showNotification('success', `Loaded ${products.length} products`);
                    } else {
                        console.log(`✓ Loaded ${products.length} products`);
                    }
                }

                return products;

            } catch (error) {
                console.error('Error fetching products:', error);

                if (config.onError) {
                    config.onError(error);
                }

                if (config.showNotification) {
                    if (config.notificationFn) {
                        config.notificationFn('error', 'Failed to load products');
                    } else if (typeof global.showNotification === 'function') {
                        global.showNotification('error', 'Failed to load products');
                    } else {
                        console.error('✗ Failed to load products');
                    }
                }

                return [];
            }
        },

        /**
         * Fetch products with custom GSRCDN configuration
         * @param {Object} gsrcdnConfig - GSRCDN configuration object
         * @param {string} sheetName - Name of the sheet/table
         * @param {Object} options - Fetch options
         * @returns {Promise<Array>} Array of normalized product objects
         */
        fetchWithConfig: async function(gsrcdnConfig, sheetName = 'products', options = {}) {
            if (typeof global.GSRCDN === 'undefined') {
                throw new Error('GSRCDN library not found. Please include secure_api_cdn.js');
            }

            // Configure GSRCDN
            global.GSRCDN.configure(gsrcdnConfig);

            // Fetch products
            return await this.fetch(sheetName, options);
        },

        /**
         * Filter products by criteria
         * @param {Array} products - Products array
         * @param {Object} criteria - Filter criteria
         * @returns {Array} Filtered products
         */
        filter: function(products, criteria) {
            return products.filter(product => {
                for (let key in criteria) {
                    const value = criteria[key];
                    
                    if (key === 'priceRange') {
                        if (product.price < value.min || product.price > value.max) {
                            return false;
                        }
                    } else if (key === 'category') {
                        if (value !== 'all' && product.category !== value) {
                            return false;
                        }
                    } else if (key === 'inStock') {
                        if (value && product.stock <= 0) {
                            return false;
                        }
                    } else if (key === 'featured') {
                        if (value && !product.featured) {
                            return false;
                        }
                    } else if (key === 'search') {
                        const searchLower = value.toLowerCase();
                        if (!product.title.toLowerCase().includes(searchLower) &&
                            !product.description.toLowerCase().includes(searchLower) &&
                            !product.category.toLowerCase().includes(searchLower)) {
                            return false;
                        }
                    }
                }
                return true;
            });
        },

        /**
         * Sort products by field
         * @param {Array} products - Products array
         * @param {string} sortBy - Sort field
         * @param {string} order - Sort order ('asc' or 'desc')
         * @returns {Array} Sorted products
         */
        sort: function(products, sortBy, order = 'asc') {
            const sorted = [...products];
            
            sorted.sort((a, b) => {
                let aVal = a[sortBy];
                let bVal = b[sortBy];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            return sorted;
        },

        /**
         * Get unique categories from products
         * @param {Array} products - Products array
         * @returns {Array} Array of unique categories
         */
        getCategories: function(products) {
            return [...new Set(products.map(p => p.category))];
        }
    };

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GSRCDNProductFetcher;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() {
            return GSRCDNProductFetcher;
        });
    } else {
        global.GSRCDNProductFetcher = GSRCDNProductFetcher;
    }

})(typeof window !== 'undefined' ? window : this);