/**
 * IWAKI Law Office & Astria Legal Platform
 * Global JavaScript Utilities - Available to all pages
 */

// ==========================================================================
// 1. UI Helper & Error Message Handlers
// ==========================================================================

function showAuthError(formId, message) {
  const form = document.getElementById(formId);
  if (!form) return;

  let errorBanner = form.querySelector('.auth-error-banner');

  if (!errorBanner) {
    errorBanner = document.createElement('div');
    errorBanner.className = 'auth-error-banner';
    form.insertBefore(errorBanner, form.querySelector('.input-group'));
  }

  errorBanner.textContent = message;
  errorBanner.style.display = 'block';
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error-banner').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

// ==========================================================================
// 2. Global Toast Notification System
// ==========================================================================

function showToast(message) {
  const toast = document.getElementById('global-toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.innerHTML = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==========================================================================
// 3. Global Modal System
// ==========================================================================

function showGlobalModal(title, description) {
  const overlay = document.getElementById('global-modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-description');

  if (modalTitle) modalTitle.innerHTML = title;
  if (modalDesc) modalDesc.innerHTML = description;
  if (overlay) overlay.classList.add('active');
}

function closeGlobalModal() {
  const overlay = document.getElementById('global-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ==========================================================================
// 4. Account Settings Modal & Dropdown Utilities
// ==========================================================================

function showSettings() {
  const existingModal = document.querySelector('.settings-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.className = 'settings-modal-overlay';
  modal.innerHTML = `
    <div class="settings-modal">
      <div class="settings-modal-header">
        <h3>Account Settings</h3>
        <button class="modal-close-btn" onclick="closeSettings()">&times;</button>
      </div>
      <div class="settings-modal-body">
        <div class="settings-section">
          <h4>Profile Information</h4>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="modal-input" id="settings-fullname" placeholder="Enter full name">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" class="modal-input" id="settings-email" disabled>
          </div>
        </div>
        <div class="settings-section">
          <h4>Security</h4>
          <div class="form-group">
            <label>Change Password</label>
            <input type="password" class="modal-input" id="settings-password" placeholder="Enter new password">
          </div>
        </div>
      </div>
      <div class="settings-modal-footer">
        <button class="btn-modal-cancel" onclick="closeSettings()">Cancel</button>
        <button class="btn-modal-confirm" onclick="saveAccountSettings()">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Populate fields if session exists
  if (typeof supabase !== 'undefined') {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        const emailInput = document.getElementById('settings-email');
        const nameInput = document.getElementById('settings-fullname');
        if (emailInput) emailInput.value = session.user.email;
        if (nameInput) nameInput.value = session.user.user_metadata?.full_name || '';
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettings();
    }
  });
}

function closeSettings() {
  const modal = document.querySelector('.settings-modal-overlay');
  if (modal) {
    modal.remove();
  }
}

async function saveAccountSettings() {
  const fullName = document.getElementById('settings-fullname')?.value.trim();
  const newPassword = document.getElementById('settings-password')?.value;

  if (typeof supabase === 'undefined') return;

  const updates = { data: { full_name: fullName } };
  if (newPassword) updates.password = newPassword;

  const { error } = await supabase.auth.updateUser(updates);

  if (error) {
    showToast('Error updating settings: ' + error.message);
  } else {
    showToast('Settings saved successfully!');
    closeSettings();
  }
}

function closeFileViewer() {
  const overlay = document.getElementById('file-viewer-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// Toggle Settings Dropdown Menu
function toggleSettingsMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('settings-dropdown-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

// Close settings dropdown when clicking outside
window.addEventListener('click', () => {
  const menu = document.getElementById('settings-dropdown-menu');
  if (menu) menu.style.display = 'none';
});

// ==========================================================================
// 5. Supabase Role Guard & Session Initialization
// ==========================================================================

async function initializePortalSession(requiredRole) {
  if (typeof supabase === 'undefined') return;

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    window.location.href = 'auth.html';
    return;
  }

  const user = session.user;
  const userRole = user.user_metadata?.role || user.app_metadata?.role || 'client';

  // Strict Role Control Check
  if (requiredRole === 'admin' && userRole !== 'admin') {
    alert('Access Denied: Admin privileges required.');
    window.location.href = 'client-dashboard.html';
    return;
  }

  if (requiredRole === 'client' && userRole === 'admin') {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  // Populate email badge in settings menu if present
  const emailEl = document.getElementById('dropdown-user-email');
  if (emailEl) emailEl.textContent = user.email;
}

// Global Logout Handler
async function handleLogout(event) {
  if (event) event.preventDefault();
  if (typeof supabase !== 'undefined') {
    await supabase.auth.signOut();
  }
  window.location.href = 'auth.html';
}

// ==========================================================================
// 6. Global Button Interceptor for All Pages
// ==========================================================================

function bindAllButtonsAndLinks() {
  document.body.addEventListener('click', (e) => {
    if (!e.target.closest('.action-menu-container') && !e.target.closest('.three-dots-container') && !e.target.closest('.folder-card-options') && !e.target.closest('.settings-dropdown-container')) {
      document.querySelectorAll('.action-menu-dropdown.show, .folder-dropdown-menu.show').forEach(el => el.classList.remove('show'));
    }

    const target = e.target.closest('button, a, select, input[type="button"], input[type="submit"]');
    if (!target) return;

    const href = target.getAttribute('href');

    if (target.tagName === 'A') {
      if (!href || href === '#' || href === 'javascript:void(0);') {
        if (!target.classList.contains('file-access-link')) {
          e.preventDefault();
          const linkText = target.innerText.trim() || 'Navigation item';
          showToast(`${linkText} module is coming soon.`);
        }
        return;
      }

      // Whitelist anchor links and known pages
      const isKnownPage = href.startsWith('#') ||
                          href.includes('index.html') ||
                          href.includes('admin-dashboard.html') ||
                          href.includes('client-dashboard.html') ||
                          href.includes('clause-library.html') ||
                          href.includes('client-files.html') ||
                          href.includes('file-manager.html') ||
                          href.includes('client-calendar.html') ||
                          href.includes('calendar.html') ||
                          href.includes('messages.html') ||
                          href.includes('client-messages.html') ||
                          href.includes('ASTengine.html') ||
                          href.includes('auth.html');

      if (!isKnownPage && !href.startsWith('http') && !href.startsWith('blob:')) {
        e.preventDefault();
        const cleanName = href.replace('.html', '').replace('-', ' ');
        showGlobalModal(
          `${cleanName.toUpperCase()} Module`,
          `The <strong>${cleanName}</strong> workspace is currently under active development.`
        );
        return;
      }
    }

    if (target.tagName === 'BUTTON') {
      const btnText = target.innerText.trim();

      if (btnText.includes('ADD NEW CLAUSE') || btnText.includes('OPEN QUEUE') || btnText.includes('View logs')) {
        e.preventDefault();
        showGlobalModal(
          btnText,
          `Triggered <strong>${btnText}</strong>.`
        );
      } else if (!target.getAttribute('onclick') && !target.classList.contains('btn-three-dots') && !target.classList.contains('three-dots-btn') && !target.classList.contains('editor-btn') && !target.classList.contains('cal-nav-btn')) {
        showToast(`Action triggered: "${btnText}"`);
      }
    }
  });

  document.querySelectorAll('.admin-search-input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        showToast(query ? `Searching legal records for: "${query}"` : `Please enter a keyword to filter.`);
      }
    });
  });

  document.querySelectorAll('.filter-dropdown').forEach(select => {
    select.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex].text;
      showToast(`Filter applied: ${selectedOption}`);
    });
  });
}

// ==========================================================================
// 7. File Helper Functions
// ==========================================================================

function readFileContent(file) {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // Store Image & PDF files as Base64 Data URLs
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'data_url', result: reader.result });
      reader.onerror = () => resolve({ type: 'error', result: '' });
      reader.readAsDataURL(file);
    }
    // DOCX Parsing via Mammoth.js
    else if (typeof mammoth !== 'undefined' && ext === 'docx') {
      const reader = new FileReader();
      reader.onload = function(e) {
        mammoth.convertToHtml({ arrayBuffer: e.target.result })
          .then(result => resolve({ type: 'html', result: result.value }))
          .catch(() => resolve({ type: 'html', result: '' }));
      };
      reader.readAsArrayBuffer(file);
    }
    // Fallback TXT / Source files
    else {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'html', result: reader.result });
      reader.onerror = () => resolve({ type: 'html', result: '' });
      reader.readAsText(file);
    }
  });
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function capitalizeWord(str) {
  if (!str) return '';
  return str.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ==========================================================================
// 8. Page Load Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  bindAllButtonsAndLinks();
});

if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = window.supabase.createClient(
    'https://cyssvluzwzsftsskveet.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w'
  );
}
var supabase = window.supabaseClient;