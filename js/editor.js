let codeEditor;
let currentFilename = 'main.js';
let hintHTML = '';

function initEditor() {
    if (!window.keywordInfo || !window.editorKeywords) {
        console.error('Keywords not loaded! Make sure keywords.js is loaded before editor.js');
        return;
    }

    codeEditor = CodeMirror(document.getElementById('code-editor'), {
        value: getDefaultCode(),
        mode: "javascript",
        theme: "darcula",
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: false,
        styleActiveLine: true,
        styleActiveSelected: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        },
        hintOptions: {
            completeSingle: false,
            hint: function(editor) {
                const cursor = editor.getCursor();
                const token = editor.getTokenAt(cursor);
                const currentWord = token.string.toLowerCase();
                
                const matches = window.editorKeywords.filter(word => 
                    word.toLowerCase().startsWith(currentWord)
                );

                return {
                    list: matches.map(word => ({
                        text: word,
                        displayText: word,
                        description: window.keywordInfo[word]?.description || ''
                    })),
                    from: CodeMirror.Pos(cursor.line, token.start),
                    to: CodeMirror.Pos(cursor.line, token.end)
                };
            }
        }
    });

    document.querySelector('.editor-hints').style.height = '150px'; // Set default height for hints panel

    // Add KScript mode detection
    /*codeEditor.on('change', function(cm) {
        // Check if the first line contains #kscript
        const firstLine = cm.getLine(0);
        if (firstLine && firstLine.trim().startsWith('#kscript')) {
            // Set a CSS class to indicate KScript mode
            cm.getWrapperElement().classList.add('kscript-mode');
        } else {
            cm.getWrapperElement().classList.remove('kscript-mode');
        }
    });*/

    codeEditor.on('change', function() {
        // Use setTimeout to avoid performance issues with frequent updates
        clearTimeout(window.hintSizeTimeout);
        window.hintSizeTimeout = setTimeout(maintainHintPanelSize, 100);
    });

    window.editor = codeEditor;
    codeEditor.on('cursorActivity', updateHints);
    setTimeout(updateHints, 100);

    // Initialize the hint resizer
    initEditorResizers();

    setTimeout(maintainHintPanelSize, 200); // Short delay to ensure DOM is ready
    setTimeout(addVisualComposerButton, 100);
}

function addVisualComposerButton() {
    const editorHeader = document.querySelector('.editor-header');
    if (!editorHeader) return;
    
    const visualComposerBtn = document.createElement('button');
    visualComposerBtn.className = 'composer-button';
    visualComposerBtn.id = 'visual-composer-btn';
    visualComposerBtn.innerHTML = '<i class="fas fa-magic"></i> Visual Composer';
    visualComposerBtn.title = 'Create visualizations without coding';
    
    const blockComposerBtn = document.createElement('button');
    blockComposerBtn.className = 'composer-button block-composer-btn';
    blockComposerBtn.id = 'block-composer-btn';
    blockComposerBtn.innerHTML = '<i class="fas fa-cubes"></i> Block Composer';
    blockComposerBtn.title = 'Create code using blocks';
    
    editorHeader.appendChild(visualComposerBtn);
    editorHeader.appendChild(blockComposerBtn);
    
    visualComposerBtn.addEventListener('click', function() {
        if (window.openVisualComposer) {
            window.openVisualComposer();
        } else {
            console.error('Visual Composer not loaded or initialized');
            alert('Visual Composer is not available. Please make sure visual-composer.js is loaded properly.');
        }
    });
    
    blockComposerBtn.addEventListener('click', function() {
        if (window.openBlockComposer) {
            window.openBlockComposer();
        } else {
            console.error('Block Composer not loaded or initialized');
            alert('Block Composer is not available. Please make sure block-composer.js is loaded properly.');
        }
    });
}

window.addEventListener('resize', maintainHintPanelSize);

function maintainHintPanelSize() {
    const editorPanel = document.querySelector('.editor-panel');
    const editorHints = document.querySelector('.editor-hints');
    const codeEditor = document.getElementById('code-editor');
    
    if (!editorPanel || !editorHints || !codeEditor) return;
    
    // Set default hint panel height to a more reasonable size (150px instead of 100px)
    const defaultHeight = 150;
    
    // Get the current height of the hint panel
    const currentHintHeight = editorHints.offsetHeight;
    
    // Calculate total available height
    const totalHeight = editorPanel.offsetHeight;
    
    // Calculate reasonable proportions
    // Default to 25% of the editor panel height, but not less than 150px
    const targetHeight = Math.max(defaultHeight, Math.floor(totalHeight * 0.25));
    
    // Ensure hint panel height is between min and max values
    const minHeight = defaultHeight; // Minimum height in pixels
    const maxHeight = Math.floor(editorPanel.offsetHeight * 0.4); // 40% of editor panel
    
    // Apply the constrained height - prioritize targetHeight but stay within bounds
    const newHeight = Math.min(maxHeight, Math.max(minHeight, targetHeight));
    editorHints.style.height = `${newHeight}px`;
    
    // Refresh CodeMirror to ensure proper rendering
    if (window.editor) {
        window.editor.refresh();
    }
}

function getDefaultCode() {
    return `var cImage = null;

function setup() {
    loadAudio("Music/Be My Moon.wav");
    playAudio();
  
    cImage = loadImage("Images/MoonBroken.png");
}

function draw(time) {
    // Dark background
    background(5, 5, 10);
  	
  	fill(220, 16, 128, 1);
    
  	visualCircular(width / 2, height / 2, 150, 250, 64, 20, 2000, time * 0.001, true);
  
    // Add album art in the center with glow that responds to bass
    visualCenterImage(cImage, 200, 0.6, "#FF33AA");
    
  	stroke(220 + (audiohz(200) * 500), 16, 128, .6);
  
  	visualBar(0, height, width, 60, 128, 2, 5, 0, true, true);
    
  	// Overlay some particles for additional visual interest
    visualParticle(0, 0, width, height, 40, 500, 4000, true);
}`;
}

function getKScriptDefaultCode() {
    return `#kscript
/**
 * KaleidoScript (KScript Syntax)
 * A creative coding environment for audio-reactive visualizations
 */

// Global settings
settings = {
  background: [20, 20, 30],
  primary: [0, 150, 255],
  accent: [255, 50, 150],
  intensity: 1.0,
  speed: 1.0
}

// Setup block
setup:
  // Set initial background color
  background settings.background[0] settings.background[1] settings.background[2]
  
  // Uncomment to load and play audio
  // loadAudio "your_audio_file.mp3"
  // playAudio
  
  // Log a message to show setup is complete
  log "Setup complete!"
end setup

// Draw block - runs every animation frame
draw:
  // Clear with background color
  background settings.background[0] settings.background[1] settings.background[2]
  
  // Calculate center position and radius
  centerX = width / 2
  centerY = height / 2
  radius = 100 + Math.sin(time * 0.001 * settings.speed) * 50
  
  // Use the primary color
  fill settings.primary[0] settings.primary[1] settings.primary[2]
  
  // Draw the circle
  circle centerX centerY radius * settings.intensity
  
  // Add some text
  fill 255 255 255
  text "KaleidoScript is ready!" centerX - 80 centerY - radius - 20 16
end draw`;
}

function updateEditorTheme(theme, isPreview = false) {
    if (!codeEditor) return;
    
    codeEditor.setOption("theme", theme);
    
    if (!isPreview) {
        // Save the theme preference to localStorage
        localStorage.setItem('kaleidoScript.theme', theme);
        
        // Show a notification if not in preview mode
        if (window.logToConsole) {
            window.logToConsole(`Theme changed to ${theme}`);
        }
    }
}

function previewEditorTheme(theme) {
    updateEditorTheme(theme, true);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('kaleidoScript.theme') || 'monokai';
    updateEditorTheme(savedTheme);
    
    // Update the select dropdown to match the saved theme
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function initThemeSelector() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;
    
    // Add preview on hover/focus
    themeSelect.addEventListener('change', function() {
        previewEditorTheme(this.value);
    });
    
    // Apply button saves the theme
    const applyButton = document.getElementById('apply-settings');
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            updateEditorTheme(themeSelect.value);
        });
    }
    
    // Load saved theme on init
    loadSavedTheme();
}

function updateHints() {
    // Get hint content element
    let hintContent = document.getElementById('hint-content');
    if (!hintContent) return;

    // Default hint HTML
    const defaultHint = `
        <div class="hint-title">Welcome to KaleidoScript!</div>
        <div class="hint-description">Start typing to see hints for available functions and keywords.</div>
        <div class="hint-example">Example: <code>circle(400, 300, 50);</code></div>
    `;

    // Early return if missing dependencies
    if (!window.editor || !window.keywordInfo) {
        hintContent.innerHTML = defaultHint;
        return;
    }

    // Get current cursor position and line
    const cursor = window.editor.getCursor();
    const line = window.editor.getLine(cursor.line);
    
    // Get current partial word at cursor
    const token = window.editor.getTokenAt(cursor);
    const currentWord = token.string.trim();
    
    // Find all matches for the current partial word
    const matches = [];
    if (currentWord && currentWord.length > 0) {
        for (const keyword of window.editorKeywords) {
            if (keyword.toLowerCase().startsWith(currentWord.toLowerCase())) {
                matches.push(keyword);
            }
        }
    }
    
    // Extract first word from line (remove anything after first bracket or space)
    const firstWord = line.trim().split(/[\s\(]/)[0];
    
    // First check if we have a specific keyword that matches the first word
    if (firstWord && window.keywordInfo[firstWord]) {
        const info = window.keywordInfo[firstWord];
        hintContent.innerHTML = `
            <div class="hint-title">${info.name || firstWord}</div>
            <div class="hint-description">${info.description || 'KaleidoScript function'}</div>
            <div class="hint-example">Example: <code>${info.example || firstWord + '()'}</code></div>
        `;
    } 
    // Next check if we have partial matches for the current word
    else if (matches.length > 0) {
        // Show all matches, not just the first 5
        const matchList = matches.map(match => {
            const info = window.keywordInfo[match];
            const functionSignature = info?.signature || `${match}()`;
            const description = info?.description ? 
                (info.description.length > 60 ? info.description.substring(0, 60) + '...' : info.description) : '';
            
            return `<div class="hint-match" data-keyword="${match}" data-signature="${functionSignature}">
                <code>${match}</code> - ${description}
            </div>`;
        }).join('');
        
        hintContent.innerHTML = `
            <div class="hint-title">Suggestions</div>
            <div class="hint-description">Click a suggestion to insert it:</div>
            <div class="hint-matches">${matchList}</div>
        `;
        
        // Add click handlers for all matches
        const matchElements = hintContent.querySelectorAll('.hint-match');
        matchElements.forEach(matchElement => {
            matchElement.addEventListener('click', function() {
                const keyword = this.dataset.keyword;
                const signature = this.dataset.signature || `${keyword}()`;
                
                // Get the token position
                const from = {line: cursor.line, ch: token.start};
                const to = {line: cursor.line, ch: token.end};
                
                // Replace the current word with the full function signature
                window.editor.replaceRange(signature, from, to);
                
                // Position cursor inside the parentheses
                const cursorPos = {
                    line: cursor.line, 
                    ch: token.start + signature.indexOf('(') + 1
                };
                window.editor.setCursor(cursorPos);
                
                // Focus the editor
                window.editor.focus();
                
                // Log the insertion
                if (window.logToConsole) {
                    window.logToConsole(`Inserted function: ${keyword}`);
                }
            });
        });
    } else {
        // No keyword found, show default hint
        hintContent.innerHTML = defaultHint;
    }

    // Use our new separate function to add and animate the help button
    addPulsingHelpButton();

    // Make the hint panel scrollable if there are many suggestions
    if (matches.length > 10) {
        const matchesContainer = hintContent.querySelector('.hint-matches');
        if (matchesContainer) {
            matchesContainer.style.maxHeight = '200px';
            matchesContainer.style.overflowY = 'auto';
            matchesContainer.style.padding = '5px';
            matchesContainer.style.border = '1px solid #444';
            matchesContainer.style.borderRadius = '4px';
        }
    }

    // Add at the end of the function:
    maintainHintPanelSize();
}

function addPulsingHelpButton() {
    // Add the help button
    const helpButton = document.createElement('button');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '<i class="fas fa-question-circle"></i>';
    helpButton.title = 'Show function reference';
    helpButton.id = 'hint-help-button';
    helpButton.onclick = showFunctionReference;
    
    // Add help button to hint container
    const hintHeader = document.querySelector('.hint-header');
    if (hintHeader && !hintHeader.querySelector('.help-button')) {
        hintHeader.appendChild(helpButton);
        
        // Add CSS for the enhanced pulsing animation with glow
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-help {
                0% { 
                    color: #61dafb; 
                    text-shadow: 0 0 0 rgba(255, 255, 255, 0);
                }
                50% { 
                    color: #a0e6ff; 
                    text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
                }
                100% { 
                    color: #61dafb; 
                    text-shadow: 0 0 0 rgba(255, 255, 255, 0);
                }
            }
            
            .help-button.pulsing {
                animation: pulse-help 2s ease-in-out;
            }
            
            .help-button {
                position: relative;
                overflow: visible;
            }
            
            @keyframes glow-ring {
                0% {
                    opacity: 0;
                    transform: scale(1);
                    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
                }
                15% {
                    opacity: 0.1;
                }
                50% {
                    opacity: 0.3;
                    transform: scale(1.4);
                    box-shadow: 0 0 10px rgba(160, 230, 255, 0.5);
                }
                85% {
                    opacity: 0.1;
                }
                100% {
                    opacity: 0;
                    transform: scale(1);
                    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
                }
            }
            
            .help-button:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 50%;
                background: transparent;
                pointer-events: none;
                opacity: 0;
            }
            
            .help-button.pulsing:before {
                animation: glow-ring 2s ease-in-out;
            }
        `;
        document.head.appendChild(style);
        
        // Set up the interval to pulse the button every 10 seconds
        setInterval(() => {
            const helpBtn = document.getElementById('hint-help-button');
            if (helpBtn) {
                helpBtn.classList.add('pulsing');
                
                // Remove the class after animation completes
                setTimeout(() => {
                    helpBtn.classList.remove('pulsing');
                }, 2000);
            }
        }, 4000);
    }
}

function addKScriptToggle() {
    const editorToolbar = document.querySelector('.editor-toolbar');
    if (!editorToolbar) return;
    
    const kscriptToggle = document.createElement('button');
    kscriptToggle.id = 'kscript-toggle';
    kscriptToggle.className = 'editor-button';
    kscriptToggle.innerHTML = '<i class="fas fa-code"></i> KScript Mode';
    kscriptToggle.title = 'Toggle between JavaScript and KScript';
    
    editorToolbar.appendChild(kscriptToggle);
    
    kscriptToggle.addEventListener('click', function() {
        const currentCode = codeEditor.getValue();
        if (currentCode.trim().startsWith('#kscript')) {
            // Convert from KScript to JavaScript
            if (window.kscriptParser) {
                const jsCode = window.kscriptParser.parse(currentCode);
                codeEditor.setValue(jsCode);
                window.logToConsole('Converted from KScript to JavaScript');
            }
        } else {
            // Switch to KScript template
            if (confirm('Switch to KScript mode? This will replace your current code with a KScript template.')) {
                codeEditor.setValue(getKScriptDefaultCode());
                window.logToConsole('Switched to KScript mode');
            }
        }
    });
}

// Call this after initEditor in the main.js
function initKScriptSupport() {
    addKScriptToggle();
}

// Function to show comprehensive function reference
function showFunctionReference() {
    // Create modal if it doesn't exist yet
    let referenceModal = document.getElementById('reference-modal');
    if (!referenceModal) {
        referenceModal = document.createElement('div');
        referenceModal.id = 'reference-modal';
        referenceModal.className = 'reference-modal';
        
        // Create modal content
        referenceModal.innerHTML = `
            <div class="reference-content">
                <div class="reference-header">
                    <h2>KaleidoScript Function Reference</h2>
                    <button class="close-reference"><i class="fas fa-times"></i></button>
                </div>
                <div class="reference-body">
                    <div class="reference-sidebar"></div>
                    <div class="reference-details">
                        <div class="reference-placeholder">
                            <i class="fas fa-arrow-left"></i>
                            Select a function from the list to view details
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(referenceModal);
        
        // Add event listener to close button
        referenceModal.querySelector('.close-reference').addEventListener('click', () => {
            referenceModal.style.display = 'none';
        });
        
        // Fill the sidebar with categories and functions
        populateReferenceSidebar();
    }
    
    // Show the modal
    referenceModal.style.display = 'flex';
}

// Helper function to populate reference sidebar
function populateReferenceSidebar() {
    const sidebar = document.querySelector('.reference-sidebar');
    if (!sidebar || !window.keywordInfo) return;
    
    // Group functions by category
    const categories = {};
    
    // Process all keywords and group by category
    for (const [keyword, info] of Object.entries(window.keywordInfo)) {
        // Generate signature if not already present
        if (!info.signature && info.example) {
            info.signature = extractFunctionSignature(keyword, info.example);
        }
        
        const category = info.category || 'other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ keyword, info });
    }
    
    // Generate HTML for each category
    let sidebarHTML = '';
    
    // Nice category names mapping
    const categoryNames = {
        'shapes': 'Shapes & Drawing',
        'color': 'Colors & Styles',
        'turtle': 'Turtle Graphics',
        'audio': 'Audio Controls',
        'math': 'Math Functions',
        'visualizer': 'Audio Visualizers',
        'lifecycle': 'Lifecycle Hooks',
        'utility': 'Utilities',
        'other': 'Other Functions'
    };
    
    // Sort categories by name
    const sortedCategories = Object.keys(categories).sort((a, b) => {
        // First by priority order (if we want to force certain categories to top)
        const priorityOrder = ['lifecycle', 'shapes', 'color'];
        const priorityA = priorityOrder.indexOf(a);
        const priorityB = priorityOrder.indexOf(b);
        
        if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
        if (priorityA !== -1) return -1;
        if (priorityB !== -1) return 1;
        
        // Then alphabetically
        return (categoryNames[a] || a).localeCompare(categoryNames[b] || b);
    });
    
    // Generate HTML for each category
    for (const category of sortedCategories) {
        const displayName = categoryNames[category] || category;
        
        sidebarHTML += `<div class="reference-category">
            <h3>${displayName}</h3>
            <ul>`;
            
        // Sort functions alphabetically within category
        categories[category].sort((a, b) => a.keyword.localeCompare(b.keyword));
        
        // Add each function to this category
        for (const { keyword, info } of categories[category]) {
            sidebarHTML += `<li data-keyword="${keyword}">${keyword}</li>`;
        }
        
        sidebarHTML += `</ul></div>`;
    }
    
    // Set the sidebar HTML
    sidebar.innerHTML = sidebarHTML;
    
    // Add click event listeners to each function item
    sidebar.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function() {
            // Highlight the selected item
            sidebar.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            this.classList.add('active');
            
            // Show function details
            showFunctionDetails(this.dataset.keyword);
        });
    });
}

// Helper function to show details for a specific function
function showFunctionDetails(keyword) {
    const details = document.querySelector('.reference-details');
    if (!details || !window.keywordInfo || !window.keywordInfo[keyword]) return;
    
    const info = window.keywordInfo[keyword];
    
    // Create signature from example or use default
    let signature = info.signature || info.example || `${keyword}()`;
    
    // If it's a complete line with semicolon, extract just the function call
    if (signature.includes(';')) {
        signature = signature.split(';')[0];
    }
    
    // Store signature in keywordInfo for future use
    if (!info.signature) {
        info.signature = signature;
    }
    
    // Create details HTML
    let detailsHTML = `
        <h2>${info.name || keyword}</h2>
        <div class="reference-signature"><code>${signature}</code></div>
        <div class="reference-description">${info.description || ''}</div>
        <div class="reference-category-tag">${info.category || 'other'}</div>
        <div class="reference-example">
            <h3>Example:</h3>
            <pre><code>${info.example || keyword + '();'}</code></pre>
        </div>
        <button class="insert-code" data-keyword="${keyword}" data-signature="${signature}">Insert into editor</button>
    `;
    
    details.innerHTML = detailsHTML;
    
    // Add event listener to insert code button
    details.querySelector('.insert-code').addEventListener('click', function() {
        const keyword = this.dataset.keyword;
        const signature = this.dataset.signature || `${keyword}()`;
        
        if (window.editor && keyword) {
            window.editor.replaceSelection(signature);
            window.logToConsole(`Inserted ${keyword} function`);
            
            // Move cursor inside parentheses
            const cursor = window.editor.getCursor();
            const offset = signature.indexOf('(') + 1;
            window.editor.setCursor({line: cursor.line, ch: cursor.ch - (signature.length - offset)});
            
            // Close the modal
            document.getElementById('reference-modal').style.display = 'none';
        }
    });
}

// Add resize functionality between editor and hints
function initEditorResizers() {
    const hintResizer = document.createElement('div');
    hintResizer.className = 'hint-resizer';
    
    // Insert the resizer between code editor and hints
    const editorPanel = document.querySelector('.editor-panel');
    const editorHints = document.querySelector('.editor-hints');
    const codeEditor = document.getElementById('code-editor');
    
    if (editorPanel && editorHints) {
        editorPanel.insertBefore(hintResizer, editorHints);
        
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        hintResizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startY = e.clientY;
            startHeight = editorHints.offsetHeight;
            
            // Add active class for visual feedback
            hintResizer.classList.add('active');
            
            // Add overlay to prevent text selection during resize
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            document.body.appendChild(overlay);
            
            // Change cursor for all elements
            document.body.style.cursor = 'row-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const dy = startY - e.clientY;
            
            // Calculate maximum height (50% of editor panel height)
            const maxHeight = editorPanel.offsetHeight * 0.5;
            
            // Allow sizing from 50px minimum to 50% of panel maximum
            const newHeight = Math.max(50, Math.min(maxHeight, startHeight + dy));
            editorHints.style.height = newHeight + 'px';
            
            // Adjust the code editor height to fill the remaining space
            if (codeEditor) {
                codeEditor.style.flexGrow = "1";
            }
            
            // Refresh CodeMirror editor to ensure proper rendering
            if (window.editor) {
                window.editor.refresh();
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                hintResizer.classList.remove('active');
                
                // Remove overlay
                const overlay = document.getElementById('resize-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
                
                // Reset cursor
                document.body.style.cursor = '';
                
                // Refresh editor again after resize is complete
                if (window.editor) {
                    setTimeout(() => window.editor.refresh(), 50);
                }
            }
        });
    }
}

// Helper function to get information about keywords
function getKeywordInfo(keyword) {
    if (!keyword) return null;
    return window.keywordInfo[keyword] || null;
}

function getCurrentCode() {
    return codeEditor.getValue();
}

function setEditorContent(content) {
    codeEditor.setValue(content);
}

function setCurrentFileName(filename) {
    currentFilename = filename;
    document.getElementById('current-file-name').textContent = filename;
}

function extractFunctionSignature(keyword, exampleCode) {
    if (!exampleCode) return `${keyword}()`;
    
    // Try to find the function call pattern in the example
    const regex = new RegExp(`${keyword}\\s*\\([^;]*\\)`, 'i');
    const match = exampleCode.match(regex);
    
    if (match && match[0]) {
        return match[0];
    }
    
    return `${keyword}()`;
}
