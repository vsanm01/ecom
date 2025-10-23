/**
 * LightboxWrapper - A reusable image lightbox library wrapper
 * Version: 1.0.0
 * 
 * Dependencies:
 * - GLightbox (https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/js/glightbox.min.js)
 * - GLightbox CSS (https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/css/glightbox.min.css)
 * 
 * Usage:
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/css/glightbox.min.css">
 * <script src="https://cdn.jsdelivr.net/npm/glightbox@3.2.0/dist/js/glightbox.min.js"></script>
 * <script src="lightbox-wrapper.js"></script>
 * 
 * // Initialize
 * LightboxWrapper.init({
 *   selector: '.lightbox-trigger',
 *   zoomable: true,
 *   draggable: true
 * });
 * 
 * // Or use without GLightbox dependency (fallback mode)
 * LightboxWrapper.init({ useFallback: true });
 */

(function(window, document) {
    'use strict';
    
    const LightboxWrapper = {
        config: {
            selector: '.lightbox-trigger',
            imageAttr: 'data-image',
            titleAttr: 'data-title',
            descriptionAttr: 'data-description',
            zoomable: true,
            draggable: true,
            touchNavigation: true,
            loop: false,
            closeOnOutsideClick: true,
            autoplayVideos: false,
            width: '95vw',
            height: '95vh',
            useFallback: false,
            onOpen: null,
            onClose: null,
            customSVG: {
                close: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
                next: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
                prev: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>'
            }
        },
        
        instance: null,
        isGLightboxAvailable: false,
        
        /**
         * Initialize the lightbox
         */
        init: function(options) {
            this.config = Object.assign({}, this.config, options || {});
            this.isGLightboxAvailable = typeof GLightbox !== 'undefined';
            
            if (this.config.useFallback || !this.isGLightboxAvailable) {
                this.injectFallbackStyles();
                this.initFallback();
            } else {
                this.initGLightbox();
            }
        },
        
        /**
         * Initialize GLightbox
         */
        initGLightbox: function() {
            // Destroy existing instance
            if (this.instance) {
                this.instance.destroy();
            }
            
            // Attach click listeners
            this.attachListeners();
        },
        
        /**
         * Attach click event listeners to elements
         */
        attachListeners: function() {
            const elements = document.querySelectorAll(this.config.selector);
            
            elements.forEach(element => {
                // Remove existing listeners
                element.removeEventListener('click', this.handleClick);
                
                // Add new listener
                element.addEventListener('click', this.handleClick.bind(this));
            });
        },
        
        /**
         * Handle click on lightbox trigger
         */
        handleClick: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.currentTarget;
            const imageUrl = element.getAttribute(this.config.imageAttr);
            const title = element.getAttribute(this.config.titleAttr);
            const description = element.getAttribute(this.config.descriptionAttr);
            
            if (!imageUrl) {
                console.warn('No image URL found');
                return;
            }
            
            if (this.config.useFallback || !this.isGLightboxAvailable) {
                this.openFallback(imageUrl, title, description);
            } else {
                this.openGLightbox(imageUrl, title, description);
            }
        },
        
        /**
         * Open GLightbox
         */
        openGLightbox: function(imageUrl, title, description) {
            if (this.instance) {
                this.instance.destroy();
            }
            
            this.instance = GLightbox({
                elements: [{
                    href: imageUrl,
                    type: 'image',
                    title: title || '',
                    description: description || '',
                    width: this.config.width,
                    height: this.config.height
                }],
                touchNavigation: this.config.touchNavigation,
                loop: this.config.loop,
                autoplayVideos: this.config.autoplayVideos,
                zoomable: this.config.zoomable,
                draggable: this.config.draggable,
                closeOnOutsideClick: this.config.closeOnOutsideClick,
                svg: this.config.customSVG,
                onOpen: () => {
                    if (this.config.onOpen) {
                        this.config.onOpen();
                    }
                },
                onClose: () => {
                    if (this.config.onClose) {
                        this.config.onClose();
                    }
                }
            });
            
            this.instance.open();
        },
        
        /**
         * Inject fallback lightbox styles
         */
        injectFallbackStyles: function() {
            if (document.getElementById('lw-fallback-styles')) return;
            
            const styles = `
                <style id="lw-fallback-styles">
                    .lw-lightbox {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.95);
                        z-index: 999999;
                        animation: lw-fadeIn 0.3s ease;
                    }
                    
                    .lw-lightbox.active {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .lw-content {
                        position: relative;
                        max-width: 95vw;
                        max-height: 95vh;
                        animation: lw-zoomIn 0.3s ease;
                    }
                    
                    .lw-image {
                        max-width: 100%;
                        max-height: 95vh;
                        object-fit: contain;
                        border-radius: 8px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                    
                    .lw-close {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        width: 50px;
                        height: 50px;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s;
                        z-index: 1000000;
                    }
                    
                    .lw-close:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: rotate(90deg) scale(1.1);
                    }
                    
                    .lw-close svg {
                        width: 24px;
                        height: 24px;
                        stroke: white;
                    }
                    
                    .lw-info {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
                        padding: 40px 20px 20px;
                        color: white;
                        text-align: center;
                    }
                    
                    .lw-title {
                        font-size: 24px;
                        font-weight: 700;
                        margin-bottom: 8px;
                    }
                    
                    .lw-description {
                        font-size: 16px;
                        opacity: 0.9;
                    }
                    
                    .lw-zoom-controls {
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 10px;
                        z-index: 1000000;
                    }
                    
                    .lw-zoom-btn {
                        width: 40px;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 20px;
                        transition: all 0.3s;
                    }
                    
                    .lw-zoom-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: scale(1.1);
                    }
                    
                    @keyframes lw-fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes lw-zoomIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .lw-title {
                            font-size: 18px;
                        }
                        
                        .lw-description {
                            font-size: 14px;
                        }
                        
                        .lw-close {
                            width: 40px;
                            height: 40px;
                            top: 15px;
                            right: 15px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        /**
         * Initialize fallback lightbox
         */
        initFallback: function() {
            if (document.getElementById('lw-lightbox')) return;
            
            const lightbox = `
                <div id="lw-lightbox" class="lw-lightbox">
                    <button class="lw-close" id="lw-close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="lw-content">
                        <img id="lw-image" class="lw-image" alt="Lightbox Image">
                    </div>
                    <div class="lw-info" id="lw-info" style="display: none;">
                        <div class="lw-title" id="lw-title"></div>
                        <div class="lw-description" id="lw-description"></div>
                    </div>
                    ${this.config.zoomable ? `
                        <div class="lw-zoom-controls">
                            <button class="lw-zoom-btn" id="lw-zoom-out">-</button>
                            <button class="lw-zoom-btn" id="lw-zoom-reset">⟲</button>
                            <button class="lw-zoom-btn" id="lw-zoom-in">+</button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', lightbox);
            
            // Attach fallback event listeners
            this.attachFallbackListeners();
            this.attachListeners();
        },
        
        /**
         * Attach fallback lightbox event listeners
         */
        attachFallbackListeners: function() {
            const lightbox = document.getElementById('lw-lightbox');
            const closeBtn = document.getElementById('lw-close');
            const image = document.getElementById('lw-image');
            
            // Close on click outside or close button
            closeBtn.addEventListener('click', () => this.closeFallback());
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.closeFallback();
                }
            });
            
            // Close on ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                    this.closeFallback();
                }
            });
            
            // Zoom controls
            if (this.config.zoomable) {
                let scale = 1;
                
                document.getElementById('lw-zoom-in')?.addEventListener('click', () => {
                    scale = Math.min(scale + 0.2, 3);
                    image.style.transform = `scale(${scale})`;
                });
                
                document.getElementById('lw-zoom-out')?.addEventListener('click', () => {
                    scale = Math.max(scale - 0.2, 0.5);
                    image.style.transform = `scale(${scale})`;
                });
                
                document.getElementById('lw-zoom-reset')?.addEventListener('click', () => {
                    scale = 1;
                    image.style.transform = 'scale(1)';
                });
                
                // Mouse wheel zoom
                image.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    scale += e.deltaY > 0 ? -0.1 : 0.1;
                    scale = Math.max(0.5, Math.min(3, scale));
                    image.style.transform = `scale(${scale})`;
                });
            }
            
            // Dragging
            if (this.config.draggable) {
                let isDragging = false;
                let startX, startY, translateX = 0, translateY = 0;
                
                image.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    startX = e.clientX - translateX;
                    startY = e.clientY - translateY;
                    image.style.cursor = 'grabbing';
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    translateX = e.clientX - startX;
                    translateY = e.clientY - startY;
                    image.style.transform = `scale(${image.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1}) translate(${translateX}px, ${translateY}px)`;
                });
                
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    image.style.cursor = 'grab';
                });
            }
        },
        
        /**
         * Open fallback lightbox
         */
        openFallback: function(imageUrl, title, description) {
            const lightbox = document.getElementById('lw-lightbox');
            const image = document.getElementById('lw-image');
            const info = document.getElementById('lw-info');
            const titleEl = document.getElementById('lw-title');
            const descEl = document.getElementById('lw-description');
            
            image.src = imageUrl;
            image.style.transform = 'scale(1)';
            
            if (title || description) {
                info.style.display = 'block';
                titleEl.textContent = title || '';
                descEl.textContent = description || '';
            } else {
                info.style.display = 'none';
            }
            
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (this.config.onOpen) {
                this.config.onOpen();
            }
        },
        
        /**
         * Close fallback lightbox
         */
        closeFallback: function() {
            const lightbox = document.getElementById('lw-lightbox');
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            
            if (this.config.onClose) {
                this.config.onClose();
            }
        },
        
        /**
         * Open lightbox programmatically
         */
        open: function(imageUrl, title, description) {
            if (this.config.useFallback || !this.isGLightboxAvailable) {
                this.openFallback(imageUrl, title, description);
            } else {
                this.openGLightbox(imageUrl, title, description);
            }
        },
        
        /**
         * Close lightbox
         */
        close: function() {
            if (this.config.useFallback || !this.isGLightboxAvailable) {
                this.closeFallback();
            } else if (this.instance) {
                this.instance.close();
            }
        },
        
        /**
         * Destroy lightbox
         */
        destroy: function() {
            if (this.instance) {
                this.instance.destroy();
                this.instance = null;
            }
            
            const lightbox = document.getElementById('lw-lightbox');
            if (lightbox) {
                lightbox.remove();
            }
            
            const elements = document.querySelectorAll(this.config.selector);
            elements.forEach(element => {
                element.removeEventListener('click', this.handleClick);
            });
        },
        
        /**
         * Refresh/reinitialize lightbox
         */
        refresh: function() {
            this.destroy();
            this.init(this.config);
        }
    };
    
    // Expose to global scope
    window.LightboxWrapper = LightboxWrapper;
    
})(window, document);