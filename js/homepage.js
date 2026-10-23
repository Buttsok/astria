// ==========================================
//   Dedicated Homepage JavaScript Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Bind contact form submission on the homepage
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactFormSubmit);
  }

  // Navbar link active state tracker & smooth scrolling behavior
  setupHomepageNavigation();
});

// Navigation link highlighting and dynamic active state tracker
function setupHomepageNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Update active navbar item on scroll
  const sections = document.querySelectorAll('.section-target');
  window.addEventListener('scroll', () => {
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });
}

// Save inquiry directly to admin messages database from index.html
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