/**
 * Visual Composer for KaleidoScript
 * Allows creating visualizations without writing code
 */

class VisualComposer {
    constructor() {
        this.selectedVisualizers = [];
        this.visualizerConfigs = {};
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
        
        try {
            // Extract parameters from the function signature
            const paramStr = signature.match(/\(([^)]*)\)/);
            if (paramStr && paramStr[1]) {
                return paramStr[1].split(',').map(param => {
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
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each visualizer as a collapsible item
        this.visualizers.forEach((visualizer, index) => {
            const isSelected = this.selectedVisualizers.includes(visualizer.name);
            
            const item = document.createElement('div');
            item.className = 'visualizer-item';
            item.dataset.name = visualizer.name;
            
            item.innerHTML = `
                <div class="visualizer-header">
                    <div class="visualizer-header-content">
                        <input type="checkbox" class="visualizer-checkbox" 
                               id="viz-${index}" ${isSelected ? 'checked' : ''}>
                        <span class="visualizer-title">${visualizer.title}</span>
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
            
            // Add event listeners
            const checkbox = item.querySelector('.visualizer-checkbox');
            checkbox.addEventListener('change', (e) => {
                this.toggleVisualizerSelection(visualizer.name, e.target.checked);
                this.updatePreview(item, visualizer);
            });
            
            const toggle = item.querySelector('.visualizer-toggle');
            toggle.addEventListener('click', () => {
                const config = item.querySelector('.visualizer-config');
                config.classList.toggle('open');
                toggle.classList.toggle('open');
            });
            
            // Add event listeners to config inputs for live preview updates
            const inputs = item.querySelectorAll('input, select');
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
            
            // Initialize config for this visualizer if selected
            if (isSelected) {
                this.updateConfig(visualizer.name);
            }
        });
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
            let defaultValue = param.defaultValue;
            
            // Special handling for commonly used parameters
            if (param.name === 'x' && defaultValue === null) defaultValue = 'width/2';
            if (param.name === 'y' && defaultValue === null) defaultValue = 'height/2';
            if (param.name === 'width' && defaultValue === null) defaultValue = 'width';
            if (param.name === 'height' && defaultValue === null) defaultValue = 'height';
            
            // Use existing config if available
            if (this.visualizerConfigs[visualizerName] && this.visualizerConfigs[visualizerName][param.name] !== undefined) {
                defaultValue = this.visualizerConfigs[visualizerName][param.name];
            }
            
            if (param.type === 'boolean') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="true" ${defaultValue === true ? 'selected' : ''}>Yes</option>
                            <option value="false" ${defaultValue === false ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                `;
            } else if (param.type === 'color') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <input type="color" id="${id}" name="${param.name}" 
                               value="${defaultValue || '#61dafb'}">
                    </div>
                `;
            } else if (param.name === 'x') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="0" ${defaultValue === 0 ? 'selected' : ''}>Left (0)</option>
                            <option value="width/2" ${defaultValue === 'width/2' || defaultValue === null ? 'selected' : ''}>Center</option>
                            <option value="width" ${defaultValue === 'width' ? 'selected' : ''}>Right</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
            } else if (param.name === 'y') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="0" ${defaultValue === 0 ? 'selected' : ''}>Top (0)</option>
                            <option value="height/2" ${defaultValue === 'height/2' || defaultValue === null ? 'selected' : ''}>Middle</option>
                            <option value="height" ${defaultValue === 'height' ? 'selected' : ''}>Bottom</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
            } else if (param.name === 'width') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="width" ${defaultValue === 'width' || defaultValue === null ? 'selected' : ''}>Full Width</option>
                            <option value="width/2" ${defaultValue === 'width/2' ? 'selected' : ''}>Half Width</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
            } else if (param.name === 'height') {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="height" ${defaultValue === 'height' || defaultValue === null ? 'selected' : ''}>Full Height</option>
                            <option value="height/2" ${defaultValue === 'height/2' ? 'selected' : ''}>Half Height</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
            } else if (param.name.includes('freq') && param.name.includes('Start')) {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="20" ${defaultValue === 20 || defaultValue === null ? 'selected' : ''}>Bass (20Hz)</option>
                            <option value="200" ${defaultValue === 200 ? 'selected' : ''}>Mid-Low (200Hz)</option>
                            <option value="500" ${defaultValue === 500 ? 'selected' : ''}>Mid (500Hz)</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                `;
            } else if (param.name.includes('freq') && param.name.includes('End')) {
                return `
                    <div class="config-field">
                        <label for="${id}">${param.label}</label>
                        <select id="${id}" name="${param.name}">
                            <option value="2000" ${defaultValue === 2000 || defaultValue === null ? 'selected' : ''}>High (2000Hz)</option>
                            <option value="5000" ${defaultValue === 5000 ? 'selected' : ''}>Very High (5000Hz)</option>
                            <option value="1000" ${defaultValue === 1000 ? 'selected' : ''}>Mid-High (1000Hz)</option>
                            <option value="custom">Custom</option>
                        </select>
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
        
        const inputs = item.querySelectorAll('input, select');
        const config = this.visualizerConfigs[visualizerName] || {};
        
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
        
        return `${visualizer.name}(${params});`;
    }
    
    toggleVisualizerSelection(name, isSelected) {
        if (isSelected) {
            if (!this.selectedVisualizers.includes(name)) {
                this.selectedVisualizers.push(name);
            }
        } else {
            this.selectedVisualizers = this.selectedVisualizers.filter(v => v !== name);
        }
    }
    
    generateCode() {
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
        
        // Generate code for each selected visualizer
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

loadAudio("your-music.mp3");

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