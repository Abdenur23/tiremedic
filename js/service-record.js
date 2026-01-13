// Service Record Module (No File Upload Version)
const ServiceRecordModule = (function() {
    // Configuration
    const API_ENDPOINT = 'https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod';
    
    // Track if form is already submitting to prevent double submission
    let isSubmitting = false;
    
    // Initialize module
    function init() {
        console.log('Service Record Module initialized');
        
        // Setup form submission
        const serviceRecordForm = document.getElementById('serviceRecordForm');
        if (serviceRecordForm) {
            // Remove any existing event listeners first
            const newForm = serviceRecordForm.cloneNode(true);
            serviceRecordForm.parentNode.replaceChild(newForm, serviceRecordForm);
            
            // Setup form submission on the new form
            setupFormSubmission(newForm);
        }
        
        // Setup print functionality
        const printBtn = document.getElementById('printForm');
        if (printBtn) {
            printBtn.addEventListener('click', handlePrint);
        }
        
        // Initialize wheel selection after form is ready
        setTimeout(initializeWheelSelection, 100);
    }
    
    // Setup form submission with AWS integration
    function setupFormSubmission(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Prevent double submission
            if (isSubmitting) {
                console.log('Form submission already in progress');
                return;
            }
            
            // Set submitting flag
            isSubmitting = true;
            
            // Validate form
            if (!validateForm(form)) {
                Utils.showNotification('Please fill in all required fields', 'error');
                isSubmitting = false;
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('.btn-record-submit');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Prepare form data
                const formData = prepareFormData(form);
                console.log('Submitting form data:', formData);
                
                // Save service record to DynamoDB
                const result = await saveServiceRecord(formData);
                console.log('Server response:', result);
                
                // Show success message
                Utils.showNotification('Service record submitted successfully!', 'success');
                
                // Reset form after delay
                setTimeout(() => {
                    form.reset();
                    resetFormUI();
                    
                    // Show record ID to user
                    if (result.recordId) {
                        Utils.showNotification(`Record ID: ${result.recordId}`, 'info');
                    }
                }, 1000);
                
            } catch (error) {
                console.error('Error submitting form:', error);
                Utils.showNotification(`Error: ${error.message}`, 'error');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = originalDisabled;
                
                // Reset submitting flag after a delay to prevent rapid re-submission
                setTimeout(() => {
                    isSubmitting = false;
                }, 2000);
            }
        });
    }
    
    // Validate form
    function validateForm(form) {
        let isValid = true;
        
        // Check required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                highlightError(field);
            } else {
                clearHighlight(field);
            }
        });
        
        // Check at least one wheel selected
        const wheelCheckboxes = form.querySelectorAll('input[name="wheels"]:checked');
        if (wheelCheckboxes.length === 0) {
            isValid = false;
            const wheelSelection = form.querySelector('.wheel-selection');
            if (wheelSelection) highlightError(wheelSelection);
        }
        
        // Check signature confirmation
        const signatureConfirm = form.querySelector('#signatureConfirm');
        if (signatureConfirm && !signatureConfirm.checked) {
            isValid = false;
            highlightError(signatureConfirm.parentElement);
        }
        
        // Check initials
        const initials = form.querySelector('#customerInitials');
        if (initials && initials.value.trim().length < 2) {
            isValid = false;
            highlightError(initials);
        }
        
        return isValid;
    }
    
    // Highlight field error
    function highlightError(element) {
        element.style.borderColor = 'var(--emergency-red)';
        element.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.1)';
    }
    
    // Clear highlight
    function clearHighlight(element) {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }
    
    // Prepare form data
    function prepareFormData(form) {
        const data = {
            recordId: generateRecordId(),
            timestamp: new Date().toISOString(),
            serviceDate: document.getElementById('autoDate')?.textContent || new Date().toLocaleDateString(),
        };
        
        // Collect text inputs, selects, and textareas
        const inputs = form.querySelectorAll('input[type="text"], input[type="hidden"], select, textarea');
        inputs.forEach(input => {
            if (input.name && input.name !== 'wheels' && input.name !== 'condition') {
                data[input.name] = input.value.trim();
            }
        });
        
        // Collect wheel checkboxes
        const wheelCheckboxes = form.querySelectorAll('input[name="wheels"]:checked');
        if (wheelCheckboxes.length > 0) {
            data.wheels = Array.from(wheelCheckboxes).map(cb => cb.value);
        }
        
        // Collect condition checkboxes
        const conditionCheckboxes = form.querySelectorAll('input[name="condition"]:checked');
        if (conditionCheckboxes.length > 0) {
            data.condition = Array.from(conditionCheckboxes).map(cb => cb.value);
        }
        
        return data;
    }
    
    // Save service record to DynamoDB via Lambda
    async function saveServiceRecord(recordData) {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveServiceRecord',
                tableName: 'tire-medics-service-records',
                recordData: recordData
            })
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    }
    
    // Generate unique record ID
    function generateRecordId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `SR-${timestamp}-${random}`.toUpperCase();
    }
    
    // Handle print
    function handlePrint() {
        window.print();
    }
    
    // Reset form UI
    function resetFormUI() {
        // Reset wheel selection highlights
        const wheelOptions = document.querySelectorAll('.wheel-option');
        wheelOptions.forEach(option => {
            const wheelBox = option.querySelector('.wheel-box');
            if (wheelBox) {
                wheelBox.style.borderColor = '';
                wheelBox.style.backgroundColor = '';
                const icon = wheelBox.querySelector('i');
                if (icon) icon.style.color = '';
            }
        });
        
        // Clear all checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Re-initialize wheel selection after reset
        setTimeout(initializeWheelSelection, 100);
    }
    
    // Initialize wheel selection
    function initializeWheelSelection() {
        const wheelOptions = document.querySelectorAll('.wheel-option');
        wheelOptions.forEach(option => {
            // Remove any existing event listeners by cloning
            if (option.hasAttribute('data-listener-attached')) {
                return; // Already has listener
            }
            
            option.setAttribute('data-listener-attached', 'true');
            
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const checkbox = this.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    
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
            });
            
            // Also update visual state based on current checkbox state
            const checkbox = option.querySelector('input[type="checkbox"]');
            const wheelBox = option.querySelector('.wheel-box');
            if (checkbox && wheelBox) {
                if (checkbox.checked) {
                    wheelBox.style.borderColor = 'var(--emergency-red)';
                    wheelBox.style.backgroundColor = 'var(--emergency-light)';
                    const icon = wheelBox.querySelector('i');
                    if (icon) icon.style.color = 'var(--emergency-red)';
                }
            }
        });
    }
    
    // Public API
    return {
        init,
        validateForm,
        prepareFormData,
        saveServiceRecord,
        generateRecordId,
        initializeWheelSelection
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all DOM is loaded
    setTimeout(() => {
        ServiceRecordModule.init();
    }, 100);
});
