// Service Record Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // API endpoint
    const API_ENDPOINT = 'https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod';
    
    // Form submission handling
    const serviceRecordForm = document.getElementById('serviceRecordForm');
    if (serviceRecordForm) {
        serviceRecordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.btn-record-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Collect form data
                const formData = collectFormData();
                
                // Upload images if any
                const wheelPhotos = document.getElementById('wheelPhotos').files;
                if (wheelPhotos.length > 0) {
                    formData.imageUrls = await uploadImages(wheelPhotos);
                }
                
                // Submit to API
                const response = await saveServiceRecord(formData);
                
                if (response.success) {
                    showSuccess('Service record saved successfully!');
                    
                    // Optionally reset form or redirect
                    setTimeout(() => {
                        // Clear form
                        serviceRecordForm.reset();
                        clearPhotoPreview();
                        resetWheelSelection();
                        
                        // Reset signature if exists
                        const signatureCanvas = document.getElementById('signatureCanvas');
                        if (signatureCanvas) {
                            const ctx = signatureCanvas.getContext('2d');
                            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                        }
                    }, 2000);
                } else {
                    showError(response.message || 'Failed to save service record');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showError('An error occurred while submitting the form');
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Required fields
        const requiredFields = [
            'streetAddress',
            'customerType',
            'firstName',
            'plateState',
            'plateNumber',
            'customerInitials'
        ];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                isValid = false;
                highlightError(field);
            } else if (field) {
                clearError(field);
            }
        });
        
        // Validate at least one wheel selected
        const wheelCheckboxes = document.querySelectorAll('input[name="wheels"]:checked');
        if (wheelCheckboxes.length === 0) {
            isValid = false;
            const wheelSelection = document.querySelector('.wheel-selection');
            if (wheelSelection) {
                wheelSelection.style.border = '2px solid var(--emergency-red)';
                wheelSelection.style.borderRadius = 'var(--border-radius)';
                wheelSelection.style.padding = '10px';
            }
        } else {
            const wheelSelection = document.querySelector('.wheel-selection');
            if (wheelSelection) {
                wheelSelection.style.border = '';
                wheelSelection.style.padding = '';
            }
        }
        
        // Validate agreement checkbox
        const agreementCheckbox = document.getElementById('signatureConfirm');
        if (agreementCheckbox && !agreementCheckbox.checked) {
            isValid = false;
            highlightError(agreementCheckbox);
        } else if (agreementCheckbox) {
            clearError(agreementCheckbox);
        }
        
        if (!isValid) {
            showError('Please fill in all required fields marked with *');
        }
        
        return isValid;
    }
    
    function highlightError(element) {
        element.style.borderColor = 'var(--emergency-red)';
        element.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.1)';
    }
    
    function clearError(element) {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }
    
    // Collect form data
    function collectFormData() {
        const formData = {
            id: generateRecordId(),
            timestamp: new Date().toISOString(),
            serviceDate: document.getElementById('autoDate').textContent,
            streetAddress: document.getElementById('streetAddress').value,
            cityState: document.getElementById('cityState').value,
            customerType: document.getElementById('customerType').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName')?.value || '',
            phoneNumber: document.getElementById('phoneNumber')?.value || '',
            plateState: document.getElementById('plateState').value,
            plateNumber: document.getElementById('plateNumber').value.toUpperCase(),
            wheels: Array.from(document.querySelectorAll('input[name="wheels"]:checked'))
                .map(cb => cb.value),
            condition: Array.from(document.querySelectorAll('input[name="condition"]:checked'))
                .map(cb => cb.value),
            wheelNotes: document.getElementById('wheelNotes').value,
            customerInitials: document.getElementById('customerInitials').value.toUpperCase(),
            signatureConfirmed: document.getElementById('signatureConfirm').checked,
            vehicleMake: document.getElementById('vehicleMake')?.value || '',
            vehicleModel: document.getElementById('vehicleModel')?.value || '',
            vehicleYear: document.getElementById('vehicleYear')?.value || '',
            serviceType: document.getElementById('serviceType')?.value || 'flat-tire-repair',
            technicianNotes: document.getElementById('technicianNotes')?.value || '',
            status: 'submitted'
        };
        
        return formData;
    }
    
    // Generate unique record ID
    function generateRecordId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `SR-${timestamp}-${random}`.toUpperCase();
    }
    
    // Upload images to S3 via API
    async function uploadImages(files) {
        const imageUrls = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('image', file);
            formData.append('recordId', generateRecordId());
            formData.append('imageType', 'wheel-photo');
            
            try {
                const response = await fetch(`${API_ENDPOINT}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    imageUrls.push(result.imageUrl);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
        
        return imageUrls;
    }
    
    // Save service record to DynamoDB
    async function saveServiceRecord(data) {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error saving service record:', error);
            throw error;
        }
    }
    
    // Clear photo preview
    function clearPhotoPreview() {
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.innerHTML = '';
        }
        const fileInput = document.getElementById('wheelPhotos');
        if (fileInput) {
            fileInput.value = '';
            const label = fileInput.nextElementSibling;
            if (label) {
                label.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Take or upload photos</span>';
                label.style.color = '';
            }
        }
    }
    
    // Reset wheel selection
    function resetWheelSelection() {
        const wheelOptions = document.querySelectorAll('.wheel-option');
        wheelOptions.forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.checked = false;
            const wheelBox = option.querySelector('.wheel-box');
            wheelBox.style.borderColor = '';
            wheelBox.style.backgroundColor = '';
            if (wheelBox.querySelector('i')) {
                wheelBox.querySelector('i').style.color = '';
            }
        });
    }
    
    // Show success message
    function showSuccess(message) {
        Utils.showNotification(message, 'success');
    }
    
    // Show error message
    function showError(message) {
        Utils.showNotification(message, 'error');
    }
});
