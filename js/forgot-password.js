(function() {
  const SUPABASE_URL = 'https://cyssvluzwzsftsskveet.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w'; // Use your working anon key here
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('form-forgot');
    if (forgotForm) {
      forgotForm.addEventListener('submit', handleForgotPassword);
    }
  });

  function showMessage(message, type = 'error') {
    const form = document.getElementById('form-forgot');
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

  async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html',
      });
      if (error) throw error;

      showMessage('Password recovery email sent! Check your inbox for the link.', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }
})();