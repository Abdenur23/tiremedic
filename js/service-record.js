// Service Record API Handler
class ServiceRecordAPI {
    constructor() {
        // Replace with your actual API Gateway endpoint
        this.API_ENDPOINT = 'https://qick4b9ex5.execute-api.us-east-1.amazonaws.com/prod/prod';
        this.API_KEY = 'your-api-key'; // Store securely in production
    }

    async saveRecord(formData) {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Save failed:', error);
            throw error;
        }
    }

    prepareFormData(formElement) {
        const formData = {
            serviceDetails: {},
            wheelInspection: {},
            agreement: {},
            metadata: {
                submittedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenSize: `${window.screen.width}x${window.screen.height}`
            }
        };

        // Collect all form fields
        const formFields = new FormData(formElement);
        
        // Process each field
        for (let [key, value] of formFields.entries()) {
            if (key === 'wheels') {
                if (!formData.wheelInspection.wheels) formData.wheelInspection.wheels = [];
                formData.wheelInspection.wheels.push(value);
            } else if (key === 'condition') {
                if (!formData.wheelInspection.conditions) formData.wheelInspection.conditions = [];
                formData.wheelInspection.conditions.push(value);
            } else if (key.startsWith('customer')) {
                formData.agreement[key] = value;
            } else if (key === 'wheelNotes') {
                formData.wheelInspection.notes = value;
            } else {
                formData.serviceDetails[key] = value;
            }
        }

        // Add auto date
        formData.serviceDetails.date = document.getElementById('autoDate').textContent;

        return formData;
    }
}

// Form Handler
class ServiceRecordForm {
    constructor() {
        this.api = new ServiceRecordAPI();
        this.init();
    }

    init() {
        this.setupAutoDate();
        this.setupUppercaseInputs();
        this.setupWheelSelection();
        this.bindEvents();
    }

    setupAutoDate() {
        const dateElement = document.getElementById('autoDate');
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    setupUppercaseInputs() {
        const inputs = document.querySelectorAll('.uppercase-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        });
    }

    setupWheelSelection() {
        const wheelOptions = document.querySelectorAll('.wheel-option');
        wheelOptions.forEach(option => {
            option.addEventListener('click', () => {
                const checkbox = option.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                
                // Visual feedback
                const wheelBox = option.querySelector('.wheel-box');
                if (checkbox.checked) {
                    wheelBox.style.borderColor = 'var(--emergency-red)';
                    wheelBox.style.backgroundColor = 'var(--emergency-light)';
                } else {
                    wheelBox.style.borderColor = '';
                    wheelBox.style.backgroundColor = '';
                }
            });
        });
    }

    bindEvents() {
        const form = document.getElementById('serviceRecordForm');
        const printBtn = document.getElementById('printForm');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => this.handlePrint());
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Show loading
            const submitBtn = document.querySelector('.btn-record-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            // Prepare and send data
            const formData = this.api.prepareFormData(e.target);
            const response = await this.api.saveRecord(formData);

            // Success
            this.showMessage('Service record saved successfully!', 'success');
            this.resetForm();
            
            // Generate receipt/confirmation
            this.generateConfirmation(response);

        } catch (error) {
            this.showMessage('Failed to save. Please try again.', 'error');
            console.error('Submission error:', error);
        } finally {
            // Reset button
            const submitBtn = document.querySelector('.btn-record-submit');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check-double"></i> Complete Service Record';
                submitBtn.disabled = false;
            }
        }
    }

    validateForm() {
        let isValid = true;
        
        // Check required fields
        const requiredFields = document.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--emergency-red)';
            } else {
                field.style.borderColor = '';
            }
        });

        // Check at least one wheel selected
        const wheelsChecked = document.querySelectorAll('input[name="wheels"]:checked');
        if (wheelsChecked.length === 0) {
            isValid = false;
            document.querySelector('.wheel-selection').style.border = '2px solid var(--emergency-red)';
        } else {
            document.querySelector('.wheel-selection').style.border = '';
        }

        return isValid;
    }

    showMessage(message, type) {
        // Remove existing messages
        const existing = document.querySelector('.form-message');
        if (existing) existing.remove();

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `form-message form-message-${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        const formActions = document.querySelector('.form-actions');
        formActions.parentNode.insertBefore(messageEl, formActions);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.opacity = '0';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    resetForm() {
        const form = document.getElementById('serviceRecordForm');
        form.reset();
        
        // Reset wheel visuals
        document.querySelectorAll('.wheel-box').forEach(box => {
            box.style.borderColor = '';
            box.style.backgroundColor = '';
        });

        // Reset photos preview
        const preview = document.getElementById('photoPreview');
        if (preview) preview.innerHTML = '';
    }

    handlePrint() {
        window.print();
    }

    generateConfirmation(response) {
        // Create a simple confirmation modal
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <i class="fas fa-check-circle"></i>
                <h3>Record Saved</h3>
                <p>Service record has been submitted.</p>
                <div class="modal-actions">
                    <button onclick="window.print()" class="btn btn-primary">
                        <i class="fas fa-print"></i> Print Copy
                    </button>
                    <button onclick="this.closest('.confirmation-modal').remove()" class="btn btn-outline">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add modal styles
        if (!document.querySelector('#modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.textContent = `
                .confirmation-modal {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: var(--border-radius);
                    text-align: center;
                    max-width: 400px;
                }
                .modal-content i {
                    font-size: 3rem;
                    color: var(--success-color);
                    margin-bottom: 1rem;
                }
                .modal-actions {
                    margin-top: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }
                .form-message {
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .form-message-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .form-message-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            `;
            document.head.appendChild(styles);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('serviceRecordForm')) {
        window.serviceRecordForm = new ServiceRecordForm();
    }
});
