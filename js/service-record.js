// Service Record Module
const ServiceRecordModule = (function() {
    // Configuration
    const API_ENDPOINT = 'https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod';
    const BUCKET_NAME = 'tire-medics-service-images';
    
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
                
                // Upload photos and get presigned URLs
                const photoUrls = await uploadPhotos(formData.photos);
                
                // Update form data with photo URLs
                formData.photoUrls = photoUrls;
                
                // Save service record to DynamoDB
                const result = await saveServiceRecord(formData);
                
                // Show success message
                Utils.showNotification('Service record submitted successfully!', 'success');
                
                // Generate PDF or redirect
                setTimeout(() => {
                    // Optional: Generate PDF receipt
                    // generateReceipt(result);
                    
                    // Reset form
                    form.reset();
                    
                    // Reset photo preview
                    const photoPreview = document.getElementById('photoPreview');
                    if (photoPreview) photoPreview.innerHTML = '';
                    
                    // Reset signature canvas
                    const signatureCanvas = document.getElementById('signatureCanvas');
                    if (signatureCanvas) {
                        const ctx = signatureCanvas.getContext('2d');
                        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                    }
                }, 2000);
                
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
        
        // Check signature
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
            } else if (key === 'wheelPhotos') {
                // Photos will be handled separately
                if (!data.photos) data.photos = [];
                // Note: We'll get files from the file input directly
            } else {
                data[key] = value;
            }
        });
        
        // Get files from file input
        const fileInput = document.getElementById('wheelPhotos');
        if (fileInput && fileInput.files.length > 0) {
            data.photos = Array.from(fileInput.files);
        }
        
        return data;
    }
    
    // Upload photos and get presigned URLs
    async function uploadPhotos(photos) {
        if (!photos || photos.length === 0) return [];
        
        const photoUrls = [];
        
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const fileName = `service-record-${Date.now()}-${i}.${photo.name.split('.').pop()}`;
            
            try {
                // Get presigned URL for upload
                const presignedUrl = await getPresignedUrl(fileName);
                
                // Upload photo to S3 using presigned URL
                await uploadToS3(presignedUrl, photo);
                
                // Store the public URL
                photoUrls.push(`https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`);
                
            } catch (error) {
                console.error(`Error uploading photo ${i}:`, error);
                throw new Error(`Failed to upload photo ${photo.name}`);
            }
        }
        
        return photoUrls;
    }
    
    // Get presigned URL from Lambda
    async function getPresignedUrl(fileName) {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getPresignedUrl',
                bucket: BUCKET_NAME,
                key: fileName,
                contentType: 'image/*'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get presigned URL: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.url;
    }
    
    // Upload to S3 using presigned URL
    async function uploadToS3(presignedUrl, file) {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file
        });
        
        if (!response.ok) {
            throw new Error(`Failed to upload to S3: ${response.statusText}`);
        }
        
        return response;
    }
    
    // Save service record to DynamoDB via Lambda
    async function saveServiceRecord(recordData) {
        // Remove photos from data before sending to Lambda
        const { photos, ...dataWithoutPhotos } = recordData;
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveServiceRecord',
                tableName: 'tire-medics-service-records',
                recordData: dataWithoutPhotos,
                photoUrls: recordData.photoUrls || []
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save service record: ${response.statusText}`);
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
    
    // Generate receipt (optional)
    function generateReceipt(data) {
        // Implementation for generating PDF receipt
        console.log('Generating receipt for:', data);
        // You could use libraries like jsPDF or html2pdf here
    }
    
    // Public API
    return {
        init,
        validateForm,
        prepareFormData,
        uploadPhotos,
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
