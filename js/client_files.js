/**
 * Client File Manager Component Script
 * Handles file uploads, document management, TinyMCE Word Editor, and Supabase Database Sync
 */

// Safely initialize Supabase client only if not already declared globally
if (typeof window.supabaseClient === 'undefined') {
  const SUPABASE_URL = 'https://cyssvluzwzsftsskveet.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w';
  window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
}

let activeClientId = null;
let pendingFiles = [];

// ==========================================================================
// Local Storage Folder DB Helpers (Prevents ReferenceError)
// ==========================================================================

function getFoldersDB() {
  return JSON.parse(localStorage.getItem('client_folders_db')) || [];
}

function saveFoldersDB(folders) {
  localStorage.setItem('client_folders_db', JSON.stringify(folders));
}

// Helper utility for capitalization
function capitalizeWord(str) {
  if (!str) return '';
  return str.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Helper utility for file size formatting
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ==========================================================================
// Client File Manager & Modal Handlers
// ==========================================================================

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

  const folders = getFoldersDB();
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

function closeClientModal() {
  const modal = document.getElementById('client-name-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  pendingFiles = [];
}

// ==========================================================================
// Read File Content & Upload Logic
// ==========================================================================

async function confirmClientUpload() {
  const status = document.getElementById('modal-client-status')?.value || 'new';
  const entityType = document.querySelector('input[name="client_entity_type"]:checked')?.value || 'individual';
  let folders = getFoldersDB();
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
        type: entityType === 'company' ? 'company' : 'individual',
        files: []
      };
      folders.push(targetFolder);
      if (typeof showToast === 'function') showToast(`Created directory: "${targetFolder.name}"`);
    }
  }

  if (!targetFolder) return;

  for (const file of pendingFiles) {
    const parsed = typeof readFileContent === 'function' ? await readFileContent(file) : { type: 'html', data: '' };
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

    if (window.supabaseClient) {
      try {
        const filePath = `${targetFolder.name}/${Date.now()}_${file.name}`;
        await window.supabaseClient.storage
          .from('client-documents')
          .upload(filePath, file);
      } catch (err) {
        console.error('Supabase storage upload error:', err);
      }
    }
  }

  saveFoldersDB(folders);
  activeClientId = targetFolder.id;
  closeClientModal();
  renderClientDirectory();
}

// ==========================================================================
// Render Client Directory & Folders
// ==========================================================================

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

  let folders = getFoldersDB();

  if (sortVal === 'az') {
    folders.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'za') {
    folders.sort((a, b) => b.name.localeCompare(a.name));
  }

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
      folderGrid.style.display = 'block';
      folderGrid.style.padding = '0';

      const individualFolders = filteredFolders.filter(f => !f.type || f.type === 'individual');
      const companyFolders = filteredFolders.filter(f => f.type === 'company');

      let htmlContent = '';

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
              <button class="folder-dropdown-item" onclick="renameClientFolder('${activeFolder.id}')">Rename Folder</button>
              <button class="folder-dropdown-item text-danger" onclick="deleteClientFolder('${activeFolder.id}')">Delete Folder</button>
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
            let iconSvg = `<div style="background: #2563eb; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800;">W</div>`;

            if (ext === 'pdf') {
              iconSvg = `<div style="background: #e11d48; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800;">PDF</div>`;
            }

            return `
              <div class="file-box-tile" onclick="openClientFileItem('${f.id}')" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 10px 10px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; position: relative;">
                <div style="margin-top: 10px; margin-bottom: 12px;">${iconSvg}</div>
                <span style="font-size: 0.85rem; font-weight: 600; color: #1e293b; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${f.name}">${f.name}</span>
                <span style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">${f.size}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }
}

function renderFolderCardHTML(f) {
  return `
    <div class="client-folder-card-box" onclick="openClientFolder('${f.id}')" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; position: relative;">
      <div style="display: flex; align-items: center; gap: 14px; overflow: hidden; flex: 1;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#52AB62" stroke-width="2" style="flex-shrink: 0;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <div style="overflow: hidden; padding-right: 8px;">
          <h4 style="margin: 0; font-size: 0.98rem; color: #1e293b; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.name}</h4>
          <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #64748b;">${f.files ? f.files.length : 0} items</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// Navigation & Actions
// ==========================================================================

function toggleActionMenu(event, menuId) {
  event.stopPropagation();
  document.querySelectorAll('.action-menu-dropdown, .folder-dropdown-menu').forEach(el => {
    if (el.id !== menuId) el.classList.remove('show');
  });
  document.getElementById(menuId)?.classList.toggle('show');
}

function toggleFolderDropdown(event) {
  event.stopPropagation();
  document.getElementById('folder-dropdown-menu')?.classList.toggle('show');
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
  let folders = getFoldersDB();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return;
  const newName = prompt(`Rename Folder "${folder.name}":`, folder.name);
  if (newName && newName.trim() !== '') {
    folder.name = newName.trim();
    saveFoldersDB(folders);
    renderClientDirectory();
  }
}

function deleteClientFolder(folderId) {
  let folders = getFoldersDB();
  if (confirm(`Delete folder?`)) {
    folders = folders.filter(f => f.id !== folderId);
    saveFoldersDB(folders);
    if (activeClientId === folderId) activeClientId = null;
    renderClientDirectory();
  }
}

// ==========================================================================
// File Viewers & TinyMCE Word Editor
// ==========================================================================

let activeEditingFileId = null;

function openClientFileItem(fileId) {
  let folders = getFoldersDB();
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
        </object>
      `;
    } else {
      content.innerHTML = `<p style="text-align: center; color: #64748b;">No PDF data captured.</p>`;
    }
  } else {
    if (file.dataUrl) {
      content.innerHTML = `<img src="${file.dataUrl}" style="max-width: 100%; max-height: 520px; object-fit: contain; border-radius: 6px;" alt="${file.name}" />`;
    } else {
      content.innerHTML = `<p style="text-align: center; color: #64748b;">Image preview active.</p>`;
    }
  }

  modal.classList.add('active');
}

function initWordDocsEngine(callback) {
  if (typeof tinymce === 'undefined') {
    if (callback) callback();
    return;
  }
  if (tinymce.get('word-editor-textarea')) tinymce.get('word-editor-textarea').remove();

  tinymce.init({
    selector: '#word-editor-textarea',
    height: 600,
    menubar: false,
    plugins: ['lists', 'link', 'table'],
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist',
    setup: function (editor) {
      editor.on('init', function () {
        if (callback) callback();
      });
    }
  });
}

function openFileInWordEditor(fileId) {
  let folders = getFoldersDB();
  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folder = folders.find(f => f.id === activeClientId);
  if (!folder) return;
  const file = folder.files.find(f => f.id === fileId);
  if (!file) return;

  activeEditingFileId = file.id;
  document.getElementById('editor-document-title').value = file.name;
  document.getElementById('word-docs-editor-modal').style.display = 'flex';

  initWordDocsEngine(() => {
    tinymce.get('word-editor-textarea')?.setContent(file.htmlContent || '');
  });
}

function saveWordDocument() {
  let folders = getFoldersDB();
  const folder = folders.find(f => f.id === activeClientId);
  if (!folder) return;
  const file = folder.files.find(f => f.id === activeEditingFileId);
  if (!file) return;

  file.htmlContent = tinymce.get('word-editor-textarea')?.getContent() || '';
  saveFoldersDB(folders);
  document.getElementById('editor-save-status').innerText = 'All changes saved';
  renderClientDirectory();
}

function closeWordDocEditor() {
  document.getElementById('word-docs-editor-modal').style.display = 'none';
  activeEditingFileId = null;
}

// ==========================================================================
// Page Load Init & Supabase Sync
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname.includes('client-files.html')) {
    await syncSupabaseCompiledFilesToFolders();

    renderClientDirectory();
    document.getElementById('client-search-input')?.addEventListener('keyup', renderClientDirectory);
    document.getElementById('alpha-sort-filter')?.addEventListener('change', renderClientDirectory);

    document.getElementById('modal-client-status')?.addEventListener('change', () => toggleExistingVsNewUI());
  }
});

async function syncSupabaseCompiledFilesToFolders() {
  if (!window.supabaseClient) return;

  try {
    const { data: dbFiles, error } = await window.supabaseClient
      .from('client_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !dbFiles) return;

    let folders = getFoldersDB();
    let updated = false;

    dbFiles.forEach(dbFile => {
      const folderName = dbFile.client_id ? capitalizeWord(dbFile.client_id.replace(/-/g, ' ')) : 'Acme Corp';
      const clientType = dbFile.client_type || 'company';

      let targetFolder = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());

      if (!targetFolder) {
        targetFolder = {
          id: 'cli-sync-' + dbFile.client_id,
          name: folderName,
          formalName: folderName,
          type: clientType,
          files: []
        };
        folders.push(targetFolder);
        updated = true;
      }

      const fileExists = targetFolder.files.some(f => f.name === dbFile.file_name);
      if (!fileExists) {
        targetFolder.files.unshift({
          id: 'file-' + dbFile.id,
          name: dbFile.file_name,
          ext: 'docx',
          size: '12 KB',
          date: new Date(dbFile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          htmlContent: `<h3>${dbFile.file_name}</h3><pre>${dbFile.file_content || ''}</pre>`,
          dataUrl: ''
        });
        updated = true;
      }
    });

    if (updated) {
      saveFoldersDB(folders);
    }
  } catch (err) {
    console.error('Error syncing Supabase compiled contracts:', err);
  }
}

// Explicit global bindings for HTML event handlers
window.closeClientModal = closeClientModal;
window.confirmClientUpload = confirmClientUpload;
window.triggerFileUpload = triggerFileUpload;
window.handleFileUpload = handleFileUpload;