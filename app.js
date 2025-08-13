// Form Builder Application
class FormBuilder {
    constructor() {
        this.currentForm = {
            id: null,
            name: '',
            fields: [],
            createdAt: null
        };
        this.currentPage = 'create';
        this.currentFieldId = 0;
        this.draggedField = null;
        this.editingFieldId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRouting();
        this.loadFromStorage();
        this.navigateToPage(window.location.hash.slice(1) || 'create');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const route = e.target.getAttribute('data-route');
                if (route) {
                    window.location.hash = route;
                    this.navigateToPage(route);
                }
            });
        });

        // Field type buttons
        document.querySelectorAll('.field-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const type = e.currentTarget.getAttribute('data-type');
                if (type) {
                    this.addField(type);
                }
            });
        });

        // Form actions
        const clearBtn = document.getElementById('clear-form');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearForm();
            });
        }

        const saveBtn = document.getElementById('save-form');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSaveModal();
            });
        }

        const resetPreviewBtn = document.getElementById('reset-preview');
        if (resetPreviewBtn) {
            resetPreviewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resetPreview();
            });
        }

        const submitPreviewBtn = document.getElementById('submit-preview');
        if (submitPreviewBtn) {
            submitPreviewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.submitPreview();
            });
        }

        // Modal events
        this.setupModalEvents();

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupModalEvents() {
        // Field config modal
        const configModal = document.getElementById('field-config-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelConfig = document.getElementById('cancel-config');
        const saveConfig = document.getElementById('save-config');

        if (closeModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal('field-config-modal');
            });
        }

        if (cancelConfig) {
            cancelConfig.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal('field-config-modal');
            });
        }

        if (saveConfig) {
            saveConfig.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveFieldConfig();
            });
        }

        // Save form modal
        const saveModal = document.getElementById('save-form-modal');
        const closeSaveModal = document.getElementById('close-save-modal');
        const cancelSave = document.getElementById('cancel-save');
        const confirmSave = document.getElementById('confirm-save');

        if (closeSaveModal) {
            closeSaveModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal('save-form-modal');
            });
        }

        if (cancelSave) {
            cancelSave.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal('save-form-modal');
            });
        }

        if (confirmSave) {
            confirmSave.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveForm();
            });
        }

        // Close modals on backdrop click
        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.hideModal(e.target.parentElement.id);
                }
            });
        });

        // Field type change handler
        const derivedTypeSelect = document.getElementById('derived-type');
        if (derivedTypeSelect) {
            derivedTypeSelect.addEventListener('change', () => {
                this.updateDerivedFieldConfig();
            });
        }
    }

    setupDragAndDrop() {
        const formFields = document.getElementById('form-fields');
        
        if (!formFields) return;
        
        formFields.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('field-item')) {
                this.draggedField = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        formFields.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('field-item')) {
                e.target.classList.remove('dragging');
                this.draggedField = null;
            }
        });

        formFields.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(formFields, e.clientY);
            const dragging = document.querySelector('.dragging');
            
            if (dragging) {
                if (afterElement == null) {
                    formFields.appendChild(dragging);
                } else {
                    formFields.insertBefore(dragging, afterElement);
                }
            }
        });

        formFields.addEventListener('drop', (e) => {
            e.preventDefault();
            this.reorderFields();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.field-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupRouting() {
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.slice(1) || 'create';
            this.navigateToPage(route);
        });
    }

    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        
        // Show current page
        const currentPageElement = document.getElementById(`${page}-page`);
        if (currentPageElement) {
            currentPageElement.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === page) {
                link.classList.add('active');
            }
        });

        this.currentPage = page;

        // Load page-specific data
        if (page === 'preview') {
            this.renderPreview();
        } else if (page === 'myforms') {
            this.renderMyForms();
        }
    }

    addField(type) {
        if (type === 'derived') {
            this.showFieldConfigModal(null, type);
        } else {
            const field = {
                id: ++this.currentFieldId,
                type: type,
                label: `${this.getFieldTypeLabel(type)} ${this.currentFieldId}`,
                required: false,
                defaultValue: '',
                validation: {},
                options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : null
            };

            this.currentForm.fields.push(field);
            this.renderFormFields();
            this.showNotification('Field added successfully', 'success');
        }
    }

    getFieldTypeLabel(type) {
        const labels = {
            text: 'Text Input',
            number: 'Number Input',
            textarea: 'Text Area',
            select: 'Select Dropdown',
            radio: 'Radio Buttons',
            checkbox: 'Checkboxes',
            date: 'Date Picker',
            derived: 'Derived Field'
        };
        return labels[type] || 'Field';
    }

    showFieldConfigModal(fieldId, type = null) {
        this.editingFieldId = fieldId;
        const field = fieldId ? this.currentForm.fields.find(f => f.id === fieldId) : null;
        const modal = document.getElementById('field-config-modal');
        
        // Set modal title
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = fieldId ? 'Edit Field' : `Add ${this.getFieldTypeLabel(type)}`;
        }

        // Reset form
        const form = document.getElementById('field-config-form');
        if (form) {
            form.reset();
        }

        // Fill form with existing data
        if (field) {
            const labelField = document.getElementById('field-label');
            const requiredField = document.getElementById('field-required');
            const defaultField = document.getElementById('field-default');
            const optionsField = document.getElementById('field-options');

            if (labelField) labelField.value = field.label || '';
            if (requiredField) requiredField.checked = field.required || false;
            if (defaultField) defaultField.value = field.defaultValue || '';
            
            if (field.options && optionsField) {
                optionsField.value = field.options.join('\n');
            }

            // Set validation rules
            Object.keys(field.validation || {}).forEach(rule => {
                const checkbox = document.querySelector(`[data-rule="${rule}"]`);
                if (checkbox && checkbox.type === 'checkbox') {
                    checkbox.checked = true;
                    const input = checkbox.parentElement.querySelector('.validation-input');
                    if (input && typeof field.validation[rule] === 'number') {
                        input.value = field.validation[rule];
                    }
                }
            });

            // Handle derived fields
            if (field.type === 'derived') {
                const derivedTypeField = document.getElementById('derived-type');
                const formulaField = document.getElementById('field-formula');
                
                if (derivedTypeField) derivedTypeField.value = field.derivedType || 'age';
                if (formulaField) formulaField.value = field.formula || '';
                
                this.updateDerivedFieldConfig();
                this.renderParentFields(field.parentFields || []);
            }
        } else if (type === 'derived') {
            this.updateDerivedFieldConfig();
            this.renderParentFields([]);
        }

        // Show/hide relevant sections
        this.updateConfigModalSections(type || (field ? field.type : null));

        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    updateConfigModalSections(type) {
        const optionsGroup = document.getElementById('options-group');
        const derivedGroup = document.getElementById('derived-config-group');
        const defaultValueGroup = document.getElementById('default-value-group');

        // Hide all optional sections
        if (optionsGroup) optionsGroup.classList.add('hidden');
        if (derivedGroup) derivedGroup.classList.add('hidden');

        // Show relevant sections
        if (type === 'select' || type === 'radio' || type === 'checkbox') {
            if (optionsGroup) optionsGroup.classList.remove('hidden');
        }
        
        if (type === 'derived') {
            if (derivedGroup) derivedGroup.classList.remove('hidden');
            if (defaultValueGroup) defaultValueGroup.classList.add('hidden');
        }
    }

    updateDerivedFieldConfig() {
        const derivedTypeSelect = document.getElementById('derived-type');
        if (!derivedTypeSelect) return;
        
        const derivedType = derivedTypeSelect.value;
        const formulaGroup = document.getElementById('formula-group');
        const parentFieldsGroup = document.getElementById('parent-fields-group');
        
        if (formulaGroup) formulaGroup.classList.remove('hidden');
        if (parentFieldsGroup) parentFieldsGroup.classList.remove('hidden');

        // Update placeholder based on type
        const formulaInput = document.getElementById('field-formula');
        if (formulaInput) {
            const placeholders = {
                age: 'Leave empty for automatic calculation',
                fullName: 'firstName + " " + lastName',
                calculation: 'field1 + field2 * 0.1',
                conditional: 'if(field1 > 100) "High" else "Low"'
            };
            
            formulaInput.placeholder = placeholders[derivedType] || '';
            
            if (derivedType === 'age') {
                formulaInput.value = '';
                formulaInput.disabled = true;
            } else {
                formulaInput.disabled = false;
            }
        }
    }

    renderParentFields(selectedFields = []) {
        const container = document.getElementById('parent-fields-list');
        if (!container) return;
        
        container.innerHTML = '';

        this.currentForm.fields
            .filter(field => field.type !== 'derived')
            .forEach(field => {
                const label = document.createElement('label');
                label.className = 'parent-field-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = field.id;
                checkbox.checked = selectedFields.includes(field.id);
                
                const span = document.createElement('span');
                span.textContent = `${field.label} (${field.type})`;
                
                label.appendChild(checkbox);
                label.appendChild(span);
                container.appendChild(label);
            });
    }

    saveFieldConfig() {
        const form = document.getElementById('field-config-form');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const labelField = document.getElementById('field-label');
        const requiredField = document.getElementById('field-required');
        const defaultField = document.getElementById('field-default');
        const optionsField = document.getElementById('field-options');
        
        const label = labelField ? labelField.value : '';
        const required = requiredField ? requiredField.checked : false;
        const defaultValue = defaultField ? defaultField.value : '';
        const optionsText = optionsField ? optionsField.value : '';
        const options = optionsText ? optionsText.split('\n').filter(opt => opt.trim()) : null;

        // Get validation rules
        const validation = {};
        document.querySelectorAll('.validation-checkbox:checked').forEach(checkbox => {
            const rule = checkbox.getAttribute('data-rule');
            const input = checkbox.parentElement.querySelector('.validation-input');
            validation[rule] = input ? parseInt(input.value) || true : true;
        });

        let field;
        if (this.editingFieldId) {
            // Edit existing field
            field = this.currentForm.fields.find(f => f.id === this.editingFieldId);
            if (field) {
                field.label = label;
                field.required = required;
                field.defaultValue = defaultValue;
                field.validation = validation;
                if (options) field.options = options;
            }
        } else {
            // Create new field
            const derivedGroup = document.getElementById('derived-config-group');
            const type = derivedGroup && !derivedGroup.classList.contains('hidden') ? 'derived' : 'text';
            
            field = {
                id: ++this.currentFieldId,
                type: type,
                label: label,
                required: required,
                defaultValue: defaultValue,
                validation: validation,
                options: options
            };

            // Handle derived fields
            if (type === 'derived') {
                const derivedTypeField = document.getElementById('derived-type');
                const formulaField = document.getElementById('field-formula');
                
                field.derivedType = derivedTypeField ? derivedTypeField.value : 'age';
                field.formula = formulaField ? formulaField.value : '';
                
                const parentCheckboxes = document.querySelectorAll('#parent-fields-list input:checked');
                field.parentFields = Array.from(parentCheckboxes).map(cb => parseInt(cb.value));
            }

            this.currentForm.fields.push(field);
        }

        this.hideModal('field-config-modal');
        this.renderFormFields();
        this.showNotification(
            this.editingFieldId ? 'Field updated successfully' : 'Field added successfully',
            'success'
        );
    }

    editField(fieldId) {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) {
            this.showFieldConfigModal(fieldId);
        }
    }

    deleteField(fieldId) {
        if (confirm('Are you sure you want to delete this field?')) {
            this.currentForm.fields = this.currentForm.fields.filter(f => f.id !== fieldId);
            this.renderFormFields();
            this.showNotification('Field deleted successfully', 'success');
        }
    }

    reorderFields() {
        const fieldElements = document.querySelectorAll('.field-item');
        const newOrder = Array.from(fieldElements).map(el => parseInt(el.getAttribute('data-field-id')));
        
        const reorderedFields = [];
        newOrder.forEach(id => {
            const field = this.currentForm.fields.find(f => f.id === id);
            if (field) reorderedFields.push(field);
        });
        
        this.currentForm.fields = reorderedFields;
    }

    renderFormFields() {
        const container = document.getElementById('form-fields');
        const emptyState = document.getElementById('empty-state');
        
        if (!container || !emptyState) return;
        
        if (this.currentForm.fields.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        container.innerHTML = '';
        
        this.currentForm.fields.forEach(field => {
            const fieldElement = this.createFieldElement(field);
            container.appendChild(fieldElement);
        });
    }

    createFieldElement(field) {
        const div = document.createElement('div');
        div.className = 'field-item';
        div.draggable = true;
        div.setAttribute('data-field-id', field.id);
        
        div.innerHTML = `
            <div class="field-header">
                <div class="field-info">
                    <h4 class="field-label">${field.label}</h4>
                    <p class="field-type">${this.getFieldTypeLabel(field.type)}${field.type === 'derived' ? ` (${field.derivedType})` : ''}</p>
                </div>
                <div class="field-actions">
                    <button class="field-action edit" data-field-id="${field.id}" title="Edit field">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="field-action delete" data-field-id="${field.id}" title="Delete field">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
            <div class="field-preview">
                ${this.renderFieldPreview(field)}
            </div>
            <div class="field-validation-info">
                ${field.required ? '<span class="validation-badge required-badge">Required</span>' : ''}
                ${Object.keys(field.validation || {}).map(rule => 
                    `<span class="validation-badge">${this.getValidationLabel(rule, field.validation[rule])}</span>`
                ).join('')}
            </div>
        `;
        
        // Add event listeners to action buttons
        const editBtn = div.querySelector('.field-action.edit');
        const deleteBtn = div.querySelector('.field-action.delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.editField(field.id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteField(field.id);
            });
        }
        
        return div;
    }

    renderFieldPreview(field) {
        const disabled = 'disabled';
        const required = field.required ? 'required' : '';
        
        switch (field.type) {
            case 'text':
                return `<div class="form-group">
                    <input type="text" class="form-control" placeholder="${field.label}" value="${field.defaultValue}" ${disabled} ${required}>
                </div>`;
            
            case 'number':
                return `<div class="form-group">
                    <input type="number" class="form-control" placeholder="${field.label}" value="${field.defaultValue}" ${disabled} ${required}>
                </div>`;
            
            case 'textarea':
                return `<div class="form-group">
                    <textarea class="form-control" placeholder="${field.label}" ${disabled} ${required}>${field.defaultValue}</textarea>
                </div>`;
            
            case 'select':
                const selectOptions = (field.options || []).map(opt => 
                    `<option value="${opt}" ${opt === field.defaultValue ? 'selected' : ''}>${opt}</option>`
                ).join('');
                return `<div class="form-group">
                    <select class="form-control" ${disabled} ${required}>
                        <option value="">Select ${field.label}</option>
                        ${selectOptions}
                    </select>
                </div>`;
            
            case 'radio':
                const radioOptions = (field.options || []).map((opt, idx) => `
                    <label class="validation-rule">
                        <input type="radio" name="preview_${field.id}" value="${opt}" ${opt === field.defaultValue ? 'checked' : ''} ${disabled}>
                        ${opt}
                    </label>
                `).join('');
                return `<div class="form-group">
                    <div class="validation-rules">${radioOptions}</div>
                </div>`;
            
            case 'checkbox':
                const defaultValues = field.defaultValue ? field.defaultValue.split(',') : [];
                const checkboxOptions = (field.options || []).map(opt => `
                    <label class="validation-rule">
                        <input type="checkbox" value="${opt}" ${defaultValues.includes(opt) ? 'checked' : ''} ${disabled}>
                        ${opt}
                    </label>
                `).join('');
                return `<div class="form-group">
                    <div class="validation-rules">${checkboxOptions}</div>
                </div>`;
            
            case 'date':
                return `<div class="form-group">
                    <input type="date" class="form-control" value="${field.defaultValue}" ${disabled} ${required}>
                </div>`;
            
            case 'derived':
                return `<div class="form-group">
                    <input type="text" class="form-control" placeholder="Calculated value will appear here" ${disabled} readonly>
                    <small class="field-error">Depends on: ${this.getDependencyLabels(field.parentFields)}</small>
                </div>`;
            
            default:
                return '<div class="form-group">Unknown field type</div>';
        }
    }

    getDependencyLabels(parentFieldIds) {
        if (!parentFieldIds || parentFieldIds.length === 0) return 'No dependencies';
        
        return parentFieldIds
            .map(id => {
                const field = this.currentForm.fields.find(f => f.id === id);
                return field ? field.label : `Field ${id}`;
            })
            .join(', ');
    }

    getValidationLabel(rule, value) {
        const labels = {
            minLength: `Min ${value} chars`,
            maxLength: `Max ${value} chars`,
            email: 'Email format',
            password: 'Password rules'
        };
        return labels[rule] || rule;
    }

    clearForm() {
        if (this.currentForm.fields.length === 0 || confirm('Are you sure you want to clear all fields?')) {
            this.currentForm = {
                id: null,
                name: '',
                fields: [],
                createdAt: null
            };
            this.currentFieldId = 0;
            this.renderFormFields();
            this.showNotification('Form cleared successfully', 'info');
        }
    }

    showSaveModal() {
        if (this.currentForm.fields.length === 0) {
            this.showNotification('Please add at least one field before saving', 'warning');
            return;
        }
        
        const formNameField = document.getElementById('form-name');
        if (formNameField) {
            formNameField.value = this.currentForm.name || '';
        }
        
        const modal = document.getElementById('save-form-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    saveForm() {
        const formNameField = document.getElementById('form-name');
        const name = formNameField ? formNameField.value.trim() : '';
        
        if (!name) {
            this.showNotification('Please enter a form name', 'error');
            return;
        }

        this.currentForm.name = name;
        this.currentForm.id = this.currentForm.id || Date.now().toString();
        this.currentForm.createdAt = this.currentForm.createdAt || new Date().toISOString();

        this.saveToStorage();
        this.hideModal('save-form-modal');
        this.showNotification('Form saved successfully', 'success');
    }

    renderPreview() {
        const container = document.getElementById('preview-form');
        const emptyPreview = document.getElementById('empty-preview');
        
        if (!container || !emptyPreview) return;
        
        if (this.currentForm.fields.length === 0) {
            container.innerHTML = '';
            emptyPreview.classList.remove('hidden');
            return;
        }
        
        emptyPreview.classList.add('hidden');
        
        const form = document.createElement('form');
        form.id = 'preview-form-element';
        form.innerHTML = `
            <h3>${this.currentForm.name || 'Untitled Form'}</h3>
            ${this.currentForm.fields.map(field => this.renderPreviewField(field)).join('')}
        `;
        
        container.innerHTML = '';
        container.appendChild(form);
        
        // Set up real-time validation and derived field updates
        this.setupPreviewInteractivity();
    }

    renderPreviewField(field) {
        const required = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span style="color: var(--color-error);">*</span>' : '';
        
        let fieldHtml = '';
        
        switch (field.type) {
            case 'text':
                fieldHtml = `
                    <input type="text" id="field_${field.id}" name="field_${field.id}" 
                           class="form-control" value="${field.defaultValue || ''}" ${required}
                           data-validation='${JSON.stringify(field.validation || {})}'>`;
                break;
            
            case 'number':
                fieldHtml = `
                    <input type="number" id="field_${field.id}" name="field_${field.id}" 
                           class="form-control" value="${field.defaultValue || ''}" ${required}
                           data-validation='${JSON.stringify(field.validation || {})}'>`;
                break;
            
            case 'textarea':
                fieldHtml = `
                    <textarea id="field_${field.id}" name="field_${field.id}" 
                              class="form-control" ${required} rows="4"
                              data-validation='${JSON.stringify(field.validation || {})}'>${field.defaultValue || ''}</textarea>`;
                break;
            
            case 'select':
                const selectOptions = (field.options || []).map(opt => 
                    `<option value="${opt}" ${opt === field.defaultValue ? 'selected' : ''}>${opt}</option>`
                ).join('');
                fieldHtml = `
                    <select id="field_${field.id}" name="field_${field.id}" 
                            class="form-control" ${required}>
                        <option value="">Select an option</option>
                        ${selectOptions}
                    </select>`;
                break;
            
            case 'radio':
                const radioOptions = (field.options || []).map((opt, idx) => `
                    <label class="validation-rule">
                        <input type="radio" name="field_${field.id}" value="${opt}" 
                               ${opt === field.defaultValue ? 'checked' : ''}>
                        ${opt}
                    </label>
                `).join('');
                fieldHtml = `<div class="validation-rules">${radioOptions}</div>`;
                break;
            
            case 'checkbox':
                const defaultValues = field.defaultValue ? field.defaultValue.split(',').map(v => v.trim()) : [];
                const checkboxOptions = (field.options || []).map(opt => `
                    <label class="validation-rule">
                        <input type="checkbox" name="field_${field.id}" value="${opt}" 
                               ${defaultValues.includes(opt) ? 'checked' : ''}>
                        ${opt}
                    </label>
                `).join('');
                fieldHtml = `<div class="validation-rules">${checkboxOptions}</div>`;
                break;
            
            case 'date':
                fieldHtml = `
                    <input type="date" id="field_${field.id}" name="field_${field.id}" 
                           class="form-control" value="${field.defaultValue || ''}" ${required}>`;
                break;
            
            case 'derived':
                fieldHtml = `
                    <input type="text" id="field_${field.id}" name="field_${field.id}" 
                           class="form-control" readonly placeholder="Calculated value">`;
                break;
        }
        
        return `
            <div class="form-group">
                <label class="form-label" for="field_${field.id}">${field.label} ${requiredMark}</label>
                ${fieldHtml}
                <span class="field-error" id="error_${field.id}"></span>
            </div>
        `;
    }

    setupPreviewInteractivity() {
        // Add event listeners to form fields for validation and derived field updates
        this.currentForm.fields.forEach(field => {
            const element = document.getElementById(`field_${field.id}`);
            if (element && field.type !== 'derived') {
                const eventType = field.type === 'select' || field.type === 'date' ? 'change' : 'input';
                element.addEventListener(eventType, () => {
                    this.validateField(field.id);
                    this.updateDerivedFields();
                });
                
                if (field.type === 'radio' || field.type === 'checkbox') {
                    const inputs = document.querySelectorAll(`input[name="field_${field.id}"]`);
                    inputs.forEach(input => {
                        input.addEventListener('change', () => {
                            this.validateField(field.id);
                            this.updateDerivedFields();
                        });
                    });
                }
            }
        });
        
        // Initial calculation of derived fields
        this.updateDerivedFields();
    }

    validateField(fieldId) {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (!field) return true;

        const element = document.getElementById(`field_${fieldId}`);
        const errorElement = document.getElementById(`error_${fieldId}`);
        
        if (!element || !errorElement) return true;

        let value = '';
        if (field.type === 'checkbox') {
            const checkboxes = document.querySelectorAll(`input[name="field_${fieldId}"]:checked`);
            value = Array.from(checkboxes).map(cb => cb.value).join(', ');
        } else if (field.type === 'radio') {
            const radio = document.querySelector(`input[name="field_${fieldId}"]:checked`);
            value = radio ? radio.value : '';
        } else {
            value = element.value || '';
        }

        const errors = [];

        // Required validation
        if (field.required && !value.trim()) {
            errors.push('This field is required');
        }

        // Other validations
        if (value.trim() && field.validation) {
            const validation = field.validation;

            if (validation.minLength && value.length < validation.minLength) {
                errors.push(`Minimum ${validation.minLength} characters required`);
            }

            if (validation.maxLength && value.length > validation.maxLength) {
                errors.push(`Maximum ${validation.maxLength} characters allowed`);
            }

            if (validation.email && !this.isValidEmail(value)) {
                errors.push('Please enter a valid email address');
            }

            if (validation.password && !this.isValidPassword(value)) {
                errors.push('Password must be at least 8 characters and contain a number');
            }
        }

        // Update UI
        if (errors.length > 0) {
            element.classList.add('error');
            errorElement.textContent = errors[0];
            errorElement.style.display = 'block';
            return false;
        } else {
            element.classList.remove('error');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            return true;
        }
    }

    updateDerivedFields() {
        this.currentForm.fields
            .filter(field => field.type === 'derived')
            .forEach(field => {
                const element = document.getElementById(`field_${field.id}`);
                if (!element) return;

                const value = this.calculateDerivedValue(field);
                element.value = value;
            });
    }

    calculateDerivedValue(field) {
        if (!field.parentFields || field.parentFields.length === 0) {
            return '';
        }

        const parentValues = {};
        let allParentsHaveValues = true;

        field.parentFields.forEach(parentId => {
            const parentField = this.currentForm.fields.find(f => f.id === parentId);
            if (!parentField) return;

            const element = document.getElementById(`field_${parentId}`);
            if (!element) {
                allParentsHaveValues = false;
                return;
            }

            let value = '';
            if (parentField.type === 'checkbox') {
                const checkboxes = document.querySelectorAll(`input[name="field_${parentId}"]:checked`);
                value = Array.from(checkboxes).map(cb => cb.value).join(', ');
            } else if (parentField.type === 'radio') {
                const radio = document.querySelector(`input[name="field_${parentId}"]:checked`);
                value = radio ? radio.value : '';
            } else {
                value = element.value || '';
            }

            if (!value.trim()) {
                allParentsHaveValues = false;
            }

            parentValues[`field${parentId}`] = value;
            parentValues[parentField.label.replace(/\s+/g, '')] = value;
        });

        if (!allParentsHaveValues) {
            return '';
        }

        try {
            switch (field.derivedType) {
                case 'age':
                    // Find date field in parents
                    const dateField = field.parentFields.find(parentId => {
                        const parentField = this.currentForm.fields.find(f => f.id === parentId);
                        return parentField && parentField.type === 'date';
                    });
                    
                    if (dateField) {
                        const birthDate = parentValues[`field${dateField}`];
                        if (birthDate) {
                            const age = this.calculateAge(new Date(birthDate));
                            return age.toString();
                        }
                    }
                    return '';

                case 'fullName':
                    // Concatenate all parent field values
                    return Object.values(parentValues).filter(v => v).join(' ');

                case 'calculation':
                    return this.evaluateFormula(field.formula, parentValues);

                case 'conditional':
                    return this.evaluateConditional(field.formula, parentValues);

                default:
                    return '';
            }
        } catch (error) {
            console.error('Error calculating derived value:', error);
            return 'Error';
        }
    }

    calculateAge(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    evaluateFormula(formula, values) {
        if (!formula) return '';
        
        let expression = formula;
        
        // Replace field references with values
        Object.keys(values).forEach(key => {
            const value = parseFloat(values[key]) || 0;
            expression = expression.replace(new RegExp(key, 'g'), value.toString());
        });
        
        // Basic safety check - only allow numbers, operators, and parentheses
        if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
            return 'Invalid formula';
        }
        
        try {
            // Use Function constructor for safe evaluation
            const result = Function('"use strict"; return (' + expression + ')')();
            return isNaN(result) ? 'Invalid' : result.toString();
        } catch (error) {
            return 'Error';
        }
    }

    evaluateConditional(formula, values) {
        if (!formula) return '';
        
        // Simple conditional logic: if(condition) "value1" else "value2"
        const conditionMatch = formula.match(/if\s*\(\s*(.+?)\s*\)\s*"([^"]*?)"\s*else\s*"([^"]*?)"/i);
        
        if (!conditionMatch) return 'Invalid condition';
        
        const [, condition, trueValue, falseValue] = conditionMatch;
        
        try {
            let conditionExpression = condition;
            
            // Replace field references
            Object.keys(values).forEach(key => {
                const value = isNaN(values[key]) ? `"${values[key]}"` : values[key];
                conditionExpression = conditionExpression.replace(new RegExp(key, 'g'), value.toString());
            });
            
            const result = Function('"use strict"; return (' + conditionExpression + ')')();
            return result ? trueValue : falseValue;
        } catch (error) {
            return 'Error';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password) {
        return password.length >= 8 && /\d/.test(password);
    }

    resetPreview() {
        const form = document.getElementById('preview-form-element');
        if (form) {
            form.reset();
            // Clear all error messages
            document.querySelectorAll('.field-error').forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
            // Remove error classes
            document.querySelectorAll('.form-control.error').forEach(field => {
                field.classList.remove('error');
            });
            // Update derived fields
            this.updateDerivedFields();
        }
    }

    submitPreview() {
        const form = document.getElementById('preview-form-element');
        if (!form) return;

        let isValid = true;
        const formData = {};

        // Validate all fields
        this.currentForm.fields.forEach(field => {
            const fieldValid = this.validateField(field.id);
            if (!fieldValid) isValid = false;

            // Collect form data
            const element = document.getElementById(`field_${field.id}`);
            if (element) {
                if (field.type === 'checkbox') {
                    const checkboxes = document.querySelectorAll(`input[name="field_${field.id}"]:checked`);
                    formData[field.label] = Array.from(checkboxes).map(cb => cb.value);
                } else if (field.type === 'radio') {
                    const radio = document.querySelector(`input[name="field_${field.id}"]:checked`);
                    formData[field.label] = radio ? radio.value : '';
                } else {
                    formData[field.label] = element.value;
                }
            }
        });

        if (isValid) {
            this.showNotification('Form submitted successfully!', 'success');
            console.log('Form Data:', formData);
            
            // Show summary
            const summary = Object.entries(formData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
            
            alert(`Form Submitted Successfully!\n\n${summary}`);
        } else {
            this.showNotification('Please fix all validation errors before submitting', 'error');
        }
    }

    renderMyForms() {
        const container = document.getElementById('forms-list');
        const emptyState = document.getElementById('empty-forms');
        
        if (!container || !emptyState) return;
        
        const savedForms = this.getSavedForms();
        
        if (savedForms.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        container.innerHTML = savedForms.map(form => `
            <div class="form-card" data-form-id="${form.id}">
                <div class="form-card__header">
                    <h3 class="form-card__title">${form.name}</h3>
                    <button class="form-card__menu" data-form-id="${form.id}">
                        <span class="material-icons">more_vert</span>
                    </button>
                </div>
                <div class="form-card__info">
                    Created: ${new Date(form.createdAt).toLocaleDateString()}
                </div>
                <div class="form-card__fields">
                    ${form.fields.length} field${form.fields.length !== 1 ? 's' : ''}
                </div>
            </div>
        `).join('');
        
        // Add event listeners to form cards
        container.querySelectorAll('.form-card').forEach(card => {
            const formId = card.getAttribute('data-form-id');
            
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on menu button
                if (!e.target.closest('.form-card__menu')) {
                    this.loadForm(formId);
                }
            });
            
            const menuBtn = card.querySelector('.form-card__menu');
            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showFormMenu(e, formId);
                });
            }
        });
    }

    loadForm(formId) {
        const savedForms = this.getSavedForms();
        const form = savedForms.find(f => f.id === formId);
        
        if (form) {
            this.currentForm = { ...form };
            this.currentFieldId = Math.max(...form.fields.map(f => f.id), 0);
            this.navigateToPage('preview');
            window.location.hash = 'preview';
        }
    }

    showFormMenu(event, formId) {
        // Simple context menu - in a real app, you'd create a proper context menu
        if (confirm('Delete this form?')) {
            this.deleteForm(formId);
        }
    }

    deleteForm(formId) {
        let savedForms = this.getSavedForms();
        savedForms = savedForms.filter(f => f.id !== formId);
        localStorage.setItem('formBuilder_forms', JSON.stringify(savedForms));
        this.renderMyForms();
        this.showNotification('Form deleted successfully', 'success');
    }

    saveToStorage() {
        const savedForms = this.getSavedForms();
        const existingIndex = savedForms.findIndex(f => f.id === this.currentForm.id);
        
        if (existingIndex >= 0) {
            savedForms[existingIndex] = { ...this.currentForm };
        } else {
            savedForms.push({ ...this.currentForm });
        }
        
        localStorage.setItem('formBuilder_forms', JSON.stringify(savedForms));
    }

    loadFromStorage() {
        // Load any existing form from localStorage if needed
        // For now, we start with a clean form
    }

    getSavedForms() {
        try {
            const forms = localStorage.getItem('formBuilder_forms');
            return forms ? JSON.parse(forms) : [];
        } catch (error) {
            console.error('Error loading saved forms:', error);
            return [];
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        
        const icon = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        }[type] || 'info';
        
        notification.innerHTML = `
            <span class="material-icons notification__icon">${icon}</span>
            <span class="notification__message">${message}</span>
            <button class="notification__close">
                <span class="material-icons">close</span>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Close button
        const closeBtn = notification.querySelector('.notification__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }
}

// Initialize the application
let formBuilder;
document.addEventListener('DOMContentLoaded', () => {
    formBuilder = new FormBuilder();
});