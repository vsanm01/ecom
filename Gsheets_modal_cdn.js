/**
 * Google Sheets Modal Library
 * A reusable library to display Google Sheets data in beautiful modals
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Initialize: SheetsModal.init('YOUR_WEBAPP_URL');
 * 3. Open modal: SheetsModal.open('Sheet5', 'B37');
 */

(function(window) {
  'use strict';

  const SheetsModal = {
    webAppUrl: '',
    isInitialized: false,

    /**
     * Initialize the library with your Google Apps Script Web App URL
     * @param {string} url - Your deployed Web App URL
     * @param {object} options - Optional configuration
     */
    init: function(url, options = {}) {
      if (!url) {
        console.error('SheetsModal: Web App URL is required');
        return;
      }

      this.webAppUrl = url;
      this.isInitialized = true;

      // Apply custom options
      this.options = {
        theme: options.theme || 'default', // 'default', 'dark', 'light'
        animation: options.animation !== false, // true by default
        closeOnOverlayClick: options.closeOnOverlayClick !== false,
        closeOnEscape: options.closeOnEscape !== false,
        ...options
      };

      // Inject styles
      this._injectStyles();

      // Create modal HTML structure
      this._createModalStructure();

      // Setup event listeners
      this._setupEventListeners();

      console.log('SheetsModal initialized successfully');
    },

    /**
     * Open modal and fetch data from Google Sheets
     * @param {string} sheetName - Name of the sheet (Sheet5 or Sheet6)
     * @param {string} range - Cell range (e.g., 'B37', 'B37,D44', 'B10:B15')
     * @param {object} options - Optional display options
     */
    open: async function(sheetName, range, options = {}) {
      if (!this.isInitialized) {
        console.error('SheetsModal: Please call init() first');
        return;
      }

      const modal = document.getElementById('sheets-modal');
      const modalTitle = document.getElementById('sheets-modal-title');
      const modalBody = document.getElementById('sheets-modal-body');

      // Show modal with loading state
      modal.style.display = 'flex';
      modalTitle.textContent = options.title || 'Loading...';
      modalBody.innerHTML = '<div class="sheets-modal-loading">Fetching data...</div>';

      try {
        const data = await this._fetchData(sheetName, range);
        modalTitle.textContent = options.title || `${sheetName} - ${range}`;
        modalBody.innerHTML = this._formatData(data, options);
      } catch (error) {
        modalTitle.textContent = 'Error';
        modalBody.innerHTML = `<div class="sheets-modal-error">${error.message}</div>`;
      }
    },

    /**
     * Close the modal
     */
    close: function() {
      const modal = document.getElementById('sheets-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    },

    /**
     * Fetch data from Google Sheets
     * @private
     */
    _fetchData: async function(sheetName, range) {
      const url = `${this.webAppUrl}?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}&type=modal`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Sheets');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },

    /**
     * Format data for display
     * @private
     */
    _formatData: function(data, options = {}) {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return '<p class="sheets-modal-empty">No data found</p>';
      }

      const formatter = options.formatter || this._defaultFormatter;
      return formatter(data, options);
    },

    /**
     * Default data formatter
     * @private
     */
    _defaultFormatter: function(data, options) {
      let html = '';

      if (Array.isArray(data)) {
        data.forEach(item => {
          Object.keys(item).forEach(cellRef => {
            const value = item[cellRef];
            html += `
              <div class="sheets-modal-cell">
                <div class="sheets-modal-cell-ref">${cellRef}</div>
                <div class="sheets-modal-cell-value">${value || '<em>Empty</em>'}</div>
              </div>
            `;
          });
        });
      } else {
        html += '<div class="sheets-modal-cell">';
        Object.keys(data).forEach(key => {
          html += `
            <div class="sheets-modal-cell-ref">${key}</div>
            <div class="sheets-modal-cell-value">${data[key] || '<em>Empty</em>'}</div>
          `;
        });
        html += '</div>';
      }

      return html;
    },

    /**
     * Create modal HTML structure
     * @private
     */
    _createModalStructure: function() {
      // Check if modal already exists
      if (document.getElementById('sheets-modal')) {
        return;
      }

      const modalHTML = `
        <div id="sheets-modal" class="sheets-modal">
          <div class="sheets-modal-overlay"></div>
          <div class="sheets-modal-content">
            <button class="sheets-modal-close" aria-label="Close">&times;</button>
            <h2 id="sheets-modal-title" class="sheets-modal-title">Loading...</h2>
            <div id="sheets-modal-body" class="sheets-modal-body"></div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners: function() {
      const modal = document.getElementById('sheets-modal');
      const closeBtn = document.querySelector('.sheets-modal-close');
      const overlay = document.querySelector('.sheets-modal-overlay');

      // Close button click
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click
      if (overlay && this.options.closeOnOverlayClick) {
        overlay.addEventListener('click', () => this.close());
      }

      // Escape key
      if (this.options.closeOnEscape) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.style.display === 'flex') {
            this.close();
          }
        });
      }
    },

    /**
     * Inject CSS styles
     * @private
     */
    _injectStyles: function() {
      if (document.getElementById('sheets-modal-styles')) {
        return;
      }

      const styles = `
        .sheets-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999;
          align-items: center;
          justify-content: center;
          animation: sheetsModalFadeIn 0.3s ease;
        }

        @keyframes sheetsModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sheets-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }

        .sheets-modal-content {
          position: relative;
          background: white;
          padding: 30px;
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
          animation: sheetsModalSlideDown 0.3s ease;
          z-index: 1;
        }

        @keyframes sheetsModalSlideDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .sheets-modal-close {
          position: absolute;
          right: 20px;
          top: 20px;
          background: none;
          border: none;
          font-size: 32px;
          color: #999;
          cursor: pointer;
          transition: color 0.3s;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 1;
        }

        .sheets-modal-close:hover {
          color: #333;
        }

        .sheets-modal-title {
          color: #333;
          font-size: 24px;
          margin: 0 0 20px 0;
          padding-right: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sheets-modal-body {
          color: #555;
          line-height: 1.8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sheets-modal-loading {
          text-align: center;
          padding: 30px;
          color: #667eea;
          font-size: 16px;
        }

        .sheets-modal-error {
          color: #e74c3c;
          padding: 20px;
          background: #fadbd8;
          border-radius: 8px;
          border-left: 4px solid #e74c3c;
        }

        .sheets-modal-empty {
          text-align: center;
          padding: 30px;
          color: #999;
        }

        .sheets-modal-cell {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #667eea;
        }

        .sheets-modal-cell-ref {
          font-weight: 600;
          color: #667eea;
          font-size: 14px;
          margin-bottom: 8px;
          font-family: monospace;
        }

        .sheets-modal-cell-value {
          color: #333;
          font-size: 16px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sheets-modal-content {
            width: 95%;
            padding: 20px;
            max-height: 90vh;
          }

          .sheets-modal-title {
            font-size: 20px;
          }

          .sheets-modal-close {
            right: 15px;
            top: 15px;
          }
        }

        /* Dark theme support */
        @media (prefers-color-scheme: dark) {
          .sheets-modal-content {
            background: #1e1e1e;
          }

          .sheets-modal-title,
          .sheets-modal-cell-value {
            color: #e0e0e0;
          }

          .sheets-modal-body {
            color: #b0b0b0;
          }

          .sheets-modal-cell {
            background: #2d2d2d;
          }

          .sheets-modal-close {
            color: #888;
          }

          .sheets-modal-close:hover {
            color: #fff;
          }
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.id = 'sheets-modal-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  };

  // Expose to global scope
  window.SheetsModal = SheetsModal;

})(window);