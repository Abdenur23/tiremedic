// service-record.js
document.addEventListener('DOMContentLoaded', function() {
    // ... (keep your existing DOMContentLoaded code as is) ...
    
    // Form submission handling for service record
    const serviceRecordForm = document.getElementById('serviceRecordForm');
    if (serviceRecordForm) {
        serviceRecordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate required fields
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--emergency-red)';
                    field.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.1)';
                } else {
                    field.style.borderColor = '';
                    field.style.boxShadow = '';
                }
            });
            
            // Validate at least one wheel selected
            const wheelCheckboxes = this.querySelectorAll('input[name="wheels"]:checked');
            if (wheelCheckboxes.length === 0) {
                isValid = false;
                const wheelSelection = document.querySelector('.wheel-selection');
                if (wheelSelection) {
                    wheelSelection.style.border = '2px solid var(--emergency-red)';
                    wheelSelection.style.borderRadius = 'var(--border-radius)';
                    wheelSelection.style.padding = '10px';
                }
            }
            
            // Validate initials
            const initialsInput = document.getElementById('customerInitials');
            if (initialsInput && !initialsInput.value.trim()) {
                isValid = false;
                initialsInput.style.borderColor = 'var(--emergency-red)';
            }
            
            if (!isValid) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            try {
                // Collect form data
                const formData = new FormData(this);
                
                // Get checkbox values
                const wheels = [];
                document.querySelectorAll('input[name="wheels"]:checked').forEach(cb => {
                    wheels.push(cb.value);
                });
                
                const conditions = [];
                document.querySelectorAll('input[name="condition"]:checked').forEach(cb => {
                    conditions.push(cb.value);
                });
                
                // Create JSON payload
                const payload = {
                    serviceDetails: {
                        streetAddress: formData.get('streetAddress'),
                        cityState: formData.get('cityState'),
                        customerType: formData.get('customerType'),
                        firstName: formData.get('firstName'),
                        plateState: formData.get('plateState'),
                        plateNumber: formData.get('plateNumber'),
                        serviceDate: new Date().toISOString()
                    },
                    wheelInspection: {
                        wheels: wheels,
                        conditions: conditions,
                        wheelNotes: formData.get('wheelNotes')
                    },
                    agreement: {
                        customerInitials: formData.get('customerInitials'),
                        signatureConfirm: formData.get('signatureConfirm') === 'on'
                    }
                };
                
                // Prepare multipart form data for files
                const apiFormData = new FormData();
                apiFormData.append('serviceRecord', JSON.stringify(payload));
                
                // Append photos
                const photos = document.getElementById('wheelPhotos').files;
                for (let i = 0; i < photos.length; i++) {
                    apiFormData.append('photos', photos[i]);
                }
                
                // Send to API Gateway endpoint
                const response = await fetch('https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod', {
                    method: 'POST',
                    body: apiFormData
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    alert('Service record submitted successfully! Record ID: ' + result.recordId);
                    
                    // Reset form
                    this.reset();
                    
                    // Clear photo preview
                    const photoPreview = document.getElementById('photoPreview');
                    if (photoPreview) {
                        photoPreview.innerHTML = '';
                    }
                    
                    // Reset file upload label
                    const uploadLabel = document.querySelector('.file-upload-label');
                    if (uploadLabel) {
                        uploadLabel.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Take or upload photos</span>';
                        uploadLabel.style.color = '';
                    }
                    
                    // Reset wheel selection visuals
                    document.querySelectorAll('.wheel-box').forEach(box => {
                        box.style.borderColor = '';
                        box.style.backgroundColor = '';
                        if (box.querySelector('i')) {
                            box.querySelector('i').style.color = '';
                        }
                    });
                    
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
                
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Failed to submit service record: ' + error.message);
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Photo upload preview (enhanced with better feedback)
    const photoUpload = document.getElementById('wheelPhotos');
    const photoPreview = document.getElementById('photoPreview');
    
    if (photoUpload && photoPreview) {
        photoUpload.addEventListener('change', function() {
            photoPreview.innerHTML = '';
            
            if (this.files.length > 0) {
                // Show file count
                const fileCount = document.createElement('div');
                fileCount.className = 'photo-count';
                fileCount.innerHTML = `<i class="fas fa-images"></i> ${this.files.length} photo(s) selected`;
                photoPreview.appendChild(fileCount);
                
                // Show first few thumbnails
                const maxThumbnails = 3;
                Array.from(this.files).slice(0, maxThumbnails).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'photo-preview-item';
                            previewItem.innerHTML = `
                                <img src="${e.target.result}" alt="Preview ${index + 1}">
                            `;
                            photoPreview.appendChild(previewItem);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                // Update label
                const label = this.nextElementSibling;
                label.innerHTML = `<i class="fas fa-check-circle"></i><span>${this.files.length} photo(s) selected</span>`;
                label.style.color = 'var(--success-color)';
                
                if (this.files.length > maxThumbnails) {
                    const moreText = document.createElement('div');
                    moreText.className = 'more-photos';
                    moreText.innerHTML = `<i class="fas fa-plus-circle"></i> +${this.files.length - maxThumbnails} more`;
                    photoPreview.appendChild(moreText);
                }
            }
        });
    }
    
    // Add CSS for photo preview enhancements
    const style = document.createElement('style');
    style.textContent = `
        .photo-count {
            background: var(--light-gray);
            padding: 10px;
            border-radius: var(--border-radius);
            margin-bottom: 10px;
            color: var(--dark-color);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .photo-preview-item {
            display: inline-block;
            margin: 0 10px 10px 0;
            width: 100px;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid var(--light-gray);
        }
        .photo-preview-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .more-photos {
            color: var(--gray-color);
            font-size: 14px;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);
});
