/**
 * Social Media Modal Module - CDN Version
 * Usage: <script src="path/to/social-modal.js"></script>
 * Then call: SocialModal.render('container-id', options);
 */

(function(global) {
    'use strict';

    const SocialModal = {
        version: '1.0.0',
        
        /**
         * Render the social media modal
         * @param {string} containerId - ID of the container element
         * @param {Object} options - Configuration options
         * @param {string} options.title - Custom title text (default: "Connect With Us")
         * @param {Object} options.links - Social media URLs (optional)
         * @param {string} options.gradientStart - Start color of gradient (default: "#667eea")
         * @param {string} options.gradientEnd - End color of gradient (default: "#764ba2")
         * @param {string} options.titleColor - Title text color (default: "#4a5fc1")
         * @param {string} options.borderColor - Card border color (default: "#888")
         */
        render: function(containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`SocialModal: Container with id "${containerId}" not found`);
                return;
            }

            // Default options
            const config = {
                title: options.title || 'Connect With Us',
                gradientStart: options.gradientStart || '#667eea',
                gradientEnd: options.gradientEnd || '#764ba2',
                titleColor: options.titleColor || '#4a5fc1',
                borderColor: options.borderColor || '#888',
                links: options.links || {}
            };

            // Default social media links
            const socialLinks = {
                website: config.links.website || '#',
                blog: config.links.blog || '#',
                facebook: config.links.facebook || '#',
                instagram: config.links.instagram || '#',
                youtube: config.links.youtube || '#',
                tiktok: config.links.tiktok || '#',
                twitter: config.links.twitter || '#',
                pinterest: config.links.pinterest || '#',
                linkedin: config.links.linkedin || '#',
                whatsapp: config.links.whatsapp || '#',
                telegram: config.links.telegram || '#',
                arattai: config.links.arattai || '#',
                discord: config.links.discord || '#',
                playstore: config.links.playstore || '#',
                googlebusiness: config.links.googlebusiness || '#',
                wikipedia: config.links.wikipedia || '#',
                reddit: config.links.reddit || '#',
                quora: config.links.quora || '#'
            };

            // Inject styles
            this._injectStyles(config);

            // Create and inject HTML
            container.innerHTML = `
                <div class="social-modal-wrapper">
                    <div class="social-modal-card">
                        <h1 class="social-modal-title">${this._escapeHtml(config.title)}</h1>
                        <div class="social-grid">
                            ${this._createSocialIcon('Website', socialLinks.website, this._getWebsiteIcon())}
                            ${this._createSocialIcon('Blog', socialLinks.blog, this._getBlogIcon())}
                            ${this._createSocialIcon('Facebook', socialLinks.facebook, this._getFacebookIcon())}
                            ${this._createSocialIcon('Instagram', socialLinks.instagram, this._getInstagramIcon())}
                            ${this._createSocialIcon('YouTube', socialLinks.youtube, this._getYouTubeIcon())}
                            ${this._createSocialIcon('TikTok', socialLinks.tiktok, this._getTikTokIcon())}
                            ${this._createSocialIcon('X', socialLinks.twitter, this._getTwitterIcon())}
                            ${this._createSocialIcon('Pinterest', socialLinks.pinterest, this._getPinterestIcon())}
                            ${this._createSocialIcon('LinkedIn', socialLinks.linkedin, this._getLinkedInIcon())}
                            ${this._createSocialIcon('WhatsApp', socialLinks.whatsapp, this._getWhatsAppIcon())}
                            ${this._createSocialIcon('Telegram', socialLinks.telegram, this._getTelegramIcon())}
                            ${this._createSocialIcon('Arattai', socialLinks.arattai, this._getArattaiIcon())}
                            ${this._createSocialIcon('Discord', socialLinks.discord, this._getDiscordIcon())}
                            ${this._createSocialIcon('Play Store', socialLinks.playstore, this._getPlayStoreIcon())}
                            ${this._createSocialIcon('Google Business', socialLinks.googlebusiness, this._getGoogleBusinessIcon())}
                            ${this._createSocialIcon('Wikipedia', socialLinks.wikipedia, this._getWikipediaIcon())}
                            ${this._createSocialIcon('Reddit', socialLinks.reddit, this._getRedditIcon())}
                            ${this._createSocialIcon('Quora', socialLinks.quora, this._getQuoraIcon())}
                        </div>
                    </div>
                </div>
            `;
        },

        _createSocialIcon: function(name, url, svgIcon) {
            return `
                <a href="${this._escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="social-item" title="${this._escapeHtml(name)}">
                    ${svgIcon}
                    <span class="social-label">${this._escapeHtml(name)}</span>
                </a>
            `;
        },

        // Icon SVGs
        _getWebsiteIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#4285F4" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/></svg>`;
        },

        _getBlogIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#FF6B35" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`;
        },

        _getFacebookIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#1877F2" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>`;
        },

        _getInstagramIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><defs><linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#FED373;stop-opacity:1"/><stop offset="50%" style="stop-color:#F15245;stop-opacity:1"/><stop offset="100%" style="stop-color:#D92E7F;stop-opacity:1"/></linearGradient></defs><path fill="url(#ig-gradient)" d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/></svg>`;
        },

        _getYouTubeIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#FF0000" d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/></svg>`;
        },

        _getTikTokIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#000000" d="M16.6,5.82C15.9,5.03 15.5,4 15.5,2.9V2H12.2V15.5C12.2,16.95 11,18.1 9.5,18.1C8,18.1 6.8,16.95 6.8,15.5C6.8,14.05 8,12.9 9.5,12.9C9.9,12.9 10.3,13 10.6,13.1V9.7C10.3,9.65 10,9.6 9.7,9.6C6.2,9.6 3.4,12.42 3.4,15.92C3.4,19.42 6.22,22.24 9.72,22.24C13.22,22.24 16.04,19.42 16.04,15.92V8.63C17.2,9.5 18.7,10 20.3,10V6.7C18.6,6.7 17.1,6.42 16.6,5.82Z"/></svg>`;
        },

        _getTwitterIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
        },

        _getPinterestIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#E60023" d="M9.04,21.54C10,21.83 10.97,22 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2A10,10 0 0,0 2,12C2,16.25 4.67,19.9 8.44,21.34C8.35,20.56 8.26,19.27 8.44,18.38L9.59,13.44C9.59,13.44 9.3,12.86 9.3,11.94C9.3,10.56 10.16,9.53 11.14,9.53C12,9.53 12.4,10.16 12.4,10.97C12.4,11.83 11.83,13.06 11.54,14.24C11.37,15.22 12.06,16.08 13.04,16.08C14.8,16.08 16.22,14.18 16.22,11.5C16.22,9.1 14.5,7.46 12.03,7.46C9.21,7.46 7.55,9.56 7.55,11.77C7.55,12.63 7.83,13.5 8.29,14.07C8.38,14.13 8.38,14.21 8.35,14.36L8.06,15.45C8.06,15.62 7.95,15.68 7.78,15.56C6.5,15 5.76,13.18 5.76,11.71C5.76,8.55 8,5.68 12.32,5.68C15.76,5.68 18.44,8.15 18.44,11.43C18.44,14.87 16.31,17.63 13.26,17.63C12.29,17.63 11.34,17.11 11,16.5L10.33,18.87C10.1,19.73 9.47,20.88 9.04,21.57V21.54Z"/></svg>`;
        },

        _getLinkedInIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#0A66C2" d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z"/></svg>`;
        },

        _getWhatsAppIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z"/></svg>`;
        },

        _getTelegramIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#0088CC" d="M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z"/></svg>`;
        },

        _getArattaiIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#FF6B35" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,6H13V14H11V6M11,16H13V18H11V16Z"/></svg>`;
        },

        _getDiscordIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#5865F2" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4A.09.09 0 0 0 14.92 4.05C14.77 4.34 14.6 4.71 14.49 5C12.9 4.75 11.32 4.75 9.73 5C9.62 4.71 9.45 4.34 9.3 4.05A.09.09 0 0 0 9.22 4C7.72 4.26 6.28 4.71 4.95 5.33A.09.09 0 0 0 4.88 5.38C2.37 9.13 1.71 12.79 2.04 16.4A.11.11 0 0 0 2.1 16.49C3.92 17.79 5.69 18.59 7.42 19.1A.09.09 0 0 0 7.52 19.07C7.88 18.6 8.2 18.1 8.48 17.58A.09.09 0 0 0 8.43 17.46C7.92 17.26 7.44 17.03 6.97 16.76A.09.09 0 0 1 6.96 16.63C7.06 16.56 7.16 16.49 7.26 16.42A.09.09 0 0 1 7.37 16.41C10.39 17.8 13.65 17.8 16.64 16.41A.09.09 0 0 1 16.75 16.42C16.85 16.49 16.95 16.56 17.05 16.63A.09.09 0 0 1 17.04 16.76C16.57 17.04 16.09 17.27 15.58 17.46A.09.09 0 0 0 15.53 17.58C15.82 18.1 16.14 18.6 16.49 19.07A.09.09 0 0 0 16.59 19.1C18.33 18.59 20.1 17.79 21.92 16.49A.11.11 0 0 0 21.98 16.4C22.37 12.24 21.3 8.61 19.35 5.38A.09.09 0 0 0 19.27 5.33M8.68 14.25C7.69 14.25 6.87 13.34 6.87 12.21C6.87 11.08 7.67 10.17 8.68 10.17C9.7 10.17 10.51 11.09 10.49 12.21C10.49 13.34 9.69 14.25 8.68 14.25M15.34 14.25C14.35 14.25 13.53 13.34 13.53 12.21C13.53 11.08 14.33 10.17 15.34 10.17C16.36 10.17 17.17 11.09 17.15 12.21C17.15 13.34 16.36 14.25 15.34 14.25Z"/></svg>`;
        },

        _getPlayStoreIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#34A853"/></svg>`;
        },

        _getGoogleBusinessIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#4285F4" d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/></svg>`;
        },

        _getWikipediaIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#000000" d="M13.82,12L20.82,2H19.11L13.09,10.94L13.09,10.94L13,11.07L12,9.58L8.89,5.24H8.87L7.19,2.64H1L4.54,8.14L4.28,8.42L0,2H1.71L7.73,10.94L8,11.33L8.86,12.4L12,16.76L12,16.76L13.68,19.36H19.82L16.28,13.86L16.56,13.58L20.82,19.36H22.54L13.82,12M11,12.73L6.67,6.27H7.73L12,12.73L11,12.73M12,12.73L16.33,19.18H15.27L11,12.73L12,12.73Z"/></svg>`;
        },

        _getRedditIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#FF4500" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M17.28 14.5C17.28 15.91 15.16 17.06 12.54 17.06C9.91 17.06 7.79 15.91 7.79 14.5C7.79 13.09 9.91 11.94 12.54 11.94C15.16 11.94 17.28 13.09 17.28 14.5M10.5 12.5C10.5 11.67 9.83 11 9 11S7.5 11.67 7.5 12.5 8.17 14 9 14 10.5 13.33 10.5 12.5M16.5 12.5C16.5 11.67 15.83 11 15 11S13.5 11.67 13.5 12.5 14.17 14 15 14 16.5 13.33 16.5 12.5Z"/></svg>`;
        },

        _getQuoraIcon: function() {
            return `<svg viewBox="0 0 24 24" class="social-icon"><path fill="#B92B27" d="M9.53,13.13C9.31,13.5 9.03,13.81 8.69,14.07C8.35,14.33 7.95,14.5 7.5,14.5C6.5,14.5 5.75,13.72 5.75,12.75C5.75,11.78 6.5,11 7.5,11C7.95,11 8.35,11.17 8.69,11.43C9.03,11.69 9.31,12 9.53,12.38L11.09,11.5C10.66,10.66 9.91,10 9,9.63V8.25C9,6.46 10.46,5 12.25,5H15.75C17.54,5 19,6.46 19,8.25V15.75C19,17.54 17.54,19 15.75,19H12.25C10.46,19 9,17.54 9,15.75V15.13L9.53,13.13M14.25,11C14.25,9.76 13.24,8.75 12,8.75C10.76,8.75 9.75,9.76 9.75,11C9.75,12.24 10.76,13.25 12,13.25C13.24,13.25 14.25,12.24 14.25,11M16,13L14.5,15H17L18.5,13H16Z"/></svg>`;
        },

        /**
         * Inject CSS styles into the document
         */
        _injectStyles: function(config) {
            // Check if styles already exist
            if (document.getElementById('social-modal-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'social-modal-styles';
            style.textContent = `
                .social-modal-wrapper {
                    background: linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    margin: 0;
                }

                .social-modal-card {
                    background: white;
                    border: 4px solid ${config.borderColor};
                    border-radius: 30px;
                    padding: 40px 50px;
                    max-width: 800px;
                    width: 100%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                }

                .social-modal-title {
                    color: ${config.titleColor};
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    margin: 0 0 30px 0;
                    text-align: center;
                }

                .social-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 25px;
                    justify-items: center;
                }

                .social-grid .social-item:nth-child(n+16) {
                    grid-column: span 1;
                }

                .social-grid .social-item:nth-last-child(-n+3) {
                    grid-column: auto;
                }

                .social-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    cursor: pointer;
                }

                .social-item:hover {
                    transform: scale(1.1);
                    opacity: 0.8;
                }

                .social-item:active {
                    transform: scale(0.95);
                }

                .social-icon {
                    width: 48px;
                    height: 48px;
                    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
                }

                .social-label {
                    font-size: 11px;
                    color: #333;
                    font-weight: 600;
                    text-align: center;
                    max-width: 80px;
                    line-height: 1.2;
                }

                @media (max-width: 768px) {
                    .social-modal-card {
                        padding: 30px 25px;
                        border-radius: 20px;
                    }

                    .social-modal-title {
                        font-size: 24px;
                        margin-bottom: 25px;
                    }

                    .social-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                    }

                    .social-icon {
                        width: 40px;
                        height: 40px;
                    }

                    .social-label {
                        font-size: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .social-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                    }

                    .social-icon {
                        width: 36px;
                        height: 36px;
                    }

                    .social-label {
                        font-size: 9px;
                        max-width: 60px;
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
         * Remove the social modal
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
        module.exports = SocialModal;
    } else {
        global.SocialModal = SocialModal;
    }

})(typeof window !== 'undefined' ? window : this);

/**
 * USAGE EXAMPLE:
 * 
 * <!DOCTYPE html>
 * <html>
 * <head>
 *     <title>Social Media Modal</title>
 * </head>
 * <body>
 *     <div id="social-container"></div>
 *     
 *     <script src="path/to/social-modal.js"></script>
 *     <script>
 *         SocialModal.render('social-container', {
 *             title: 'Connect With Us',
 *             links: {
 *                 website: 'https://example.com',
 *                 facebook: 'https://facebook.com/yourpage',
 *                 instagram: 'https://instagram.com/yourprofile',
 *                 youtube: 'https://youtube.com/@yourchannel',
 *                 twitter: 'https://x.com/yourhandle',
 *                 linkedin: 'https://linkedin.com/company/yourcompany',
 *                 whatsapp: 'https://wa.me/1234567890',
 *                 telegram: 'https://t.me/yourchannel',
 *                 playstore: 'https://play.google.com/store/apps/details?id=com.yourapp'
 *                 // Add other links as needed
 *             }
 *         });
 *     </script>
 * </body>
 * </html>
 */