// ============================================
// PART 1: GOOGLE SHEETS STRUCTURE (Sheet4 - Digital Card Data)
// ============================================

/*
Create Sheet4 with this structure:

Column A (Parameter) | Column B (Value)
--------------------|------------------
banner              | Premium Member
companyName         | ShopHub Solutions
profileImage        | https://i.imgur.com/yourimage.jpg
name                | John Doe
jobTitle            | CEO & Founder
phone               | +91 9876543210
whatsapp            | +91 9876543210
location            | Mumbai, Maharashtra, India
email               | john@shophub.com
website             | www.shophub.com
websiteSocial       | https://www.shophub.com
blog                | https://blog.shophub.com
facebook            | https://facebook.com/shophub
instagram           | https://instagram.com/shophub
youtube             | https://youtube.com/@shophub
tiktok              | https://tiktok.com/@shophub
x                   | https://x.com/shophub
pinterest           | https://pinterest.com/shophub
linkedin            | https://linkedin.com/company/shophub
whatsappSocial      | https://wa.me/919876543210
telegram            | https://t.me/shophub
arattai             | https://arattai.com/shophub
discord             | https://discord.gg/shophub
playstore           | https://play.google.com/store/apps/details?id=com.shophub
googleBusiness      | https://g.page/shophub
wikipedia           | https://wikipedia.org/wiki/ShopHub
reddit              | https://reddit.com/u/shophub
quora               | https://quora.com/profile/shophub
*/

// ============================================
// PART 2: UPDATE GOOGLE APPS SCRIPT
// ============================================

/*
Add this function to your Google Apps Script (before doGet):

function handleSheet4DigitalCardRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sheet4');
    
    if (!sheet) {
      return createJsonResponse({ 
        error: 'Sheet4 not found',
        data: {}
      });
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length === 0) {
      return createJsonResponse({ 
        success: true,
        data: {}
      });
    }
    
    // Convert to key-value object
    const data = {};
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      
      if (!row[0] || !row[1]) continue;
      
      const key = String(row[0]).trim();
      const value = String(row[1]).trim();
      
      data[key] = value;
    }
    
    return createJsonResponse({
      success: true,
      data: data
    });
    
  } catch (error) {
    return createJsonResponse({ 
      error: error.message,
      data: {}
    });
  }
}

// Then UPDATE your doGet() function to include:

function doGet(e) {
  // 1. Check for Sheet4 Digital Card request
  if (e.parameter.sheet && e.parameter.sheet === 'Sheet4' && e.parameter.action === 'digitalcard') {
    return handleSheet4DigitalCardRequest(e);
  }
  
  // 2. Check for Sheet3 config
  if (e.parameter.sheet && e.parameter.sheet === 'Sheet3' && e.parameter.action === 'config') {
    return handleSheet3ConfigRequest(e);
  }
  
  // 3. Check for Sheet5 (scrolling messages)
  if (e.parameter.sheet && e.parameter.sheet === 'Sheet5') {
    return handleScrollingMessagesRequest(e);
  }
  
  // 4. Check for modal sheets (Sheet3 or Sheet4 with range)
  if (e.parameter.sheet && (e.parameter.sheet === 'Sheet3' || e.parameter.sheet === 'Sheet4') && e.parameter.range) {
    return handleModalRequest(e);
  }
  
  // 5. Otherwise, use SecureSheets for Sheet1 and Sheet2 (products)
  return SecureSheets.handleGetRequest(e, {
    sheetName: 'Sheet1',
    configSheet: 'Sheet2'
  });
}

// After deployment, your endpoint will be:
// YOUR_WEB_APP_URL?sheet=Sheet4&action=digitalcard
*/

// ============================================
// PART 3: DIGITAL CARD CDN LIBRARY (dbc_cdn.js)
// ============================================

/**
 * Digital Business Card CDN Library
 * Loads card data from Google Sheets and displays in modal
 * Version: 1.0.0
 */

(function(window) {
    'use strict';
    
    const DigitalBusinessCard = {
        config: {
            scriptUrl: '',
            sheetName: 'Sheet4',
            modalId: 'dbcModal',
            debug: true
        },
        
        cardData: null,
        
        // Initialize the library
        init: function(config) {
            this.config = { ...this.config, ...config };
            
            if (this.config.debug) {
                console.log('🎴 Digital Business Card Library Initialized');
            }
            
            // Create modal HTML
            this.createModal();
            
            return this;
        },
        
        // Fetch card data from Google Sheets
        fetchCardData: async function() {
            try {
                const url = `${this.config.scriptUrl}?sheet=${this.config.sheetName}&action=digitalcard`;
                
                if (this.config.debug) {
                    console.log('📡 Fetching digital card data from:', url);
                }
                
                const response = await fetch(url);
                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                this.cardData = result.data;
                
                if (this.config.debug) {
                    console.log('✅ Digital card data loaded:', this.cardData);
                }
                
                return this.cardData;
                
            } catch (error) {
                console.error('❌ Error fetching card data:', error);
                return null;
            }
        },
        
        // Create modal HTML
        createModal: function() {
            const modalHTML = `
                <div class="dbc-modal" id="${this.config.modalId}">
                    <div class="dbc-modal-overlay"></div>
                    <div class="dbc-modal-content">
                        <button class="dbc-close-btn" onclick="DigitalBusinessCard.close()">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="dbc-loading" id="dbcLoading">
                            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--primary-color);"></i>
                            <p>Loading Digital Card...</p>
                        </div>
                        <div class="dbc-card-container" id="dbcCardContainer" style="display: none;"></div>
                    </div>
                </div>
            `;
            
            // Add CSS
            const style = document.createElement('style');
            style.textContent = this.getCSS();
            document.head.appendChild(style);
            
            // Add modal HTML
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Close on overlay click
            document.querySelector('.dbc-modal-overlay').addEventListener('click', () => {
                this.close();
            });
        },
        
        // Get CSS styles
        getCSS: function() {
            return `
                .dbc-modal {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .dbc-modal.active {
                    display: flex;
                }
                
                .dbc-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                }
                
                .dbc-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 24px;
                    max-width: 400px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: dbcSlideUp 0.3s ease-out;
                }
                
                @keyframes dbcSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .dbc-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #e5e7eb;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: all 0.2s;
                }
                
                .dbc-close-btn:hover {
                    background: #f3f4f6;
                    transform: scale(1.1);
                }
                
                .dbc-loading {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .dbc-loading p {
                    margin-top: 20px;
                    font-size: 14px;
                }
                
                .dbc-card-container {
                    padding: 20px;
                }
                
                /* Card Styles */
                .dbc-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                
                .dbc-badge {
                    background: #9ca3af;
                    color: white;
                    padding: 6px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .dbc-profile {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .dbc-profile-image {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border: 3px solid #e5e7eb;
                    object-fit: cover;
                }
                
                .dbc-profile-info h2 {
                    font-size: 20px;
                    font-weight: bold;
                    color: #111827;
                    margin: 0 0 4px 0;
                }
                
                .dbc-profile-info p {
                    font-size: 14px;
                    color: #6b7280;
                    margin: 0;
                }
                
                .dbc-contact-list {
                    margin-bottom: 24px;
                }
                
                .dbc-contact-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                    text-decoration: none;
                    color: inherit;
                }
                
                .dbc-contact-item:hover {
                    background: #f3f4f6;
                }
                
                .dbc-contact-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                
                .dbc-icon-phone { background: #10b981; }
                .dbc-icon-whatsapp { background: #25d366; }
                .dbc-icon-location { background: #ef4444; }
                .dbc-icon-email { background: #3b82f6; }
                .dbc-icon-website { background: #6366f1; }
                
                .dbc-contact-text {
                    flex: 1;
                    font-size: 14px;
                    color: #111827;
                    font-weight: 500;
                }
                
                .dbc-social-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    margin-top: 24px;
                }
                
                .dbc-social-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                    margin: 0 auto;
                }
                
                .dbc-social-icon:hover {
                    transform: scale(1.1);
                }
                
                .dbc-social-icon svg {
                    width: 24px;
                    height: 24px;
                    fill: white;
                }
                
                .dbc-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .dbc-action-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .dbc-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .dbc-btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .dbc-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                @media (max-width: 480px) {
                    .dbc-modal-content {
                        max-width: 100%;
                        margin: 0;
                        border-radius: 0;
                        max-height: 100vh;
                    }
                    
                    .dbc-social-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
            `;
        },
        
        // Render card HTML
        renderCard: function(data) {
            const container = document.getElementById('dbcCardContainer');
            
            const html = `
                <div class="dbc-header">
                    <div class="dbc-badge">${data.banner || 'Member'}</div>
                    <div class="dbc-badge">${data.companyName || 'Company'}</div>
                </div>
                
                <div class="dbc-profile">
                    <img src="${data.profileImage || 'https://via.placeholder.com/100'}" 
                         alt="${data.name}" 
                         class="dbc-profile-image"
                         onerror="this.src='https://via.placeholder.com/100?text=Profile'">
                    <div class="dbc-profile-info">
                        <h2>${data.name || 'Name'}</h2>
                        <p>${data.jobTitle || 'Job Title'}</p>
                    </div>
                </div>
                
                <div class="dbc-contact-list">
                    ${data.phone ? `
                    <a href="tel:${data.phone}" class="dbc-contact-item">
                        <div class="dbc-contact-icon dbc-icon-phone">
                            <i class="fas fa-phone"></i>
                        </div>
                        <div class="dbc-contact-text">${data.phone}</div>
                    </a>
                    ` : ''}
                    
                    ${data.whatsapp ? `
                    <a href="https://wa.me/${data.whatsapp.replace(/[^\d]/g, '')}" target="_blank" class="dbc-contact-item">
                        <div class="dbc-contact-icon dbc-icon-whatsapp">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div class="dbc-contact-text">${data.whatsapp}</div>
                    </a>
                    ` : ''}
                    
                    ${data.location ? `
                    <a href="https://maps.google.com/maps?q=${encodeURIComponent(data.location)}" target="_blank" class="dbc-contact-item">
                        <div class="dbc-contact-icon dbc-icon-location">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="dbc-contact-text">${data.location}</div>
                    </a>
                    ` : ''}
                    
                    ${data.email ? `
                    <a href="mailto:${data.email}" class="dbc-contact-item">
                        <div class="dbc-contact-icon dbc-icon-email">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="dbc-contact-text">${data.email}</div>
                    </a>
                    ` : ''}
                    
                    ${data.website ? `
                    <a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" target="_blank" class="dbc-contact-item">
                        <div class="dbc-contact-icon dbc-icon-website">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="dbc-contact-text">${data.website}</div>
                    </a>
                    ` : ''}
                </div>
                
                ${this.renderSocialIcons(data)}
                
                <div class="dbc-actions">
                    <button class="dbc-action-btn dbc-btn-primary" onclick="DigitalBusinessCard.saveContact()">
                        <i class="fas fa-download"></i>
                        Save Contact
                    </button>
                    <button class="dbc-action-btn dbc-btn-secondary" onclick="DigitalBusinessCard.share()">
                        <i class="fas fa-share-alt"></i>
                        Share
                    </button>
                </div>
            `;
            
            container.innerHTML = html;
        },
        
        // Render social media icons
        renderSocialIcons: function(data) {
            const socials = [
                { key: 'facebook', icon: 'fab fa-facebook-f', color: '#1877f2' },
                { key: 'instagram', icon: 'fab fa-instagram', color: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
                { key: 'youtube', icon: 'fab fa-youtube', color: '#ff0000' },
                { key: 'linkedin', icon: 'fab fa-linkedin-in', color: '#0a66c2' },
                { key: 'x', icon: 'fab fa-x-twitter', color: '#000000' },
                { key: 'tiktok', icon: 'fab fa-tiktok', color: '#000000' },
                { key: 'telegram', icon: 'fab fa-telegram-plane', color: '#26a5e4' },
                { key: 'pinterest', icon: 'fab fa-pinterest-p', color: '#bd081c' }
            ];
            
            const availableSocials = socials.filter(social => data[social.key] && data[social.key] !== '#');
            
            if (availableSocials.length === 0) return '';
            
            const html = `
                <div class="dbc-social-grid">
                    ${availableSocials.map(social => `
                        <a href="${data[social.key]}" target="_blank" class="dbc-social-icon" style="background: ${social.color}">
                            <i class="${social.icon}"></i>
                        </a>
                    `).join('')}
                </div>
            `;
            
            return html;
        },
        
        // Open modal and load data
        open: async function() {
            const modal = document.getElementById(this.config.modalId);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Show loading
            document.getElementById('dbcLoading').style.display = 'block';
            document.getElementById('dbcCardContainer').style.display = 'none';
            
            // Fetch data if not already loaded
            if (!this.cardData) {
                await this.fetchCardData();
            }
            
            // Hide loading and show card
            document.getElementById('dbcLoading').style.display = 'none';
            document.getElementById('dbcCardContainer').style.display = 'block';
            
            // Render card
            if (this.cardData) {
                this.renderCard(this.cardData);
            } else {
                document.getElementById('dbcCardContainer').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Failed to load digital card data</p>
                    </div>
                `;
            }
        },
        
        // Close modal
        close: function() {
            const modal = document.getElementById(this.config.modalId);
            modal.classList.remove('active');
            document.body.style.overflow = '';
        },
        
        // Save contact as vCard
        saveContact: function() {
            if (!this.cardData) return;
            
            const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${this.cardData.name || ''}
ORG:${this.cardData.companyName || ''}
TITLE:${this.cardData.jobTitle || ''}
TEL:${this.cardData.phone || ''}
EMAIL:${this.cardData.email || ''}
URL:${this.cardData.website || ''}
ADR:;;${this.cardData.location || ''};;;;
END:VCARD`;
            
            const blob = new Blob([vCard], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(this.cardData.name || 'contact').replace(/\s+/g, '_')}.vcf`;
            link.click();
            URL.revokeObjectURL(url);
        },
        
        // Share card
        share: function() {
            const url = window.location.href;
            const text = `Check out ${this.cardData?.name || 'my'}'s digital business card`;
            
            if (navigator.share) {
                navigator.share({ title: text, url: url });
            } else {
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        }
    };
    
    // Expose to global scope
    window.DigitalBusinessCard = DigitalBusinessCard;
    
})(window);

// ============================================
// PART 4: ADD TO YOUR BLOGGER TEMPLATE
// ============================================

// 1. Add the CDN library (in your template <head> section):
// <script src='https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/YOUR_REPO@main/dbc_cdn.js'/>

// 2. Initialize in your $(document).ready function:
/*
$(document).ready(async function() {
    // ... existing code ...
    
    // Initialize Digital Business Card
    DigitalBusinessCard.init({
        scriptUrl: GSRCDN_CONFIG.scriptUrl,
        sheetName: 'Sheet4',
        debug: true
    });
    
    // ... rest of code ...
});
*/

// 3. Replace toggleNotifications function:
/*
function toggleNotifications(event) {
    event.preventDefault();
    DigitalBusinessCard.open();
}
*/

console.log('✅ Digital Business Card CDN Library Ready');
