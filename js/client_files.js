/**
 * Client File Manager Component Script
 * Handles file uploads, management, and TinyMCE Word Editor
 */

// Initialize Supabase Client for Cloud Storage Sync
const SUPABASE_URL = 'https://cyssvluzwzsftsskveet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.supabaseClient = supabase;

let activeClientId = null;
let pendingFiles = [];

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

// ==========================================================================
// Read File Content & Upload Logic
// ==========================================================================

/**
 * Convert files to Base64, HTML text, or Mammoth docx parsing
 * Uses global.readFileContent function
 */
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
      storedDataUrl = parsed.result;
    } else {
      storedHtmlContent = (parsed.result && parsed.result.trim() !== '')
        ? parsed.result
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

    // --- SUPABASE STORAGE CLOUD SYNC ---
    if (window.supabaseClient) {
      try {
        const filePath = `${targetFolder.name}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await window.supabaseClient.storage
          .from('client-documents')
          .upload(filePath, file);
        if (uploadError) console.error('Supabase storage sync error:', uploadError.message);
      } catch (err) {
        console.error('Failed to upload file to Supabase storage:', err);
      }
    }
  }

  saveFoldersDB(folders);

  activeClientId = targetFolder.id;
  closeClientModal();
  renderClientDirectory();
}

// ==========================================================================
// Render Client Directory
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
            const ext = (f.ext || f.name.split('.')).pop().toLowerCase();
            const isMediaOrPdf = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
            let iconSvg = '';

            if (ext === 'pdf') {
              iconSvg = `<div style="background: #e11d48; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">PDF</div>`;
            } else if (ext === 'docx' || ext === 'doc') {
              iconSvg = `<div style="background: #2563eb; color: #fff; width: 64px; height: 72px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">W</div>`;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
              if (f.dataUrl) {
                iconSvg = `<div style="width: 64px; height: 72px; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"><img src="${f.dataUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${f.name}" /></div>`;
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

// ==========================================================================
// File Operations
// ==========================================================================

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
  if (newName && newName.trim() !== '' && newName.trim() !== folder.name) {
    folder.name = newName.trim();
    saveFoldersDB(folders);
    renderClientDirectory();
    if (typeof showToast === 'function') showToast(`Folder renamed to "${folder.name}"`);
  }
}

function deleteClientFolder(folderId) {
  let folders = getFoldersDB();
  const folder = folders.find(f => f.id === folderId);

  if (folder && confirm(`Delete folder "${folder.name}" and all its contents?`)) {
    folders = folders.filter(f => f.id !== folderId);
    saveFoldersDB(folders);
    if (activeClientId === folderId) activeClientId = null;
    renderClientDirectory();
    if (typeof showToast === 'function') showToast('Folder deleted.');
  }
}

function renameClientFile(fileId) {
  let folders = getFoldersDB();

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
    saveFoldersDB(folders);
    renderClientDirectory();
    if (typeof showToast === 'function') showToast(`File renamed to "${file.name}"`);
  }
}

function deleteClientFile(fileId) {
  let folders = getFoldersDB();

  if (!activeClientId) {
    const parentFolder = folders.find(f => f.files && f.files.some(file => file.id === fileId));
    if (parentFolder) activeClientId = parentFolder.id;
  }

  const folderIndex = folders.findIndex(f => f.id === activeClientId);
  if (folderIndex === -1) return;

  folders[folderIndex].files = folders[folderIndex].files.filter(f => f.id !== fileId);
  saveFoldersDB(folders);
  renderClientDirectory();
  if (typeof showToast === 'function') showToast('File deleted.');
}

// ==========================================================================
// Word / Docs Editor (TinyMCE)
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
  let folders = getFoldersDB();

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

  saveFoldersDB(folders);

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

// ==========================================================================
// Media Viewer
// ==========================================================================

function openMediaViewer(file) {
  const modal = document.getElementById('file-viewer-modal-overlay');
  const title = document.getElementById('file-viewer-title');
  const content = document.getElementById('file-viewer-content');
  const sizeInfo = document.getElementById('file-viewer-size-info');

  if (!modal || !content) return;

  if (title) title.innerText = file.name;
  if (sizeInfo) sizeInfo.innerText = `File Size: ${file.size} | Date: ${file.date}`;

  const ext = (file.ext || file.name.split('.')).pop().toLowerCase().trim();

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

// ==========================================================================
// Modal Handlers
// ==========================================================================

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

  const ext = (file.ext || file.name.split('.')).pop().toLowerCase().trim();

  if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    openMediaViewer(file);
  } else {
    openFileInWordEditor(fileId);
  }
}

// ==========================================================================
// Page Load Init
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a client-files page
  if (window.location.pathname.includes('client-files.html')) {
    renderClientDirectory();
    document.getElementById('client-search-input')?.addEventListener('keyup', renderClientDirectory);
    document.getElementById('alpha-sort-filter')?.addEventListener('change', renderClientDirectory);

    // Setup client name modal handlers
    const modalClientStatus = document.getElementById('modal-client-status');
    const modalClientSelect = document.getElementById('modal-existing-client-select');

    if (modalClientStatus) {
      modalClientStatus.addEventListener('change', () => {
        toggleExistingVsNewUI();
      });
    }

    if (modalClientSelect) {
      populateExistingClientsDropdown();
    }
  }
});