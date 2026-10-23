document.addEventListener('DOMContentLoaded', () => {
  // Initialize admin search and filtering interactions
  const searchInput = document.querySelector('.admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        console.log(`Filtering admin records for: ${query}`);
      }
    });
  }

  const filterDropdowns = document.querySelectorAll('.filter-dropdown');
  filterDropdowns.forEach(dropdown => {
    dropdown.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      console.log(`Filter changed to: ${selectedValue}`);
    });
  });
});