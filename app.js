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
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
    
    // Auto-populate date in service record form
    const autoDateElement = document.getElementById('autoDate');
    if (autoDateElement) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        autoDateElement.textContent = formattedDate;
        
        // Also set a hidden date field if needed
        const hiddenDateField = document.getElementById('serviceDate');
        if (hiddenDateField) {
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            hiddenDateField.value = `${yyyy}-${mm}-${dd}`;
        }
    }
    
    // Uppercase input for plate number
    const plateNumberInput = document.getElementById('plateNumber');
    if (plateNumberInput) {
        plateNumberInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    // Uppercase input for initials
    const initialsInput = document.getElementById('customerInitials');
    if (initialsInput) {
        initialsInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    // Initialize wheel selection (will be re-initialized by ServiceRecordModule after form reset)
    initializeWheelSelection();
    
    // Initialize condition checkbox labels (for mobile)
    initializeConditionCheckboxes();
    
    // Initialize modules
    initializeModules();
});

// Wheel selection interaction
function initializeWheelSelection() {
    const wheelOptions = document.querySelectorAll('.wheel-option');
    wheelOptions.forEach(option => {
        // Remove any existing event listeners
        if (option._wheelListener) {
            option.removeEventListener('click', option._wheelListener);
            option.removeEventListener('touchstart', option._wheelTouchListener);
        }
        
        // Create new listeners
        const clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
                
                // Update visual state
                const wheelBox = this.querySelector('.wheel-box');
                if (wheelBox) {
                    if (checkbox.checked) {
                        wheelBox.style.borderColor = 'var(--emergency-red)';
                        wheelBox.style.backgroundColor = 'var(--emergency-light)';
                        const icon = wheelBox.querySelector('i');
                        if (icon) icon.style.color = 'var(--emergency-red)';
                    } else {
                        wheelBox.style.borderColor = '';
                        wheelBox.style.backgroundColor = '';
                        const icon = wheelBox.querySelector('i');
                        if (icon) icon.style.color = '';
                    }
                }
            }
        };
        
        const touchHandler = function(e) {
            e.preventDefault();
            clickHandler.call(this, e);
        };
        
        // Store references for later removal
        option._wheelListener = clickHandler;
        option._wheelTouchListener = touchHandler;
        
        // Add event listeners
        option.addEventListener('click', clickHandler);
        option.addEventListener('touchstart', touchHandler, { passive: false });
    });
}

// Initialize condition checkbox labels for mobile
function initializeConditionCheckboxes() {
    const checkboxGroups = document.querySelectorAll('.condition-checkboxes .checkbox-group');
    checkboxGroups.forEach(group => {
        const label = group.querySelector('label');
        const checkbox = group.querySelector('input[type="checkbox"]');
        
        if (label && checkbox) {
            // Make the entire label area clickable on mobile
            label.style.cursor = 'pointer';
            label.style.userSelect = 'none';
            label.style.webkitTapHighlightColor = 'transparent';
            
            const clickHandler = function(e) {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            };
            
            // Remove existing listener if any
            if (label._conditionListener) {
                label.removeEventListener('click', label._conditionListener);
                label.removeEventListener('touchstart', label._conditionTouchListener);
            }
            
            // Store references
            label._conditionListener = clickHandler;
            label._conditionTouchListener = function(e) {
                e.preventDefault();
                clickHandler.call(this, e);
            };
            
            // Add listeners
            label.addEventListener('click', clickHandler);
            label.addEventListener('touchstart', label._conditionTouchListener, { passive: false });
        }
    });
}

// Utility functions
const Utils = {
    formatPhoneNumber: function(phone) {
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
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--box-shadow);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid var(--emergency-red);
                }
                .notification-success { border-left-color: var(--success-color); }
                .notification-error { border-left-color: var(--emergency-red); }
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--gray-color);
                    cursor: pointer;
                    margin-left: 10px;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .fade-out {
                    animation: fadeOut 0.3s ease forwards;
                }
                @keyframes fadeOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Auto-remove after 5 seconds
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

// Function to initialize modular components
function initializeModules() {
    console.log('Initializing Tire Medics SF application...');
    
    // Initialize Service Record Module if it exists
    if (typeof ServiceRecordModule !== 'undefined' && ServiceRecordModule.init) {
        ServiceRecordModule.init();
    }
}

// Export for modular use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, initializeModules, initializeWheelSelection, initializeConditionCheckboxes };
}
