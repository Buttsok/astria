// ==========================================================================
// Dedicated Authentication Page Logic (Sign In & Sign Up)
// ==========================================================================

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

document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('form-signin');
  const signupForm = document.getElementById('form-signup');

  if (signinForm) signinForm.addEventListener('submit', handleSignIn);
  if (signupForm) signupForm.addEventListener('submit', handleSignUp);
});

// DATABASE CONNECTION // 
const SUPABASE_URL = 'cyssvluzwzsftsskveet';
const SUPABASE_ANON_KEY = 'sb_publishable_xxFzGiH-Ut3EpB_vqs1UVg_G8uZYrNo';