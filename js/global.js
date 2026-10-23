/**
 * IWAKI Law Office & Astria Legal Platform
 * Global JavaScript Utilities - Available to all pages
 */

// ==========================================================================
// 1. Database Initialization & Helpers
// ==========================================================================

function initDatabase() {
  if (!localStorage.getItem('users_db')) {
    const defaultUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@iwaki.ph',
        phone: '+63 9123456789',
        password: 'password123',
        role: 'admin'
      },
      {
        id: '2',
        name: 'Client User',
        email: 'client@example.com',
        phone: '+63 9876543210',
        password: 'password123',
        role: 'client'
      }
    ];
    localStorage.setItem('users_db', JSON.stringify(defaultUsers));
  }
}

// Helper methods for reading & writing to mock database
function getUsersDB() {
  return JSON.parse(localStorage.getItem('users_db')) || [];
}

function saveUsersDB(users) {
  localStorage.setItem('users_db', JSON.stringify(users));
}

function getEvents() {
  return JSON.parse(localStorage.getItem('calendar_events_db')) || [];
}

function saveEventsDB(events) {
  localStorage.setItem('calendar_events_db', JSON.stringify(events));
}

function getFoldersDB() {
  return JSON.parse(localStorage.getItem('client_folders_db')) || [];
}

function saveFoldersDB(folders) {
  localStorage.setItem('client_folders_db', JSON.stringify(folders));
}

function getMessagesDB() {
  return JSON.parse(localStorage.getItem('admin_messages_db')) || [];
}

function saveMessagesDB(messages) {
  localStorage.setItem('admin_messages_db', JSON.stringify(messages));
}

// ==========================================================================
// 2. UI Helper & Error Message Handlers
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
// 3. Global Toast Notification System
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
// 4. Global Modal System
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

function closeFileViewer() {
  const overlay = document.getElementById('file-viewer-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ==========================================================================
// 5. Global Button Interceptor for All Admin Pages
// ==========================================================================

function bindAllButtonsAndLinks() {
  document.body.addEventListener('click', (e) => {
    if (!e.target.closest('.action-menu-container') && !e.target.closest('.three-dots-container') && !e.target.closest('.folder-card-options')) {
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

      // Whitelist anchor links (starting with #) and known pages
      const isKnownPage = href.startsWith('#') ||
                          href.includes('index.html') ||
                          href.includes('admin-dashboard.html') ||
                          href.includes('clause-library.html') ||
                          href.includes('client-files.html') ||
                          href.includes('messages.html') ||
                          href.includes('auth.html') ||
                          href.includes('calendar.html');

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
// 6. File Helper Functions
// ==========================================================================

/**
 * Convert files to Base64, HTML text, or Mammoth docx parsing
 */
function readFileContent(file) {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // Store Image & PDF files as Base64 Data URLs
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'data_url', reader.result });
      reader.onerror = () => resolve({ type: 'error', '' });
      reader.readAsDataURL(file);
    }
    // DOCX Parsing via Mammoth.js
    else if (typeof mammoth !== 'undefined' && ext === 'docx') {
      const reader = new FileReader();
      reader.onload = function(e) {
        mammoth.convertToHtml({ arrayBuffer: e.target.result })
          .then(result => resolve({ type: 'html', result.value }))
          .catch(() => resolve({ type: 'html', '' }));
      };
      reader.readAsArrayBuffer(file);
    }
    // Fallback TXT / Source files
    else {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'html', reader.result });
      reader.onerror = () => resolve({ type: 'html', '' });
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
// 7. Page Load Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  bindAllButtonsAndLinks();
});