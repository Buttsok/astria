(function() {
  const SUPABASE_URL = 'https://cyssvluzwzsftsskveet.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3N2bHV6d3pzZnRzc2t2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDM5NTgsImV4cCI6MjEwNzU3OTk1OH0.kfBHS-DwCjZKdZ4_KkVTLXDuUi-niTGV5dbuUs3MU3w'; // Use your working anon key here
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('form-reset');
    if (resetForm) {
      resetForm.addEventListener('submit', handlePasswordUpdate);
    }
  });

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    const newPassword = document.getElementById('new-password').value;

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      alert('Password updated successfully! You can now sign in with your new password.');
      window.location.href = 'auth.html';
    } catch (err) {
      alert('Error updating password: ' + err.message);
    }
  }

  window.togglePass = function(id, btn) {
    const field = document.getElementById(id);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
    btn.textContent = field.type === 'password' ? 'Show' : 'Hide';
  };
})();

