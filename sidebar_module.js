/**
 * Responsive Sidebar Module
 * Version: 1.0.0
 * A lightweight, customizable sidebar navigation component
 * 
 * Usage:
 * 1. Include CSS: <link rel="stylesheet" href="path/to/sidebar.css">
 * 2. Include JS: <script src="path/to/sidebar.js"></script>
 * 3. Initialize: ResponsiveSidebar.init(config);
 */

(function(window) {
    'use strict';

    const ResponsiveSidebar = {
        config: {
            sidebarId: 'responsive-sidebar',
            overlayId: 'sidebar-overlay',
            hamburgerClass: 'sidebar-hamburger',
            width: '300px',
            direction: 'left', // 'left' or 'right'
            showOverlay: true,
            closeOnOutsideClick: true,
            animationDuration: 300,
            zIndex: 1000,
            menuItems: []
        },

        state: {
            isOpen: false,
            openSubmenus: new Set()
        },

        /**
         * Initialize the sidebar
         * @param {Object} userConfig - Configuration options
         */
        init: function(userConfig = {}) {
            this.config = { ...this.config, ...userConfig };
            this.createSidebar();
            this.attachEventListeners();
            return this;
        },

        /**
         * Create sidebar HTML structure
         */
        createSidebar: function() {
            // Create overlay
            if (this.config.showOverlay) {
                const overlay = document.createElement('div');
                overlay.id = this.config.overlayId;
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
            }

            // Create sidebar container
            const sidebar = document.createElement('div');
            sidebar.id = this.config.sidebarId;
            sidebar.className = 'sidebar';
            sidebar.style.width = this.config.width;
            
            // Create sidebar header
            const header = document.createElement('div');
            header.className = 'sidebar-header';
            header.innerHTML = `
                <h3>${this.config.title || 'Menu'}</h3>
                <button class="sidebar-close-btn" aria-label="Close menu">&times;</button>
            `;

            // Create sidebar menu
            const menu = document.createElement('div');
            menu.className = 'sidebar-menu';
            menu.innerHTML = this.renderMenuItems(this.config.menuItems);

            sidebar.appendChild(header);
            sidebar.appendChild(menu);
            document.body.appendChild(sidebar);
        },

        /**
         * Render menu items recursively
         * @param {Array} items - Menu items array
         * @param {number} level - Nesting level
         */
        renderMenuItems: function(items, level = 0) {
            if (!items || items.length === 0) return '';

            return items.map(item => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const itemId = this.generateId(item.label);
                const indentStyle = level > 0 ? `padding-left: ${20 + (level * 20)}px;` : '';
                const bgStyle = level > 0 ? `background-color: ${level === 1 ? '#f8f9fa' : '#e9ecef'};` : '';

                if (hasSubmenu) {
                    return `
                        <div class="sidebar-menu-item">
                            <button class="sidebar-menu-toggle" data-target="${itemId}" style="${indentStyle}${bgStyle}">
                                ${item.icon ? `<span class="sidebar-icon">${item.icon}</span>` : ''}
                                <span class="sidebar-label">${item.label}</span>
                                ${item.count ? `<span class="sidebar-count">${item.count}</span>` : ''}
                                <span class="sidebar-arrow">&#9660;</span>
                            </button>
                            <div class="sidebar-submenu" id="${itemId}" style="${bgStyle}">
                                ${this.renderMenuItems(item.submenu, level + 1)}
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="sidebar-menu-item">
                            <a href="${item.href || '#'}" class="sidebar-menu-link" style="${indentStyle}${bgStyle}">
                                ${item.icon ? `<span class="sidebar-icon">${item.icon}</span>` : ''}
                                <span class="sidebar-label">${item.label}</span>
                                ${item.count ? `<span class="sidebar-count">${item.count}</span>` : ''}
                            </a>
                        </div>
                    `;
                }
            }).join('');
        },

        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            const self = this;

            // Hamburger toggle
            document.addEventListener('click', function(e) {
                if (e.target.closest('.' + self.config.hamburgerClass)) {
                    self.toggle();
                }
            });

            // Close button
            const closeBtn = document.querySelector('.sidebar-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => self.close());
            }

            // Overlay click
            if (this.config.closeOnOutsideClick) {
                const overlay = document.getElementById(this.config.overlayId);
                if (overlay) {
                    overlay.addEventListener('click', () => self.close());
                }
            }

            // Submenu toggles
            document.addEventListener('click', function(e) {
                const toggle = e.target.closest('.sidebar-menu-toggle');
                if (toggle) {
                    e.preventDefault();
                    const targetId = toggle.getAttribute('data-target');
                    self.toggleSubmenu(targetId, toggle);
                }
            });

            // Close on ESC key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.state.isOpen) {
                    self.close();
                }
            });
        },

        /**
         * Toggle sidebar open/close
         */
        toggle: function() {
            this.state.isOpen ? this.close() : this.open();
        },

        /**
         * Open sidebar
         */
        open: function() {
            const sidebar = document.getElementById(this.config.sidebarId);
            const overlay = document.getElementById(this.config.overlayId);

            if (sidebar) {
                sidebar.classList.add('sidebar-open');
                this.state.isOpen = true;
                document.body.style.overflow = 'hidden';
            }

            if (overlay) {
                overlay.classList.add('sidebar-overlay-show');
            }

            // Trigger custom event
            this.triggerEvent('sidebarOpen');
        },

        /**
         * Close sidebar
         */
        close: function() {
            const sidebar = document.getElementById(this.config.sidebarId);
            const overlay = document.getElementById(this.config.overlayId);

            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
                this.state.isOpen = false;
                document.body.style.overflow = '';
            }

            if (overlay) {
                overlay.classList.remove('sidebar-overlay-show');
            }

            // Trigger custom event
            this.triggerEvent('sidebarClose');
        },

        /**
         * Toggle submenu
         * @param {string} submenuId - Submenu ID
         * @param {Element} toggle - Toggle button element
         */
        toggleSubmenu: function(submenuId, toggle) {
            const submenu = document.getElementById(submenuId);
            const arrow = toggle.querySelector('.sidebar-arrow');

            if (!submenu) return;

            const isOpen = this.state.openSubmenus.has(submenuId);

            if (isOpen) {
                submenu.classList.remove('sidebar-submenu-open');
                arrow.classList.remove('sidebar-arrow-open');
                this.state.openSubmenus.delete(submenuId);
            } else {
                submenu.classList.add('sidebar-submenu-open');
                arrow.classList.add('sidebar-arrow-open');
                this.state.openSubmenus.add(submenuId);
            }
        },

        /**
         * Update menu items dynamically
         * @param {Array} newItems - New menu items
         */
        updateMenu: function(newItems) {
            this.config.menuItems = newItems;
            const menu = document.querySelector('.sidebar-menu');
            if (menu) {
                menu.innerHTML = this.renderMenuItems(newItems);
            }
        },

        /**
         * Update item count
         * @param {string} label - Item label
         * @param {number} count - New count
         */
        updateCount: function(label, count) {
            const menuItems = document.querySelectorAll('.sidebar-menu-toggle, .sidebar-menu-link');
            menuItems.forEach(item => {
                const labelEl = item.querySelector('.sidebar-label');
                if (labelEl && labelEl.textContent === label) {
                    let countEl = item.querySelector('.sidebar-count');
                    if (countEl) {
                        countEl.textContent = count;
                    } else {
                        countEl = document.createElement('span');
                        countEl.className = 'sidebar-count';
                        countEl.textContent = count;
                        item.appendChild(countEl);
                    }
                }
            });
        },

        /**
         * Generate unique ID from label
         * @param {string} label - Menu item label
         */
        generateId: function(label) {
            return 'submenu-' + label.toLowerCase().replace(/\s+/g, '-');
        },

        /**
         * Trigger custom event
         * @param {string} eventName - Event name
         */
        triggerEvent: function(eventName) {
            const event = new CustomEvent(eventName, {
                detail: { sidebar: this }
            });
            window.dispatchEvent(event);
        },

        /**
         * Destroy sidebar
         */
        destroy: function() {
            const sidebar = document.getElementById(this.config.sidebarId);
            const overlay = document.getElementById(this.config.overlayId);

            if (sidebar) sidebar.remove();
            if (overlay) overlay.remove();

            this.state.isOpen = false;
            this.state.openSubmenus.clear();
        }
    };

    // Export to window
    window.ResponsiveSidebar = ResponsiveSidebar;

})(window);
