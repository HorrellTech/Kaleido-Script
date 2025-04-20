/**
 * Visual Composer for KaleidoScript
 * Allows creating visualizations without writing code
 */

class VisualComposer {
    constructor() {
        this.selectedVisualizers = [];
        this.visualizerConfigs = {};
        this.visualizerColors = {}; // Add new property to store colors
        this.categories = [];
        this.activeCategory = 'all';
        
        // Extract visualizer functions from the keywords
        this.visualizers = this.extractVisualizerFunctions();
        
        // Create the UI overlay
        this.createOverlayUI();
    }
    
    extractVisualizerFunctions() {
        if (!window.keywordInfo) {
            console.error('Keywords not loaded yet');
            return [];
        }
        
        const visualizers = [];
        // Get all visualizer functions from keywordInfo
        for (const [key, info] of Object.entries(window.keywordInfo)) {
            if (info.category === 'visualizer') {
                // Parse the parameters from the function signature
                const params = this.extractParameters(info);
                
                visualizers.push({
                    name: key,
                    title: this.formatTitle(key),
                    description: info.description || '',
                    example: info.example || '',
                    params: params,
                    category: 'visualizer'
                });
            }
        }
        
        return visualizers;
    }
    
    extractParameters(info) {
        const signature = info.name || '';
        const example = info.example || '';
        
        try {
            // Extract parameters from the function signature
            const paramStr = signature.match(/\(([^)]*)\)/);
            if (paramStr && paramStr[1]) {
                const params = paramStr[1].split(',').map(param => {
                    // Parse parameter and default value
                    const [name, defaultVal] = param.trim().split('=').map(p => p.trim());
                    
                    // Determine type based on default value or name
                    let type = 'number';
                    if (defaultVal) {
                        if (defaultVal === 'true' || defaultVal === 'false') {
                            type = 'boolean';
                        } else if (defaultVal.startsWith('"') || defaultVal.startsWith("'")) {
                            type = 'string';
                        }
                    } else if (name.includes('color') || name.includes('Color')) {
                        type = 'color';
                    } else if (name.includes('glow')) {
                        type = 'boolean';
                    }
                    
                    // Special handling for known parameter types
                    if (name === 'x' || name === 'y' || name.includes('radius')) {
                        type = 'position';
                    }
                    
                    // Make a human-readable label
                    const label = name.replace(/([A-Z])/g, ' $1')
                                     .replace(/^./, str => str.toUpperCase());
                    
                    return {
                        name,
                        label,
                        type,
                        defaultValue: defaultVal ? eval(defaultVal) : null
                    };
                });
                
                // Extract example values if available
                if (example) {
                    try {
                        // Match the function call in the example
                        const functionCall = example.match(new RegExp(`${info.name.split('(')[0]}\\(([^)]+)\\)`));
                        if (functionCall && functionCall[1]) {
                            const exampleParams = functionCall[1].split(',').map(p => p.trim());
                            
                            // Associate example values with params
                            params.forEach((param, index) => {
                                if (index < exampleParams.length) {
                                    let exampleValue = exampleParams[index];
                                    
                                    // Clean up the example value
                                    if (exampleValue.endsWith(';')) {
                                        exampleValue = exampleValue.slice(0, -1);
                                    }
                                    
                                    // Store example value
                                    param.exampleValue = exampleValue;
                                }
                            });
                        }
                    } catch (exampleError) {
                        console.error('Error parsing example for', info.name, exampleError);
                    }
                }
                
                return params;
            }
        } catch (e) {
            console.error('Error parsing parameters for', info.name, e);
        }
        
        return [];
    }
    
    formatTitle(name) {
        // Convert camelCase to Title Case with spaces
        return name
            .replace(/visual/i, '')  // Remove 'visual' prefix
            .replace(/([A-Z])/g, ' $1')  // Add spaces before capital letters
            .replace(/^./, str => str.toUpperCase())  // Capitalize first letter
            .trim();
    }
    
    createOverlayUI() {
        // Create the overlay element if it doesn't exist
        let overlay = document.getElementById('visual-composer-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'visual-composer-overlay';
            overlay.className = 'composer-overlay';
            
            // Create the container
            overlay.innerHTML = `
                <div class="composer-container">
                    <div class="composer-header">
                        <h2>Visual Composer</h2>
                        <button class="composer-close" id="close-composer">×</button>
                    </div>
                    
                    <div class="composer-categories">
                        <button class="composer-category-button active" data-category="all">All Visualizers</button>
                        <button class="composer-category-button" data-category="basic">Basic</button>
                        <button class="composer-category-button" data-category="advanced">Advanced</button>
                        <button class="composer-category-button" data-category="3d">3D</button>
                    </div>
                    
                    <div class="composer-visualizers" id="composer-visualizers-container">
                        <!-- Visualizers will be added here -->
                    </div>
                    
                    <div class="composer-footer">
                        <div class="composer-help">
                            Select visualizers and configure settings, then generate code
                        </div>
                        <div class="composer-button-group">
                            <button id="reset-composer" class="composer-action-btn secondary">Reset</button>
                            <button id="generate-code" class="composer-action-btn primary">Generate Code</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Add event listeners
            document.getElementById('close-composer').addEventListener('click', () => this.closeComposer());
            document.getElementById('generate-code').addEventListener('click', () => this.generateCode());
            document.getElementById('reset-composer').addEventListener('click', () => this.resetComposer());
            
            // Category buttons
            const categoryButtons = document.querySelectorAll('.composer-category-button');
            categoryButtons.forEach(button => {
                button.addEventListener('click', () => {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    this.activeCategory = button.dataset.category;
                    this.filterVisualizers();
                });
            });
        }
        
        // Store reference to the overlay
        this.overlay = overlay;
        
        // Populate the visualizers
        this.populateVisualizers();
    }
    
    populateVisualizers() {
        const container = document.getElementById('composer-visualizers-container');
        if (!container) return;
        
        // Important: Change grid to flex column for drag-and-drop to work properly
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '15px';
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each visualizer as a collapsible item
        this.visualizers.forEach((visualizer, index) => {
            // Check if this visualizer is already selected
            const isSelected = this.selectedVisualizers.includes(visualizer.name);
            
            const item = document.createElement('div');
            item.className = 'visualizer-item';
            item.dataset.name = visualizer.name;
            
            // Add drag handle and selection indicator
            const colorId = `${visualizer.name}-color`;
            const defaultColor = this.visualizerColors[visualizer.name] || '#ffffff';
            
            item.innerHTML = `
                <div class="visualizer-header">
                    <div class="visualizer-drag-handle" title="Drag to reorder">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path fill="#888" d="M4 4h2v2H4V4zm0 6h2v2H4v-2zm0-3h2v2H4V7zm6 3h2v2h-2v-2zm0-3h2v2h-2V7zm0-3h2v2h-2V4z"></path>
                        </svg>
                    </div>
                    <div class="visualizer-header-content">
                        <input type="checkbox" class="visualizer-checkbox" 
                               id="viz-${index}" ${isSelected ? 'checked' : ''}>
                        <span class="visualizer-title">${visualizer.title}</span>
                    </div>
                    <div class="visualizer-color-picker">
                        <input type="color" id="${colorId}" class="visualizer-color" 
                               value="${defaultColor}" title="Set visualizer color">
                    </div>
                    <button class="visualizer-toggle" title="Toggle settings">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="visualizer-config">
                    <div class="config-description">
                        ${visualizer.description}
                    </div>
                    <div class="config-fields">
                        ${this.generateConfigFields(visualizer)}
                    </div>
                    <div class="config-preview">
                        <code>${this.generatePreviewCode(visualizer)}</code>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
            
            // Make the item draggable
            item.setAttribute('draggable', 'true');
            
            // Add event listeners
            const checkbox = item.querySelector('.visualizer-checkbox');
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                console.log(`Checkbox for ${visualizer.name} changed to: ${isChecked}`);
                
                // Update selection and preview
                this.toggleVisualizerSelection(visualizer.name, isChecked);
                this.updatePreview(item, visualizer);
                
                // Update the item's appearance based on selection
                item.classList.toggle('selected', isChecked);
                
                console.log(`Current selections (${this.selectedVisualizers.length}): ${this.selectedVisualizers.join(', ')}`);
            });
            
            // Set initial selected state
            item.classList.toggle('selected', isSelected);
            
            // Add color picker event listener
            const colorPicker = item.querySelector('.visualizer-color');
            colorPicker.addEventListener('change', (e) => {
                this.visualizerColors[visualizer.name] = e.target.value;
                this.updatePreview(item, visualizer);
            });
            
            const toggle = item.querySelector('.visualizer-toggle');
            toggle.addEventListener('click', () => {
                const config = item.querySelector('.visualizer-config');
                config.classList.toggle('open');
                toggle.classList.toggle('open');
            });
            
            // Add event listeners to config inputs for live preview updates
            const inputs = item.querySelectorAll('input:not(.visualizer-color), select');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    this.updateConfig(visualizer.name);
                    this.updatePreview(item, visualizer);
                });
                
                input.addEventListener('input', () => {
                    this.updateConfig(visualizer.name);
                    this.updatePreview(item, visualizer);
                });
            });
            
            // Initialize config for this visualizer if already selected
            if (isSelected) {
                this.updateConfig(visualizer.name);
            }
            
            // Manually set the selection state
            if (checkbox.checked && !this.selectedVisualizers.includes(visualizer.name)) {
                this.selectedVisualizers.push(visualizer.name);
            }
            
            // Drag and Drop functionality
            this.addDragAndDropListeners(item);
        });
        
        // Add touch-friendly drag and drop support for mobile
        this.setupMobileDragAndDrop(container);
        
        // After populating the visualizers, attach custom select listeners
        this.attachCustomSelectListeners();
        console.log(`After population, selected visualizers: ${this.selectedVisualizers.join(', ')}`);
    }

    addDragAndDropListeners(element) {
        // Drag start - store the element being dragged
        element.addEventListener('dragstart', (e) => {
            // Add a class to style the dragged element
            element.classList.add('dragging');
            
            // Store the dragged element's name in the dataTransfer
            e.dataTransfer.setData('text/plain', element.dataset.name);
            
            // Set a custom drag image (optional)
            const dragImage = document.createElement('div');
            dragImage.textContent = element.querySelector('.visualizer-title').textContent;
            dragImage.className = 'drag-ghost';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            
            // Clean up the drag image after a delay
            setTimeout(() => document.body.removeChild(dragImage), 0);
        });
        
        // Drag end - remove styling
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            this.updateVisualizerOrder();
        });
        
        // Allow dropping
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging && dragging !== element) {
                // Determine drop position (before or after)
                const rect = element.getBoundingClientRect();
                const mouseY = e.clientY;
                const threshold = rect.top + rect.height / 2;
                
                if (mouseY < threshold) {
                    // Drop before
                    element.classList.add('drop-before');
                    element.classList.remove('drop-after');
                } else {
                    // Drop after
                    element.classList.add('drop-after');
                    element.classList.remove('drop-before');
                }
            }
        });
        
        // Handle drop
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drop-before', 'drop-after');
            
            const draggedName = e.dataTransfer.getData('text/plain');
            const dragging = document.querySelector(`[data-name="${draggedName}"]`);
            
            if (dragging && dragging !== element) {
                const container = document.getElementById('composer-visualizers-container');
                const rect = element.getBoundingClientRect();
                const mouseY = e.clientY;
                const threshold = rect.top + rect.height / 2;
                
                if (mouseY < threshold) {
                    // Insert before
                    container.insertBefore(dragging, element);
                } else {
                    // Insert after
                    const nextSibling = element.nextElementSibling;
                    if (nextSibling) {
                        container.insertBefore(dragging, nextSibling);
                    } else {
                        container.appendChild(dragging);
                    }
                }
                
                this.updateVisualizerOrder();
            }
        });
        
        // Clear drop markers when leaving
        element.addEventListener('dragleave', () => {
            element.classList.remove('drop-before', 'drop-after');
        });
        
        // Make sure the drag handle is the only part that initiates drag
        const dragHandle = element.querySelector('.visualizer-drag-handle');
        if (dragHandle) {
            // Prevent other parts of the item from initiating drag
            element.addEventListener('mousedown', (e) => {
                if (e.target !== dragHandle && !dragHandle.contains(e.target)) {
                    e.stopPropagation();
                }
            });
            
            // Make only the drag handle initiate dragging
            dragHandle.addEventListener('mousedown', () => {
                element.setAttribute('draggable', 'true');
            });
            
            element.addEventListener('mouseup', () => {
                element.setAttribute('draggable', 'false');
            });
        }
    }

    // Mobile touch-based drag and drop
    setupMobileDragAndDrop(container) {
        let touchDragging = null;
        let touchDragStart = null;
        let placeholder = null;
        
        // Create the touch event handlers
        document.addEventListener('touchstart', (e) => {
            // Find if we're touching a drag handle
            let target = e.target;
            const dragHandle = target.closest('.visualizer-drag-handle');
            
            if (dragHandle) {
                const visualizerItem = dragHandle.closest('.visualizer-item');
                if (visualizerItem) {
                    e.preventDefault(); // Prevent scrolling while dragging
                    touchDragging = visualizerItem;
                    
                    // Create a semi-transparent clone as placeholder
                    placeholder = visualizerItem.cloneNode(true);
                    placeholder.style.opacity = '0.5';
                    placeholder.style.position = 'absolute';
                    placeholder.style.zIndex = '1000';
                    placeholder.style.width = `${visualizerItem.offsetWidth}px`;
                    placeholder.style.pointerEvents = 'none';
                    
                    // Store initial touch position
                    touchDragStart = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    };
                    
                    document.body.appendChild(placeholder);
                    
                    // Position the placeholder initially
                    placeholder.style.top = `${visualizerItem.getBoundingClientRect().top}px`;
                    placeholder.style.left = `${visualizerItem.getBoundingClientRect().left}px`;
                    
                    // Add visual indication to the original element
                    visualizerItem.classList.add('touch-dragging');
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (touchDragging && placeholder) {
                e.preventDefault(); // Prevent scrolling while dragging
                
                // Move placeholder with touch
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                // Move the placeholder
                placeholder.style.top = `${touchY - touchDragStart.y + touchDragging.getBoundingClientRect().top}px`;
                
                // Find the element we're hovering over
                const elementsAtPoint = document.elementsFromPoint(touchX, touchY);
                const hoverElement = elementsAtPoint.find(el => 
                    el.classList.contains('visualizer-item') && el !== placeholder && el !== touchDragging
                );
                
                if (hoverElement) {
                    // Determine position (before or after)
                    const rect = hoverElement.getBoundingClientRect();
                    if (touchY < rect.top + rect.height / 2) {
                        // Want to place above
                        container.insertBefore(touchDragging, hoverElement);
                    } else {
                        // Want to place below
                        const nextElement = hoverElement.nextElementSibling;
                        if (nextElement) {
                            container.insertBefore(touchDragging, nextElement);
                        } else {
                            container.appendChild(touchDragging);
                        }
                    }
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (touchDragging) {
                touchDragging.classList.remove('touch-dragging');
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
                
                touchDragging = null;
                placeholder = null;
                touchDragStart = null;
                
                // Update the order
                this.updateVisualizerOrder();
            }
        });
    }

    updateVisualizerOrder() {
        // Only update the order of selected visualizers
        const selectedItems = document.querySelectorAll('.visualizer-item.selected');
        if (selectedItems.length === 0) return;
        
        // Create a new array with the visualizers in the current DOM order
        const newOrder = [];
        selectedItems.forEach(item => {
            const name = item.dataset.name;
            if (this.selectedVisualizers.includes(name)) {
                newOrder.push(name);
            }
        });
        
        // Replace the selectedVisualizers array with the new order
        if (newOrder.length > 0) {
            this.selectedVisualizers = newOrder;
            console.log('Updated visualizer order:', this.selectedVisualizers);
        }
    }
    
    generateConfigFields(visualizer) {
        if (!visualizer.params || visualizer.params.length === 0) {
            return '<p>No configuration options available for this visualizer.</p>';
        }
        
        // Group parameters by type for better organization
        const positionParams = visualizer.params.filter(p => p.type === 'position' || p.name === 'x' || p.name === 'y' || p.name === 'width' || p.name === 'height');
        const styleParams = visualizer.params.filter(p => p.type === 'color' || p.name.includes('glow') || p.name.includes('Color'));
        const behaviorParams = visualizer.params.filter(p => p.name.includes('count') || p.name.includes('Count') || p.type === 'number' && !positionParams.find(pos => pos.name === p.name) && !p.name.includes('freq'));
        const audioParams = visualizer.params.filter(p => p.name.includes('freq') || p.name.includes('Freq'));
        const otherParams = visualizer.params.filter(p => 
            !positionParams.find(pos => pos.name === p.name) && 
            !styleParams.find(s => s.name === p.name) && 
            !behaviorParams.find(b => b.name === p.name) &&
            !audioParams.find(a => a.name === p.name)
        );
        
        let html = '';
        
        // Position parameters
        if (positionParams.length > 0) {
            html += `
                <div class="config-group">
                    <label>Position & Size</label>
                    <div class="config-row">
                        ${this.generateInputFields(positionParams, visualizer.name)}
                    </div>
                </div>
            `;
        }
        
        // Behavior parameters
        if (behaviorParams.length > 0) {
            html += `
                <div class="config-group">
                    <label>Behavior</label>
                    <div class="config-row">
                        ${this.generateInputFields(behaviorParams, visualizer.name)}
                    </div>
                </div>
            `;
        }
        
        // Audio parameters
        if (audioParams.length > 0) {
            html += `
                <div class="config-group">
                    <label>Audio Response</label>
                    <div class="config-row">
                        ${this.generateInputFields(audioParams, visualizer.name)}
                    </div>
                </div>
            `;
        }
        
        // Style parameters
        if (styleParams.length > 0) {
            html += `
                <div class="config-group">
                    <label>Appearance</label>
                    <div class="config-row">
                        ${this.generateInputFields(styleParams, visualizer.name)}
                    </div>
                </div>
            `;
        }
        
        // Other parameters
        if (otherParams.length > 0) {
            html += `
                <div class="config-group">
                    <label>Other Settings</label>
                    <div class="config-row">
                        ${this.generateInputFields(otherParams, visualizer.name)}
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    generateInputFields(params, visualizerName) {
        return params.map(param => {
            const id = `${visualizerName}-${param.name}`;
            const customId = `${id}-custom`;
            let defaultValue = param.defaultValue;
            
            // Use example value if available
            if (param.exampleValue !== undefined) {
                // Only use the example value if it's a sensible default
                if (param.exampleValue && 
                    !param.exampleValue.includes('time') && 
                    !param.exampleValue.includes('Math.sin') &&
                    !param.exampleValue.includes('Math.cos')) {
                    defaultValue = param.exampleValue;
                }
            } else {
                // Special handling for commonly used parameters when no example
                if (param.name === 'x' && defaultValue === null) defaultValue = 'width/2';
                if (param.name === 'y' && defaultValue === null) defaultValue = 'height/2';
                if (param.name === 'width' && defaultValue === null) defaultValue = 'width';
                if (param.name === 'height' && defaultValue === null) defaultValue = 'height';
            }
            
            // Use existing config if available
            if (this.visualizerConfigs[visualizerName] && this.visualizerConfigs[visualizerName][param.name] !== undefined) {
                defaultValue = this.visualizerConfigs[visualizerName][param.name];
            }
            
            if (param.type === 'boolean') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="true" ${defaultValue === true || defaultValue === 'true' ? 'selected' : ''}>Yes</option>
                            <option value="false" ${defaultValue === false || defaultValue === 'false' ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                `;
            } else if (param.type === 'color') {
                let colorValue = defaultValue || '#61dafb';
                // Extract color from example if it's in quotes
                if (typeof colorValue === 'string' && colorValue.includes('"')) {
                    colorValue = colorValue.replace(/"/g, '');
                }
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <input type="color" id="${id}" name="${param.name}" 
                               value="${colorValue}">
                    </div>
                `;
            } else if (param.name === 'x') {
                // Use example value if available to determine the default selection
                let selectedOption = 'width/2';
                if (defaultValue === 0 || defaultValue === '0') selectedOption = '0';
                else if (defaultValue === 'width' || defaultValue === 'width') selectedOption = 'width';
                else if (defaultValue === 'width/2' || defaultValue === 'width/2') selectedOption = 'width/2';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="0" ${selectedOption === '0' ? 'selected' : ''}>Left (0)</option>
                            <option value="width/2" ${selectedOption === 'width/2' ? 'selected' : ''}>Center</option>
                            <option value="width" ${selectedOption === 'width' ? 'selected' : ''}>Right</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="text" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? defaultValue : ''}">
                    </div>
                `;
            } else if (param.name === 'y') {
                // Use example value to determine the default selection
                let selectedOption = 'height/2';
                if (defaultValue === 0 || defaultValue === '0') selectedOption = '0';
                else if (defaultValue === 'height' || defaultValue === 'height') selectedOption = 'height';
                else if (defaultValue === 'height/2' || defaultValue === 'height/2') selectedOption = 'height/2';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="0" ${selectedOption === '0' ? 'selected' : ''}>Top (0)</option>
                            <option value="height/2" ${selectedOption === 'height/2' ? 'selected' : ''}>Middle</option>
                            <option value="height" ${selectedOption === 'height' ? 'selected' : ''}>Bottom</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="text" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? defaultValue : ''}">
                    </div>
                `;
            } else if (param.name === 'width') {
                let selectedOption = 'width';
                if (defaultValue === 'width/2' || defaultValue === 'width/2') selectedOption = 'width/2';
                else if (defaultValue === 'width' || defaultValue === 'width') selectedOption = 'width';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="width" ${selectedOption === 'width' ? 'selected' : ''}>Full Width</option>
                            <option value="width/2" ${selectedOption === 'width/2' ? 'selected' : ''}>Half Width</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="text" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? defaultValue : ''}">
                    </div>
                `;
            } else if (param.name === 'height') {
                let selectedOption = 'height';
                if (defaultValue === 'height/2' || defaultValue === 'height/2') selectedOption = 'height/2';
                else if (defaultValue === 'height' || defaultValue === 'height') selectedOption = 'height';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="height" ${selectedOption === 'height' ? 'selected' : ''}>Full Height</option>
                            <option value="height/2" ${selectedOption === 'height/2' ? 'selected' : ''}>Half Height</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="text" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? defaultValue : ''}">
                    </div>
                `;
            } else if (param.name.includes('freq') && param.name.includes('Start')) {
                const freqValue = typeof defaultValue === 'number' ? defaultValue : 20;
                let selectedOption = '20';
                if (freqValue === 200) selectedOption = '200';
                else if (freqValue === 500) selectedOption = '500';
                else if (freqValue === 20) selectedOption = '20';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="20" ${selectedOption === '20' ? 'selected' : ''}>Bass (20Hz)</option>
                            <option value="200" ${selectedOption === '200' ? 'selected' : ''}>Mid-Low (200Hz)</option>
                            <option value="500" ${selectedOption === '500' ? 'selected' : ''}>Mid (500Hz)</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="number" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? freqValue : ''}">
                    </div>
                `;
            } else if (param.name.includes('freq') && param.name.includes('End')) {
                const freqValue = typeof defaultValue === 'number' ? defaultValue : 2000;
                let selectedOption = '2000';
                if (freqValue === 5000) selectedOption = '5000';
                else if (freqValue === 1000) selectedOption = '1000';
                else if (freqValue === 2000) selectedOption = '2000';
                else selectedOption = 'custom';
                
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}" class="custom-select" data-custom-id="${customId}">
                            <option value="2000" ${selectedOption === '2000' ? 'selected' : ''}>High (2000Hz)</option>
                            <option value="5000" ${selectedOption === '5000' ? 'selected' : ''}>Very High (5000Hz)</option>
                            <option value="1000" ${selectedOption === '1000' ? 'selected' : ''}>Mid-High (1000Hz)</option>
                            <option value="custom" ${selectedOption === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <input type="number" id="${customId}" class="custom-value" 
                               style="display: ${selectedOption === 'custom' ? 'block' : 'none'};" 
                               value="${selectedOption === 'custom' ? freqValue : ''}">
                    </div>
                `;
            } else {
                // For numeric inputs
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <input type="number" id="${id}" name="${param.name}" 
                               value="${defaultValue !== null ? defaultValue : param.name.includes('Count') ? 50 : 10}" 
                               step="${param.name.includes('Count') ? 1 : 0.1}">
                    </div>
                `;
            }
        }).join('');
    }
    
    updateConfig(visualizerName) {
        const item = document.querySelector(`.visualizer-item[data-name="${visualizerName}"]`);
        if (!item) return;
        
        const config = this.visualizerConfigs[visualizerName] || {};
        
        // Process regular inputs
        const inputs = item.querySelectorAll('input:not(.custom-value), select:not(.custom-select)');
        inputs.forEach(input => {
            const paramName = input.name;
            let value = input.value;
            
            // Convert value to appropriate type
            if (input.type === 'number') {
                value = parseFloat(value);
            } else if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'select-one' && (value === 'true' || value === 'false')) {
                value = value === 'true';
            }
            
            config[paramName] = value;
        });
        
        // Process custom-select elements
        const customSelects = item.querySelectorAll('.custom-select');
        customSelects.forEach(select => {
            const paramName = select.name;
            let value = select.value;
            
            // If "custom" is selected, use the value from the associated custom input
            if (value === 'custom') {
                const customId = select.dataset.customId;
                const customInput = document.getElementById(customId);
                if (customInput && customInput.value) {
                    value = customInput.value;
                }
            }
            
            config[paramName] = value;
        });
        
        this.visualizerConfigs[visualizerName] = config;
    }
    
    updatePreview(item, visualizer) {
        const previewElement = item.querySelector('.config-preview code');
        if (previewElement) {
            previewElement.textContent = this.generatePreviewCode(visualizer);
        }
    }
    
    generatePreviewCode(visualizer) {
        if (!this.visualizerConfigs[visualizer.name]) {
            this.updateConfig(visualizer.name);
        }
        
        const config = this.visualizerConfigs[visualizer.name] || {};
        const params = visualizer.params.map(param => {
            let value = config[param.name];
            
            if (value === undefined || value === null) {
                // Use defaults for undefined values
                if (param.name === 'x') return 'width/2';
                if (param.name === 'y') return 'height/2';
                if (param.name === 'width') return 'width';
                if (param.name === 'height') return 'height';
                if (param.name.includes('Count')) return '50';
                if (param.name === 'glow') return 'true';
                if (param.name.includes('freqStart')) return '20';
                if (param.name.includes('freqEnd')) return '2000';
                
                return param.defaultValue || '10';
            }
            
            // Format value according to type
            if (typeof value === 'string') {
                // Special handling for canvas dimension expressions
                if (['width', 'width/2', 'height', 'height/2', 'width/3', 'height/3'].includes(value) ||
                    value.match(/^(width|height)(\s*[\/\*\+\-]\s*\d+(\.\d+)?)+$/)) {
                    return value; // Return dimension expressions directly without quotes
                } else if (!isNaN(parseFloat(value)) && param.type !== 'color') {
                    return value; // Return numeric strings without quotes
                } else if (param.type === 'color') {
                    return `"${value}"`; // Keep quotes for colors
                } else {
                    return `"${value}"`; // Keep quotes for other strings
                }
            } else if (typeof value === 'boolean') {
                return value.toString();
            } else if (typeof value === 'number') {
                return value;
            } else {
                return `"${value}"`;
            }
        }).join(', ');
        
        // Get the visualizer color if available
        const visualizerColor = this.visualizerColors[visualizer.name];
        
        if (visualizerColor && visualizerColor !== '#ffffff') {
            // Convert hex color to r,g,b values
            const rgb = this.hexToRgb(visualizerColor);
            // Add fill command before the visualizer call with RGB values
            return `fill(${rgb.r}, ${rgb.g}, ${rgb.b}); ${visualizer.name}(${params});`;
        } else {
            return `${visualizer.name}(${params});`;
        }
    }

    // Helper method to convert hex to RGB
    hexToRgb(hex) {
        // Remove the hash if it exists
        hex = hex.replace(/^#/, '');
        
        // Parse the hex values
        let r, g, b;
        if (hex.length === 3) {
            // For shorthand hex (#RGB)
            r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
            g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
            b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        } else {
            // For standard hex (#RRGGBB)
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        
        // Handle potential parsing errors
        if (isNaN(r)) r = 255;
        if (isNaN(g)) g = 255;
        if (isNaN(b)) b = 255;
        
        return { r, g, b };
    }
    
    toggleVisualizerSelection(name, isSelected) {
        console.log(`toggleVisualizerSelection called for ${name}, selected: ${isSelected}`);
        
        const prevSelections = [...this.selectedVisualizers]; // Clone for comparison
        
        if (isSelected) {
            // Only add if not already in the array
            if (!this.selectedVisualizers.includes(name)) {
                this.selectedVisualizers.push(name);
                console.log(`Added ${name} to selections. Now have ${this.selectedVisualizers.length} visualizers`);
            }
        } else {
            // Remove from array
            const beforeLength = this.selectedVisualizers.length;
            this.selectedVisualizers = this.selectedVisualizers.filter(v => v !== name);
            const afterLength = this.selectedVisualizers.length;
            
            if (beforeLength !== afterLength) {
                console.log(`Removed ${name} from selections. Now have ${afterLength} visualizers`);
            }
        }
        
        // Check if we actually changed anything
        const changed = prevSelections.length !== this.selectedVisualizers.length || 
                       prevSelections.some(v => !this.selectedVisualizers.includes(v)) ||
                       this.selectedVisualizers.some(v => !prevSelections.includes(v));
        
        if (changed) {
            console.log(`Selection changed: Now have ${this.selectedVisualizers.length} visualizers selected`);
        }
    }
    
    generateCode() {
        console.log(`Generate code called. Currently have ${this.selectedVisualizers.length} visualizers selected.`);
        console.log(`Selected visualizers: ${this.selectedVisualizers.join(', ')}`);
        
        // Check all checkboxes to make sure selections are in sync
        const checkboxes = document.querySelectorAll('.visualizer-checkbox');
        let checkedCount = 0;
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedCount++;
                const visualizerItem = checkbox.closest('.visualizer-item');
                if (visualizerItem) {
                    const name = visualizerItem.dataset.name;
                    if (!this.selectedVisualizers.includes(name)) {
                        console.log(`Found checked visualizer ${name} not in selections, adding it now`);
                        this.selectedVisualizers.push(name);
                    }
                }
            }
        });
        
        console.log(`Found ${checkedCount} checked visualizers in the DOM`);
        
        if (this.selectedVisualizers.length === 0) {
            alert('Please select at least one visualizer to generate code.');
            return;
        }
        
        // Generate a complete script with the selected visualizers
        const code = this.generateFullScript();
        
        // Update the editor content
        if (window.editor) {
            window.editor.setValue(code);
            window.logToConsole('Generated code with ' + this.selectedVisualizers.length + ' visualizers');
        }
        
        // Close the composer
        this.closeComposer();
    }
    
    generateFullScript() {
        let visualizerCode = '';
        
        // Generate code for each selected visualizer in the current order
        this.selectedVisualizers.forEach(name => {
            const visualizer = this.visualizers.find(v => v.name === name);
            if (visualizer) {
                visualizerCode += '    // ' + visualizer.title + '\n';
                visualizerCode += '    ' + this.generatePreviewCode(visualizer) + '\n\n';
            }
        });
        
        // Create the full template
        return `/**
 * KaleidoScript Visualizer
 * Generated by Visual Composer
 */

function setup() {
    loadAudio("your-music.mp3");
}

function draw(time) {
    // Play audio when animation starts
    if (time < 0.1) audioPlay();
    
    // Set background color
    background(10, 10, 30); // Dark blue background
    
${visualizerCode}}`;
    }
    
    filterVisualizers() {
        // Filter visualizers by category
        const items = document.querySelectorAll('.visualizer-item');
        
        items.forEach(item => {
            // For now we just show all items since we don't have categories yet
            // This will be enhanced with actual category filtering
            if (this.activeCategory === 'all') {
                item.style.display = 'block';
            } else {
                // In the future, use actual category information
                const visualizerName = item.dataset.name;
                const visualizer = this.visualizers.find(v => v.name === visualizerName);
                
                // For now, simple categorization based on name
                let belongs = false;
                
                if (this.activeCategory === 'basic') {
                    belongs = ['visualCircular', 'visualBar', 'visualWaveform', 'visualSpiral'].includes(visualizerName);
                } else if (this.activeCategory === 'advanced') {
                    belongs = ['visualFlame', 'visualParticle', 'visualNebular', 'visualVortex', 'visualMatrix'].includes(visualizerName);
                } else if (this.activeCategory === '3d') {
                    belongs = visualizerName.includes('3D') || visualizerName.includes('3d');
                }
                
                item.style.display = belongs ? 'block' : 'none';
            }
        });
    }
    
    resetComposer() {
        this.selectedVisualizers = [];
        this.visualizerConfigs = {};
        this.visualizerColors = {}; // Reset colors too
        
        // Reset all checkboxes
        const checkboxes = document.querySelectorAll('.visualizer-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Close all expanded configs
        const configs = document.querySelectorAll('.visualizer-config');
        configs.forEach(config => {
            config.classList.remove('open');
        });
        
        const toggles = document.querySelectorAll('.visualizer-toggle');
        toggles.forEach(toggle => {
            toggle.classList.remove('open');
        });
    }
    
    openComposer() {
        if (this.overlay) {
            this.overlay.style.display = 'block';
        }
    }
    
    closeComposer() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
    
    // Add event listener to handle "custom" select option changes
    attachCustomSelectListeners() {
        const customSelects = document.querySelectorAll('.custom-select');
        customSelects.forEach(select => {
            select.addEventListener('change', function() {
                const customId = this.dataset.customId;
                const customInput = document.getElementById(customId);
                
                if (customInput) {
                    if (this.value === 'custom') {
                        customInput.style.display = 'block';
                        customInput.focus();
                    } else {
                        customInput.style.display = 'none';
                    }
                }
            });
        });
        
        // Add listener for custom value changes
        const customInputs = document.querySelectorAll('.custom-value');
        customInputs.forEach(input => {
            input.addEventListener('change', () => {
                // Find the visualizer this input belongs to
                const configField = input.closest('.config-field');
                const configGroup = configField ? configField.closest('.config-group') : null;
                const visualizerConfig = configGroup ? configGroup.closest('.visualizer-config') : null;
                const visualizerItem = visualizerConfig ? visualizerConfig.closest('.visualizer-item') : null;
                
                if (visualizerItem) {
                    const visualizerName = visualizerItem.dataset.name;
                    this.updateConfig(visualizerName);
                    this.updatePreview(visualizerItem, this.visualizers.find(v => v.name === visualizerName));
                }
            });
        });
    }
}

// Initialize the component when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    window.visualComposer = new VisualComposer();
});

// Function to open the visual composer from external calls
function openVisualComposer() {
    if (window.visualComposer) {
        window.visualComposer.openComposer();
    } else {
        window.visualComposer = new VisualComposer();
        setTimeout(() => {
            window.visualComposer.openComposer();
        }, 100);
    }
}

// Add some CSS to style the color picker
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .visualizer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .visualizer-header-content {
            flex-grow: 1;
        }
        
        .visualizer-drag-handle {
            cursor: move;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            touch-action: none;
        }
        
        .visualizer-drag-handle:hover {
            opacity: 1;
        }
        
        .visualizer-color-picker {
            margin-right: 10px;
        }
        
        .visualizer-color {
            width: 25px;
            height: 25px;
            padding: 0;
            border: none;
            border-radius: 50%;
            overflow: hidden;
            cursor: pointer;
        }
        
        .visualizer-color::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        
        .visualizer-color::-webkit-color-swatch {
            border: none;
            border-radius: 50%;
        }
        
        .custom-value {
            margin-top: 5px;
            width: 100%;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 14px;
        }
        
        .config-field {
            position: relative;
            margin-bottom: 8px;
        }
        
        /* Drag and drop styles */
        .visualizer-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .visualizer-item.selected {
            box-shadow: 0 0 0 2px #61dafb;
        }
        
        .visualizer-item.dragging {
            opacity: 0.5;
            box-shadow: 0 5px 10px rgba(0,0,0,0.2);
        }
        
        .visualizer-item.touch-dragging {
            opacity: 0.7;
        }
        
        .visualizer-item.drop-before {
            border-top: 2px solid #61dafb;
        }
        
        .visualizer-item.drop-after {
            border-bottom: 2px solid #61dafb;
        }
        
        .drag-ghost {
            background: #2d2d3a;
            color: #61dafb;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.9rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            position: absolute;
            top: -1000px; /* Hidden but available for size calculation */
            opacity: 0.8;
            pointer-events: none;
            z-index: 1000;
        }
        
        /* Status indicator */
        .layer-info {
            display: inline-block;
            background: rgba(97, 218, 251, 0.2);
            color: #61dafb;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.8rem;
            margin-left: 8px;
        }
        
        /* Style for the last updated info in footer */
        .last-updated {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.8rem;
            color: #777;
        }
        
        @media (max-width: 768px) {
            .last-updated {
                position: static;
                display: block;
                margin-top: 5px;
                transform: none;
            }
            
            /* Make headers easier to tap on mobile */
            .visualizer-header {
                min-height: 44px;
                padding: 10px;
            }
            
            .visualizer-drag-handle {
                padding: 10px;
                margin: -10px 0 -10px -10px;
            }
            
            /* Add instruction text */
            .composer-visualizers::before {
                content: "Drag to reorder visualizers. Items at the top will be drawn first (bottom layer).";
                display: block;
                margin-bottom: 15px;
                color: #888;
                font-size: 0.9rem;
                text-align: center;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add build date information to the footer
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        // Format the current date as the build date
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        
        lastUpdatedElement.textContent = `v1.0.5 (${day}/${month}/${year})`;
    }
    
    // Initialize VisualComposer only once
    if (!window.visualComposer) {
        window.visualComposer = new VisualComposer();
    }
});