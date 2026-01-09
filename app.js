// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Set minimum date for booking form to today
    const serviceDateInput = document.getElementById('serviceDate');
    if (serviceDateInput) {
        const today = new Date().toISOString().split('T')[0];
        serviceDateInput.min = today;
        serviceDateInput.value = today;
    }
    
    // Form submission handling
    const bookingForm = document.getElementById('serviceBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate all required checkboxes are checked
            const requiredCheckboxes = bookingForm.querySelectorAll('input[type="checkbox"][required]');
            let allChecked = true;
            
            requiredCheckboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    allChecked = false;
                    // Add visual feedback
                    checkbox.parentElement.style.color = 'var(--danger-color)';
                } else {
                    checkbox.parentElement.style.color = '';
                }
            });
            
            if (!allChecked) {
                alert('Please acknowledge all required terms before submitting.');
                return;
            }
            
            // In a real application, you would send the form data to a server
            // For now, we'll simulate a successful submission
            alert('Booking request submitted successfully! We will contact you shortly to confirm details.');
            bookingForm.reset();
            
            // Reset date to today
            if (serviceDateInput) {
                serviceDateInput.value = today;
            }
        });
    }
    
    // File upload feedback
    const fileUpload = document.querySelector('.file-upload input[type="file"]');
    if (fileUpload) {
        fileUpload.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.files.length > 0) {
                label.innerHTML = `<i class="fas fa-check-circle"></i><span>${this.files.length} file(s) selected</span>`;
                label.style.color = 'var(--success-color)';
            } else {
                label.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Choose files or drag here</span>';
                label.style.color = '';
            }
        });
    }
    
    // Initialize any future modules
    initializeModules();
});

// Function to initialize future modular components
function initializeModules() {
    // This function will be expanded as we add more modules
    console.log('Initializing application modules...');
    
    // Example of how we might initialize future modules
    // if (typeof BookingFormModule !== 'undefined') {
    //     BookingFormModule.init();
    // }
    // if (typeof Config !== 'undefined') {
    //     console.log('Config loaded:', Config.API_URL);
    // }
}

// Utility functions that can be used across modules
const Utils = {
    formatPhoneNumber: function(phone) {
        // Simple phone formatting utility
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    },
    
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    showNotification: function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
};

// Export for use in modular JS files (when using modules)
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = { Utils };
// }
