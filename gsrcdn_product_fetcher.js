/**
 * GSRCDN Product Fetcher Library v1.0.0
 * A reusable library for fetching and processing products from Google Sheets
 * 
 * Usage:
 * <script src="https://cdn.jsdelivr.net/gh/vsanm01/ecom@main/secure_api_cdn.js"></script>
 * <script src="path/to/gsrcdn-product-fetcher.js"></script>
 * 
 * const fetcher = new GSRCDNProductFetcher({
 *   gsrcdnConfig: { scriptUrl: '...', apiToken: '...', ... },
 *   tableName: 'products',
 *   imageOptions: { width: 400, height: 400, quality: 'medium' },
 *   defaultValues: { category: 'General', stock: 10 },
 *   onSuccess: (products) => console.log('Loaded', products),
 *   onError: (error) => console.error('Error', error)
 * });
 * 
 * await fetcher.fetch();
 */

(function(global) {
    'use strict';

    // Google Drive Image Handler
    const GDriveImageHandler = {
        /**
         * Convert Google Drive URL to direct image URL with optional size parameters
         * @param {string} url - Google Drive URL
         * @param {number} width - Desired width (optional)
         * @param {number} height - Desired height (optional)
         * @param {string} quality - Image quality: 'low', 'medium', 'high' (optional)
         * @returns {string} Direct image URL
         */
        convert: function(url, width, height, quality) {
            if (!url || typeof url !== 'string') {
                return null;
            }

            // Check if it's a Google Drive URL
            if (url.includes('drive.google.com')) {
                const fileIdMatch = url.match(/[-\w]{25,}/);
                if (fileIdMatch) {
                    let baseUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[0]}`;
                    
                    // Add size parameters if specified
                    if (width || height) {
                        const size = width || height || 400;
                        baseUrl = `https://lh3.googleusercontent.com/d/${fileIdMatch[0]}=s${size}`;
                    }
                    
                    return baseUrl;
                }
            }

            // If not a Drive URL, return as-is
            return url;
        },

        /**
         * Get thumbnail URL
         */
        getThumbnail: function(url, size = 200) {
            return this.convert(url, size, size);
        },

        /**
         * Get full-size URL
         */
        getFullSize: function(url) {
            return this.convert(url, 1200);
        }
    };

    // Product Schema Mapper
    const ProductSchemaMapper = {
        /**
         * Map array or object to standardized product schema
         */
        map: function(item, index, defaults = {}) {
            let product;

            if (Array.isArray(item)) {
                product = this._mapFromArray(item, index, defaults);
            } else {
                product = this._mapFromObject(item, index, defaults);
            }

            return this._normalize(product);
        },

        _mapFromArray: function(item, index, defaults) {
            return {
                id: item[0] || `PROD${index + 1}`,
                title: item[1] || defaults.title || 'Unnamed Product',
                category: item[2] || defaults.category || 'General',
                price: parseFloat(item[3]) || defaults.price || 0,
                originalPrice: parseFloat(item[4]) || 0,
                image: item[5] || defaults.image || '',
                rating: parseFloat(item[6]) || defaults.rating || 4.5,
                reviews: parseInt(item[7]) || defaults.reviews || 0,
                badge: item[8] || defaults.badge || 'Sale',
                featured: item[9] === 'TRUE' || item[9] === true || defaults.featured || false,
                description: item[10] || defaults.description || '',
                stock: parseInt(item[11]) || defaults.stock || 10,
                createdAt: item[12] || defaults.createdAt || ''
            };
        },

        _mapFromObject: function(item, index, defaults) {
            return {
                id: item.id || item.Id || `PROD${index + 1}`,
                title: item.title || item.Title || defaults.title || 'Unnamed Product',
                category: item.category || item.Category || defaults.category || 'General',
                price: parseFloat(item.price || item.Price) || defaults.price || 0,
                originalPrice: parseFloat(item.originalPrice || item.OriginalPrice || item.price) || 0,
                image: item.image || item.Image || defaults.image || '',
                rating: parseFloat(item.rating || item.Rating) || defaults.rating || 4.5,
                reviews: parseInt(item.reviews || item.Reviews) || defaults.reviews || 0,
                badge: item.badge || item.Badge || defaults.badge || 'Sale',
                featured: item.featured === 'TRUE' || item.featured === true || defaults.featured || false,
                description: item.description || item.Description || defaults.description || '',
                stock: parseInt(item.stock || item.Stock) || defaults.stock || 10,
                createdAt: item.createdAt || item.CreatedAt || defaults.createdAt || ''
            };
        },

        _normalize: function(product) {
            // Calculate original price if not set or invalid
            if (product.originalPrice <= product.price) {
                product.originalPrice = product.price * 1.3;
            }

            // Calculate discount percentage
            product.discount = Math.round(
                ((product.originalPrice - product.price) / product.originalPrice) * 100
            );

            // Ensure numeric values are valid
            product.price = Math.max(0, product.price);
            product.originalPrice = Math.max(0, product.originalPrice);
            product.rating = Math.min(5, Math.max(0, product.rating));
            product.reviews = Math.max(0, product.reviews);
            product.stock = Math.max(0, product.stock);

            return product;
        }
    };

    // Main Product Fetcher Class
    class GSRCDNProductFetcher {
        constructor(options = {}) {
            this.config = {
                tableName: options.tableName || 'products',
                gsrcdnConfig: options.gsrcdnConfig || {},
                imageOptions: {
                    width: options.imageOptions?.width || 400,
                    height: options.imageOptions?.height || 400,
                    quality: options.imageOptions?.quality || 'medium',
                    placeholder: options.imageOptions?.placeholder || 'https://via.placeholder.com/300x300?text=No+Image'
                },
                defaultValues: options.defaultValues || {},
                transformers: options.transformers || [],
                filters: options.filters || [],
                onSuccess: options.onSuccess || null,
                onError: options.onError || null,
                onProgress: options.onProgress || null,
                cache: options.cache !== false,
                cacheKey: options.cacheKey || 'gsrcdn_products',
                cacheDuration: options.cacheDuration || 300000 // 5 minutes
            };

            this.products = [];
            this._cache = null;
            this._cacheTimestamp = null;

            // Initialize GSRCDN if config provided
            if (this.config.gsrcdnConfig && typeof GSRCDN !== 'undefined') {
                GSRCDN.configure(this.config.gsrcdnConfig);
            }
        }

        /**
         * Fetch products from Google Sheets
         */
        async fetch() {
            try {
                // Check cache first
                if (this.config.cache && this._isCacheValid()) {
                    this.products = this._cache;
                    if (this.config.onSuccess) {
                        this.config.onSuccess(this.products);
                    }
                    return this.products;
                }

                // Fetch from GSRCDN
                const data = await this._fetchFromGSRCDN();
                
                // Process raw data
                const rawProducts = this._extractRawProducts(data);
                
                // Map to product schema
                this.products = rawProducts.map((item, index) => {
                    const product = ProductSchemaMapper.map(
                        item, 
                        index, 
                        this.config.defaultValues
                    );

                    // Process image URL
                    product.image = GDriveImageHandler.convert(
                        product.image,
                        this.config.imageOptions.width,
                        this.config.imageOptions.height,
                        this.config.imageOptions.quality
                    ) || this.config.imageOptions.placeholder;

                    // Generate thumbnail
                    product.thumbnail = GDriveImageHandler.getThumbnail(product.image, 200);

                    return product;
                });

                // Apply custom transformers
                this.products = this._applyTransformers(this.products);

                // Apply filters
                this.products = this._applyFilters(this.products);

                // Update cache
                if (this.config.cache) {
                    this._updateCache(this.products);
                }

                // Success callback
                if (this.config.onSuccess) {
                    this.config.onSuccess(this.products);
                }

                return this.products;

            } catch (error) {
                console.error('GSRCDNProductFetcher: Error fetching products', error);
                
                if (this.config.onError) {
                    this.config.onError(error);
                }

                this.products = [];
                return this.products;
            }
        }

        /**
         * Refresh products (bypass cache)
         */
        async refresh() {
            this._clearCache();
            return await this.fetch();
        }

        /**
         * Get products with filtering
         */
        getProducts(filterFn = null) {
            if (!filterFn) return this.products;
            return this.products.filter(filterFn);
        }

        /**
         * Get product by ID
         */
        getProductById(id) {
            return this.products.find(p => p.id === id);
        }

        /**
         * Get products by category
         */
        getProductsByCategory(category) {
            return this.products.filter(p => p.category === category);
        }

        /**
         * Get featured products
         */
        getFeaturedProducts() {
            return this.products.filter(p => p.featured);
        }

        /**
         * Get all categories
         */
        getCategories() {
            return [...new Set(this.products.map(p => p.category))];
        }

        /**
         * Add custom transformer
         */
        addTransformer(fn) {
            this.config.transformers.push(fn);
            return this;
        }

        /**
         * Add filter
         */
        addFilter(fn) {
            this.config.filters.push(fn);
            return this;
        }

        // Private methods
        async _fetchFromGSRCDN() {
            if (typeof GSRCDN === 'undefined') {
                throw new Error('GSRCDN library not found. Please include secure_api_cdn.js');
            }

            if (this.config.onProgress) {
                this.config.onProgress('Fetching data...');
            }

            return await GSRCDN.getData(this.config.tableName);
        }

        _extractRawProducts(data) {
            let rawProducts = [];
            
            if (data.data && Array.isArray(data.data)) {
                rawProducts = data.data;
            } else if (Array.isArray(data)) {
                rawProducts = data;
            }

            return rawProducts;
        }

        _applyTransformers(products) {
            return this.config.transformers.reduce(
                (prods, transformer) => prods.map(transformer),
                products
            );
        }

        _applyFilters(products) {
            return this.config.filters.reduce(
                (prods, filter) => prods.filter(filter),
                products
            );
        }

        _isCacheValid() {
            if (!this._cache || !this._cacheTimestamp) return false;
            return (Date.now() - this._cacheTimestamp) < this.config.cacheDuration;
        }

        _updateCache(products) {
            this._cache = products;
            this._cacheTimestamp = Date.now();
            
            // Also save to localStorage if available
            try {
                localStorage.setItem(this.config.cacheKey, JSON.stringify({
                    products: products,
                    timestamp: this._cacheTimestamp
                }));
            } catch (e) {
                // Ignore localStorage errors
            }
        }

        _clearCache() {
            this._cache = null;
            this._cacheTimestamp = null;
            try {
                localStorage.removeItem(this.config.cacheKey);
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    }

    // Export to global scope
    global.GSRCDNProductFetcher = GSRCDNProductFetcher;
    global.GDriveImageHandler = GDriveImageHandler;
    global.ProductSchemaMapper = ProductSchemaMapper;

    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return { GSRCDNProductFetcher, GDriveImageHandler, ProductSchemaMapper };
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = { GSRCDNProductFetcher, GDriveImageHandler, ProductSchemaMapper };
    }

})(typeof window !== 'undefined' ? window : this);
