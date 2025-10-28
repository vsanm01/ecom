/**
 * DBC Welcome Module - CDN Version
 * Usage: <script src="path/to/dbc-welcome.js"></script>
 * Then call: DBCWelcome.render('container-id', options);
 */

(function(global) {
    'use strict';

    const DBCWelcome = {
        version: '1.0.0',
        
        /**
         * Render the welcome component
         * @param {string} containerId - ID of the container element
         * @param {Object} options - Configuration options
         * @param {string} options.title - Custom title text (default: "Welcome to DBC 101")
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
                title: options.title || 'Welcome to DBC  DEmo 101 ',
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
                    align-items: center;
                    justify-content: center;
                }

                .dbc-welcome-title {
                    color: ${config.titleColor};
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    margin: 0;
                }

                @media (max-width: 600px) {
                    .dbc-welcome-card {
                        padding: 40px 30px;
                        border-radius: 20px;
                    }

                    .dbc-welcome-title {
                        font-size: 24px;
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
