// Service Record Module (No File Upload Version)
const ServiceRecordModule = (function() {
    // Configuration
    const API_ENDPOINT = 'https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod';
    
    // Initialize module
    function init() {
        console.log('Service Record Module initialized');
        
        // Setup form submission
        const serviceRecordForm = document.getElementById('serviceRecordForm');
        if (serviceRecordForm) {
            setupFormSubmission(serviceRecordForm);
        }
        
        // Setup print functionality
        const printBtn = document.getElementById('printForm');
        if (printBtn) {
            printBtn.addEventListener('click', handlePrint);
        }
    }
    
    // Setup form submission with AWS integration
    function setupFormSubmission(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(form)) {
                Utils.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('.btn-record-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Prepare form data
                const formData = prepareFormData(form);
                
                // Save service record to DynamoDB
                const result = await saveServiceRecord(formData);
                
                // Show success message
                Utils.showNotification('Service record submitted successfully!', 'success');
                
                // Reset form
                form.reset();
                
                // Reset any UI elements
                resetFormUI();
                
                // Optional: Show confirmation or redirect
                console.log('Service record saved:', result);
                
            } catch (error) {
                console.error('Error submitting form:', error);
                Utils.showNotification('Error submitting form. Please try again.', 'error');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
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
        const formData = new FormData(form);
        const data = {
            recordId: generateRecordId(),
            timestamp: new Date().toISOString(),
            serviceDate: document.getElementById('autoDate')?.textContent || new Date().toLocaleDateString(),
        };
        
        // Collect all form fields
        formData.forEach((value, key) => {
            if (key === 'wheels' || key === 'condition') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        // Get wheel checkboxes directly (in case FormData doesn't capture all)
        const wheelCheckboxes = form.querySelectorAll('input[name="wheels"]:checked');
        if (wheelCheckboxes.length > 0 && (!data.wheels || data.wheels.length === 0)) {
            data.wheels = Array.from(wheelCheckboxes).map(cb => cb.value);
        }
        
        // Get condition checkboxes
        const conditionCheckboxes = form.querySelectorAll('input[name="condition"]:checked');
        if (conditionCheckboxes.length > 0 && (!data.condition || data.condition.length === 0)) {
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
            const errorText = await response.text();
            throw new Error(`Failed to save service record: ${response.status} - ${errorText}`);
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
        
        // Reset photo preview
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) photoPreview.innerHTML = '';
        
        // Reset file upload label
        const fileUpload = document.getElementById('wheelPhotos');
        if (fileUpload) {
            fileUpload.value = '';
            const label = fileUpload.nextElementSibling;
            if (label && label.classList.contains('file-upload-label')) {
                label.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Take or upload photos</span>';
                label.style.color = '';
            }
        }
    }
    
    // Public API
    return {
        init,
        validateForm,
        prepareFormData,
        saveServiceRecord,
        generateRecordId
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        ServiceRecordModule.init();
    });
} else {
    ServiceRecordModule.init();
}
