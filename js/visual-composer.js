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
        this.logKeywordStatus();

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
                            <button id="refresh-visualizers" class="composer-debug-btn">Refresh Visualizers</button>
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

        document.getElementById('refresh-visualizers').addEventListener('click', () => {
            const count = this.refreshVisualizers();
            alert(`Refreshed visualizers: found ${count} visualizers`);
        });
        
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
        
        // Show layering instructions
        const instructions = document.createElement('div');
        instructions.className = 'layer-instructions';
        instructions.innerHTML = `
            <div class="layer-legend">
                <div class="layer-arrow top">↑ Top Layer (Drawn Last)</div>
                <div class="layer-arrow bottom">↓ Bottom Layer (Drawn First)</div>
            </div>
            <div class="layer-hint">Drag selected visualizers to change their order</div>
        `;
        container.appendChild(instructions);
        
        // Add each visualizer as a collapsible item
        this.visualizers.forEach((visualizer, index) => {
            // Check if this visualizer is already selected
            const isSelected = this.selectedVisualizers.includes(visualizer.name);
            
            const item = document.createElement('div');
            item.className = 'visualizer-item';
            item.dataset.name = visualizer.name;
    
            item.setAttribute('draggable', true);
            
            // Add drag handle and selection indicator
            const colorId = `${visualizer.name}-color`;
            const defaultColor = this.visualizerColors[visualizer.name] || '#ffffff';
            
            // Calculate layer position for selected items
            let layerPosition = '';
            if (isSelected) {
                const position = this.selectedVisualizers.indexOf(visualizer.name);
                const total = this.selectedVisualizers.length;
                if (position !== -1) {
                    // Convert to layers - first in array is bottom layer
                    layerPosition = `Layer ${position + 1} of ${total}`;
                }
            }
            
            // Create main header
            const headerHtml = `
                <div class="visualizer-header">
                    <div class="visualizer-drag-handle" title="Drag to reorder">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path fill="${isSelected ? '#61dafb' : '#888'}" d="M4 4h2v2H4V4zm0 6h2v2H4v-2zm0-3h2v2H4V7zm6 3h2v2h-2v-2zm0-3h2v2h-2V7zm0-3h2v2h-2V4z"></path>
                        </svg>
                    </div>
                    <div class="visualizer-header-content">
                        <input type="checkbox" class="visualizer-checkbox" 
                            id="viz-${index}" ${isSelected ? 'checked' : ''}>
                        <span class="visualizer-title">${visualizer.title}</span>
                        ${isSelected ? `<span class="layer-badge">${layerPosition}</span>` : ''}
                    </div>
                    <div class="visualizer-order-buttons">
                        <button class="visualizer-order-up" title="Move up">
                            <svg width="14" height="14" viewBox="0 0 24 24">
                                <path fill="${isSelected ? '#61dafb' : '#888'}" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path>
                            </svg>
                        </button>
                        <button class="visualizer-order-down" title="Move down">
                            <svg width="14" height="14" viewBox="0 0 24 24">
                                <path fill="${isSelected ? '#61dafb' : '#888'}" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="visualizer-color-picker">
                        <input type="color" id="${colorId}" class="visualizer-color" 
                            value="${defaultColor}" title="Set visualizer color">
                    </div>
                    <button class="visualizer-toggle" title="Toggle settings">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>`;
                
            // Create config section
            const configHtml = `
                <div class="visualizer-config">
                    <div class="config-content">
                        ${this.generateConfigFields(visualizer)}
                    </div>
                    <div class="config-preview">
                        <h4>Generated Code</h4>
                        <pre><code></code></pre>
                    </div>
                </div>`;
                
            // Add all HTML to the item
            item.innerHTML = headerHtml + configHtml;
            
            const upButton = item.querySelector('.visualizer-order-up');
            const downButton = item.querySelector('.visualizer-order-down');
    
            if (upButton) {
                upButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveVisualizer(visualizer.name, 'up');
                });
            }
            
            if (downButton) {
                downButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveVisualizer(visualizer.name, 'down');
                });
            }
                        
            container.appendChild(item);
            
            // Set draggable state based on selection
            item.setAttribute('draggable', isSelected);
            
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
                
                // Always keep items draggable for better UX
                item.setAttribute('draggable', 'true');
                item.draggable = true;
                
                // Update drag handle color
                const dragHandlePath = item.querySelector('.visualizer-drag-handle path');
                if (dragHandlePath) {
                    dragHandlePath.setAttribute('fill', isChecked ? '#61dafb' : '#888');
                }
    
                // Update the order buttons
                const upBtn = item.querySelector('.visualizer-order-up');
                const downBtn = item.querySelector('.visualizer-order-down');
                
                if (upBtn) {
                    upBtn.disabled = false; // Never disable
                    upBtn.querySelector('path').setAttribute('fill', isChecked ? '#61dafb' : '#888');
                }
                
                if (downBtn) {
                    downBtn.disabled = false; // Never disable
                    downBtn.querySelector('path').setAttribute('fill', isChecked ? '#61dafb' : '#888');
                }
                
                // Update layer badges for all items
                this.updateLayerBadges();
                
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
            const config = item.querySelector('.visualizer-config');
            
            if (toggle && config) {
                toggle.addEventListener('click', () => {
                    config.classList.toggle('open');
                    toggle.classList.toggle('open');
                });
            }
            
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
            
            // Update the initial preview
            this.updatePreview(item, visualizer);
            
            // Drag and Drop functionality
            this.addDragAndDropListeners(item);
        });
        
        // Add touch-friendly drag and drop support for mobile
        this.setupMobileDragAndDrop(container);
        
        // After populating the visualizers, attach custom select listeners
        this.attachCustomSelectListeners();
        
        // Update the layer badges to reflect current order
        this.updateLayerBadges();
    
        this.setupContainerDragHandlers();
        
        console.log(`After population, selected visualizers: ${this.selectedVisualizers.join(', ')}`);
    }

    moveVisualizer(name, direction) {
        console.log(`Moving visualizer ${name} ${direction}`);
        
        // Get the container
        const container = document.getElementById('composer-visualizers-container');
        if (!container) return;
        
        // Find the item to move
        const item = container.querySelector(`.visualizer-item[data-name="${name}"]`);
        if (!item) {
            console.error(`Item with name ${name} not found`);
            return;
        }
        
        // Find all items in the container
        const allItems = Array.from(container.querySelectorAll('.visualizer-item'));
        const currentIndex = allItems.indexOf(item);
        
        if (currentIndex === -1) return; // Item not found in list
        
        // Calculate the new index
        let targetIndex;
        if (direction === 'up' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < allItems.length - 1) {
            targetIndex = currentIndex + 1;
        } else {
            // Already at top or bottom
            return;
        }
        
        // Check if we need to skip the instructions element
        if (targetIndex === 0 && container.firstChild && container.firstChild.classList.contains('layer-instructions')) {
            targetIndex = 1;
        }
        
        const targetItem = allItems[targetIndex];
        if (!targetItem) return;
        
        // Move in the DOM
        if (direction === 'up') {
            container.insertBefore(item, targetItem);
        } else {
            const nextAfterTarget = targetItem.nextElementSibling;
            if (nextAfterTarget) {
                container.insertBefore(item, nextAfterTarget);
            } else {
                container.appendChild(item);
            }
        }
        
        // If the item is selected, update the selected visualizer array
        if (item.classList.contains('selected')) {
            this.updateVisualizerOrder();
        }
        
        // Update layer badges
        this.updateLayerBadges();
        
        // Visual feedback
        item.classList.add('flash-position');
        setTimeout(() => {
            item.classList.remove('flash-position');
        }, 800);
        
        console.log(`Moved visualizer ${name} ${direction}`);
    }

    reorderVisualizerDom() {
        const container = document.getElementById('composer-visualizers-container');
        if (!container) return;
        
        // Get all visualizer items
        const allItems = Array.from(container.querySelectorAll('.visualizer-item'));
        
        // Create a document fragment to hold the reordered items
        const fragment = document.createDocumentFragment();
        
        // Find all non-selected items to keep their relative positions
        const nonSelectedItems = allItems.filter(item => !item.classList.contains('selected'));
        
        // Find the original positions of all items
        const originalPositions = new Map();
        allItems.forEach((item, index) => {
            originalPositions.set(item.dataset.name, index);
        });
        
        // First, add all non-instruction elements that appear before the first selected item
        const firstSelectedPos = Math.min(...this.selectedVisualizers.map(name => {
            return originalPositions.get(name) !== undefined ? originalPositions.get(name) : Infinity;
        }));
        
        // Add the instructions element first if it exists
        const instructionsElement = container.querySelector('.layer-instructions');
        if (instructionsElement) {
            fragment.appendChild(instructionsElement);
        }
        
        // Add selected items in the order from the array
        this.selectedVisualizers.forEach(name => {
            const selectedItem = allItems.find(item => item.dataset.name === name);
            if (selectedItem) {
                fragment.appendChild(selectedItem);
            }
        });
        
        // Add any remaining non-selected items
        nonSelectedItems.forEach(item => {
            if (!fragment.contains(item)) {
                fragment.appendChild(item);
            }
        });
        
        // Clear the container and append the fragment
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Update layer badges
        this.updateLayerBadges();
    }

    updateLayerBadges() {
        const items = document.querySelectorAll('.visualizer-item.selected');
        items.forEach((item, index) => {
            const badge = item.querySelector('.layer-badge');
            const totalLayers = items.length;
            
            if (!badge && totalLayers > 0) {
                // Create a new badge if it doesn't exist
                const title = item.querySelector('.visualizer-title');
                const newBadge = document.createElement('span');
                newBadge.className = 'layer-badge';
                newBadge.textContent = `Layer ${index + 1} of ${totalLayers}`;
                title.after(newBadge);
            } else if (badge) {
                // Update existing badge
                badge.textContent = `Layer ${index + 1} of ${totalLayers}`;
            }
        });
    }

    addDragAndDropListeners(element) {
        // Store a reference to the original drag handlers to prevent attaching duplicates
        if (!element._dragHandlersAttached) {
            element._dragHandlersAttached = true;
        } else {
            // Skip if handlers are already attached
            return;
        }
        
        // Drag start event handler
        const handleDragStart = (e) => {
            // Only allow dragging if the element is selected (has a checkbox checked)
            /*const checkbox = element.querySelector('.visualizer-checkbox');
            if (!checkbox || !checkbox.checked) {
                e.preventDefault();
                return;
            }*/
            
            console.log(`Drag started for ${element.dataset.name}`);
            
            // Add a class to style the dragged element
            element.classList.add('dragging');
            
            // Store the dragged element's name in the dataTransfer
            e.dataTransfer.setData('text/plain', element.dataset.name);
            e.dataTransfer.effectAllowed = 'move';
            
            // Create a drag ghost
            const dragImage = document.createElement('div');
            const title = element.querySelector('.visualizer-title').textContent;
            dragImage.textContent = `Moving: ${title}`;
            dragImage.className = 'drag-ghost';
            document.body.appendChild(dragImage);
            
            // Position the drag ghost off-screen initially
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            
            // Use the custom drag image
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            
            // Clean up the drag image after a short delay
            setTimeout(() => {
                if (dragImage.parentNode) {
                    document.body.removeChild(dragImage);
                }
            }, 100);
        };
        
        // Drag end event handler
        const handleDragEnd = (e) => {
            console.log(`Drag ended for ${element.dataset.name}`);
            element.classList.remove('dragging');
            
            // Update the order if the item is selected
            if (element.classList.contains('selected')) {
                this.updateVisualizerOrder();
            }
            
            this.updateLayerBadges();
            
            // Flash the item for visual feedback
            element.classList.add('flash-position');
            setTimeout(() => {
                element.classList.remove('flash-position');
            }, 800);
        };
        
        // Remove any existing handlers to avoid duplicates
        element.removeEventListener('dragstart', element._handleDragStart);
        element.removeEventListener('dragend', element._handleDragEnd);
        
        // Save references to the handlers
        element._handleDragStart = handleDragStart;
        element._handleDragEnd = handleDragEnd;
        
        // Add the event listeners
        element.addEventListener('dragstart', element._handleDragStart);
        element.addEventListener('dragend', element._handleDragEnd);
        
        // Make sure the drag handle activates dragging properly
        const dragHandle = element.querySelector('.visualizer-drag-handle');
        if (dragHandle) {
            const handleMouseDown = (e) => {
                // Enable dragging for all items, not just selected ones
                console.log(`Setting draggable=true on mouse down for ${element.dataset.name}`);
                element.draggable = true;
                
                // Use browser event propagation to get to the drag event
                e.stopPropagation();
            };
            
            dragHandle.removeEventListener('mousedown', dragHandle._handleMouseDown);
            dragHandle._handleMouseDown = handleMouseDown;
            dragHandle.addEventListener('mousedown', dragHandle._handleMouseDown);
            
            // Prevent dragging from initiating on other parts of the item
            const itemMouseDown = (e) => {
                if (e.target !== dragHandle && !dragHandle.contains(e.target)) {
                    element.draggable = false;
                }
            };
            
            element.removeEventListener('mousedown', element._handleItemMouseDown);
            element._handleItemMouseDown = itemMouseDown;
            element.addEventListener('mousedown', element._handleItemMouseDown);
        }
    }
    
    // Helper method to find the closest visualizer item
    getClosestItemAtPosition(x, y) {
        // Get all elements at the position
        const elements = document.elementsFromPoint(x, y);
        
        // Find the first visualizer item in the elements list
        return elements.find(el => el.classList.contains('visualizer-item'));
    }

    setupContainerDragHandlers() {
        const container = document.getElementById('composer-visualizers-container');
        if (!container) return;
        
        console.log('Setting up container drag handlers');
        
        // Clear any existing handlers
        if (this._containerDragHandlersAttached) {
            container.removeEventListener('dragover', this._handleDragOver);
            container.removeEventListener('drop', this._handleDrop);
            container.removeEventListener('dragleave', this._handleDragLeave);
        }
        
        // Create the handler functions (using arrow functions to preserve 'this')
        this._handleDragOver = (e) => {
            e.preventDefault(); // Required to allow dropping
            e.stopPropagation();
            
            // Find the target item
            const closestItem = this.getClosestItemAtPosition(e.clientX, e.clientY);
            if (!closestItem) return;
            
            // Get currently dragged element
            const dragging = document.querySelector('.dragging');
            if (!dragging || dragging === closestItem) return;
            
            // Clear existing drop indicators
            document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                el.classList.remove('drop-before', 'drop-after');
            });
            
            // Determine drop position based on mouse position relative to item
            const rect = closestItem.getBoundingClientRect();
            const mouseY = e.clientY;
            const threshold = rect.top + (rect.height / 2);
            
            if (mouseY < threshold) {
                closestItem.classList.add('drop-before');
            } else {
                closestItem.classList.add('drop-after');
            }
        };
        
        this._handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Drop event detected');
            
            // Clear drop indicators
            document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                el.classList.remove('drop-before', 'drop-after');
            });
            
            // Get the data that was set during dragstart
            const draggedName = e.dataTransfer.getData('text/plain');
            if (!draggedName) {
                console.error('No data was transferred during drag');
                return;
            }
            
            console.log(`Dropping element: ${draggedName}`);
            
            // Find the dragged element in the DOM
            const dragging = document.querySelector(`[data-name="${draggedName}"]`);
            if (!dragging) return;
            
            // Find where to drop it
            const closestItem = this.getClosestItemAtPosition(e.clientX, e.clientY);
            if (!closestItem || dragging === closestItem) return;
            
            // Determine where to insert based on mouse position
            const rect = closestItem.getBoundingClientRect();
            const mouseY = e.clientY;
            const threshold = rect.top + (rect.height / 2);
            
            // Insert the element at the appropriate position
            if (mouseY < threshold) {
                // Insert before the target
                container.insertBefore(dragging, closestItem);
                console.log(`Inserted ${draggedName} before ${closestItem.dataset.name}`);
            } else {
                // Insert after the target
                const nextSibling = closestItem.nextElementSibling;
                if (nextSibling) {
                    container.insertBefore(dragging, nextSibling);
                    console.log(`Inserted ${draggedName} before ${nextSibling.dataset.name}`);
                } else {
                    container.appendChild(dragging);
                    console.log(`Appended ${draggedName} to the end`);
                }
            }
            
            // Update the data model and UI
            this.updateVisualizerOrder();
            this.updateLayerBadges();
            
            // Visual feedback
            dragging.classList.add('flash-position');
            setTimeout(() => {
                dragging.classList.remove('flash-position');
            }, 800);
        };
        
        this._handleDragLeave = (e) => {
            // Clear drop indicators if we leave the container
            if (e.target === container) {
                document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                    el.classList.remove('drop-before', 'drop-after');
                });
            }
        };
        
        // Attach the handlers
        container.addEventListener('dragover', this._handleDragOver);
        container.addEventListener('drop', this._handleDrop);
        container.addEventListener('dragleave', this._handleDragLeave);
        
        // Mark as attached
        this._containerDragHandlersAttached = true;
    }

    // Mobile touch-based drag and drop
    setupMobileDragAndDrop(container) {
        let touchDragging = null;
        let touchDragStart = null;
        let placeholder = null;
        let originalContainer = null;
        let originalPosition = null;
        
        // Create the touch event handlers
        document.addEventListener('touchstart', (e) => {
            // Find if we're touching a drag handle
            let target = e.target;
            const dragHandle = target.closest('.visualizer-drag-handle');
            
            if (dragHandle) {
                const visualizerItem = dragHandle.closest('.visualizer-item');
                if (visualizerItem && visualizerItem.classList.contains('selected')) {
                    e.preventDefault(); // Prevent scrolling while dragging
                    touchDragging = visualizerItem;
                    originalContainer = container;
                    
                    // Store the original position in the DOM
                    const children = Array.from(container.children).filter(
                        child => child.classList.contains('visualizer-item') && child.classList.contains('selected')
                    );
                    originalPosition = children.indexOf(visualizerItem);
                    
                    // Add visual feedback
                    visualizerItem.classList.add('touch-dragging');
                    
                    // Create a semi-transparent clone as placeholder
                    placeholder = visualizerItem.cloneNode(true);
                    placeholder.style.opacity = '0.6';
                    placeholder.style.position = 'absolute';
                    placeholder.style.zIndex = '1000';
                    placeholder.style.width = `${visualizerItem.offsetWidth}px`;
                    placeholder.style.height = `${visualizerItem.offsetHeight}px`;
                    placeholder.style.pointerEvents = 'none';
                    placeholder.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                    placeholder.style.transform = 'scale(1.02)';
                    
                    // Store initial touch position
                    touchDragStart = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    };
                    
                    document.body.appendChild(placeholder);
                    
                    // Position the placeholder initially
                    const rect = visualizerItem.getBoundingClientRect();
                    placeholder.style.top = `${rect.top}px`;
                    placeholder.style.left = `${rect.left}px`;
                    
                    // Add visual indication to the original element
                    visualizerItem.style.opacity = '0.3';
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
                placeholder.style.left = `${touchX - touchDragStart.x + touchDragging.getBoundingClientRect().left}px`;
                
                // Find the element we're hovering over
                const elementsAtPoint = document.elementsFromPoint(touchX, touchY);
                const hoverElement = elementsAtPoint.find(el => 
                    el.classList.contains('visualizer-item') && 
                    el.classList.contains('selected') &&
                    el !== placeholder && 
                    el !== touchDragging
                );
                
                // Clear all positioning indicators
                document.querySelectorAll('.touch-drop-before, .touch-drop-after').forEach(el => {
                    el.classList.remove('touch-drop-before', 'touch-drop-after');
                });
                
                // Add positioning indicator to hover element
                if (hoverElement) {
                    // Determine position (before or after)
                    const rect = hoverElement.getBoundingClientRect();
                    if (touchY < rect.top + rect.height / 2) {
                        // Want to place above
                        hoverElement.classList.add('touch-drop-before');
                        if (hoverElement !== touchDragging.nextElementSibling) {
                            container.insertBefore(touchDragging, hoverElement);
                        }
                    } else {
                        // Want to place below
                        hoverElement.classList.add('touch-drop-after');
                        const nextElement = hoverElement.nextElementSibling;
                        if (nextElement && nextElement !== touchDragging) {
                            container.insertBefore(touchDragging, nextElement);
                        } else if (!nextElement) {
                            container.appendChild(touchDragging);
                        }
                    }
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (touchDragging) {
                // Remove all visual indicators
                touchDragging.style.opacity = '';
                touchDragging.classList.remove('touch-dragging');
                
                document.querySelectorAll('.touch-drop-before, .touch-drop-after').forEach(el => {
                    el.classList.remove('touch-drop-before', 'touch-drop-after');
                });
                
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
                
                // Update the order
                this.updateVisualizerOrder();
                
                // Update layer badges
                this.updateLayerBadges();
                
                // Generate visible feedback by flashing the newly positioned item
                touchDragging.classList.add('flash-position');
                setTimeout(() => {
                    touchDragging.classList.remove('flash-position');
                }, 800);
                
                // Reset variables
                touchDragging = null;
                placeholder = null;
                touchDragStart = null;
                originalContainer = null;
                originalPosition = null;
            }
        });
    }

    updateVisualizerOrder() {
        // Get all selected items in the current DOM order
        const container = document.getElementById('composer-visualizers-container');
        const selectedItems = container ? 
            Array.from(container.querySelectorAll('.visualizer-item.selected')) : [];
        
        if (selectedItems.length === 0) return;
        
        // Create a new array with the visualizers in the current DOM order
        const newOrder = [];
        selectedItems.forEach(item => {
            const name = item.dataset.name;
            if (name && this.selectedVisualizers.includes(name)) {
                newOrder.push(name);
            }
        });
        
        // Replace the selectedVisualizers array with the new order
        if (newOrder.length > 0) {
            this.selectedVisualizers = newOrder;
            console.log('Updated visualizer order:', this.selectedVisualizers.join(', '));
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
            } /*else if (param.name.includes('path') || param.name.includes('image') || param.name.includes('mode') 
                || param.name.includes('file') || param.name.includes('url')) {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <input type="text" id="${id}" name="${param.name}" 
                               value="${defaultValue !== null ? defaultValue : 'image.png'}">
                    </div>
                `;
            }*/ else {
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
        if (!item) return;
        
        const previewElement = item.querySelector('.config-preview code');
        if (previewElement) {
            try {
                const code = this.generatePreviewCode(visualizer);
                previewElement.textContent = code;
            } catch (err) {
                console.error(`Error generating preview for ${visualizer.name}:`, err);
                previewElement.textContent = `// Error generating preview: ${err.message}`;
            }
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
        
        // Special handling for functions that may use mode parameters
        // These functions include backgroundImage and centerImage
        if (visualizer.name === 'backgroundImage' || visualizer.name === 'centerImage') {
            // For these special functions, ensure we're using string modes correctly
            const paramArray = params.split(',').map(p => p.trim());
            
            // If the second parameter (mode) is not wrapped in quotes, wrap it
            if (paramArray.length > 1) {
                // Check if the mode parameter is a string that needs quotes
                const modeParam = paramArray[1];
                if (!modeParam.startsWith('"') && !modeParam.startsWith("'") && 
                    !modeParam.includes('width') && !modeParam.includes('height') &&
                    isNaN(parseFloat(modeParam))) {
                    // It's likely a mode string that needs quotes
                    paramArray[1] = `"${modeParam}"`;
                }
                
                // Rebuild the params string
                const updatedParams = paramArray.join(', ');
                // Get the visualizer color if available
                const visualizerColor = this.visualizerColors[visualizer.name];
                
                if (visualizerColor && visualizerColor !== '#ffffff') {
                    const rgb = this.hexToRgb(visualizerColor);
                    // Add tint command instead of fill for image functions
                    return `tint(${rgb.r}, ${rgb.g}, ${rgb.b}, 255); ${visualizer.name}(${updatedParams});`;
                } else {
                    return `${visualizer.name}(${updatedParams});`;
                }
            }
        }
        
        // Standard handling for other visualizers
        const visualizerColor = this.visualizerColors[visualizer.name];
        
        if (visualizerColor && visualizerColor !== '#ffffff') {
            // Convert hex color to r,g,b values
            const rgb = this.hexToRgb(visualizerColor);
            // Add fill command before the visualizer call with RGB values
            return `fill(${rgb.r}, ${rgb.g}, ${rgb.b}, 255); ${visualizer.name}(${params});`;
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
                
                // Enhanced safety for mode parameters
                let code = this.generatePreviewCode(visualizer);
                
                // Special handling for background/centerImage functions
                if ((name === 'backgroundImage' || name === 'centerImage') && 
                    !code.includes('"') && !code.includes("'")) {
                    // Force adding quotes around the second parameter if it might be a mode
                    const parts = code.split('(');
                    if (parts.length > 1) {
                        const params = parts[1].split(')')[0].split(',');
                        if (params.length > 1) {
                            const fileName = params[0].trim();
                            let mode = params[1].trim();
                            // Add quotes to mode if it's not already quoted and looks like a string
                            if (!mode.startsWith('"') && !mode.startsWith("'") && 
                                isNaN(parseFloat(mode)) && !mode.includes('width') && !mode.includes('height')) {
                                mode = `"${mode}"`;
                                code = `${name}(${fileName}, ${mode});`;
                            }
                        }
                    }
                }
                
                visualizerCode += '    ' + code + '\n\n';
            }
        });
        
        // Create the full template with a safer background call
        return `/*
 * KaleidoScript Visualizer
 * Generated by Visual Composer
 * 
 * If you are using the backgroundImage or centerImage visualizer,
 * make sure to set the correct mode in the function call for example: 'fill', 'fit', 'cover', etc.
 * 
 * Also, make sure to load the images in the setup() function using the defined variables outside
 * of the functions, and loadImage("Images/image.png") method to point to the corrisponding image in
 * the imports tab on the left.
 */
var backgroundImage; // Default background image if background image visualizer is used
var centerImage; // Default center image if center image visualizer is used

// Function to load and initialize everything
function setup() {
    background(10, 10, 30); // Dark blue background

    loadAudio("your-music.mp3"); // Load your audio file here
    audioPlay(); // Start audio playback

    backgroundImage = loadImage("background.jpg"); // Set default background image, need to load it from our imports 
    centerImage = loadImage("center.png"); // Set default center image, need to load it from our imports 
}

// Function to draw the visualizers and loops
function draw(time) {
    // Set background color with direct RGB values
    background(10, 10, 30, 0.1); // Dark blue background, with slight transparency for motion blur effect
    
    // Uncomment the next line to enable motion blur effect
    // motionBlurStart(0.7, "lighter")'; // Start motion blur effect
    
${visualizerCode}}`;
    }

    logKeywordStatus() {
        console.log("--- Visual Composer Diagnostics ---");
        console.log(`window.keywordInfo exists: ${!!window.keywordInfo}`);
        
        if (window.keywordInfo) {
            const visualizerKeywords = Object.entries(window.keywordInfo)
                .filter(([_, info]) => info.category === 'visualizer')
                .map(([key]) => key);
                
            console.log(`Found ${visualizerKeywords.length} visualizer keywords:`);
            console.log(visualizerKeywords);
        }
        
        console.log(`This.visualizers count: ${this.visualizers.length}`);
        console.log(`Selected visualizers: ${this.selectedVisualizers.length}`);
        console.log("--- End Diagnostics ---");
    }

    refreshVisualizers() {
        console.log("Refreshing visualizers...");
        
        // Re-extract visualizers from keywords
        this.visualizers = this.extractVisualizerFunctions();
        
        // Log how many we found
        console.log(`Found ${this.visualizers.length} visualizers after refresh`);
        
        // Re-populate the UI
        this.populateVisualizers();
        
        // Return the count for verification
        return this.visualizers.length;
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
    // Add mobile handling
    if (window.innerWidth <= 768 && typeof window.closeEditorPanel === 'function') {
        // Close the editor panel if it's visible on mobile
        window.closeEditorPanel();
    }

    if (this.overlay) {
        this.overlay.style.display = 'block';
    }
    
    // Rest of your existing openComposer code...
    this.overlay.style.visibility = 'visible';
    this.overlay.style.opacity = '1';
    
    // Make sure the overlay takes full width on mobile
    if (window.innerWidth <= 768) {
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.paddingBottom = '60px'; // Make room for the footer
    }
    
    // Force a refresh of the visualizers
    this.populateVisualizers();
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

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        console.log("Keyboard shortcut detected: opening Visual Composer");
        if (window.openVisualComposer) {
            window.openVisualComposer();
        } else {
            console.error("openVisualComposer function not available");
        }
    }
});

// Initialize the component when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if keywords are loaded, if not, wait for them
    if (!window.keywordInfo) {
        console.log('Keywords not yet loaded, waiting before initializing Visual Composer');
        const checkKeywords = setInterval(() => {
            if (window.keywordInfo) {
                clearInterval(checkKeywords);
                console.log('Keywords loaded, initializing Visual Composer');
                window.visualComposer = new VisualComposer();
            }
        }, 100);
    } else {
        window.visualComposer = new VisualComposer();
    }
});

window.forceRefreshAndOpen = function() {
    if (window.loadKeywords && typeof window.loadKeywords === 'function') {
        window.loadKeywords();
        console.log("Forced keyword refresh");
        
        // Wait a bit for keywords to load
        setTimeout(() => {
            const keywordsLoaded = window.checkKeywords();
            console.log(`Keywords loaded after refresh: ${keywordsLoaded}`);
            
            // Now open the composer
            if (window.visualComposer) {
                window.visualComposer.refreshVisualizers();
                window.visualComposer.openComposer();
            } else {
                window.openVisualComposer();
            }
        }, 300);
    } else {
        alert("loadKeywords function not available. Cannot refresh visualizers.");
    }
}

window.checkKeywords = function() {
    console.log("--- Keyword Status Check ---");
    if (window.keywordInfo) {
        console.log(`Keywords loaded: ${Object.keys(window.keywordInfo).length} total keywords`);
        
        const visualizers = Object.entries(window.keywordInfo)
            .filter(([_, info]) => info.category === 'visualizer')
            .map(([key]) => key);
            
        console.log(`Found ${visualizers.length} visualizer keywords:`);
        console.log(visualizers);
        
        return visualizers.length;
    } else {
        console.error("No keywords loaded!");
        return 0;
    }
}

window.openVisualComposer = function() {
    // Force refresh keywords first to ensure we have the latest
    if (window.loadKeywords && typeof window.loadKeywords === 'function') {
        window.loadKeywords();
        console.log("Calling loadKeywords() to refresh available visualizers");
    } else {
        console.warn("loadKeywords function not available");
    }
    
    // Give it a brief moment to load
    setTimeout(() => {
        if (window.keywordInfo) {
            if (!window.visualComposer) {
                console.log("Creating new VisualComposer instance");
                window.visualComposer = new VisualComposer();
                setTimeout(() => {
                    window.visualComposer.openComposer();
                }, 100);
            } else {
                // Always refresh visualizers when opening
                console.log("Using existing VisualComposer instance and refreshing");
                window.visualComposer.refreshVisualizers();
                window.visualComposer.openComposer();
            }
        } else {
            console.error("Keywords not loaded. Cannot open Visual Composer.");
            alert("Cannot initialize Visual Composer: keywords not loaded. Please reload the page.");
        }
    }, 200); // Wait for keywords to load
}

// Add some CSS to style the color picker
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .visualizer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-radius: 4px;
            background: #1e1e2e;
            border: 1px solid rgba(97, 218, 251, 0.1);
        }
        
        .visualizer-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
            position: relative;
            margin-bottom: 5px;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .visualizer-item.selected {
            box-shadow: 0 0 0 2px #61dafb;
        }
        
        .visualizer-item.selected .visualizer-header {
            background: rgba(97, 218, 251, 0.1);
        }
        
        .visualizer-header-content {
            flex-grow: 1;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .visualizer-drag-handle {
            cursor: move;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
            touch-action: none;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            transition: background 0.2s ease;
        }
        
        .selected .visualizer-drag-handle {
            cursor: grab;
        }
        
        .visualizer-drag-handle:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .visualizer-drag-handle:active {
            cursor: grabbing;
            background: rgba(255, 255, 255, 0.2);
        }
        
        .visualizer-color-picker {
            margin-right: 10px;
        }
        
        .visualizer-color {
            width: 26px;
            height: 26px;
            padding: 0;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .visualizer-color:hover {
            transform: scale(1.1);
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
            margin-bottom: 12px;
        }
        
        /* Layer badge styles */
        .layer-badge {
            font-size: 0.75rem;
            background: rgba(97, 218, 251, 0.2);
            color: #61dafb;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 8px;
            white-space: nowrap;
        }
        
        /* Layering instructions */
        .layer-instructions {
            color: #888;
            font-size: 0.85rem;
            text-align: center;
            padding: 10px;
            margin-bottom: 15px;
            border-bottom: 1px dashed #444;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        
        .layer-hint {
            margin-top: 5px;
            font-style: italic;
            color: #aaa;
        }
        
        .layer-legend {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .layer-arrow {
            display: flex;
            align-items: center;
        }
        
        .layer-arrow.top {
            color: #61dafb;
        }
        
        .layer-arrow.top:before {
            content: "⬆";
            margin-right: 5px;
        }
        
        .layer-arrow.bottom:before {
            content: "⬇";
            margin-right: 5px;
        }
        
        /* Drag and drop styles */
        .visualizer-item.dragging {
            opacity: 0.6;
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
            z-index: 100;
        }
        
        .visualizer-item.touch-dragging {
            opacity: 0.7;
        }
        
        .visualizer-item.drop-before {
            border-top: 2px solid #61dafb;
            margin-top: -2px;
        }
        
        .visualizer-item.drop-after {
            border-bottom: 2px solid #61dafb;
            margin-bottom: -2px;
        }
        
        .visualizer-item.touch-drop-before {
            box-shadow: 0 -2px 0 #61dafb;
        }
        
        .visualizer-item.touch-drop-after {
            box-shadow: 0 2px 0 #61dafb;
        }
        
        /* Animation for position change feedback */
        .visualizer-item.flash-position {
            animation: flash-bg 0.8s ease;
        }
        
        @keyframes flash-bg {
            0% { background-color: rgba(97, 218, 251, 0); }
            30% { background-color: rgba(97, 218, 251, 0.15); }
            100% { background-color: rgba(97, 218, 251, 0); }
        }
        
        .drag-ghost {
            background: #2d2d3a;
            color: #61dafb;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.9rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            position: fixed;
            top: 0;
            left: 0;
            opacity: 0.9;
            pointer-events: none;
            z-index: 2000;
            transform: translate(-1000px, -1000px);
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
        
        /* Visualizer config section */
        .visualizer-config {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .visualizer-config.open {
            max-height: 1000px;
            padding: 15px;
            border-top: 1px solid rgba(97, 218, 251, 0.1);
        }
        
        .visualizer-toggle {
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            width: 30px;
            height: 30px;
            padding: 0;
            transition: transform 0.2s ease;
        }
        
        .visualizer-toggle:hover {
            color: #fff;
        }
        
        .visualizer-toggle.open {
            transform: rotate(180deg);
        }

        .composer-debug-btn {
            background: rgba(97, 218, 251, 0.2);
            color: #61dafb;
            border: 1px solid rgba(97, 218, 251, 0.3);
            border-radius: 4px;
            padding: 3px 8px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-left: 10px;
        }

        .visualizer-order-buttons {
            display: flex;
            flex-direction: column;
            margin-right: 8px;
        }
        
        .visualizer-order-up,
        .visualizer-order-down {
            background: none;
            border: none;
            padding: 3px;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: all 0.2s ease;
        }
        
        .visualizer-order-up:hover,
        .visualizer-order-down:hover {
            background: rgba(97, 218, 251, 0.15);
            opacity: 1;
        }
        
        .visualizer-order-up:active,
        .visualizer-order-down:active {
            background: rgba(97, 218, 251, 0.3);
            transform: scale(1.1);
        }
        
        .visualizer-order-up[disabled],
        .visualizer-order-down[disabled] {
            cursor: default;
            opacity: 0.3;
            pointer-events: none;
        }
        
        /* Adjust the header spacing to accommodate the new buttons */
        .visualizer-color-picker {
            margin-right: 6px;
        }
        
        @media (max-width: 768px) {
            /* Make headers easier to tap on mobile */
            .visualizer-header {
                min-height: 44px;
                padding: 10px;
            }
            
            .visualizer-drag-handle {
                padding: 10px;
                margin: -5px 10px -5px -5px;
                width: 44px;
                height: 44px;
            }
            
            .layer-badge {
                margin: 2px 0 0 8px;
            }
        }
    `;
        style.textContent += `
        /* Update styles to better support non-selected draggable items */
        .visualizer-drag-handle {
            cursor: move;  /* All items can be moved */
        }
        
        .visualizer-item {
            position: relative;
            border: 1px solid transparent;
        }
        
        .visualizer-item:hover {
            border-color: rgba(97, 218, 251, 0.3);
        }
        
        .visualizer-order-up:hover path,
        .visualizer-order-down:hover path {
            fill: #61dafb !important;  /* Always highlight on hover */
        }
        
        /* Clearer indication for non-selected item interactions */
        .visualizer-item:not(.selected):hover .visualizer-drag-handle path,
        .visualizer-item:not(.selected):hover .visualizer-order-up path,
        .visualizer-item:not(.selected):hover .visualizer-order-down path {
            fill: #aaa;  /* Lighter color on hover for non-selected */
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
        
        lastUpdatedElement.textContent = `v1.0.9 (${day}/${month}/${year})`;
    }
    
    // Initialize once we have keywords
    if (window.keywordInfo) {
        console.log("Keywords already available, initializing Visual Composer");
        if (!window.visualComposer) {
            window.visualComposer = new VisualComposer();
        }
    } else {
        console.log("Keywords not yet loaded, will initialize when available");
        const checkKeywords = setInterval(() => {
            if (window.keywordInfo) {
                clearInterval(checkKeywords);
                console.log("Keywords now available, initializing Visual Composer");
                if (!window.visualComposer) {
                    window.visualComposer = new VisualComposer();
                }
            }
        }, 200);
    }
});