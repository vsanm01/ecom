/**
 * DBC Welcome Module - CDN Version with Play Store Link
 * Usage: <script src="path/to/dbc-welcome.js"></script>
 * Then call: DBCWelcome.render('container-id', options);
 */

(function(global) {
    'use strict';

    const DBCWelcome = {
        version: '1.1.0',
        
        /**
         * Render the welcome component
         * @param {string} containerId - ID of the container element
         * @param {Object} options - Configuration options
         * @param {string} options.title - Custom title text (default: "Welcome to DBC 101")
         * @param {string} options.playStoreUrl - Play Store URL (default: "https://play.google.com/store")
         * @param {string} options.gradientStart - Start color of gradient (default: "#667eea")
         * @param {string} options.gradientEnd - End color of gradient (default: "#764ba2")
         * @param {string} options.titleColor - Title text color (default: "#4a5fc1")
         * @param {string} options.borderColor - Card border color (default: "#888")
         */
        render: function(containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`DBCWelcome: Container with id "${containerId}" not found`);
                return;
            }

            // Default options
            const config = {
                title: options.title || 'Welcome to DBC 101',
                playStoreUrl: options.playStoreUrl || 'https://play.google.com/store',
                gradientStart: options.gradientStart || '#667eea',
                gradientEnd: options.gradientEnd || '#764ba2',
                titleColor: options.titleColor || '#4a5fc1',
                borderColor: options.borderColor || '#888'
            };

            // Inject styles
            this._injectStyles(config);

            // Create and inject HTML
            container.innerHTML = `
                <div class="dbc-welcome-wrapper">
                    <div class="dbc-welcome-card">
                        <h1 class="dbc-welcome-title">${this._escapeHtml(config.title)}</h1>
                        <a href="${this._escapeHtml(config.playStoreUrl)}" target="_blank" rel="noopener noreferrer" class="dbc-playstore-link" title="Visit Play Store">
                            <svg class="dbc-playstore-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#34A853"/>
                                <path d="M13.69,12L3.84,2.15C3.99,2.06 4.15,2 4.34,2C4.68,2 5,2.12 5.35,2.34L16.81,8.88L13.69,12Z" fill="#EA4335"/>
                                <path d="M13.69,12L16.81,15.12L5.35,21.66C5,21.88 4.68,22 4.34,22C4.15,22 3.99,21.94 3.84,21.85L13.69,12Z" fill="#FBBC04"/>
                                <path d="M13.69,12L17.89,14.5L20.18,13.18C20.53,12.9 20.75,12.5 20.75,12C20.75,11.5 20.5,11.08 20.16,10.81L17.89,9.5L13.69,12Z" fill="#4285F4"/>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
        },

        /**
         * Inject CSS styles into the document
         */
        _injectStyles: function(config) {
            // Check if styles already exist
            if (document.getElementById('dbc-welcome-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'dbc-welcome-styles';
            style.textContent = `
                .dbc-welcome-wrapper {
                    background: linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    margin: 0;
                }

                .dbc-welcome-card {
                    background: white;
                    border: 4px solid ${config.borderColor};
                    border-radius: 30px;
                    padding: 60px 80px;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    min-height: 250px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                }

                .dbc-welcome-title {
                    color: ${config.titleColor};
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    margin: 0;
                }

                .dbc-playstore-link {
                    display: inline-block;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    cursor: pointer;
                }

                .dbc-playstore-link:hover {
                    transform: scale(1.1);
                    opacity: 0.8;
                }

                .dbc-playstore-link:active {
                    transform: scale(0.95);
                }

                .dbc-playstore-icon {
                    width: 80px;
                    height: 80px;
                    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
                }

                @media (max-width: 600px) {
                    .dbc-welcome-card {
                        padding: 40px 30px;
                        border-radius: 20px;
                        gap: 20px;
                    }

                    .dbc-welcome-title {
                        font-size: 24px;
                    }

                    .dbc-playstore-icon {
                        width: 60px;
                        height: 60px;
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
         * Remove the welcome component
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
        module.exports = DBCWelcome;
    } else {
        global.DBCWelcome = DBCWelcome;
    }

})(typeof window !== 'undefined' ? window : this);
