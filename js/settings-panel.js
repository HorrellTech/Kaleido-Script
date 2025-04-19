/*
    * SettingsPanel.js
    * This module creates a settings panel for a web-based animation editor.
    * It allows users to adjust animation settings dynamically and save them back to the code editor.
    * The panel is designed to be user-friendly and responsive to changes in the animation settings.
    * 
    * Work in progress: This is a work in progress and may not be fully functional yet.
*/
class SettingsPanel {
    constructor() {
        // Add debug logging
        console.log('SettingsPanel constructor called');
        this.init();
    }

    init() {
        // Create panel if it doesn't exist
        this.panel = document.getElementById('settings-panel');
        if (!this.panel) {
            console.error('Settings panel not found, creating it');
            this.panel = this.createPanel();
        }

        // Initialize panel elements
        this.toggle = this.createToggleButton();
        this.header = this.createHeader();
        this.content = this.createContent();
        this.footer = this.createFooter();

        // Clear and rebuild panel
        this.panel.innerHTML = '';
        this.panel.appendChild(this.toggle);
        this.panel.appendChild(this.header);
        this.panel.appendChild(this.content);
        this.panel.appendChild(this.footer);

        this.settings = null;
        this.originalSettings = null;

        // Debug logging for panel structure
        console.log('Panel initialized:', {
            panel: this.panel,
            toggle: this.toggle,
            content: this.content
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.className = 'settings-panel';
        
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.appendChild(panel);
        } else {
            console.error('Canvas container not found');
        }
        
        return panel;
    }

    createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'settings-toggle';
        toggle.innerHTML = '<i class="fas fa-sliders-h"></i>';
        return toggle;
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerHTML = '<h3>Animation Settings</h3>';
        return header;
    }

    createContent() {
        const content = document.createElement('div');
        content.className = 'settings-content';
        return content;
    }

    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'settings-footer';
        const saveButton = document.createElement('button');
        saveButton.className = 'btn-save-settings';
        saveButton.textContent = 'Save Settings';
        footer.appendChild(saveButton);
        return footer;
    }

    setupEventListeners() {
        this.toggle.addEventListener('click', () => {
            console.log('Toggle clicked'); // Debug log
            this.togglePanel();
        });

        this.footer.querySelector('.btn-save-settings')
            .addEventListener('click', () => this.saveSettings());

        if (window.editor) {
            window.editor.on('change', () => {
                if (this.panel.classList.contains('expanded')) {
                    this.checkForSettings();
                }
            });
        }

        // Initial check for settings
        this.checkForSettings();
    }

    togglePanel() {
        window.logToConsole('Toggling panel, current expanded state:' + 
            this.panel.classList.contains('expanded')); // Debug log
        
        if (!this.panel.classList.contains('expanded')) {
            this.checkForSettings();
        }
        this.panel.classList.toggle('expanded');
    }

    checkForSettings() {
        if (!window.editor) {
            console.log('Editor not available');
            return;
        }
        
        const code = window.editor.getValue();
        console.log('Checking code for settings...');
        
        // Updated regex to better match settings object
        const settingsMatch = code.match(/\/\/\s*Settings[\s\S]*?var\s+settings\s*=\s*({[\s\S]*?});/);
        
        if (settingsMatch && settingsMatch[1]) {
            try {
                const cleanSettings = settingsMatch[1]
                    .replace(/\/\/.*/g, '') // Remove comments
                    .replace(/\s+/g, ' ')   // Clean whitespace
                    .trim();
                
                console.log('Found settings object:', cleanSettings);
                    
                this.settings = new Function(`return ${cleanSettings}`)();
                this.originalSettings = {...this.settings};
                
                console.log('Parsed settings:', this.settings);
                
                // Create controls only if we have settings
                if (Object.keys(this.settings).length > 0) {
                    this.createControls();
                    console.log('Controls created');
                } else {
                    console.log('No settings properties found');
                }
            } catch (e) {
                console.error('Error parsing settings:', e);
            }
        } else {
            console.log('No settings match found in code');

            // If no settings are found, clear the content and add a text centered message to say there are no settings found, settings need to be laid out like "var settings = ...
            this.content.innerHTML = `<p class="no-settings">No settings found. Please define settings in the format: <code>
const settings = {
  squidCount: 6,           // Number of squids
  jellyfishCount: 8,       // Number of jellyfish
  bubbleRate: 0.3,         // Bubble creation rate
  glowStrength: 0.7,       // Bioluminescent glow intensity (0-1)
  waterEffect: 0.6,        // Water movement effect strength (0-1)
  colorScheme: "deep",     // "deep", "toxic", or "twilight"
  depthWaves: true         // Show underwater light rays
};            
</code></p>`;
            this.content.style.textAlign = 'center';
            this.content.style.color = '#888';
            this.content.style.fontStyle = 'italic';
            this.content.style.padding = '20px';
            this.content.style.fontSize = '14px';
            this.content.style.lineHeight = '1.5';
            this.content.style.fontFamily = 'Arial, sans-serif';
            this.content.style.borderRadius = '5px';
            this.content.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            this.content.style.margin = '10px 0';

        }
    }

    createControls() {
        this.content.innerHTML = '';
        console.log('Creating controls for settings:', this.settings);
        
        for (const [key, value] of Object.entries(this.settings)) {
            const item = document.createElement('div');
            item.className = 'setting-item';
            
            console.log(`Creating control for ${key} (${typeof value}):`, value);
            
            if (typeof value === 'number') {
                // For numbers, determine appropriate range and step
                const isInteger = Number.isInteger(value);
                const step = isInteger ? 1 : 0.1;
                let min = 0;
                let max = isInteger ? 100 : 1;
                
                // Adjust max based on current value
                if (value > max) {
                    max = Math.ceil(value * 1.5);
                }
                
                item.innerHTML = `
                    <label>${this.formatLabel(key)}</label>
                    <div class="range-container">
                        <input type="range" 
                               id="setting-${key}"
                               min="${min}" 
                               max="${max}" 
                               step="${step}" 
                               value="${value}">
                        <span class="range-value">${value}</span>
                    </div>
                `;
                
                const input = item.querySelector('input');
                const valueSpan = item.querySelector('.range-value');
                
                input.addEventListener('input', (e) => {
                    const newValue = parseFloat(e.target.value);
                    this.settings[key] = newValue;
                    valueSpan.textContent = newValue.toFixed(2);
                    this.updateRunningAnimation();
                });
            } else if (typeof value === 'boolean') {
                item.innerHTML = `
                    <label class="checkbox-label">
                        <input type="checkbox" 
                               id="setting-${key}"
                               ${value ? 'checked' : ''}>
                        ${this.formatLabel(key)}
                    </label>
                `;
                
                item.querySelector('input').addEventListener('change', (e) => {
                    this.settings[key] = e.target.checked;
                    this.updateRunningAnimation();
                });
            } else if (typeof value === 'string') {
                // Check if string represents enum-like options
                const enumMatch = value.match(/["']([^"']*)["']/g);
                
                if (enumMatch) {
                    const options = enumMatch.map(opt => opt.replace(/['"]/g, ''));
                    
                    item.innerHTML = `
                        <label>${this.formatLabel(key)}</label>
                        <select id="setting-${key}">
                            ${options.map(opt => 
                                `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                            ).join('')}
                        </select>
                    `;
                    
                    item.querySelector('select').addEventListener('change', (e) => {
                        this.settings[key] = e.target.value;
                        this.updateRunningAnimation();
                    });
                } else {
                    item.innerHTML = `
                        <label>${this.formatLabel(key)}</label>
                        <input type="text" 
                               id="setting-${key}"
                               value="${value}">
                    `;
                    
                    item.querySelector('input').addEventListener('change', (e) => {
                        this.settings[key] = e.target.value;
                        this.updateRunningAnimation();
                    });
                }
            }
            
            this.content.appendChild(item);
        }
    }

    initializeInInterpreter() {
        if (window.interpreter && this.settings) {
            window.interpreter.variables.settings = this.settings;
        }
    }

    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    updateRunningAnimation() {
        if (!window.interpreter || !this.settings) {
            console.log('Interpreter or settings not available');
            return;
        }
    
        // Update the settings in the interpreter's context
        window.interpreter.variables.settings = this.settings;
        
        // If we have a renderer and it's running
        if (window.renderer) {
            if (window.renderer.isRunning) {
                // Force immediate frame update
                if (window.renderer.drawFunction) {
                    try {
                        window.renderer.drawFunction(performance.now());
                        console.log('Animation frame updated with new settings:', this.settings);
                    } catch (error) {
                        console.error('Error updating animation:', error);
                    }
                }
            } else {
                // If not running, try to restart the animation
                try {
                    window.renderer.play();
                    console.log('Animation restarted with new settings');
                } catch (error) {
                    console.error('Error restarting animation:', error);
                }
            }
        }
    }

    saveSettings() {
        if (!window.editor || !this.settings) {
            console.log('Editor or settings not available');
            return;
        }
    
        const code = window.editor.getValue();
        const settingsString = JSON.stringify(this.settings, null, 2)
            .replace(/^{/, '{\n  ')
            .replace(/}$/, '\n}')
            .replace(/"/g, '')
            .replace(/,\n/g, ',\n  ');
            
        const updatedCode = code.replace(
            /(\/\/\s*Settings[\s\S]*?var\s+settings\s*=\s*){[\s\S]*?};/,
            `$1${settingsString};`
        );
        
        window.editor.setValue(updatedCode);
        
        // Force re-evaluation of the code with new settings
        if (window.interpreter) {
            window.interpreter.evaluate(updatedCode);
            console.log('Code re-evaluated with new settings');
        }
        
        window.logToConsole('Settings saved and applied', 'info');
    }
}

// Initialize only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SettingsPanel');
    window.settingsPanel = new SettingsPanel();
});