/**
 * Social Media Module - CDN Version
 * Usage: <script src="path/to/social-media-module.js"></script>
 * Then call: SocialMediaModule.render('container-id', options);
 */

(function(global) {
    'use strict';

    const SocialMediaModule = {
        version: '1.0.0',
        
        /**
         * Render the social media component
         * @param {string} containerId - ID of the container element
         * @param {Object} options - Configuration options
         * @param {string} options.title - Title text (default: "Connect With Us")
         * @param {Object} options.urls - Object with platform URLs { 'Facebook': 'https://...', ... }
         * @param {string} options.backgroundColor - Background color (default: "#f5f7fa")
         * @param {boolean} options.showLabels - Show platform labels (default: true)
         * @param {string} options.gridColumns - Number of columns (default: "6")
         */
        render: function(containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`SocialMediaModule: Container with id "${containerId}" not found`);
                return;
            }

            // Default options
            const config = {
                title: options.title || 'Connect With Us',
                backgroundColor: options.backgroundColor || '#f5f7fa',
                showLabels: options.showLabels !== false,
                gridColumns: options.gridColumns || '6',
                urls: options.urls || {}
            };

            // Define social media platforms
            const platforms = [
                { name: 'Website', icon: '🌐', color: '#4285F4', url: config.urls['Website'] || '' },
                { name: 'Blog', icon: '📝', color: '#FF6B35', url: config.urls['Blog'] || '' },
                { name: 'Facebook', icon: 'f', color: '#1877F2', url: config.urls['Facebook'] || '' },
                { name: 'Instagram', icon: '📷', color: '#E4405F', url: config.urls['Instagram'] || '' },
                { name: 'YouTube', icon: '▶', color: '#FF0000', url: config.urls['YouTube'] || '' },
                { name: 'TikTok', icon: '♪', color: '#000000', url: config.urls['TikTok'] || '' },
                { name: 'X', icon: '𝕏', color: '#000000', url: config.urls['X'] || config.urls['Twitter'] || '' },
                { name: 'Pinterest', icon: 'P', color: '#E60023', url: config.urls['Pinterest'] || '' },
                { name: 'LinkedIn', icon: 'in', color: '#0A66C2', url: config.urls['LinkedIn'] || '' },
                { name: 'WhatsApp', icon: '💬', color: '#25D366', url: config.urls['WhatsApp'] || '' },
                { name: 'Telegram', icon: '✈', color: '#26A5E4', url: config.urls['Telegram'] || '' },
                { name: 'Arattai', icon: '🗣️', color: '#FF8C42', url: config.urls['Arattai'] || '' },
                { name: 'Discord', icon: '🎮', color: '#5865F2', url: config.urls['Discord'] || '' },
                { name: 'Play Store', icon: '▶', color: '#34A853', url: config.urls['Play Store'] || '' },
                { name: 'Google Business', icon: 'G', color: '#4285F4', url: config.urls['Google Business'] || '' },
                { name: 'Wikipedia', icon: 'W', color: '#000000', url: config.urls['Wikipedia'] || '' },
                { name: 'Reddit', icon: '🤖', color: '#FF4500', url: config.urls['Reddit'] || '' },
                { name: 'Quora', icon: 'Q', color: '#B92B27', url: config.urls['Quora'] || '' }
            ];

            // Inject styles
            this._injectStyles(config);

            // Create platform HTML
            const platformsHTML = platforms.map(platform => {
                const hasUrl = platform.url && platform.url.trim() !== '';
                const dataUrl = hasUrl ? `data-url="${this._escapeHtml(platform.url)}"` : '';
                const clickable = hasUrl ? 'sm-clickable' : 'sm-disabled';
                
                return `
                    <div class="sm-item ${clickable}" ${dataUrl} title="${hasUrl ? 'Visit ' + platform.name : 'URL not configured'}">
                        <div class="sm-icon" style="background-color: ${platform.color};">
                            <span class="sm-icon-text">${platform.icon}</span>
                        </div>
                        ${config.showLabels ? `<div class="sm-label">${this._escapeHtml(platform.name)}</div>` : ''}
                    </div>
                `;
            }).join('');

            // Create and inject HTML
            container.innerHTML = `
                <div class="sm-wrapper">
                    <div class="sm-container">
                        <h2 class="sm-title">${this._escapeHtml(config.title)}</h2>
                        <div class="sm-grid" style="grid-template-columns: repeat(${config.gridColumns}, 1fr);">
                            ${platformsHTML}
                        </div>
                    </div>
                </div>
            `;

            // Attach click event listeners
            this._attachEventListeners(containerId);
        },

        /**
         * Attach click event listeners to social media icons
         */
        _attachEventListeners: function(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const clickableItems = container.querySelectorAll('.sm-clickable');
            clickableItems.forEach(item => {
                item.addEventListener('click', function() {
                    const url = this.getAttribute('data-url');
                    if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }
                });
            });
        },

        /**
         * Inject CSS styles into the document
         */
        _injectStyles: function(config) {
            // Check if styles already exist
            if (document.getElementById('social-media-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'social-media-styles';
            style.textContent = `
                .sm-wrapper {
                    background-color: ${config.backgroundColor};
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                }

                .sm-container {
                    max-width: 800px;
                    width: 100%;
                }

                .sm-title {
                    text-align: center;
                    font-size: 36px;
                    font-weight: 700;
                    color: #2c3e50;
                    margin: 0 0 50px 0;
                    letter-spacing: -0.5px;
                }

                .sm-grid {
                    display: grid;
                    gap: 30px;
                    padding: 0;
                }

                .sm-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    transition: transform 0.2s ease;
                }

                .sm-clickable {
                    cursor: pointer;
                }

                .sm-clickable:hover {
                    transform: translateY(-5px);
                }

                .sm-disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .sm-icon {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                }

                .sm-clickable:hover .sm-icon {
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
                    transform: scale(1.1);
                }

                .sm-icon-text {
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    line-height: 1;
                }

                .sm-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #5a6c7d;
                    text-align: center;
                    max-width: 100px;
                    word-wrap: break-word;
                }

                @media (max-width: 768px) {
                    .sm-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 25px;
                    }

                    .sm-title {
                        font-size: 28px;
                        margin-bottom: 35px;
                    }

                    .sm-icon {
                        width: 60px;
                        height: 60px;
                    }

                    .sm-icon-text {
                        font-size: 28px;
                    }
                }

                @media (max-width: 480px) {
                    .sm-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 20px;
                    }

                    .sm-icon {
                        width: 55px;
                        height: 55px;
                    }

                    .sm-icon-text {
                        font-size: 24px;
                    }

                    .sm-label {
                        font-size: 11px;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Escape HTML to prevent XSS
         */
        _escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Remove the social media component
         */
        destroy: function(containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        }
    };

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SocialMediaModule;
    } else {
        global.SocialMediaModule = SocialMediaModule;
    }

})(typeof window !== 'undefined' ? window : this);