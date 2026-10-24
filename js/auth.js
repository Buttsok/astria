(function() {
  // // DATABASE CONNECTION // //
  const SUPABASE_URL = 'https://cyssvluzwzsftsskveet.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w'; 
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('form-signin');
    const signupForm = document.getElementById('form-signup');

    if (signinForm) signinForm.addEventListener('submit', handleSignIn);
    if (signupForm) signupForm.addEventListener('submit', handleSignUp);
  });

  // Helper to show professional UI messages instead of browser alerts
  function showMessage(formId, message, type = 'error') {
    const form = document.getElementById(formId);
    let banner = form.querySelector('.auth-message-banner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'auth-message-banner';
      form.prepend(banner);
    }

    banner.style.padding = '12px 16px';
    banner.style.marginBottom = '16px';
    banner.style.borderRadius = '8px';
    banner.style.fontSize = '14px';
    banner.style.lineHeight = '1.4';
    
    if (type === 'error') {
      banner.style.backgroundColor = '#fdf2f2';
      banner.style.color = '#991b1b';
      banner.style.border = '1px solid #f87171';
    } else {
      banner.style.backgroundColor = '#f0fdf4';
      banner.style.color = '#166534';
      banner.style.border = '1px solid #4ade80';
    }

    banner.textContent = message;
  }

  // Handle Sign In
  async function handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const role = data.user.user_metadata?.role || 'client';
      window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html';
    } catch (err) {
      if (err.message.includes('Email not confirmed')) {
        showMessage('form-signin', 'Your email address has not been verified yet. Please check your inbox for the confirmation link.');
      } else {
        showMessage('form-signin', err.message);
      }
    }
  }

  // Handle Sign Up
  async function handleSignUp(event) {
    event.preventDefault();
    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'client' }
        }
      });

      if (error) throw error;

      showMessage('form-signup', 'Registration successful! Please check your email inbox to verify your account before signing in.', 'success');
      
      // Clear form and switch to sign in tab after a brief pause
      setTimeout(() => {
        document.getElementById('form-signup').reset();
        window.switchTab('signin');
      }, 3500);

    } catch (err) {
      showMessage('form-signup', err.message);
    }
  }

  // Expose functions globally for HTML inline onclick handlers
  window.switchTab = function(tab) {
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
  };

  window.togglePass = function(id, btn) {
    const field = document.getElementById(id);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
    btn.textContent = field.type === 'password' ? 'Show' : 'Hide';
  };
})();
