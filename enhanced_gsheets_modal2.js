/**
 * Google Sheets Modal Library 
 * Displays Google Sheets cell content in a modal dialog
 * Works directly with Google Apps Script - no GSRCDN dependency
 * Enhanced with URL auto-linking and close animation
 */

const GoogleSheetsModal = (function() {
    'use strict';

    let scriptUrl = '';
    let modalElement = null;
    let isInitialized = false;

    // Create modal HTML structure
    function createModalHTML() {
        const modalHTML = `
            <div id="gsheet-modal" class="gsheet-modal" style="display: none;">
                <div class="gsheet-modal-overlay"></div>
                <div class="gsheet-modal-content">
                    <button class="gsheet-modal-close" onclick="GoogleSheetsModal.close()">×</button>
                    <h2 class="gsheet-modal-title" id="gsheet-modal-title">Loading...</h2>
                    <div class="gsheet-modal-body" id="gsheet-modal-body">
                        <div class="gsheet-modal-loader">
                            <div class="spinner"></div>
                            <p>Loading content...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalStyles = `
            <style id="gsheet-modal-styles">
                .gsheet-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 99999;
                    display: none;
                }

                .gsheet-modal.active {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: modalFadeIn 0.3s ease-out;
                }

                .gsheet-modal.closing {
                    animation: modalFadeOut 0.3s ease-out;
                }

                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }

                .gsheet-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                }

                .gsheet-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 700px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                    z-index: 1;
                }

                .gsheet-modal.closing .gsheet-modal-content {
                    animation: modalSlideOut 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes modalSlideOut {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                }

                .gsheet-modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 24px;
                    line-height: 1;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }

                .gsheet-modal-close:hover {
                    background: #dc2626;
                    transform: rotate(90deg);
                }

                .gsheet-modal-title {
                    color: #1f2937;
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    padding-right: 40px;
                }

                .gsheet-modal-body {
                    color: #4b5563;
                    font-size: 16px;
                    line-height: 1.6;
                }

                .gsheet-modal-body h1,
                .gsheet-modal-body h2,
                .gsheet-modal-body h3 {
                    color: #1f2937;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }

                .gsheet-modal-body h1 { font-size: 24px; }
                .gsheet-modal-body h2 { font-size: 20px; }
                .gsheet-modal-body h3 { font-size: 18px; }

                .gsheet-modal-body p {
                    margin-bottom: 15px;
                }

                .gsheet-modal-body ul,
                .gsheet-modal-body ol {
                    margin-left: 20px;
                    margin-bottom: 15px;
                }

                .gsheet-modal-body a {
                    color: #3b82f6;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .gsheet-modal-body a:hover {
                    color: #2563eb;
                    text-decoration: underline;
                }

                .gsheet-modal-loader {
                    text-align: center;
                    padding: 40px 20px;
                }

                .gsheet-modal-loader .spinner {
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 15px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .gsheet-modal-loader p {
                    color: #6b7280;
                    font-size: 14px;
                }

                .gsheet-modal-error {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #ef4444;
                }

                .gsheet-modal-error strong {
                    display: block;
                    margin-bottom: 10px;
                    font-size: 18px;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .gsheet-modal-content {
                        width: 95%;
                        padding: 20px;
                        max-height: 90vh;
                    }

                    .gsheet-modal-title {
                        font-size: 22px;
                    }

                    .gsheet-modal-body {
                        font-size: 14px;
                    }
                }
            </style>
        `;

        // Inject styles
        if (!document.getElementById('gsheet-modal-styles')) {
            document.head.insertAdjacentHTML('beforeend', modalStyles);
        }

        // Inject modal HTML
        if (!document.getElementById('gsheet-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        modalElement = document.getElementById('gsheet-modal');

        // Close on overlay click
        modalElement.querySelector('.gsheet-modal-overlay').addEventListener('click', close);

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalElement.classList.contains('active')) {
                close();
            }
        });
    }

    /**
     * Initialize the modal library
     * @param {string} url - Google Apps Script web app URL
     */
    function init(url) {
        if (isInitialized) {
            console.log('GoogleSheetsModal already initialized');
            return;
        }

        if (!url) {
            console.error('GoogleSheetsModal: Script URL is required');
            return;
        }

        scriptUrl = url;
        createModalHTML();
        isInitialized = true;
        console.log('GoogleSheetsModal initialized successfully');
    }

    /**
     * Convert URLs in text to clickable links
     * @param {string} text - Text to process
     * @returns {string} - Text with URLs converted to links
     */
    function autoLinkUrls(text) {
        if (!text) return '';
        
        // Convert to string
        text = String(text);
        
        // Convert URLs to links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        return text;
    }

    /**
     * Fetch data from Google Sheet via Google Apps Script
     * @param {string} sheetName - Name of the sheet
     * @param {string} range - Cell range (e.g., "B2")
     * @returns {Promise<string>} - Cell content
     */
    async function fetchCellData(sheetName, range) {
        try {
            // Build URL for Google Apps Script endpoint
            const url = `${scriptUrl}?sheet=${encodeURIComponent(sheetName)}&type=modal&range=${encodeURIComponent(range)}`;
            
            console.log('Fetching from:', url);
            
            // Fetch data from endpoint
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('Response data:', data);
            
            // Handle error response
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Process and extract cell content
            let content = '';
            
            if (Array.isArray(data)) {
                // Handle array response
                if (data.length === 1 && data[0].col0 !== undefined) {
                    // Single cell value
                    content = data[0].col0 || '';
                } else if (data.length > 0) {
                    // Multiple rows - get first available value
                    const firstRow = data[0];
                    content = firstRow.col0 || firstRow[Object.keys(firstRow)[0]] || '';
                }
            } else if (typeof data === 'object') {
                // Handle object response
                const firstKey = Object.keys(data)[0];
                content = data[firstKey] || '';
            } else {
                content = String(data);
            }
            
            if (!content) {
                throw new Error('No content found in the specified cell');
            }
            
            return content;
            
        } catch (error) {
            console.error('Error fetching cell data:', error);
            throw error;
        }
    }

    /**
     * Show loading state
     * @param {string} title - Modal title
     */
    function showLoading(title) {
        if (!modalElement) {
            console.error('Modal not initialized. Call init() first.');
            return;
        }

        document.getElementById('gsheet-modal-title').textContent = title;
        document.getElementById('gsheet-modal-body').innerHTML = `
            <div class="gsheet-modal-loader">
                <div class="spinner"></div>
                <p>Loading content...</p>
            </div>
        `;

        modalElement.classList.remove('closing');
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Show error message
     * @param {string} title - Modal title
     * @param {string} message - Error message
     */
    function showError(title, message) {
        if (!modalElement) return;

        document.getElementById('gsheet-modal-title').textContent = title;
        document.getElementById('gsheet-modal-body').innerHTML = `
            <div class="gsheet-modal-error">
                <strong>⚠️ Error Loading Content</strong>
                <p>${message}</p>
                <p style="margin-top: 10px; font-size: 13px; opacity: 0.8;">
                    Please check your Google Sheet configuration or try again later.
                </p>
            </div>
        `;

        modalElement.classList.remove('closing');
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Show content in modal
     * @param {string} title - Modal title
     * @param {string} content - HTML content to display
     */
    function showContent(title, content) {
        if (!modalElement) return;

        document.getElementById('gsheet-modal-title').textContent = title;
        
        // Convert line breaks to paragraphs if content is plain text
        let formattedContent = content;
        if (!content.includes('<')) {
            // Plain text - format with paragraphs and auto-link URLs
            formattedContent = content
                .split('\n\n')
                .map(para => {
                    const linkedText = autoLinkUrls(para.replace(/\n/g, '<br>'));
                    return `<p>${linkedText}</p>`;
                })
                .join('');
        } else {
            // HTML content - still auto-link URLs in text nodes
            formattedContent = autoLinkUrls(content);
        }

        document.getElementById('gsheet-modal-body').innerHTML = formattedContent;

        modalElement.classList.remove('closing');
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the modal with animation
     */
    function close() {
        if (modalElement && modalElement.classList.contains('active')) {
            modalElement.classList.add('closing');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modalElement.classList.remove('active', 'closing');
                document.body.style.overflow = '';
            }, 300); // Match animation duration
        }
    }

    /**
     * Show modal with content from a specific cell
     * @param {string} title - Modal title
     * @param {string} sheetName - Name of the sheet
     * @param {string} range - Cell reference (e.g., "B2")
     */
    async function showCell(title, sheetName, range) {
        if (!isInitialized) {
            console.error('GoogleSheetsModal not initialized. Call init() first.');
            return;
        }

        showLoading(title);

        try {
            const content = await fetchCellData(sheetName, range);
            showContent(title, content);
        } catch (error) {
            showError(title, error.message);
        }
    }

    // Public API
    return {
        init: init,
        showCell: showCell,
        close: close,
        showContent: showContent,
        showError: showError
    };
})();

/*
 * USAGE EXAMPLE:
 * 
 * <!-- Include the library -->
 * <script src="gsheets-modal1.js"></script>
 * 
 * <!-- Initialize with your Google Apps Script URL -->
 * <script>
 *     GoogleSheetsModal.init('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
 * </script>
 * 
 * <!-- Use in your HTML -->
 * <li><a href='#' onclick='GoogleSheetsModal.showCell("About Us", "Sheet5", "B2"); return false;'>About Us</a></li>
 * 
 * <!-- Or with JavaScript -->
 * <script>
 *     document.getElementById('aboutBtn').addEventListener('click', function(e) {
 *         e.preventDefault();
 *         GoogleSheetsModal.showCell('About Us', 'Sheet5', 'B2');
 *     });
 * </script>
 */