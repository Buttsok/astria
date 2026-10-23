/**
 * IWAKI Law Office & Astria Legal Platform
 * Main Client & Authentication Application Logic
 */

// ==========================================================================
// 1. Database Initialization (LocalStorage Mock DB)
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

function switchTab(tab) {
  clearAuthErrors();
  
  const signinTab = document.getElementById('tab-signin');
  const signupTab = document.getElementById('tab-signup');
  const signinForm = document.getElementById('form-signin');
  const signupForm = document.getElementById('form-signup');

  if (signinTab && signupTab && signinForm && signupForm) {
    signinTab.classList.toggle('active', tab === 'signin');
    signupTab.classList.toggle('active', tab === 'signup');
    signinForm.classList.toggle('active', tab === 'signin');
    signupForm.classList.toggle('active', tab === 'signup');
  }
}

function togglePass(id, btn) {
  const field = document.getElementById(id);
  if (!field) return;

  if (field.type === 'password') {
    field.type = 'text';
    btn.textContent = 'Hide';
  } else {
    field.type = 'password';
    btn.textContent = 'Show';
  }
}

// ==========================================================================
// 3. Authentication Logic (Sign In & Sign Up)
// ==========================================================================

function handleSignIn(event) {
  event.preventDefault();
  clearAuthErrors();

  const emailInput = document.getElementById('signin-email').value.trim();
  const passwordInput = document.getElementById('signin-password').value;

  const users = getUsersDB();
  const foundUser = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase());

  if (!foundUser) {
    showAuthError('form-signin', 'Account not found. Please check your email or create an account.');
    return;
  }

  if (foundUser.password !== passwordInput) {
    showAuthError('form-signin', 'Invalid password. Please try again.');
    return;
  }

  localStorage.setItem('active_user', JSON.stringify({
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role
  }));

  if (foundUser.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}

function handleSignUp(event) {
  event.preventDefault();
  clearAuthErrors();

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;

  const users = getUsersDB();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    showAuthError('form-signup', 'An account with this email address already exists. Please Sign In instead.');
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    name: name,
    email: email,
    phone: phone ? `+63${phone}` : '',
    password: password,
    role: 'client'
  };

  users.push(newUser);
  saveUsersDB(users);

  localStorage.setItem('active_user', JSON.stringify({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  }));

  window.location.href = 'dashboard.html';
}

function handleSignOut() {
  localStorage.removeItem('active_user');
  window.location.href = 'auth.html';
}

// ==========================================================================
// 4. Page Load Initialization & Global Modals Injection
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initDatabase();

  const signinForm = document.getElementById('form-signin');
  const signupForm = document.getElementById('form-signup');
  const contactForm = document.getElementById('contact-form');

  if (signinForm) signinForm.addEventListener('submit', handleSignIn);
  if (signupForm) signupForm.addEventListener('submit', handleSignUp);
  if (contactForm) contactForm.addEventListener('submit', handleContactFormSubmit);

  injectGlobalModalUI();
  bindAllButtonsAndLinks();
});

// ==========================================================================
// Contact Form & Admin Inbox Logging Handler
// ==========================================================================

function handleContactFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('contact-name')?.value.trim();
  const email = document.getElementById('contact-email')?.value.trim();
  const rawPhone = document.getElementById('contact-phone')?.value.trim();
  const phone = rawPhone ? `+63 ${rawPhone}` : 'Not provided';
  const service = document.getElementById('contact-service')?.value || 'General Legal Inquiry';
  const appointment = document.getElementById('contact-appointment')?.value;
  const message = document.getElementById('contact-message')?.value.trim();

  if (!name || !email || !message) {
    if (typeof showToast === 'function') {
      showToast('Please fill out all required fields.');
    } else {
      alert('Please fill out all required fields.');
    }
    return;
  }

  let messagesDB = JSON.parse(localStorage.getItem('admin_messages_db')) || [];
  const newMsg = {
    id: 'msg-' + Date.now(),
    name: name,
    email: email,
    phone: phone,
    service: service,
    appointment: appointment ? new Date(appointment).toLocaleString() : 'No appointment requested',
    message: message,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    unread: true
  };
  messagesDB.unshift(newMsg);
  localStorage.setItem('admin_messages_db', JSON.stringify(messagesDB));

  if (typeof showToast === 'function') {
    showToast('Inquiry successfully sent and logged into the admin inbox!');
  } else {
    alert('Inquiry successfully sent and logged into the admin inbox!');
  }

  document.getElementById('contact-form')?.reset();
}

// Dynamically inject Toast, Fallback Modal, PDF/Image Viewer Modal, & Word Docs Editor Modal
function injectGlobalModalUI() {
  if (document.getElementById('global-ui-container')) return;

  const uiWrapper = document.createElement('div');
  uiWrapper.id = 'global-ui-container';
  uiWrapper.innerHTML = `
    <div id="global-toast" class="global-toast">
      <span id="toast-message">Action triggered successfully.</span>
    </div>

    <div id="global-modal-overlay" class="global-modal-overlay">
      <div class="global-modal">
        <div class="global-modal-header">
          <h3 id="modal-title">Feature Coming Soon</h3>
          <button class="modal-close-btn" onclick="closeGlobalModal()">&times;</button>
        </div>
        <div class="global-modal-body">
          <p id="modal-description">This module is currently undergoing legal engine initialization.</p>
        </div>
        <div class="global-modal-footer">
          <button class="btn-green-pill btn-sm" onclick="closeGlobalModal()">Acknowledge</button>
        </div>
      </div>
    </div>

    <div id="file-viewer-modal-overlay" class="global-modal-overlay">
      <div class="global-modal" style="max-width: 900px; width: 95%;">
        <div class="global-modal-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52AB62" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <h3 id="file-viewer-title" style="margin: 0; font-size: 1.1rem; color: #1a1a1a;">Document Preview</h3>
          </div>
          <button class="modal-close-btn" onclick="closeFileViewer()">&times;</button>
        </div>
        
        <div class="global-modal-body" style="padding: 1rem; display: flex; justify-content: center; align-items: center; min-height: 400px; max-height: 78vh; overflow-y: auto; background: #f8fafc;">
          <div id="file-viewer-content" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
            </div>
        </div>

        <div class="global-modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 10px;">
          <span id="file-viewer-size-info" style="font-size: 0.8rem; color: #64748b;">Previewing document</span>
          <button class="btn-sm" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;" onclick="closeFileViewer()">Close</button>
        </div>
      </div>
    </div>

    <div id="word-docs-editor-modal" class="global-modal-overlay">
      <div class="global-modal" style="max-width: 1000px; width: 95%; max-height: 95vh; display: flex; flex-direction: column;">
        <div class="global-modal-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <input type="text" id="editor-document-title" style="font-size: 1.1rem; font-weight: 700; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; width: 60%; color: #1e293b;" placeholder="Document Title.docx" onfocus="this.style.borderColor='#cbd5e1'" onblur="this.style.borderColor='transparent'" />
          </div>
          <button class="modal-close-btn" onclick="closeWordDocEditor()">&times;</button>
        </div>
        
        <div class="global-modal-body" style="padding: 10px 0; flex: 1; overflow: hidden;">
          <textarea id="word-editor-textarea"></textarea>
        </div>

        <div class="global-modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 10px;">
          <span id="editor-save-status" style="font-size: 0.82rem; color: #64748b; font-style: italic;">All changes saved</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-sm" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;" onclick="closeWordDocEditor()">Cancel</button>
            <button class="btn-green-pill btn-sm" onclick="saveWordDocument()">Save Document</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(uiWrapper);
}

// Global button interceptor
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
// Client File Manager Engine & File Handlers
// ==========================================================================

let activeClientId = null;
let pendingFiles = [];

function capitalizeWord(str) {
  if (!str) return '';
  return str.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function toggleClientTypeUI() {
  const entityType = document.querySelector('input[name="client_entity_type"]:checked')?.value || 'individual';
  toggleExistingVsNewUI(entityType);
}

function toggleExistingVsNewUI(entityType) {
  if (!entityType) {
    entityType = document.querySelector('input[name="client_entity_type"]:checked')?.value || 'individual';
  }

  const status = document.getElementById('modal-client-status')?.value || 'new';
  const existingContainer = document.getElementById('existing-client-container');
  const indContainer = document.getElementById('new-individual-container');
  const compContainer = document.getElementById('new-company-container');

  if (status === 'existing') {
    if (existingContainer) existingContainer.style.display = 'block';
    if (indContainer) indContainer.style.display = 'none';
    if (compContainer) compContainer.style.display = 'none';
    populateExistingClientsDropdown();
  } else {
    if (existingContainer) existingContainer.style.display = 'none';
    if (entityType === 'company') {
      if (indContainer) indContainer.style.display = 'none';
      if (compContainer) compContainer.style.display = 'block';
    } else {
      if (indContainer) indContainer.style.display = 'flex';
      if (compContainer) compContainer.style.display = 'none';
    }
  }
}

function populateExistingClientsDropdown() {
  const selectEl = document.getElementById('modal-existing-client-select');
  if (!selectEl) return;

  const folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  folders.sort((a, b) => a.name.localeCompare(b.name));

  selectEl.innerHTML = '<option value="">-- Select Existing Client --</option>';
  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    selectEl.appendChild(opt);
  });
}

function triggerFileUpload() {
  const fileInput = document.getElementById('client-file-input');
  if (fileInput) {
    fileInput.click();
  } else {
    const modal = document.getElementById('client-name-modal');
    if (modal) modal.style.display = 'flex';
  }
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  pendingFiles = Array.from(files);

  if (document.getElementById('modal-first-name')) document.getElementById('modal-first-name').value = '';
  if (document.getElementById('modal-last-name')) document.getElementById('modal-last-name').value = '';
  if (document.getElementById('modal-middle-name')) document.getElementById('modal-middle-name').value = '';
  if (document.getElementById('modal-company-name')) document.getElementById('modal-company-name').value = '';
  if (document.getElementById('modal-client-status')) document.getElementById('modal-client-status').value = 'new';

  const indRadio = document.querySelector('input[name="client_entity_type"][value="individual"]');
  if (indRadio) indRadio.checked = true;
  toggleExistingVsNewUI('individual');

  const modalEl = document.getElementById('client-name-modal');
  if (modalEl) modalEl.style.display = 'flex';

  event.target.value = '';
}

// Convert files to Base64, HTML text, or Mammoth docx parsing
function readFileContent(file) {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // Store Image & PDF files as Base64 Data URLs
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'data_url', data: reader.result });
      reader.onerror = () => resolve({ type: 'error', data: '' });
      reader.readAsDataURL(file);
    } 
    // DOCX Parsing via Mammoth.js
    else if (typeof mammoth !== 'undefined' && ext === 'docx') {
      const reader = new FileReader();
      reader.onload = function(e) {
        mammoth.convertToHtml({ arrayBuffer: e.target.result })
          .then(result => resolve({ type: 'html', data: result.value }))
          .catch(() => resolve({ type: 'html', data: '' }));
      };
      reader.readAsArrayBuffer(file);
    } 
    // Fallback TXT / Source files
    else {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'html', data: reader.result });
      reader.onerror = () => resolve({ type: 'html', data: '' });
      reader.readAsText(file);
    }
  });
}

async function confirmClientUpload() {
  const status = document.getElementById('modal-client-status')?.value || 'new';
  const entityType = document.querySelector('input[name="client_entity_type"]:checked')?.value || 'individual';
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  let targetFolder = null;

  if (status === 'existing') {
    const selectedFolderId = document.getElementById('modal-existing-client-select')?.value;
    if (!selectedFolderId) {
      if (typeof showToast === 'function') showToast('Please select an existing client folder.');
      return;
    }
    targetFolder = folders.find(f => f.id === selectedFolderId);
  } else {
    let folderName = '';
    let fullFormalName = '';

    if (entityType === 'company') {
      const compName = document.getElementById('modal-company-name')?.value.trim();
      if (!compName) {
        if (typeof showToast === 'function') showToast('Company Name is required.');
        return;
      }
      folderName = capitalizeWord(compName);
      fullFormalName = folderName;
    } else {
      const rawFirst = document.getElementById('modal-first-name')?.value.trim() || '';
      const rawLast = document.getElementById('modal-last-name')?.value.trim() || '';
      const rawMiddle = document.getElementById('modal-middle-name')?.value.trim() || '';

      if (!rawFirst || !rawLast) {
        if (typeof showToast === 'function') showToast('First Name and Last Name are required.');
        return;
      }

      const firstName = capitalizeWord(rawFirst);
      const lastName = capitalizeWord(rawLast);
      const middleInitial = rawMiddle ? `${rawMiddle.trim().charAt(0).toUpperCase()}.` : '';

      folderName = middleInitial ? `${firstName} ${middleInitial} ${lastName}` : `${firstName} ${lastName}`;
      const fullMiddleName = rawMiddle ? capitalizeWord(rawMiddle) : '';
      fullFormalName = fullMiddleName ? `${firstName} ${fullMiddleName} ${lastName}` : `${firstName} ${lastName}`;
    }

    targetFolder = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());

    if (!targetFolder) {
      targetFolder = {
        id: 'cli-' + Date.now(),
        name: folderName,
        formalName: fullFormalName,
        type: entityType, // 'individual' or 'company'
        files: []
      };
      folders.push(targetFolder);
      if (typeof showToast === 'function') showToast(`Created directory: "${targetFolder.name}"`);
    }
  }

  if (!targetFolder) return;

  for (const file of pendingFiles) {
    const parsed = await readFileContent(file);
    const ext = file.name.split('.').pop().toLowerCase();

    let storedHtmlContent = '';
    let storedDataUrl = '';

    if (parsed.type === 'data_url') {
      storedDataUrl = parsed.data;
    } else {
      storedHtmlContent = (parsed.data && parsed.data.trim() !== '')
        ? parsed.data 
        : `<h3><strong>LEGAL DOCUMENT DRAFT</strong></h3>
           <p><strong>CLIENT:</strong> ${targetFolder.formalName || targetFolder.name}</p>
           <p>Document Content for ${file.name}.</p>`;
    }

    targetFolder.files.unshift({
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: file.name,
      ext: ext,
      size: formatFileSize(file.size),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      htmlContent: storedHtmlContent,
      dataUrl: storedDataUrl
    });
  }

  localStorage.setItem('client_folders_db', JSON.stringify(folders));
  
  activeClientId = targetFolder.id;
  closeClientModal();
  renderClientDirectory();
}

function toggleActionMenu(event, menuId) {
  event.stopPropagation();
  document.querySelectorAll('.action-menu-dropdown, .folder-dropdown-menu').forEach(el => {
    if (el.id !== menuId) el.classList.remove('show');
  });

  const targetMenu = document.getElementById(menuId);
  if (targetMenu) targetMenu.classList.toggle('show');
}

function toggleFolderDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('folder-dropdown-menu');
  if (dropdown) dropdown.classList.toggle('show');
}

function renderClientDirectory() {
  const folderGrid = document.getElementById('folder-grid-view');
  const singleFolderView = document.getElementById('single-folder-file-wrapper');
  const emptyState = document.getElementById('directory-empty-state');
  const countBadge = document.getElementById('directory-count-badge');
  const heading = document.getElementById('directory-heading');
  const subheading = document.getElementById('directory-subheading');
  const backBtn = document.getElementById('btn-back-folders');
  const searchVal = (document.getElementById('client-search-input')?.value || '').toLowerCase();
  const sortVal = document.getElementById('alpha-sort-filter')?.value || 'az';

  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];

  if (sortVal === 'az') {
    folders.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'za') {
    folders.sort((a, b) => b.name.localeCompare(a.name));
  }

  // ALL CLIENT DIRECTORIES VIEW (SEPARATED INTO INDIVIDUALS & ORGANIZATIONS)
  if (!activeClientId) {
    if (heading) heading.innerText = 'Client File Manager';
    if (subheading) subheading.innerText = 'Client Directories';
    if (backBtn) backBtn.style.display = 'none';
    if (singleFolderView) singleFolderView.style.display = 'none';

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchVal));

    if (countBadge) countBadge.innerText = `${filteredFolders.length} Folders`;

    if (folders.length === 0 && filteredFolders.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        const emptyTitle = document.getElementById('empty-title');
        const emptySub = document.getElementById('empty-subtitle');
        if (emptyTitle) emptyTitle.innerText = 'No Client Directories Available';
        if (emptySub) emptySub.innerText = 'Click "+ ADD FILES" to upload files. Folders will be created automatically.';
      }
    } else if (emptyState) {
      emptyState.style.display = 'none';
    }

    if (folderGrid) {
      folderGrid.style.display = 'block'; // switch to block to contain sections
      folderGrid.style.padding = '0';

      const individualFolders = filteredFolders.filter(f => !f.type || f.type === 'individual');
      const companyFolders = filteredFolders.filter(f => f.type === 'company');

      let htmlContent = '';

      // 1. Individual Clients Section
      htmlContent += `
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #334155; margin-bottom: 1rem; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">Individual Clients (${individualFolders.length})</h3>
          ${individualFolders.length === 0 ? '<p style="font-size: 0.85rem; color: #94a3b8; font-style: italic;">No individual client directories found.</p>' : `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              ${individualFolders.map(f => renderFolderCardHTML(f)).join('')}
            </div>
          `}
        </div>
      `;

      // 2. Organization / Business Clients Section
      htmlContent += `
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #334155; margin-bottom: 1rem; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">Organization / Business Clients (${companyFolders.length})</h3>
          ${companyFolders.length === 0 ? '<p style="font-size: 0.85rem; color: #94a3b8; font-style: italic;">No organization client directories found.</p>' : `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              ${companyFolders.map(f => renderFolderCardHTML(f)).join('')}
            </div>
          `}
        </div>
      `;

      folderGrid.innerHTML = htmlContent;
    }

  } else {
    // INSIDE SPECIFIC CLIENT FOLDER
    const activeFolder = folders.find(f => f.id === activeClientId);
    if (!activeFolder) return navigateBackToFolders();

    if (heading) heading.innerText = activeFolder.name;
    if (subheading) subheading.innerText = 'Folder Contents';
    
    if (backBtn) backBtn.style.display = 'inline-block';
    if (folderGrid) folderGrid.style.display = 'none';

    let files = activeFolder.files.filter(file => file.name.toLowerCase().includes(searchVal));
    if (countBadge) countBadge.innerText = `${files.length} Files`;

    if (singleFolderView) {
      singleFolderView.style.display = 'block';
      
      const folderHeaderHTML = `
        <div class="single-folder-actions" style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 16px;">
          <div class="three-dots-container" style="position: relative;">
            <button class="three-dots-btn" onclick="toggleFolderDropdown(event)" aria-label="Folder Options" style="background: transparent; border: none; font-size: 1.4rem; cursor: pointer; padding: 4px 8px; color: #475569;">&#8942;</button>
            <div class="folder-dropdown-menu" id="folder-dropdown-menu" style="right: 0; left: auto;">
              <button class="folder-dropdown-item" onclick="renameClientFolder('${activeFolder.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Rename Folder
              </button>
              <button class="folder-dropdown-item text-danger" onclick="deleteClientFolder('${activeFolder.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      `;

      if (files.length === 0) {
        singleFolderView.innerHTML = folderHeaderHTML;
        if (emptyState) {
          emptyState.style.display = 'flex';
          const emptyTitle = document.getElementById('empty-title');
          const emptySub = document.getElementById('empty-subtitle');
          if (emptyTitle) emptyTitle.innerText = 'Folder is Empty';
          if (emptySub) emptySub.innerText = `Click "+ ADD FILES" to upload documents to ${activeFolder.name}.`;
        }
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      singleFolderView.innerHTML = `
        ${folderHeaderHTML}
        <div class="file-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; padding: 10px 0;">
          ${files.map(f => {
            const ext = (f.ext || f.name.split('.').pop()).toLowerCase();
            const isMediaOrPdf = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
            let iconSvg = '';

            if (ext === 'pdf') {
              iconSvg = `<div style="background: #e11d48; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">PDF</div>`;
            } else if (ext === 'docx' || ext === 'doc') {
              iconSvg = `<div style="background: #2563eb; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">W</div>`;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
              if (f.dataUrl) {
                iconSvg = `<div style="width: 64px; height: 72px; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><img src="${f.dataUrl}" style="width: 100\%; height: 100\%; object-fit: cover;" alt="${f.name}" /></div>`;
              } else {
                iconSvg = `<div style="background: #10b981; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;
              }
            } else {
              iconSvg = `<div style="background: #f8fafc; border: 2px solid #cbd5e1; color: #64748b; width: 64px; height: 72px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">${ext.toUpperCase()}</div>`;
            }

            return `
              <div class="file-box-tile" onclick="openClientFileItem('${f.id}')" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 10px 10px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; transition: all 0.2s ease; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                
                <div class="action-menu-container" style="position: absolute; top: 6px; right: 6px; z-index: 5;" onclick="event.stopPropagation();">
                  <button class="btn-three-dots" onclick="toggleActionMenu(event, 'file-menu-${f.id}')" title="File Actions" style="background: transparent; border: none; cursor: pointer; padding: 2px 6px; color: #64748b; font-size: 1.1rem;">
                    &#8226;&#8226;&#8226;
                  </button>
                  <div id="file-menu-${f.id}" class="action-menu-dropdown right-aligned" style="min-width: 130px; text-align: left;">
                    <button class="action-menu-item" onclick="event.stopPropagation(); openClientFileItem('${f.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      ${isMediaOrPdf ? 'View File' : 'Edit File'}
                    </button>
                    <button class="action-menu-item" onclick="event.stopPropagation(); renameClientFile('${f.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Rename
                    </button>
                    <button class="action-menu-item item-delete" onclick="event.stopPropagation(); deleteClientFile('${f.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Delete
                    </button>
                  </div>
                </div>

                <div style="margin-top: 10px; margin-bottom: 12px;">
                  ${iconSvg}
                </div>

                <span style="font-size: 0.85rem; font-weight: 600; color: #1e293b; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word;" title="${f.name}">
                  ${f.name}
                </span>

                <span style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                  ${f.size}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }
}

// Helper function to render individual folder box card HTML
function renderFolderCardHTML(f) {
  return `
    <div class="client-folder-card-box" onclick="openClientFolder('${f.id}')" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); position: relative;">
      <div style="display: flex; align-items: center; gap: 14px; overflow: hidden; flex: 1;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#52AB62" stroke-width="2" style="flex-shrink: 0;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <div style="overflow: hidden; padding-right: 8px;">
          <h4 style="margin: 0; font-size: 0.98rem; color: #1e293b; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.name}</h4>
          <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #64748b;">${f.files ? f.files.length : 0} items</p>
        </div>
      </div>

      <div class="folder-card-options" style="position: relative; flex-shrink: 0;" onclick="event.stopPropagation();">
        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'box-folder-menu-${f.id}')" aria-label="Folder Options" style="background: transparent; border: none; font-size: 1.3rem; cursor: pointer; padding: 4px 6px; color: #64748b;">&#8942;</button>
        <div id="box-folder-menu-${f.id}" class="action-menu-dropdown right-aligned" style="min-width: 140px;">
          <button class="action-menu-item" onclick="event.stopPropagation(); renameClientFolder('${f.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Rename
          </button>
          <button class="action-menu-item item-delete" onclick="event.stopPropagation(); deleteClientFolder('${f.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

// Router: Diverts PDFs/Images to Viewer Modal, DOCX/TXT to TinyMCE Editor Modal
function openClientFileItem(fileId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];

  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folder = folders.find(f => f.id === activeClientId);
  if (!folder) return;

  const file = folder.files.find(f => f.id === fileId);
  if (!file) return;

  const ext = (file.ext || file.name.split('.').pop()).toLowerCase().trim();

  if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    openMediaViewer(file);
  } else {
    openFileInWordEditor(fileId);
  }
}

// Open Image or PDF Viewer Modal
function openMediaViewer(file) {
  const modal = document.getElementById('file-viewer-modal-overlay');
  const title = document.getElementById('file-viewer-title');
  const content = document.getElementById('file-viewer-content');
  const sizeInfo = document.getElementById('file-viewer-size-info');

  if (!modal || !content) return;

  if (title) title.innerText = file.name;
  if (sizeInfo) sizeInfo.innerText = `File Size: ${file.size} | Date: ${file.date}`;

  const ext = (file.ext || file.name.split('.').pop()).toLowerCase().trim();

  if (ext === 'pdf') {
    if (file.dataUrl) {
      content.innerHTML = `
        <object data="${file.dataUrl}" type="application/pdf" style="width: 100%; height: 600px; border: none; border-radius: 6px;">
          <embed src="${file.dataUrl}" type="application/pdf" style="width: 100%; height: 600px;" />
          <div style="text-align: center; padding: 20px;">
            <p style="color: #64748b;">Your browser cannot display inline PDFs directly.</p>
            <a href="${file.dataUrl}" download="${file.name}" class="btn-green-pill btn-sm" style="text-decoration: none; display: inline-block; margin-top: 8px;">Download PDF</a>
          </div>
        </object>
      `;
    } else {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <h4 style="margin-top: 12px; color: #1e293b;">${file.name}</h4>
          <p style="color: #64748b; font-size: 0.9rem;">No PDF binary data was captured during upload.</p>
        </div>
      `;
    }
  } else {
    if (file.dataUrl) {
      content.innerHTML = `<img src="${file.dataUrl}" style="max-width: 100%; max-height: 520px; object-fit: contain; border-radius: 6px;" alt="${file.name}" />`;
    } else {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <h4 style="margin-top: 12px; color: #1e293b;">${file.name}</h4>
          <p style="color: #64748b; font-size: 0.9rem;">Image preview active.</p>
        </div>
      `;
    }
  }

  modal.classList.add('active');
}

function openClientFolder(folderId) {
  activeClientId = folderId;
  renderClientDirectory();
}

function navigateBackToFolders() {
  activeClientId = null;
  renderClientDirectory();
}

function renameClientFolder(folderId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return;

  const newName = prompt(`Rename Folder "${folder.name}":`, folder.name);
  if (newName && newName.trim() !== '' && newName.trim() !== folder.name) {
    folder.name = newName.trim();
    localStorage.setItem('client_folders_db', JSON.stringify(folders));
    renderClientDirectory();
    if (typeof showToast === 'function') showToast(`Folder renamed to "${folder.name}"`);
  }
}

function deleteClientFolder(folderId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  const folder = folders.find(f => f.id === folderId);

  if (folder && confirm(`Delete folder "${folder.name}" and all its contents?`)) {
    folders = folders.filter(f => f.id !== folderId);
    localStorage.setItem('client_folders_db', JSON.stringify(folders));
    if (activeClientId === folderId) activeClientId = null;
    renderClientDirectory();
    if (typeof showToast === 'function') showToast('Folder deleted.');
  }
}

function renameClientFile(fileId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  
  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folderIndex = folders.findIndex(f => f.id === activeClientId);
  if (folderIndex === -1) return;

  const file = folders[folderIndex].files.find(f => f.id === fileId);
  if (!file) return;

  const newName = prompt(`Rename File "${file.name}":`, file.name);
  if (newName && newName.trim() !== '' && newName.trim() !== file.name) {
    file.name = newName.trim();
    localStorage.setItem('client_folders_db', JSON.stringify(folders));
    renderClientDirectory();
    if (typeof showToast === 'function') showToast(`File renamed to "${file.name}"`);
  }
}

function deleteClientFile(fileId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];
  
  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folderIndex = folders.findIndex(f => f.id === activeClientId);
  if (folderIndex === -1) return;

  folders[folderIndex].files = folders[folderIndex].files.filter(f => f.id !== fileId);
  localStorage.setItem('client_folders_db', JSON.stringify(folders));
  renderClientDirectory();
  if (typeof showToast === 'function') showToast('File deleted.');
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('client-files.html')) {
    renderClientDirectory();
    document.getElementById('client-search-input')?.addEventListener('keyup', renderClientDirectory);
    document.getElementById('alpha-sort-filter')?.addEventListener('change', renderClientDirectory);
  }
});

// ==========================================================================
// TinyMCE Word / Docs Engine
// ==========================================================================

let activeEditingFileId = null;

function initWordDocsEngine(callback) {
  if (typeof tinymce === 'undefined') {
    if (callback) callback();
    return;
  }

  if (tinymce.get('word-editor-textarea')) {
    tinymce.get('word-editor-textarea').remove();
  }

  tinymce.init({
    selector: '#word-editor-textarea',
    height: 600,
    menubar: 'file edit view insert format tools table help',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | lineheight | bullist numlist outdent indent | forecolor backcolor removeformat | insertclause',
    content_style: `
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #1a1a1a;
        padding: 20px;
      }
      h1, h2, h3 { font-family: Arial, sans-serif; }
    `,
    setup: function (editor) {
      editor.ui.registry.addButton('insertclause', {
        text: '+ Insert Variable',
        onAction: function () {
          editor.insertContent('<strong>[INSERT_CLAUSE_HERE]</strong>');
        }
      });

      editor.on('change keyup', function () {
        const statusEl = document.getElementById('editor-save-status');
        if (statusEl) statusEl.innerText = 'Unsaved changes...';
      });

      editor.on('init', function () {
        if (callback) callback();
      });
    }
  });
}

function openFileInWordEditor(fileId) {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];

  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folder = folders.find(f => f.id === activeClientId);
  if (!folder) return;

  const file = folder.files.find(f => f.id === fileId);
  if (!file) return;

  activeEditingFileId = file.id;

  const titleInput = document.getElementById('editor-document-title');
  if (titleInput) titleInput.value = file.name;

  const modal = document.getElementById('word-docs-editor-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  initWordDocsEngine(() => {
    const editorInstance = typeof tinymce !== 'undefined' ? tinymce.get('word-editor-textarea') : null;
    const content = file.htmlContent || `<h3>${file.name}</h3><p>Legal document content...</p>`;
    
    if (editorInstance) {
      editorInstance.setContent(content);
    } else {
      const textarea = document.getElementById('word-editor-textarea');
      if (textarea) textarea.value = content;
    }
  });
}

function saveWordDocument() {
  let folders = JSON.parse(localStorage.getItem('client_folders_db')) || [];

  if (!activeClientId && activeEditingFileId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === activeEditingFileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  if (!activeClientId || !activeEditingFileId) return;

  let content = '';
  const editorInstance = typeof tinymce !== 'undefined' ? tinymce.get('word-editor-textarea') : null;
  
  if (editorInstance) {
    content = editorInstance.getContent();
  } else {
    const rawTextarea = document.getElementById('word-editor-textarea');
    if (rawTextarea) content = rawTextarea.value;
  }

  const title = document.getElementById('editor-document-title')?.value.trim();

  const folder = folders.find(f => f.id === activeClientId);
  if (!folder) return;

  const file = folder.files.find(f => f.id === activeEditingFileId);
  if (!file) return;

  if (title) file.name = title;
  file.htmlContent = content;
  file.size = formatFileSize(new Blob([content]).size);
  file.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  localStorage.setItem('client_folders_db', JSON.stringify(folders));

  const statusEl = document.getElementById('editor-save-status');
  if (statusEl) statusEl.innerText = 'All changes saved';
  
  if (typeof showToast === 'function') showToast(`Document "${file.name}" saved successfully!`);

  renderClientDirectory();
}

function closeWordDocEditor() {
  const modal = document.getElementById('word-docs-editor-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  activeEditingFileId = null;
}

function closeClientModal() {
  const modal = document.getElementById('client-name-modal');
  if (modal) modal.style.display = 'none';
  pendingFiles = [];
}

/* =========================================
   CALENDAR LOGIC & PHONE SYNC DB ENGINE
   ========================================= */

let currentNavMonth = new Date().getMonth();
let currentNavYear = new Date().getFullYear();
let activeEventId = null;
let activeDayViewDate = null; // Tracks which day the user is viewing

function initCalendarDB() {
    if (!localStorage.getItem('calendar_events_db')) {
        const defaultEvents = [
            { id: 'prop-1', title: 'Contract Review (Proposed)', client: 'Juan Dela Cruz', date: '2026-10-20', time: '14:00', status: 'pending' },
            { id: 'appt-1', title: 'Corp Setup Consult', client: 'Maria Santos', date: '2026-10-31', time: '10:00', status: 'confirmed' },
            { id: 'appt-2', title: 'Legal Advisory Synnc', client: 'TechCorp Inc.', date: '2026-10-15', time: '14:30', status: 'confirmed' }
        ];
        localStorage.setItem('calendar_events_db', JSON.stringify(defaultEvents));
    }
}

function getEvents() {
    return JSON.parse(localStorage.getItem('calendar_events_db')) || [];
}

function saveEventsDB(events) {
    localStorage.setItem('calendar_events_db', JSON.stringify(events));
}

function changeMonth(step) {
    currentNavMonth += step;
    if (currentNavMonth < 0) { currentNavMonth = 11; currentNavYear--; }
    if (currentNavMonth > 11) { currentNavMonth = 0; currentNavYear++; }
    renderCalendarUI();
}

function renderCalendarUI() {
    const monthYearEl = document.getElementById('calendarMonthYear');
    const gridEl = document.getElementById('calendarGrid');
    const listEl = document.getElementById('appointmentsList');
    
    if (!monthYearEl || !gridEl || !listEl) return;

    initCalendarDB();
    const events = getEvents();

    // 1. Render Global Appointments List (Right Column)
    listEl.innerHTML = '';
    events.sort((a,b) => new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time));
    
    events.forEach(ev => {
        const dObj = new Date(ev.date);
        const monthStr = dObj.toLocaleString('en-US', { month: 'short' });
        const dayStr = String(dObj.getDate()).padStart(2, '0');
        
        let [h, m] = ev.time.split(':');
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const displayTime = `${h}:${m} ${ampm}`;
        const displayPill = `${monthStr} ${dayStr} - ${displayTime}`;

        if(ev.status === 'pending') {
            listEl.innerHTML += `
                <div class="appointment-card border-orange" id="${ev.id}">
                    <div class="appt-details">
                        <h4 style="font-size: 1.1rem; color: #1e293b;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b;">Client: ${ev.client}</p>
                        <span class="pill pill-orange" style="margin-top: 8px;">${displayPill}</span>
                    </div>
                    <div class="appt-actions" style="display: flex; gap: 8px;">
                        <button style="background: #58B673; border: none; border-radius: 4px; padding: 6px; cursor: pointer;" onclick="handleProposal('${ev.id}', 'accept')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button style="background: #D9534F; border: none; border-radius: 4px; padding: 6px; cursor: pointer;" onclick="handleProposal('${ev.id}', 'decline')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>`;
        } else {
            listEl.innerHTML += `
                <div class="appointment-card border-green" id="${ev.id}" style="cursor:pointer;" onclick="openEventModal('${ev.id}', '${ev.title.replace(/'/g, "\\'")}', '${ev.date}', '${ev.time}', '${ev.client.replace(/'/g, "\\'")}')">
                    <div class="appt-details">
                        <h4 style="font-size: 1.1rem; color: #1e293b;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b;">Client: ${ev.client}</p>
                        <span class="pill pill-green" style="margin-top: 8px;">${displayPill}</span>
                    </div>
                </div>`;
        }
    });

    if(events.length === 0) {
        listEl.innerHTML = '<p style="color:#64748b; font-size:0.9rem; text-align:center; padding: 20px 0;">No appointments found.</p>';
    }

    // 2. Render Calendar Grid
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.innerText = `${months[currentNavMonth]} ${currentNavYear}`;
    gridEl.innerHTML = '';

    const firstDay = new Date(currentNavYear, currentNavMonth, 1).getDay();
    const daysInMonth = new Date(currentNavYear, currentNavMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentNavYear, currentNavMonth, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        gridEl.innerHTML += `<div class="cal-cell empty"><span class="date-num">${daysInPrevMonth - firstDay + i + 1}</span></div>`;
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === today.getDate() && currentNavMonth === today.getMonth() && currentNavYear === today.getFullYear());
        let currentDayStr = `${currentNavYear}-${String(currentNavMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        
        let dayEvents = events.filter(e => e.date === currentDayStr);
        let eventDots = '';
        dayEvents.forEach(e => {
            let color = e.status === 'pending' ? '#E8B87A' : '#58B673';
            eventDots += `<div style="width:100%; height:4px; border-radius:2px; background-color:${color}; margin-top:3px;"></div>`;
        });

        let bgStyle = isToday ? 'background-color: #e6f4ea;' : '';
        let textStyleStr = isToday ? 'color: #58B673; font-weight:800;' : '';
        
        // INTERCEPTION: Now calls openDayViewModal instead of openEventModal
        gridEl.innerHTML += `
            <div class="cal-cell" style="${bgStyle}" onclick="openDayViewModal('${currentDayStr}')">
                <span class="date-num" style="${textStyleStr}">${String(i).padStart(2, '0')}</span>
                <div style="width:100%; display:flex; flex-direction:column; gap:2px; margin-top:4px;">${eventDots}</div>
            </div>`;
    }

    const totalCellsRendered = firstDay + daysInMonth;
    const totalGridCells = totalCellsRendered > 35 ? 42 : 35;
    for (let i = 1; i <= (totalGridCells - totalCellsRendered); i++) {
        gridEl.innerHTML += `<div class="cal-cell empty"><span class="date-num">${String(i).padStart(2, '0')}</span></div>`;
    }
}

// 3. Modals and Form Submissions

// 3A. Daily View Modal Functions
function openDayViewModal(dateStr) {
    activeDayViewDate = dateStr;
    const modal = document.getElementById('dayViewModal');
    const title = document.getElementById('dayViewTitle');
    const list = document.getElementById('dayViewList');

    // Format the date for the title (e.g., "September 08, 2026")
    const dObj = new Date(dateStr);
    const displayDate = dObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    title.innerText = `Schedule for ${displayDate}`;

    let events = getEvents().filter(e => e.date === dateStr);
    events.sort((a,b) => new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time));

    list.innerHTML = '';
    if (events.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #64748b; margin: 30px 0; font-size: 0.95rem;">No appointments scheduled for this day.</p>';
    } else {
        events.forEach(ev => {
            let [h, m] = ev.time.split(':');
            let ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const displayTime = `${h}:${m} ${ampm}`;
            
            let borderColor = ev.status === 'pending' ? 'border-orange' : 'border-green';
            let pillColor = ev.status === 'pending' ? 'pill-orange' : 'pill-green';

            // Populate the mini-cards inside the popup
            list.innerHTML += `
                <div class="appointment-card ${borderColor}" style="cursor: pointer; margin-bottom: 12px; transition: transform 0.1s;" onclick="openEventModal('${ev.id}', '${ev.title.replace(/'/g, "\\'")}', '${ev.date}', '${ev.time}', '${ev.client.replace(/'/g, "\\'")}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <div class="appt-details">
                        <h4 style="font-size: 1.05rem; color: #1e293b; margin: 0 0 4px 0;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Client: ${ev.client}</p>
                        <span class="pill ${pillColor}" style="margin-top: 8px; display: inline-block;">${displayTime}</span>
                    </div>
                </div>
            `;
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeDayViewModal() {
    const modal = document.getElementById('dayViewModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    activeDayViewDate = null;
}

function openEventModalFromDay() {
    // Opens the Event Create form specifically for the date currently being viewed
    let dateToPass = activeDayViewDate || new Date().toISOString().split('T')[0];
    openEventModal(null, '', dateToPass, '09:00', '');
}

// 3B. Event CRUD Modal Functions
function openEventModal(eventId = null, title = '', date = '', time = '', client = '') {
    const modal = document.getElementById('eventModal');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const modalTitle = document.getElementById('modalTitle');

    activeEventId = eventId;

    if (eventId && title) {
        modalTitle.innerText = "Edit Appointment";
        deleteBtn.style.display = 'block';
        document.getElementById('eventTitle').value = title;
        document.getElementById('eventClient').value = client;
        document.getElementById('eventDate').value = date;
        document.getElementById('eventTime').value = time;
    } else {
        modalTitle.innerText = "Create New Appointment";
        deleteBtn.style.display = 'none';
        document.getElementById('eventForm').reset();
        if(date) document.getElementById('eventDate').value = date;
        if(time) document.getElementById('eventTime').value = time;
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('active'); 
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    activeEventId = null;
}

function saveEvent(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const client = document.getElementById('eventClient').value || 'Unassigned';
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;

    let events = getEvents();

    if (activeEventId) {
        let ev = events.find(x => x.id === activeEventId);
        if(ev) {
            ev.title = title;
            ev.client = client;
            ev.date = date;
            ev.time = time;
        }
        if (typeof showToast === 'function') showToast("Appointment updated.");
    } else {
        events.push({
            id: 'appt-' + Date.now(),
            title: title,
            client: client,
            date: date,
            time: time,
            status: 'confirmed'
        });
        if (typeof showToast === 'function') showToast("New appointment added.");
    }

    saveEventsDB(events);
    closeEventModal();
    renderCalendarUI();
    
    // Automatically refresh the day view popup if it happens to be open in the background
    if(activeDayViewDate) {
        openDayViewModal(activeDayViewDate); 
    }
}

function deleteEvent() {
    if (!activeEventId) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
        let events = getEvents();
        events = events.filter(x => x.id !== activeEventId);
        saveEventsDB(events);
        if (typeof showToast === 'function') showToast("Appointment removed.");
        
        closeEventModal();
        renderCalendarUI();
        
        // Refresh the day view popup
        if(activeDayViewDate) {
            openDayViewModal(activeDayViewDate); 
        }
    }
}

function handleProposal(eventId, action) {
    let events = getEvents();
    let ev = events.find(x => x.id === eventId);
    if(!ev) return;

    if (action === 'accept') {
        ev.status = 'confirmed';
        if (typeof showToast === 'function') showToast("Appointment Accepted!");
    } else {
        events = events.filter(x => x.id !== eventId);
        if (typeof showToast === 'function') showToast("Appointment Declined.");
    }
    
    saveEventsDB(events);
    renderCalendarUI();
}

function syncCalendar() {
    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IWAKI Astria//Legal Calendar Sync//EN
BEGIN:VEVENT
UID:event-sync@iwaki.ph
DTSTAMP:20260908T000000Z
DTSTART:20260908T100000Z
DTEND:20260908T110000Z
SUMMARY:Corp Setup Consult - Maria Santos
DESCRIPTION:Initial corporate setup consultation overview.
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'iwaki_schedule_sync.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showToast === 'function') showToast("Calendar sync file downloaded.");
}

// Automatically load the calendar UI if we are on the page
document.addEventListener('DOMContentLoaded', () => {
    if(window.location.pathname.includes('calendar.html')) {
        renderCalendarUI();
    }
});