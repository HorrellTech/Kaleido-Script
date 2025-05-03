/**
 * Block-Based Visual Composer for KaleidoScript
 * Allows creating code by dragging blocks between lists
 */

class BlockComposer {
    constructor() {
        this.lists = {
            keywords: [],   // All available keywords/functions
            global: [],     // Global variables and settings
            setup: [],      // Setup function content
            draw: []        // Draw function content
        };

        // Add indentation tracking for each section
        this.indentation = {
            setup: 0,
            draw: 0
        };
        
        // Add a stack to track control structures
        this.controlStack = {
            setup: [],
            draw: []
        };
        
        // Create settings object with default values
        this.settings = {
        };
        
        // Extract all keywords from the keywords.js
        this.extractKeywords();
        
        // Create the UI
        //this.createUI();

        // Add default audio functions to setup
        //this.addDefaultAudioFunctions();
    }

    addDefaultAudioFunctions() {
        // Wait until the UI is ready
        setTimeout(() => {
            const setupList = document.getElementById('setup-list');
            if (!setupList) return;
            
            // Create loadAudio block
            const loadAudioBlock = document.createElement('div');
            loadAudioBlock.className = 'block target-block';
            loadAudioBlock.dataset.name = 'loadAudio';
            loadAudioBlock.dataset.type = 'function';
            loadAudioBlock.dataset.category = 'audio';
            loadAudioBlock.draggable = true;
            
            loadAudioBlock.innerHTML = `
                <div class="block-header">
                    <span class="block-title">loadAudio</span>
                    <div class="block-actions">
                        <button class="block-edit" title="Edit">✏️</button>
                        <button class="block-delete" title="Remove">×</button>
                    </div>
                </div>
                <div class="block-content">
                    <pre>loadAudio('music.mp3', 'backgroundMusic');</pre>
                </div>
            `;
            
            // Create playAudio block
            const playAudioBlock = document.createElement('div');
            playAudioBlock.className = 'block target-block';
            playAudioBlock.dataset.name = 'playAudio';
            playAudioBlock.dataset.type = 'function';
            playAudioBlock.dataset.category = 'audio';
            playAudioBlock.draggable = true;
            
            playAudioBlock.innerHTML = `
                <div class="block-header">
                    <span class="block-title">playAudio</span>
                    <div class="block-actions">
                        <button class="block-edit" title="Edit">✏️</button>
                        <button class="block-delete" title="Remove">×</button>
                    </div>
                </div>
                <div class="block-content">
                    <pre>playAudio('backgroundMusic');</pre>
                </div>
            `;
            
            // Add event listeners to edit and delete buttons
            const addListenersToBlock = (block, listId) => {
                const editBtn = block.querySelector('.block-edit');
                const deleteBtn = block.querySelector('.block-delete');
                
                if (editBtn) {
                    editBtn.addEventListener('click', () => {
                        this.editBlock(block, listId);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        block.remove();
                        this.updateListData();
                        
                        // Update indentation for the list
                        this.updateIndentationForList(listId);
                        
                        // Show empty message if no blocks left
                        const list = document.getElementById(listId);
                        if (list && list.querySelectorAll('.block').length === 0) {
                            const emptyMsg = list.querySelector('.block-list-empty');
                            if (emptyMsg) {
                                emptyMsg.style.display = 'block';
                            } else {
                                const newEmptyMsg = document.createElement('div');
                                newEmptyMsg.className = 'block-list-empty';
                                newEmptyMsg.textContent = 'Drag items here';
                                list.appendChild(newEmptyMsg);
                            }
                        }
                    });
                }
            };
            
            // Add the event listeners
            addListenersToBlock(loadAudioBlock, 'setup-list');
            addListenersToBlock(playAudioBlock, 'setup-list');
            
            // Add to setup list
            setupList.appendChild(loadAudioBlock);
            setupList.appendChild(playAudioBlock);
            
            // Hide empty message
            const emptyMsg = setupList.querySelector('.block-list-empty');
            if (emptyMsg) {
                emptyMsg.style.display = 'none';
            }
            
            // Apply proper indentation
            this.updateIndentationForList('setup-list');
            
            // Update internal data model
            this.updateListData();
        }, 100);
    }
    
    extractKeywords() {
        if (!window.keywordInfo) {
            console.error('Keywords not loaded yet');
            return;
        }
        
        // Get all keywords grouped by category
        for (const [key, info] of Object.entries(window.keywordInfo)) {
            const category = info.category || 'other';
            
            this.lists.keywords.push({
                name: key,
                category: category,
                description: info.description || '',
                example: info.example || '',
                params: this.extractParameters(info),
                type: 'function'
            });
        }
        
        // Add variable declarations
        this.lists.keywords.push({
            name: 'var',
            category: 'variable',
            description: 'Declares a variable',
            example: 'var myVariable = 100;',
            type: 'keyword'
        });
        
        this.lists.keywords.push({
            name: 'const',
            category: 'variable',
            description: 'Declares a constant variable',
            example: 'const myConstant = 100;',
            type: 'keyword'
        });
        
        this.lists.keywords.push({
            name: 'let',
            category: 'variable',
            description: 'Declares a block-scoped variable',
            example: 'let myVariable = 100;',
            type: 'keyword'
        });
        
        // Add control structures
        this.lists.keywords.push({
            name: 'if',
            category: 'control',
            description: 'Conditional statement',
            example: 'if (condition) {',
            type: 'keyword'
        });

        this.lists.keywords.push({
            name: 'else',
            category: 'control',
            description: 'Else statement',
            example: 'else {',
            type: 'keyword'
        });

        this.lists.keywords.push({
            name: 'else if',
            category: 'control',
            description: 'Else if statement',
            example: 'else if (condition) {',
            type: 'keyword'
        });

        this.lists.keywords.push({
            name: 'end if',
            category: 'control',
            description: 'End if statement',
            example: '}',
            type: 'keyword'
        });

        this.lists.keywords.push({
            name: 'end',
            category: 'control',
            description: 'End statement',
            example: '}',
            type: 'keyword'
        });

        this.lists.keywords.push({
            name: 'end for',
            category: 'control',
            description: 'End statement',
            example: '}',
            type: 'keyword'
        });
        
        this.lists.keywords.push({
            name: 'for',
            category: 'control',
            description: 'For loop',
            example: 'for (let i = 0; i < 10; i++) {',
            type: 'keyword'
        });
        
        // Sort keywords alphabetically within each category
        this.lists.keywords.sort((a, b) => {
            if (a.category === b.category) {
                return a.name.localeCompare(b.name);
            }
            return a.category.localeCompare(b.category);
        });
    }
    
    extractParameters(info) {
        const signature = info.name || '';
        const example = info.example || '';
        
        try {
            // Extract parameters from the function signature
            const paramStr = signature.match(/\(([^)]*)\)/);
            if (paramStr && paramStr[1]) {
                const params = paramStr[1].split(',').map(param => {
                    const trimmed = param.trim();
                    if (!trimmed) return null;
                    
                    const parts = trimmed.split('=');
                    const name = parts[0].trim();
                    const defaultValue = parts.length > 1 ? parts[1].trim() : null;
                    
                    return {
                        name: name,
                        defaultValue: defaultValue,
                        type: 'any'
                    };
                }).filter(p => p !== null);
                
                // Extract example values if available
                if (example) {
                    // Try to extract values from example
                }
                
                return params;
            }
        } catch (e) {
            console.error('Error parsing parameters for', info.name, e);
        }
        
        return [];
    }
    
    createUI() {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById('block-composer-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'block-composer-overlay';
            overlay.className = 'block-composer-overlay';
            
            overlay.innerHTML = `
                <div class="block-composer-container">
                    <div class="block-composer-header">
                        <h2>Block Composer</h2>
                        <button class="block-composer-close" id="close-block-composer">×</button>
                    </div>
                    
                    <div class="block-composer-content">
                        <div class="block-composer-sidebar">
                            <div class="block-composer-search">
                                <input type="text" id="block-search" placeholder="Search keywords...">
                                <select id="category-filter">
                                    <option value="all">All Categories</option>
                                    <option value="shapes">Shapes & Drawing</option>
                                    <option value="color">Colors & Styles</option>
                                    <option value="audio">Audio Controls</option>
                                    <option value="visualizer">Visualizers</option>
                                    <option value="variable">Variables</option>
                                    <option value="control">Control Flow</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div class="block-list-container">
                                <h3>Available Components</h3>
                                <div class="block-list keywords-list" id="keywords-list">
                                    <!-- Keywords will be added here dynamically -->
                                    <div class="block-list-empty">Loading keywords...</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="block-composer-main">
                            <div class="block-section global-section">
                                <h3>Global Variables & Settings</h3>
                                <div class="block-list global-list" id="global-list">
                                    <!-- Default settings block -->
                                    <div class="block settings-block" data-type="settings">
                                        <div class="block-header">
                                            <span class="block-title">Settings</span>
                                            <div class="block-actions">
                                                <button class="block-edit" title="Edit settings">⚙️</button>
                                            </div>
                                        </div>
                                        <div class="block-content">
                                            <pre>const settings = {
  backgroundColor: [10, 10, 30],
  fps: 30,
  useMotionBlur: false,
  motionBlurStrength: 0.1
};</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="block-section setup-section">
                                <h3>Setup Function</h3>
                                <div class="block-list setup-list" id="setup-list">
                                    <!-- Setup blocks will be added here -->
                                    <div class="block-list-empty">Drag items here to build your setup function</div>
                                </div>
                            </div>
                            
                            <div class="block-section draw-section">
                                <h3>Draw Function</h3>
                                <div class="block-list draw-list" id="draw-list">
                                    <!-- Draw blocks will be added here -->
                                    <div class="block-list-empty">Drag items here to build your draw function</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="block-composer-footer">
                        <button id="clear-block-composer" class="block-composer-button secondary">Clear All</button>
                        <button id="generate-block-code" class="block-composer-button primary">Generate Code</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Add event listeners
            document.getElementById('close-block-composer').addEventListener('click', () => this.closeComposer());
            document.getElementById('clear-block-composer').addEventListener('click', () => this.clearComposer());
            document.getElementById('generate-block-code').addEventListener('click', () => this.generateCode());
            document.getElementById('block-search').addEventListener('input', (e) => this.filterKeywords(e.target.value));
            document.getElementById('category-filter').addEventListener('change', (e) => this.filterByCategory(e.target.value));
            
            // Edit settings button event handler
            const settingsBlock = overlay.querySelector('.settings-block');
            if (settingsBlock) {
                const editButton = settingsBlock.querySelector('.block-edit');
                if (editButton) {
                    editButton.addEventListener('click', () => this.openSettingsEditor());
                }
            }
        }
        
        this.overlay = overlay;
        
        // Populate the keyword list
        this.populateKeywords();
        
        // Set up drag and drop functionality
        this.setupDragAndDrop();
        // Add responsive mobile handling
        window.addEventListener('resize', () => this.handleMobileLayout());

        const footer = this.overlay.querySelector('.block-composer-footer');
        if (footer) {
            const customCodeBtn = document.createElement('button');
            customCodeBtn.id = 'add-custom-code';
            customCodeBtn.className = 'block-composer-button secondary';
            customCodeBtn.innerHTML = '<i class="fas fa-code"></i> Add Custom Code';
            customCodeBtn.addEventListener('click', () => this.createCustomCodeBlock());
            
            // Insert before other buttons
            footer.insertBefore(customCodeBtn, footer.firstChild);
        }
        
        // Call once on startup
        setTimeout(() => this.handleMobileLayout(), 200);
    }

    handleMobileLayout() {
        const isMobile = window.innerWidth <= 768;
        const container = document.querySelector('.block-composer-container');
        if (!container) return;
        
        if (isMobile) {
            // Mobile layout enhancements
            container.classList.add('mobile-layout');
            
            // Adjust size and position to be more mobile-friendly
            Object.assign(container.style, {
                width: '95%',
                height: '92%',
                maxWidth: 'none',
                maxHeight: 'none',
                margin: '4% auto'
            });
            
            // Reorganize the container for better mobile use
            const content = document.querySelector('.block-composer-content');
            if (content) {
                content.style.flexDirection = 'column';
            }
            
            // Make the sidebar collapsible on mobile
            const sidebar = document.querySelector('.block-composer-sidebar');
            if (sidebar) {
                // Add toggle button if it doesn't exist
                if (!document.querySelector('.sidebar-toggle-btn')) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'sidebar-toggle-btn';
                    toggleBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Toggle Components';
                    toggleBtn.addEventListener('click', () => {
                        sidebar.classList.toggle('collapsed');
                        if (sidebar.classList.contains('collapsed')) {
                            toggleBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Show Components';
                        } else {
                            toggleBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Hide Components';
                        }
                    });
                    
                    // Insert before content
                    content.parentNode.insertBefore(toggleBtn, content);
                    
                    // Initially collapsed on mobile
                    sidebar.classList.add('collapsed');
                }
            }
        } else {
            // Desktop layout
            container.classList.remove('mobile-layout');
            container.style.width = '90%';
            container.style.height = '90%';
            container.style.maxWidth = '1200px';
            container.style.maxHeight = '800px';
            container.style.margin = '2% auto';
            
            // Restore horizontal layout
            const content = document.querySelector('.block-composer-content');
            if (content) {
                content.style.flexDirection = 'row';
            }
            
            // Restore sidebar
            const sidebar = document.querySelector('.block-composer-sidebar');
            if (sidebar) {
                sidebar.classList.remove('collapsed');
            }
            
            // Remove toggle button if it exists
            const toggleBtn = document.querySelector('.sidebar-toggle-btn');
            if (toggleBtn) {
                toggleBtn.remove();
            }
        }
    }
    
    populateKeywords() {
        const keywordsList = document.getElementById('keywords-list');
        if (!keywordsList) return;
        
        // Clear existing content
        keywordsList.innerHTML = '';
        
        // Group keywords by category
        const categories = {};
        this.lists.keywords.forEach(keyword => {
            if (!categories[keyword.category]) {
                categories[keyword.category] = [];
            }
            categories[keyword.category].push(keyword);
        });
        
        // Create category groups
        Object.keys(categories).sort().forEach(category => {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'category-group';
            categoryGroup.dataset.category = category;
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = this.formatCategoryName(category);
            categoryGroup.appendChild(categoryHeader);
            
            // Add keywords for this category
            categories[category].forEach(keyword => {
                const block = this.createKeywordBlock(keyword);
                categoryGroup.appendChild(block);
            });
            
            keywordsList.appendChild(categoryGroup);
        });
    }
    
    createKeywordBlock(keyword) {
        const block = document.createElement('div');
        block.className = 'block';
        block.dataset.name = keyword.name;
        block.dataset.type = keyword.type;
        block.dataset.category = keyword.category;
        block.draggable = true;
        
        let content = `
            <div class="block-header">
                <span class="block-title">${keyword.name}</span>
                <div class="block-actions">
                    <span class="block-category-badge">${this.formatCategoryName(keyword.category)}</span>
                    <button class="block-info" title="View details">?</button>
                </div>
            </div>
        `;
        
        if (keyword.description) {
            content += `
                <div class="block-description" style="display: none;">
                    <p>${keyword.description}</p>
                    ${keyword.example ? `<pre class="block-example">${keyword.example}</pre>` : ''}
                </div>
            `;
        }
        
        block.innerHTML = content;
        
        // Add info button click handler
        const infoButton = block.querySelector('.block-info');
        const description = block.querySelector('.block-description');
        if (infoButton && description) {
            infoButton.addEventListener('click', (e) => {
                e.stopPropagation();
                description.style.display = description.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        return block;
    }
    
    setupDragAndDrop() {
        // Get all lists
        const lists = [
            document.getElementById('keywords-list'),
            document.getElementById('global-list'),
            document.getElementById('setup-list'),
            document.getElementById('draw-list')
        ];
        
        // Function to handle drag start
        const handleDragStart = (e) => {
            const block = e.target.closest('.block');
            if (!block) return;
            
            e.dataTransfer.setData('text/plain', block.dataset.name);
            e.dataTransfer.setData('application/json', JSON.stringify({
                name: block.dataset.name,
                type: block.dataset.type,
                category: block.dataset.category,
                source: block.closest('.block-list').id,
                sourceElement: block.id || `block-${Date.now()}`
            }));
            
            // Add a unique ID to the block if it doesn't have one yet
            if (!block.id) {
                block.id = `block-${Date.now()}`;
            }
            
            block.classList.add('dragging');
            
            // Create drag ghost
            const ghost = block.cloneNode(true);
            ghost.classList.add('drag-ghost');
            document.body.appendChild(ghost);
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';
            ghost.style.opacity = '0.9';
            
            e.dataTransfer.setDragImage(ghost, 20, 20);
            
            setTimeout(() => {
                if (ghost.parentNode) {
                    document.body.removeChild(ghost);
                }
            }, 100);
        };
        
        // Function to handle drag over
        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            const list = e.currentTarget;
            list.classList.add('drag-over');
            
            // Find all target-block elements in this list
            const targetBlocks = Array.from(list.querySelectorAll('.target-block'));
            
            // If we're dragging over a list with blocks, add visual indicators
            if (targetBlocks.length > 0) {
                // Get mouse position
                const mouseY = e.clientY;
                
                // Find the block we're hovering over
                let closestBlock = null;
                let closestDistance = Infinity;
                let position = 'after'; // 'before' or 'after'
                
                targetBlocks.forEach(block => {
                    const rect = block.getBoundingClientRect();
                    const blockMiddle = rect.top + rect.height / 2;
                    
                    // Calculate distance to top or bottom half of block
                    const distanceTop = Math.abs(mouseY - (rect.top));
                    const distanceBottom = Math.abs(mouseY - (rect.bottom));
                    
                    // Determine if we're closer to top or bottom
                    if (distanceTop < distanceBottom && distanceTop < closestDistance) {
                        closestDistance = distanceTop;
                        closestBlock = block;
                        position = 'before';
                    } else if (distanceBottom < closestDistance) {
                        closestDistance = distanceBottom;
                        closestBlock = block;
                        position = 'after';
                    }
                });
                
                // Clear all indicators first
                targetBlocks.forEach(b => {
                    b.classList.remove('drop-target-before', 'drop-target-after');
                });
                
                // Add indicator to closest block
                if (closestBlock) {
                    closestBlock.classList.add(`drop-target-${position}`);
                }
            }
        };
        
        // Function to handle drag leave
        const handleDragLeave = (e) => {
            const list = e.currentTarget;
            list.classList.remove('drag-over');
            
            // Clear all indicators
            const targetBlocks = list.querySelectorAll('.target-block');
            targetBlocks.forEach(b => {
                b.classList.remove('drop-target-before', 'drop-target-after');
            });
        };
        
        // Function to handle drop
        const handleDrop = (e) => {
            e.preventDefault();
            const list = e.currentTarget;
            list.classList.remove('drag-over');
            
            try {
                const data = e.dataTransfer.getData('application/json');
                if (!data) return;
                
                const blockData = JSON.parse(data);
                const sourceList = blockData.source;
                const targetList = list.id;
                const name = blockData.name;
                const sourceElementId = blockData.sourceElement;
                
                console.log(`Drop event: moving ${name} from ${sourceList} to ${targetList}`);
                
                // Don't allow dropping into keywords list
                if (targetList === 'keywords-list') return;
                
                // Find the source element
                const sourceElement = document.getElementById(sourceElementId);
                
                // Handle different drop scenarios
                if (sourceList === 'keywords-list') {
                    // Dragging from keywords - create a new block
                    const keywordBlock = document.querySelector(`#keywords-list .block[data-name="${name}"]`);
                    if (!keywordBlock) return;
                    
                    // Create a new block based on the original
                    const newBlock = this.createBlockForTargetList(keywordBlock, targetList);
                    
                    // Find drop target position
                    this.insertAtDropPosition(list, newBlock, e.clientY);
                    
                    // Apply indentation if this is in a setup or draw list
                    if (targetList === 'setup-list' || targetList === 'draw-list') {
                        this.applyIndentationToBlock(newBlock, targetList);
                    }
                } 
                else if (sourceList === targetList) {
                    // Moving within the same list
                    if (sourceElement) {
                        // Find drop target position
                        this.insertAtDropPosition(list, sourceElement, e.clientY);
                        
                        // Update indentation for all blocks in this list
                        if (targetList === 'setup-list' || targetList === 'draw-list') {
                            this.updateIndentationForList(targetList);
                        }
                    }
                }
                else {
                    // Moving between different target lists (setup to draw or vice versa)
                    if (sourceElement) {
                        // When moving between target lists, we need to create a new block
                        // to ensure proper formatting for the target list
                        const originalBlock = sourceElement;
                        
                        // Get the source block's data
                        const sourceBlockName = originalBlock.dataset.name;
                        const sourceBlockType = originalBlock.dataset.type;
                        const sourceBlockContent = originalBlock.querySelector('.block-content pre')?.textContent || '';
                        
                        // Find the keyword block as a template
                        const keywordBlock = document.querySelector(`#keywords-list .block[data-name="${sourceBlockName}"]`);
                        if (!keywordBlock) return;
                        
                        // Create new block for target list
                        const newBlock = this.createBlockForTargetList(keywordBlock, targetList);
                        
                        // Update the content from the source block
                        const newContent = newBlock.querySelector('.block-content pre');
                        if (newContent) {
                            newContent.textContent = sourceBlockContent;
                        }
                        
                        // Insert at drop position
                        this.insertAtDropPosition(list, newBlock, e.clientY);
                        
                        // Apply indentation if needed
                        if (targetList === 'setup-list' || targetList === 'draw-list') {
                            this.applyIndentationToBlock(newBlock, targetList);
                        }
                        
                        // Remove the original block
                        originalBlock.remove();
                        
                        // Update indentation for the source list too if needed
                        if (sourceList === 'setup-list' || sourceList === 'draw-list') {
                            this.updateIndentationForList(sourceList);
                        }
                    }
                }
                
                // Clear all drop indicators
                const targetBlocks = document.querySelectorAll('.drop-target-before, .drop-target-after');
                targetBlocks.forEach(b => {
                    b.classList.remove('drop-target-before', 'drop-target-after');
                });
                
                // Remove empty message if any blocks exist
                const emptyMsg = list.querySelector('.block-list-empty');
                if (emptyMsg && list.querySelectorAll('.block').length > 0) {
                    emptyMsg.style.display = 'none';
                }
                
                // Show empty message in source list if it's now empty
                if (sourceList !== 'keywords-list' && sourceList !== targetList) {
                    const sourceListElement = document.getElementById(sourceList);
                    if (sourceListElement && sourceListElement.querySelectorAll('.block').length === 0) {
                        const sourceEmptyMsg = sourceListElement.querySelector('.block-list-empty');
                        if (sourceEmptyMsg) {
                            sourceEmptyMsg.style.display = 'block';
                        } else {
                            const newEmptyMsg = document.createElement('div');
                            newEmptyMsg.className = 'block-list-empty';
                            newEmptyMsg.textContent = 'Drag items here';
                            sourceListElement.appendChild(newEmptyMsg);
                        }
                    }
                }
                
                // Update the corresponding list data
                this.updateListData();
            } catch (err) {
                console.error('Error handling drop:', err);
            }
        };
        
        // Function to handle drag end
        const handleDragEnd = (e) => {
            const block = e.target;
            block.classList.remove('dragging');
            
            // Remove any drag-over classes
            document.querySelectorAll('.block-list').forEach(list => {
                list.classList.remove('drag-over');
            });
            
            // Clear all drop indicators
            const targetBlocks = document.querySelectorAll('.drop-target-before, .drop-target-after');
            targetBlocks.forEach(b => {
                b.classList.remove('drop-target-before', 'drop-target-after');
            });
        };
        
        // Add event listeners to all blocks
        const setupBlockDrag = (block) => {
            block.addEventListener('dragstart', handleDragStart);
            block.addEventListener('dragend', handleDragEnd);
        };
        
        // Add event listeners to all lists
        lists.forEach(list => {
            if (!list) return;
            
            list.addEventListener('dragover', handleDragOver);
            list.addEventListener('dragleave', handleDragLeave);
            list.addEventListener('drop', handleDrop);
            
            // Setup drag for existing blocks
            list.querySelectorAll('.block').forEach(setupBlockDrag);
            
            // Setup mutation observer to handle new blocks
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.classList.contains('block')) {
                                setupBlockDrag(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(list, { childList: true });
        });
    }

    applyIndentationToBlock(block, listId) {
        const section = listId === 'setup-list' ? 'setup' : 'draw';
        const blockName = block.dataset.name;
        const content = block.querySelector('.block-content pre');
        
        if (!content) return;
        
        // Get the current indentation level
        const indentLevel = this.getIndentationLevel(listId);
        
        // Create the indentation string
        const indent = '  '.repeat(indentLevel);
        
        // Add indent to the block content (but don't touch control structures)
        if (!['if', 'else', 'else if', 'for', 'end', 'end if', 'end for'].includes(blockName)) {
            content.textContent = content.textContent.split('\n').map(line => 
                indent + line
            ).join('\n');
        }
        
        // Add a data attribute to track the indentation level
        block.dataset.indentLevel = indentLevel;
    }
    
    updateIndentationForList(listId) {
        const section = listId === 'setup-list' ? 'setup' : 'draw';
        const list = document.getElementById(listId);
        if (!list) return;
        
        // Reset indentation tracking
        this.indentation[section] = 0;
        this.controlStack[section] = [];
        
        // Get all blocks in the list
        const blocks = Array.from(list.querySelectorAll('.block'));
        
        // Apply indentation to each block based on control structures
        blocks.forEach((block, index) => {
            const blockName = block.dataset.name;
            const content = block.querySelector('.block-content pre');
            if (!content) return;
            
            // Handle indentation based on block type
            if (blockName === 'if' || blockName === 'for') {
                // First apply current indentation to this block
                block.dataset.indentLevel = this.indentation[section];
                
                // Format the content to ensure proper indentation
                const indent = '  '.repeat(this.indentation[section]);
                content.textContent = content.textContent.split('\n').map(line => 
                    indent + line.trim()
                ).join('\n');
                
                // Then increase indentation for blocks that follow
                this.controlStack[section].push(blockName);
                this.indentation[section]++;
            } 
            else if (blockName === 'else if' || blockName === 'else') {
                // Maintain indentation level of the matching 'if'
                // (indentation is already decreased by one)
                const indent = '  '.repeat(Math.max(0, this.indentation[section] - 1));
                content.textContent = content.textContent.split('\n').map(line => 
                    indent + line.trim()
                ).join('\n');
                
                block.dataset.indentLevel = Math.max(0, this.indentation[section] - 1);
            }
            else if (blockName === 'end if' || blockName === 'end' || blockName === 'end for') {
                // Decrease indentation before applying it to this block
                if (this.indentation[section] > 0) {
                    this.indentation[section]--;
                }
                
                if (this.controlStack[section].length > 0) {
                    this.controlStack[section].pop();
                }
                
                // Apply the reduced indentation
                const indent = '  '.repeat(this.indentation[section]);
                content.textContent = content.textContent.split('\n').map(line => 
                    indent + line.trim()
                ).join('\n');
                
                block.dataset.indentLevel = this.indentation[section];
            }
            else {
                // Regular block - apply current indentation
                const indent = '  '.repeat(this.indentation[section]);
                
                // Clean up any existing indentation first
                content.textContent = content.textContent.split('\n').map((line, i) => {
                    return line.trim();
                }).join('\n');
                
                // Now add proper indentation
                content.textContent = content.textContent.split('\n').map(line => 
                    indent + line
                ).join('\n');
                
                block.dataset.indentLevel = this.indentation[section];
            }
        });
    }
    
    getIndentationLevel(listId) {
        const section = listId === 'setup-list' ? 'setup' : 'draw';
        return this.indentation[section] || 0;
    }

    insertAtDropPosition(list, block, mouseY) {
        // Get all blocks in the list
        const blocks = Array.from(list.querySelectorAll('.block'));
        
        // Find where to insert based on mouse position
        let insertBefore = null;
        
        for (const existingBlock of blocks) {
            // Skip if it's the same block
            if (existingBlock === block) continue;
            
            const rect = existingBlock.getBoundingClientRect();
            if (mouseY < rect.top + (rect.height / 2)) {
                insertBefore = existingBlock;
                break;
            }
        }
        
        // Insert at the determined position
        if (insertBefore) {
            list.insertBefore(block, insertBefore);
        } else {
            list.appendChild(block);
        }
    }
    
    createBlockForTargetList(sourceBlock, targetListId) {
        const name = sourceBlock.dataset.name;
        const type = sourceBlock.dataset.type;
        const category = sourceBlock.dataset.category;
        
        // Find the original keyword data
        const keyword = this.lists.keywords.find(k => k.name === name);
        
        // Create new block
        const block = document.createElement('div');
        block.className = 'block target-block';
        block.dataset.name = name;
        block.dataset.type = type;
        block.dataset.category = category;
        block.draggable = true;
        
        let blockContent = '';
        let codeContent = '';
        let isControlBlock = false;
        
        // Handle special control blocks
        if (targetListId === 'setup-list' || targetListId === 'draw-list') {
            const section = targetListId === 'setup-list' ? 'setup' : 'draw';
            
            if (name === 'if') {
                codeContent = 'if (condition) {';
                isControlBlock = true;
                // Push to control stack
                this.controlStack[section].push('if');
                // Increase indentation for next items
                this.indentation[section]++;
            } else if (name === 'else if') {
                codeContent = '} else if (condition) {';
                isControlBlock = true;
                // No change to control stack, just continue the if
            } else if (name === 'else') {
                codeContent = '} else {';
                isControlBlock = true;
                // No change to control stack, just continue the if
            } else if (name === 'end if' || name === 'end' || name === 'end for') {
                // Pop from control stack if it's not empty
                if (this.controlStack[section].length > 0) {
                    this.controlStack[section].pop();
                    // Decrease indentation
                    if (this.indentation[section] > 0) {
                        this.indentation[section]--;
                    }
                }
                codeContent = '}';
                isControlBlock = true;
            } else if (name === 'for') {
                codeContent = 'for (let i = 0; i < 10; i++) {';
                isControlBlock = true;
                // Push to control stack - exactly like if statements
                this.controlStack[section].push('for');
                // Increase indentation for next items
                this.indentation[section]++;
            } else {
                // Regular function or keyword
                if (keyword && keyword.example) {
                    codeContent = keyword.example;
                } else {
                    codeContent = `${name}();`;
                }
            }
            
            blockContent = `
                <div class="block-header">
                    <span class="block-title">${name}</span>
                    <div class="block-actions">
                        <button class="block-edit" title="Edit">✏️</button>
                        <button class="block-delete" title="Remove">×</button>
                    </div>
                </div>
                <div class="block-content">
                    <pre>${codeContent}</pre>
                </div>
            `;
            
            // Add data attribute to track if it's a control block
            if (isControlBlock) {
                block.dataset.controlType = name;
            }
        } else if (targetListId === 'global-list') {
            // Handle global list items
            // Code for global list remains the same...
            if (type === 'keyword' && ['var', 'let', 'const'].includes(name)) {
                blockContent = `
                    <div class="block-header">
                        <span class="block-title">${name} declaration</span>
                        <div class="block-actions">
                            <button class="block-edit" title="Edit variable">✏️</button>
                            <button class="block-delete" title="Remove">×</button>
                        </div>
                    </div>
                    <div class="block-content">
                        <pre>${name} myVariable = null;</pre>
                    </div>
                `;
            } else {
                // For functions in global, create variable to store result
                blockContent = `
                    <div class="block-header">
                        <span class="block-title">${name}</span>
                        <div class="block-actions">
                            <button class="block-edit" title="Edit">✏️</button>
                            <button class="block-delete" title="Remove">×</button>
                        </div>
                    </div>
                    <div class="block-content">
                        <pre>var ${name}Result = ${keyword?.example || `${name}();`}</pre>
                    </div>
                `;
            }
        }
        
        block.innerHTML = blockContent;
        
        // Add event listeners for edit and delete
        const editBtn = block.querySelector('.block-edit');
        const deleteBtn = block.querySelector('.block-delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editBlock(block, targetListId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                // If this is a control start block, also remove the matching end block
                if (isControlBlock && (name === 'if' || name === 'for')) {
                    const section = targetListId === 'setup-list' ? 'setup' : 'draw';
                    // Reduce indentation level
                    if (this.indentation[section] > 0) {
                        this.indentation[section]--;
                    }
                    // Remove from control stack
                    const index = this.controlStack[section].indexOf(name);
                    if (index > -1) {
                        this.controlStack[section].splice(index, 1);
                    }
                }
                
                block.remove();
                this.updateListData();
                
                // Update indentation for the list if this was removed from a code section
                if (targetListId === 'setup-list' || targetListId === 'draw-list') {
                    this.updateIndentationForList(targetListId);
                }
                
                // Show empty message if no blocks left
                const list = document.getElementById(targetListId);
                if (list && list.querySelectorAll('.block').length === 0) {
                    const emptyMsg = list.querySelector('.block-list-empty');
                    if (emptyMsg) {
                        emptyMsg.style.display = 'block';
                    } else {
                        const newEmptyMsg = document.createElement('div');
                        newEmptyMsg.className = 'block-list-empty';
                        newEmptyMsg.textContent = 'Drag items here';
                        list.appendChild(newEmptyMsg);
                    }
                }
            });
        }
        
        return block;
    }

    addGlobalVariable(name, type = 'var', value = 'null') {
        const globalList = document.getElementById('global-list');
        if (!globalList) return;
        
        // Create a new block for the variable
        const block = document.createElement('div');
        block.className = 'block target-block';
        block.dataset.name = type;
        block.dataset.type = 'keyword';
        block.dataset.category = 'variable';
        block.draggable = true;
        
        block.innerHTML = `
            <div class="block-header">
                <span class="block-title">${type} ${name}</span>
                <div class="block-actions">
                    <button class="block-edit" title="Edit variable">✏️</button>
                    <button class="block-delete" title="Remove">×</button>
                </div>
            </div>
            <div class="block-content">
                <pre>${type} ${name} = ${value};</pre>
            </div>
        `;
        
        // Add event listeners
        const editBtn = block.querySelector('.block-edit');
        const deleteBtn = block.querySelector('.block-delete');
        
        editBtn.addEventListener('click', () => {
            this.editVariableBlock(block);
        });
        
        deleteBtn.addEventListener('click', () => {
            block.remove();
            this.updateListData();
            
            if (globalList.querySelectorAll('.block').length === 0) {
                const emptyMsg = globalList.querySelector('.block-list-empty');
                if (emptyMsg) {
                    emptyMsg.style.display = 'block';
                }
            }
        });
        
        // Add to global list
        globalList.appendChild(block);
        
        // Hide empty message
        const emptyMsg = globalList.querySelector('.block-list-empty');
        if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
        
        // Update data model
        this.updateListData();
    }

    showAddVariableDialog() {
        const modal = document.createElement('div');
        modal.className = 'block-editor-modal';
        
        modal.innerHTML = `
            <div class="block-editor-container">
                <div class="block-editor-header">
                    <h3>Add Global Variable</h3>
                    <button class="block-editor-close">×</button>
                </div>
                <div class="block-editor-content">
                    <div class="form-field">
                        <label for="var-type">Variable Type:</label>
                        <select id="var-type">
                            <option value="var">var</option>
                            <option value="let">let</option>
                            <option value="const">const</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="var-name">Variable Name:</label>
                        <input type="text" id="var-name" value="myVariable" placeholder="Enter name">
                    </div>
                    <div class="form-field">
                        <label for="var-value">Initial Value:</label>
                        <input type="text" id="var-value" value="0" placeholder="Enter initial value">
                    </div>
                    <div class="preview-field">
                        <label>Preview:</label>
                        <pre id="var-preview">var myVariable = 0;</pre>
                    </div>
                </div>
                <div class="block-editor-footer">
                    <button class="block-editor-cancel">Cancel</button>
                    <button class="block-editor-save">Add Variable</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get form elements
        const typeSelect = modal.querySelector('#var-type');
        const nameInput = modal.querySelector('#var-name');
        const valueInput = modal.querySelector('#var-value');
        const preview = modal.querySelector('#var-preview');
        
        // Update preview when inputs change
        const updatePreview = () => {
            preview.textContent = `${typeSelect.value} ${nameInput.value} = ${valueInput.value};`;
        };
        
        typeSelect.addEventListener('change', updatePreview);
        nameInput.addEventListener('input', updatePreview);
        valueInput.addEventListener('input', updatePreview);
        
        // Close and save functionality
        const closeBtn = modal.querySelector('.block-editor-close');
        const cancelBtn = modal.querySelector('.block-editor-cancel');
        const saveBtn = modal.querySelector('.block-editor-save');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', () => {
            const type = typeSelect.value;
            const name = nameInput.value.trim();
            const value = valueInput.value.trim();
            
            if (name) {
                this.addGlobalVariable(name, type, value);
                closeModal();
            } else {
                alert('Please enter a variable name.');
            }
        });
    }

    editVariableBlock(block) {
        const content = block.querySelector('.block-content pre');
        if (!content) return;
        
        const codeText = content.textContent;
        
        // Extract variable type, name and value
        const match = codeText.match(/^(var|let|const)\s+(\w+)\s+=\s+(.+);$/);
        if (!match) return;
        
        const [, varType, varName, varValue] = match;
        
        const modal = document.createElement('div');
        modal.className = 'block-editor-modal';
        
        modal.innerHTML = `
            <div class="block-editor-container">
                <div class="block-editor-header">
                    <h3>Edit Variable</h3>
                    <button class="block-editor-close">×</button>
                </div>
                <div class="block-editor-content">
                    <div class="form-field">
                        <label for="var-type">Variable Type:</label>
                        <select id="var-type">
                            <option value="var" ${varType === 'var' ? 'selected' : ''}>var</option>
                            <option value="let" ${varType === 'let' ? 'selected' : ''}>let</option>
                            <option value="const" ${varType === 'const' ? 'selected' : ''}>const</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="var-name">Variable Name:</label>
                        <input type="text" id="var-name" value="${varName}" placeholder="Enter name">
                    </div>
                    <div class="form-field">
                        <label for="var-value">Value:</label>
                        <input type="text" id="var-value" value="${varValue}" placeholder="Enter value">
                    </div>
                    <div class="preview-field">
                        <label>Preview:</label>
                        <pre id="var-preview">${codeText}</pre>
                    </div>
                    <div class="toggle-mode">
                        <button class="toggle-editor-mode">Switch to Advanced Mode</button>
                    </div>
                </div>
                <div class="block-editor-footer">
                    <button class="block-editor-cancel">Cancel</button>
                    <button class="block-editor-save">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get form elements
        const typeSelect = modal.querySelector('#var-type');
        const nameInput = modal.querySelector('#var-name');
        const valueInput = modal.querySelector('#var-value');
        const preview = modal.querySelector('#var-preview');
        const toggleButton = modal.querySelector('.toggle-editor-mode');
        
        // Update preview when inputs change
        const updatePreview = () => {
            preview.textContent = `${typeSelect.value} ${nameInput.value} = ${valueInput.value};`;
        };
        
        typeSelect.addEventListener('change', updatePreview);
        nameInput.addEventListener('input', updatePreview);
        valueInput.addEventListener('input', updatePreview);
        
        // Toggle to advanced mode (raw code editing)
        toggleButton.addEventListener('click', () => {
            const formSection = modal.querySelector('.block-editor-content');
            
            // Check if we're already in advanced mode
            const isAdvancedMode = modal.querySelector('.block-editor-textarea');
            
            if (!isAdvancedMode) {
                // Switch to advanced mode
                formSection.innerHTML = `
                    <textarea class="block-editor-textarea">${content.textContent}</textarea>
                    <div class="toggle-mode">
                        <button class="toggle-editor-mode">Switch to Simple Mode</button>
                    </div>
                `;
                
                // Re-attach event listener to new toggle button
                formSection.querySelector('.toggle-editor-mode').addEventListener('click', () => {
                    // Get the current textarea value
                    const textareaValue = formSection.querySelector('.block-editor-textarea').value;
                    
                    // Extract components if possible
                    const advMatch = textareaValue.match(/^(var|let|const)\s+(\w+)\s+=\s+(.+);$/);
                    
                    // Rebuild the form
                    formSection.innerHTML = `
                        <div class="form-field">
                            <label for="var-type">Variable Type:</label>
                            <select id="var-type">
                                <option value="var" ${advMatch && advMatch[1] === 'var' ? 'selected' : ''}>var</option>
                                <option value="let" ${advMatch && advMatch[1] === 'let' ? 'selected' : ''}>let</option>
                                <option value="const" ${advMatch && advMatch[1] === 'const' ? 'selected' : ''}>const</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="var-name">Variable Name:</label>
                            <input type="text" id="var-name" value="${advMatch ? advMatch[2] : ''}" placeholder="Enter name">
                        </div>
                        <div class="form-field">
                            <label for="var-value">Value:</label>
                            <input type="text" id="var-value" value="${advMatch ? advMatch[3] : ''}" placeholder="Enter value">
                        </div>
                        <div class="preview-field">
                            <label>Preview:</label>
                            <pre id="var-preview">${textareaValue}</pre>
                        </div>
                        <div class="toggle-mode">
                            <button class="toggle-editor-mode">Switch to Advanced Mode</button>
                        </div>
                    `;
                    
                    // Re-attach event listeners
                    formSection.querySelector('#var-type').addEventListener('change', updatePreview);
                    formSection.querySelector('#var-name').addEventListener('input', updatePreview);
                    formSection.querySelector('#var-value').addEventListener('input', updatePreview);
                    formSection.querySelector('.toggle-editor-mode').addEventListener('click', () => toggleButton.click());
                });
            }
        });
        
        // Close and save functionality
        const closeBtn = modal.querySelector('.block-editor-close');
        const cancelBtn = modal.querySelector('.block-editor-cancel');
        const saveBtn = modal.querySelector('.block-editor-save');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', () => {
            const textarea = modal.querySelector('.block-editor-textarea');
            
            if (textarea) {
                // Advanced mode
                content.textContent = textarea.value;
            } else {
                // Simple mode
                content.textContent = preview.textContent;
                block.querySelector('.block-title').textContent = `${typeSelect.value} ${nameInput.value}`;
            }
            
            this.updateListData();
            closeModal();
        });
    }
    
    createParamForm(functionName) {
        // Check if we have keyword info for this function
        const functionInfo = window.keywordInfo[functionName];
        
        if (!functionInfo) {
            return `<p>No information available for function "${functionName}".</p>`;
        }
        
        // Prepare form HTML
        let formHtml = '';
        
        // Add function description if available
        if (functionInfo.description) {
            formHtml += `<div class="function-description">${functionInfo.description}</div>`;
        }
        
        // Extract parameter information
        let params = [];
        
        // Try to extract parameters from the function name pattern (e.g., "circle(x, y, radius)")
        if (functionInfo.name && functionInfo.name.includes('(')) {
            const paramMatch = functionInfo.name.match(/\(([^)]+)\)/);
            if (paramMatch && paramMatch[1]) {
                // Split by commas but handle optional parameters in square brackets
                const paramNames = paramMatch[1].split(',').map(p => p.trim());
                
                params = paramNames.map(param => {
                    // Handle optional parameters [name]
                    const isOptional = param.startsWith('[') && param.endsWith(']');
                    const paramName = isOptional ? param.slice(1, -1) : param;
                    
                    return {
                        name: paramName,
                        optional: isOptional,
                        type: 'any' // Default type
                    };
                });
            }
        }
        
        // If we have parameters, create form fields for them
        if (params.length > 0) {
            // Extract current parameter values from code
            const paramValues = this.extractParamValuesFromCode(functionName, this.currentCode || '');
            
            formHtml += '<div class="params-form">';
            
            params.forEach((param, index) => {
                const paramId = `param-${functionName}-${param.name}`;
                const paramValue = paramValues[param.name] || '';
                const paramDescription = this.getParamDescription(functionName, param.name);
                
                formHtml += `
                    <div class="form-group">
                        <label for="${paramId}">${this.formatParamName(param.name)}${param.optional ? ' (optional)' : ''}:</label>
                        <input type="text" id="${paramId}" name="${param.name}" 
                            value="${paramValue}" placeholder="${param.defaultValue || ''}">
                        ${paramDescription ? `<p class="param-desc">${paramDescription}</p>` : ''}
                    </div>
                `;
            });
            
            // Add example if available
            if (functionInfo.example) {
                formHtml += `
                    <div class="form-group">
                        <label>Example:</label>
                        <pre class="param-example">${functionInfo.example}</pre>
                    </div>
                `;
            }
            
            formHtml += '</div>';
        } else {
            // No parameters
            formHtml += '<p>This function has no parameters.</p>';
            
            // Still show example if available
            if (functionInfo.example) {
                formHtml += `
                    <div class="form-group">
                        <label>Example:</label>
                        <pre class="param-example">${functionInfo.example}</pre>
                    </div>
                `;
            }
        }
        
        return formHtml;
    }

    getParamDescription(functionName, paramName) {
        // Try to infer parameter descriptions based on common naming patterns
        const lowerParamName = paramName.toLowerCase();
        
        // Common parameter descriptions
        const commonDescriptions = {
            'x': 'X coordinate position',
            'y': 'Y coordinate position',
            'z': 'Z coordinate position',
            'width': 'Width in pixels',
            'height': 'Height in pixels',
            'radius': 'Radius of the circle',
            'radiusx': 'Horizontal radius of the ellipse',
            'radiusy': 'Vertical radius of the ellipse',
            'color': 'Color value (name, hex, or RGB array)',
            'freq start': 'Starting frequency',
            'freq end': 'Ending frequency',
            'r': 'Red component (0-255)',
            'g': 'Green component (0-255)',
            'b': 'Blue component (0-255)',
            'alpha': 'Opacity (0-1)',
            'rotation': 'Rotation angle in radians',
            'scale': 'Scale factor',
            'speed': 'Speed of movement',
            'text': 'Text content to display',
            'font': 'Font family name',
            'size': 'Size in pixels',
            'min': 'Minimum value',
            'max': 'Maximum value',
            'count': 'Number of items',
            'outline': 'Whether to draw only the outline (true) or fill the shape (false)',
            'time': 'Current time in seconds',
            'duration': 'Duration in seconds',
            'frequency': 'Frequency value in Hz',
            'amplitude': 'Amplitude value',
            'glow': 'Whether to apply a glow effect'
        };
        
        // Special cases for specific functions
        const specialDescriptions = {
            'circle': {
                'x': 'X coordinate of the center',
                'y': 'Y coordinate of the center',
                'radius': 'Radius of the circle',
                'outline': 'If true, draws only the outline; otherwise fills the circle'
            },
            'rect': {
                'x': 'X coordinate of the top-left corner',
                'y': 'Y coordinate of the top-left corner',
                'width': 'Width of the rectangle',
                'height': 'Height of the rectangle',
                'outline': 'If true, draws only the outline; otherwise fills the rectangle'
            },
            'line': {
                'x1': 'X coordinate of the starting point',
                'y1': 'Y coordinate of the starting point',
                'x2': 'X coordinate of the ending point',
                'y2': 'Y coordinate of the ending point'
            },
            'fill': {
                'r': 'Red component (0-255)',
                'g': 'Green component (0-255)',
                'b': 'Blue component (0-255)',
                'alpha': 'Opacity (0-1, optional)'
            },
            'stroke': {
                'r': 'Red component (0-255)',
                'g': 'Green component (0-255)',
                'b': 'Blue component (0-255)',
                'alpha': 'Opacity (0-1, optional)'
            }
        };
        
        // Try to get a specialized description first
        if (specialDescriptions[functionName] && specialDescriptions[functionName][paramName]) {
            return specialDescriptions[functionName][paramName];
        }
        
        // Fall back to common descriptions
        return commonDescriptions[lowerParamName] || '';
    }
    
    editBlock(block, listId = null) {
        const content = block.querySelector('.block-content pre');
        const blockName = block.dataset.name;
        const blockType = block.dataset.type;
        
        if (!content) return;
        
        // Get the current code content
        const currentCode = content.textContent;
    
        this.currentCode = content.textContent;
    
        
        // Create editor modal
        const modal = document.createElement('div');
        modal.className = 'block-editor-modal';
        
        // Get the keyword info for parameter help
        const keyword = (window.keywordInfo || {})[blockName];
        const isControlBlock = ['if', 'else', 'else if', 'for', 'end', 'end if'].includes(blockName);
        const isVariable = keyword && keyword.category === 'variables';
        
        if (isVariable) {
            // Special handling for variables
            modal.innerHTML = `
                <div class="block-editor-container">
                    <div class="block-editor-header">
                        <h3>Edit ${blockName}</h3>
                        <button class="block-editor-close">×</button>
                    </div>
                    <div class="block-editor-content">
                        <div class="function-description">${keyword.description || ''}</div>
                        <div class="form-group">
                            <label>Example Usage:</label>
                            <pre class="param-example">${keyword.example || `const myVar = ${blockName};`}</pre>
                        </div>
                        <textarea class="block-editor-textarea">${currentCode}</textarea>
                    </div>
                    <div class="block-editor-footer">
                        <button class="block-editor-cancel">Cancel</button>
                        <button class="block-editor-save">Save</button>
                    </div>
                </div>
            `;
        } else if (blockType === 'function') {
            // For functions, create a structured editor
            const paramForm = this.createParamForm(blockName);
            
            modal.innerHTML = `
                <div class="block-editor-container">
                    <div class="block-editor-header">
                        <h3>Edit ${blockName}</h3>
                        <button class="block-editor-close">×</button>
                    </div>
                    <div class="block-editor-content">
                        <div class="structured-form">
                            ${paramForm}
                            <div class="preview-field">
                                <label>Preview:</label>
                                <pre id="function-preview">${currentCode}</pre>
                            </div>
                        </div>
                        <div class="toggle-mode">
                            <button class="toggle-editor-mode">Switch to Code Mode</button>
                        </div>
                    </div>
                    <div class="block-editor-footer">
                        <button class="block-editor-cancel">Cancel</button>
                        <button class="block-editor-save">Save</button>
                    </div>
                </div>
            `;
        } else if (isControlBlock) {
            // Special handling for control blocks
            let formHtml = '';
            
            if (blockName === 'if' || blockName === 'else if') {
                formHtml = `
                    <div class="form-group">
                        <label for="condition">Condition:</label>
                        <input type="text" id="condition" placeholder="Enter condition" 
                            value="${this.extractCondition(currentCode)}">
                        <p class="form-help">Examples: x > 10, mouseX() > width/2, time > 5</p>
                    </div>
                `;
            } else if (blockName === 'for') {
                const [init, condition, increment] = this.extractForLoopParts(currentCode);
                formHtml = `
                    <div class="form-group">
                        <label for="for-init">Initialization:</label>
                        <input type="text" id="for-init" placeholder="let i = 0" value="${init}">
                    </div>
                    <div class="form-group">
                        <label for="for-condition">Condition:</label>
                        <input type="text" id="for-condition" placeholder="i < 10" value="${condition}">
                    </div>
                    <div class="form-group">
                        <label for="for-increment">Increment:</label>
                        <input type="text" id="for-increment" placeholder="i++" value="${increment}">
                    </div>
                    <p class="form-help">Example: for(let i=0; i < 10; i++)</p>
                `;
            }
            
            modal.innerHTML = `
                <div class="block-editor-container">
                    <div class="block-editor-header">
                        <h3>Edit ${blockName}</h3>
                        <button class="block-editor-close">×</button>
                    </div>
                    <div class="block-editor-content">
                        <div class="structured-form">
                            ${formHtml}
                            <div class="preview-field">
                                <label>Preview:</label>
                                <pre id="control-preview">${currentCode}</pre>
                            </div>
                        </div>
                        <div class="toggle-mode">
                            <button class="toggle-editor-mode">Switch to Code Mode</button>
                        </div>
                    </div>
                    <div class="block-editor-footer">
                        <button class="block-editor-cancel">Cancel</button>
                        <button class="block-editor-save">Save</button>
                    </div>
                </div>
            `;
        } else {
            // For other block types, show raw code editor with parameter info
            let paramInfo = '';
            
            if (keyword && keyword.params && keyword.params.length > 0) {
                paramInfo = `<div class="param-info">
                    <h4>Function Parameters:</h4>
                    <ul>
                        ${keyword.params.map(param => `<li><strong>${param.name}</strong>: ${param.description || 'No description'}</li>`).join('')}
                    </ul>
                    <div class="param-example">Example: ${keyword.example || `${blockName}(...);`}</div>
                </div>`;
            }
            
            modal.innerHTML = `
                <div class="block-editor-container">
                    <div class="block-editor-header">
                        <h3>Edit ${blockName}</h3>
                        <button class="block-editor-close">×</button>
                    </div>
                    <div class="block-editor-content">
                        ${paramInfo}
                        <textarea class="block-editor-textarea">${currentCode}</textarea>
                        ${keyword && keyword.params && keyword.params.length > 0 ? `
                            <div class="toggle-mode">
                                <button class="toggle-editor-mode">Switch to Form Mode</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="block-editor-footer">
                        <button class="block-editor-cancel">Cancel</button>
                        <button class="block-editor-save">Save</button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        
        // Set up live updating of preview for function parameters
        if (blockType === 'function') {
            const preview = modal.querySelector('#function-preview');
            if (preview) {
                // Get all parameter inputs
                const paramInputs = modal.querySelectorAll('.params-form input, .form-field input');
                paramInputs.forEach(input => {
                    input.addEventListener('input', () => {
                        // Update preview with current parameter values
                        // FIX: Use correct method to generate code from inputs
                        preview.textContent = this.generateCodeFromParamInputs(blockName, modal);
                    });
                });
            }
        }
        
        // Handle toggle between form and code mode
        const toggleButton = modal.querySelector('.toggle-editor-mode');
        if (toggleButton) {
            // Store the original code to preserve it during mode switches
            modal._originalCode = currentCode;
            
            toggleButton.addEventListener('click', () => {
                const editorContent = modal.querySelector('.block-editor-content');
                const isFormMode = editorContent.querySelector('.structured-form');
                
                if (isFormMode) {
                    // Switch to code mode - get current code from preview
                    let codeValue = '';
                    
                    if (blockType === 'function') {
                        // FIX: Get code from the preview element
                        const preview = editorContent.querySelector('#function-preview');
                        codeValue = preview ? preview.textContent : this.generateCodeFromParamInputs(blockName, modal);
                    } else if (isControlBlock) {
                        // Get values from form for control blocks
                        if (blockName === 'if' || blockName === 'else if') {
                            const condition = editorContent.querySelector('#condition').value;
                            codeValue = blockName === 'if' ? 
                                `if (${condition}) {` : 
                                `} else if (${condition}) {`;
                        } else if (blockName === 'for') {
                            const init = editorContent.querySelector('#for-init').value;
                            const condition = editorContent.querySelector('#for-condition').value;
                            const increment = editorContent.querySelector('#for-increment').value;
                            codeValue = `for (${init}; ${condition}; ${increment}) {`;
                        } else {
                            codeValue = currentCode;
                        }
                    }
                    
                    // Save the current form-based code for switching back
                    modal._lastFormCode = codeValue;
                    
                    // Replace with code editor
                    editorContent.innerHTML = `
                        <textarea class="block-editor-textarea">${codeValue}</textarea>
                        <div class="toggle-mode">
                            <button class="toggle-editor-mode">Switch to Form Mode</button>
                        </div>
                    `;
                    
                    // Focus the textarea
                    editorContent.querySelector('.block-editor-textarea').focus();
                } else {
                    // Switch to form mode from code mode
                    const textarea = editorContent.querySelector('.block-editor-textarea');
                    if (!textarea) return;
                    
                    // Get the current code value
                    const codeValue = textarea.value;
                    
                    if (blockType === 'function') {
                        // Create parameter form for this function
                        const paramForm = this.createParamForm(blockName);
                        
                        editorContent.innerHTML = `
                            <div class="structured-form">
                                ${paramForm || '<p>No parameters available for this function</p>'}
                                <div class="preview-field">
                                    <label>Preview:</label>
                                    <pre id="function-preview">${codeValue}</pre>
                                </div>
                            </div>
                            <div class="toggle-mode">
                                <button class="toggle-editor-mode">Switch to Code Mode</button>
                            </div>
                        `;
                        
                        // Store the current code for parameter extraction
                        this.currentCode = codeValue;
                        
                        // FIX: Extract values from the code and apply to form
                        const paramValues = this.extractParamValuesFromCode(blockName, codeValue);
                        setTimeout(() => {
                            // Update the form fields with the extracted values
                            Object.entries(paramValues).forEach(([paramName, value]) => {
                                const paramId = `param-${blockName}-${paramName}`;
                                const input = editorContent.querySelector(`#${paramId}`);
                                if (input) {
                                    input.value = value;
                                }
                            });
                            
                            // Set up parameter change handlers
                            const preview = editorContent.querySelector('#function-preview');
                            if (preview) {
                                const paramInputs = editorContent.querySelectorAll('.params-form input');
                                paramInputs.forEach(input => {
                                    input.addEventListener('input', () => {
                                        // Update preview
                                        preview.textContent = this.generateCodeFromParamInputs(blockName, editorContent);
                                    });
                                });
                            }
                        }, 0);
                    } else if (isControlBlock) {
                        // Create form for control blocks
                        let formHtml = '';
                        
                        if (blockName === 'if' || blockName === 'else if') {
                            const condition = this.extractCondition(codeValue);
                            formHtml = `
                                <div class="form-group">
                                    <label for="condition">Condition:</label>
                                    <input type="text" id="condition" placeholder="Enter condition" value="${condition}">
                                    <p class="form-help">Examples: x > 10, mouseX() > width/2, time > 5</p>
                                </div>
                            `;
                        } else if (blockName === 'for') {
                            const [init, condition, increment] = this.extractForLoopParts(codeValue);
                            formHtml = `
                                <div class="form-group">
                                    <label for="for-init">Initialization:</label>
                                    <input type="text" id="for-init" placeholder="let i = 0" value="${init}">
                                </div>
                                <div class="form-group">
                                    <label for="for-condition">Condition:</label>
                                    <input type="text" id="for-condition" placeholder="i < 10" value="${condition}">
                                </div>
                                <div class="form-group">
                                    <label for="for-increment">Increment:</label>
                                    <input type="text" id="for-increment" placeholder="i++" value="${increment}">
                                </div>
                                <p class="form-help">Example: for(let i=0; i < 10; i++)</p>
                            `;
                        }
                        
                        editorContent.innerHTML = `
                            <div class="structured-form">
                                ${formHtml}
                                <div class="preview-field">
                                    <label>Preview:</label>
                                    <pre id="control-preview">${codeValue}</pre>
                                </div>
                            </div>
                            <div class="toggle-mode">
                                <button class="toggle-editor-mode">Switch to Code Mode</button>
                            </div>
                        `;
                        
                        // Set up control block change handlers
                        const preview = editorContent.querySelector('#control-preview');
                        
                        if (blockName === 'if' || blockName === 'else if') {
                            const conditionField = editorContent.querySelector('#condition');
                            if (conditionField && preview) {
                                conditionField.addEventListener('input', () => {
                                    preview.textContent = blockName === 'if' ? 
                                        `if (${conditionField.value}) {` : 
                                        `} else if (${conditionField.value}) {`;
                                });
                            }
                        } else if (blockName === 'for') {
                            const initField = editorContent.querySelector('#for-init');
                            const conditionField = editorContent.querySelector('#for-condition');
                            const incrementField = editorContent.querySelector('#for-increment');
                            
                            if (initField && conditionField && incrementField && preview) {
                                const updateForPreview = () => {
                                    preview.textContent = `for (${initField.value}; ${conditionField.value}; ${incrementField.value}) {`;
                                };
                                
                                initField.addEventListener('input', updateForPreview);
                                conditionField.addEventListener('input', updateForPreview);
                                incrementField.addEventListener('input', updateForPreview);
                            }
                        }
                    }
                }
                
                // Re-attach toggle button event listener
                editorContent.querySelector('.toggle-editor-mode')
                    .addEventListener('click', () => toggleButton.click());
            });
        }
        
        // Add event handlers for close, cancel, and save
        const closeBtn = modal.querySelector('.block-editor-close');
        const cancelBtn = modal.querySelector('.block-editor-cancel');
        const saveBtn = modal.querySelector('.block-editor-save');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', () => {
            const structuredForm = modal.querySelector('.structured-form');
            const textarea = modal.querySelector('.block-editor-textarea');
            
            if (structuredForm) {
                // Form mode - get code from preview
                if (blockType === 'function') {
                    const preview = structuredForm.querySelector('#function-preview');
                    content.textContent = preview ? preview.textContent : this.generateCodeFromParamInputs(blockName, modal);
                } else if (isControlBlock) {
                    // Control blocks
                    if (blockName === 'if' || blockName === 'else if') {
                        const conditionField = modal.querySelector('#condition');
                        if (conditionField) {
                            content.textContent = blockName === 'if' ? 
                                `if (${conditionField.value}) {` : 
                                `} else if (${conditionField.value}) {`;
                        }
                    } else if (blockName === 'for') {
                        const initField = modal.querySelector('#for-init');
                        const conditionField = modal.querySelector('#for-condition');
                        const incrementField = modal.querySelector('#for-increment');
                        
                        if (initField && conditionField && incrementField) {
                            content.textContent = `for (${initField.value}; ${conditionField.value}; ${incrementField.value}) {`;
                        }
                    }
                }
            } else if (textarea) {
                // Code mode - take raw value
                content.textContent = textarea.value;
            }
            
            this.updateListData();
            closeModal();
        });
    }

    generateCodeFromParamInputs(functionName, container) {
        // Get function info for parameter structure
        const functionInfo = (window.keywordInfo || {})[functionName];
        if (!functionInfo || !functionInfo.name) {
            return `${functionName}();`;
        }
        
        // Collect parameter values
        const paramValues = [];
        
        // Try to get parameter names from the function signature
        let paramNames = [];
        if (functionInfo.name && functionInfo.name.includes('(')) {
            const paramMatch = functionInfo.name.match(/\(([^)]+)\)/);
            if (paramMatch && paramMatch[1]) {
                // Extract param names, removing optional brackets
                paramNames = paramMatch[1].split(',').map(p => {
                    p = p.trim();
                    return p.startsWith('[') && p.endsWith(']') ? p.slice(1, -1) : p;
                });
            }
        }
        
        // Get values from form inputs
        paramNames.forEach(paramName => {
            const paramId = `param-${functionName}-${paramName}`;
            const input = container.querySelector(`#${paramId}`);
            
            if (input) {
                let value = input.value.trim();
                
                // Skip empty parameters unless they're required
                if (!value) {
                    if (paramValues.length > 0) {
                        // Only add empty placeholders if we already have values
                        // (to maintain parameter position)
                        paramValues.push('');
                    }
                    return;
                }
                
                // Format special types
                if (paramName.includes('color') || paramName.includes('Color')) {
                    if (value.startsWith('#') && !value.startsWith('"')) {
                        value = `"${value}"`;
                    }
                } else if (paramName === 'text' || paramName.includes('message')) {
                    if (!value.startsWith('"') && !value.startsWith("'")) {
                        value = `"${value}"`;
                    }
                } else if (paramName === 'url' || paramName === 'src' || paramName === 'path') {
                    if (!value.startsWith('"') && !value.startsWith("'")) {
                        value = `"${value}"`;
                    }
                } else if (!isNaN(parseFloat(value)) && !value.includes('[') && 
                           !value.startsWith('"') && !value.startsWith("'")) {
                    // Convert numeric strings to actual numbers
                    value = parseFloat(value);
                }
                
                paramValues.push(value);
            } else {
                // Input not found, add empty placeholder to maintain position
                if (paramValues.length > 0) {
                    paramValues.push('');
                }
            }
        });
        
        // Generate function call
        const code = `${functionName}(${paramValues.join(', ')})`;
        
        // Add semicolon for statement contexts
        return code.endsWith(';') ? code : `${code};`;
    }

    // Helper to extract condition from if statement
    extractCondition(code) {
        // Match the condition within parentheses
        const match = code.match(/if\s*\((.*?)\)\s*{/);
        if (match && match[1]) {
            return match[1].trim();
        }
        return 'condition';
    }

    // Helper to extract for loop parts
    extractForLoopParts(code) {
        // Improved regex that handles more variations in for loop syntax
        const match = code.match(/for\s*\(\s*(.*?)(?:;)\s*(.*?)(?:;)\s*(.*?)\s*\)\s*{?/);
        if (match && match.length >= 4) {
            return [
                match[1].trim(), // initialization
                match[2].trim(), // condition
                match[3].trim()  // increment
            ];
        }
        return ['let i = 0', 'i < 10', 'i++'];
    }

    canCreateStructuredEditor(blockName, code) {
        // Check if we have editor info for this function
        const keyword = (window.keywordInfo || {})[blockName];
        
        // If it has parameters and is a known function, we can create a structured editor
        return keyword && keyword.params && keyword.params.length > 0;
    }

    createStructuredForm(blockName, code) {
        // Get the function information
        const keyword = (window.keywordInfo || {})[blockName];
        
        // Extract current parameter values using regex
        const paramValues = this.extractParamValuesFromCode(blockName, code);
        console.log(`Extracted param values for ${blockName}:`, paramValues);
        
        let html = '';
        const fields = [];
        
        if (keyword) {
            // Add function description if available
            if (keyword.description) {
                html += `<div class="function-description">${keyword.description}</div>`;
            }
            
            // If we have parameters, create inputs for them
            if (keyword.params && keyword.params.length > 0) {
                // Group parameters by type/category for easier editing
                html += '<div class="form-group"><h4>Parameters</h4>';
                
                // Add all parameters with clear labels
                keyword.params.forEach((param, index) => {
                    const paramId = `param-${blockName}-${param.name}`;
                    const paramValue = paramValues[param.name] !== undefined ? paramValues[param.name] : '';
                    
                    html += `
                        <div class="form-field">
                            <label for="${paramId}">${this.formatParamName(param.name)}:</label>
                            <input type="text" id="${paramId}" name="${param.name}" 
                                value="${paramValue}" placeholder="${param.defaultValue || ''}">
                            ${param.description ? `<p class="param-desc">${param.description}</p>` : ''}
                        </div>
                    `;
                    
                    fields.push({
                        name: param.name,
                        id: paramId,
                        type: 'text'
                    });
                });
                
                html += '</div>';
            } else {
                // No parameters
                html += '<p>This function has no parameters.</p>';
            }
            
            // Add a preview code section
            html += `
                <div class="form-preview">
                    <h4>Preview</h4>
                    <pre class="preview-code">${code}</pre>
                </div>
            `;
        } else {
            // Fallback for unknown functions
            html = `
                <div class="form-message">
                    <p>No structured editor available for this function.</p>
                    <textarea class="block-editor-textarea">${code}</textarea>
                </div>
            `;
        }
        
        return { html, fields };
    }
    
    // Helper to format parameter names for display
    formatParamName(name) {
        // Convert camelCase or snake_case to Title Case with spaces
        return name
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/_/g, ' ')         // Replace underscores with spaces
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .trim();
    }
    
    // Extract parameter values using regex
    extractParamValuesFromCode(functionName, code) {
        const values = {};
        
        try {
            // Match the function call pattern - handle different formats
            const funcPattern = new RegExp(`${functionName}\\s*\\(([^)]*?)\\)`, 'i');
            const match = code.match(funcPattern);
            
            if (match && match[1]) {
                // Get the parameters string
                const paramsString = match[1];
                
                if (paramsString.trim() === '') {
                    return values; // No parameters provided
                }
                
                // Split by commas while preserving structures like arrays and nested functions
                const params = this.splitParamsPreservingStructures(paramsString);
                
                // Get parameter info from function name or keywords.js
                const funcInfo = window.keywordInfo[functionName];
                let paramNames = [];
                
                if (funcInfo && funcInfo.name && funcInfo.name.includes('(')) {
                    const paramMatch = funcInfo.name.match(/\(([^)]+)\)/);
                    if (paramMatch && paramMatch[1]) {
                        // Extract param names, removing optional brackets
                        paramNames = paramMatch[1].split(',').map(p => {
                            p = p.trim();
                            return p.startsWith('[') && p.endsWith(']') ? p.slice(1, -1) : p;
                        });
                    }
                }
                
                // Map parameter values to parameter names
                params.forEach((value, index) => {
                    if (index < paramNames.length) {
                        const paramName = paramNames[index];
                        values[paramName] = value.trim();
                    }
                });
            }
        } catch (e) {
            console.error('Error extracting parameters:', e);
        }
        
        return values;
    }
    
    // Helper to split parameters while preserving structures like arrays
    splitParamsPreservingStructures(paramsString) {
        const params = [];
        let current = '';
        let depth = 0;
        let inQuote = false;
        let quoteChar = '';
        
        for (let i = 0; i < paramsString.length; i++) {
            const char = paramsString[i];
            
            // Handle quotes - be careful about escaped quotes
            if ((char === '"' || char === "'") && 
                (i === 0 || paramsString[i-1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuote = false;
                }
            }
            
            // Handle brackets and parentheses - but only if not in quotes
            if (!inQuote) {
                if (char === '(' || char === '[' || char === '{') {
                    depth++;
                } else if (char === ')' || char === ']' || char === '}') {
                    depth--;
                }
            }
            
            // Process commas at the top level
            if (char === ',' && depth === 0 && !inQuote) {
                params.push(current);
                current = '';
                continue;
            }
            
            current += char;
        }
        
        // Add the last parameter
        if (current.trim() !== '') {
            params.push(current);
        }
        
        return params;
    }
    
    // Generate code from the form
    generateCodeFromForm(functionName, modal) {
        const keyword = (window.keywordInfo || {})[functionName];
        if (!keyword || !keyword.params) return null;
        
        // Collect parameter values from form fields
        const paramValues = [];
        
        keyword.params.forEach(param => {
            const fieldId = `param-${functionName}-${param.name}`;
            const field = modal.querySelector(`#${fieldId}`);
            
            if (field) {
                let value;
                
                if (field.type === 'checkbox') {
                    value = field.checked;
                } else {
                    value = field.value.trim();
                    
                    // Handle empty values
                    if (!value && param.defaultValue) {
                        value = param.defaultValue;
                    }
                    
                    // Format based on type
                    if (value) {
                        if (param.name.includes('color') || param.name.includes('Color')) {
                            // If it's a hex color but not wrapped in quotes, wrap it
                            if (value.startsWith('#') && 
                                !value.startsWith('"') && 
                                !value.startsWith("'")) {
                                value = `"${value}"`;
                            }
                        } else if (param.name === 'text' || 
                                  param.name === 'message' ||
                                  param.name === 'content') {
                            // Ensure text strings have quotes
                            if (!value.startsWith('"') && !value.startsWith("'")) {
                                value = `"${value}"`;
                            }
                        }
                        // Convert plain numbers to numeric values
                        else if (!isNaN(value) && 
                                 !value.includes('"') && 
                                 !value.startsWith('[')) {
                            value = parseFloat(value);
                            
                            // Re-add trailing zeros if they were in the original
                            if (field.value.includes('.') && !String(value).includes('.')) {
                                value = field.value;
                            }
                        }
                    }
                }
                
                paramValues.push(value);
            } else {
                // If field not found, use empty string
                paramValues.push('');
            }
        });
        
        // Generate the function call
        const functionCall = `${functionName}(${paramValues.join(', ')})`;
        
        // Check context to add trailing semicolon if needed
        const block = modal.querySelector('.block-content');
        const isStatement = !block || !block.textContent.includes('=');
        
        return isStatement ? `${functionCall};` : functionCall;
    }
    
    updateFormFromCode(functionName, code, formContainer) {
        const paramValues = this.extractParamValuesFromCode(functionName, code);
        
        // Update each form field with extracted values
        Object.entries(paramValues).forEach(([paramName, value]) => {
            const fieldId = `param-${functionName}-${paramName}`;
            const field = formContainer.querySelector(`#${fieldId}`);
            
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value === true || value === 'true';
                } else if (field.type === 'color') {
                    field.value = this.convertToHex(value);
                    
                    // Also update color picker if exists
                    const picker = formContainer.querySelector(`#${fieldId}-picker`);
                    if (picker) {
                        picker.value = this.convertToHex(value);
                    }
                } else {
                    // Remove quotes if present
                    if (typeof value === 'string' && 
                       (value.startsWith('"') && value.endsWith('"') || 
                        value.startsWith("'") && value.endsWith("'"))) {
                        field.value = value.slice(1, -1);
                    } else {
                        field.value = value;
                    }
                }
            }
        });
        
        // Update preview
        const preview = formContainer.querySelector('.preview-code');
        if (preview) {
            preview.textContent = code;
        }
    }
    
    // Helper to convert various color formats to hex
    convertToHex(color) {
        if (!color) return '#FFFFFF';
        
        // Handle array format [r, g, b]
        if (color.includes('[') && color.includes(']')) {
            try {
                const rgbArray = JSON.parse(color.replace(/\s+/g, ''));
                if (Array.isArray(rgbArray) && rgbArray.length >= 3) {
                    const r = parseInt(rgbArray[0]);
                    const g = parseInt(rgbArray[1]);
                    const b = parseInt(rgbArray[2]);
                    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
                }
            } catch (e) {
                console.error('Error parsing color array:', e);
            }
        }
        
        // Handle hex format
        if (color.startsWith('#')) {
            return color;
        }
        
        // Handle named colors
        if (color.startsWith('"') || color.startsWith("'")) {
            // Remove quotes
            const namedColor = color.slice(1, -1);
            
            // Use a temporary element to convert named color to hex
            const tempElem = document.createElement('div');
            tempElem.style.color = namedColor;
            document.body.appendChild(tempElem);
            const computedColor = getComputedStyle(tempElem).color;
            document.body.removeChild(tempElem);
            
            // Parse rgb() format
            const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
            }
        }
        
        return '#FFFFFF'; // Default fallback
    }
    
    openSettingsEditor() {
        const settingsBlock = document.querySelector('.settings-block .block-content pre');
        if (!settingsBlock) return;
        
        // Ensure fillColor exists
        if (!this.settings.fillColor) {
            this.settings.fillColor = [255, 255, 255]; // Default white
        }
        
        // Create settings editor modal
        const modal = document.createElement('div');
        modal.className = 'settings-editor-modal';
        
        modal.innerHTML = `
            <div class="settings-editor-container">
                <div class="settings-editor-header">
                    <h3>Edit Settings</h3>
                    <button class="settings-editor-close">×</button>
                </div>
                <div class="settings-editor-content">
                    <div class="settings-group">
                        <label>Background Color</label>
                        <div class="settings-color-inputs">
                            <input type="number" id="bg-r" min="0" max="255" value="${this.settings.backgroundColor[0]}" placeholder="R">
                            <input type="number" id="bg-g" min="0" max="255" value="${this.settings.backgroundColor[1]}" placeholder="G">
                            <input type="number" id="bg-b" min="0" max="255" value="${this.settings.backgroundColor[2]}" placeholder="B">
                            <input type="color" id="bg-color-picker" value="${this.rgbToHex(this.settings.backgroundColor)}">
                        </div>
                    </div>
                    <div class="settings-group">
                        <label>Fill Color</label>
                        <div class="settings-color-inputs">
                            <input type="number" id="fill-r" min="0" max="255" value="${this.settings.fillColor[0]}" placeholder="R">
                            <input type="number" id="fill-g" min="0" max="255" value="${this.settings.fillColor[1]}" placeholder="G">
                            <input type="number" id="fill-b" min="0" max="255" value="${this.settings.fillColor[2]}" placeholder="B">
                            <input type="color" id="fill-color-picker" value="${this.rgbToHex(this.settings.fillColor)}">
                        </div>
                    </div>
                    <div class="settings-group">
                        <label>FPS</label>
                        <input type="number" id="settings-fps" min="1" max="60" value="${this.settings.fps}">
                    </div>
                    <div class="settings-group">
                        <label>Motion Blur</label>
                        <div>
                            <input type="checkbox" id="use-motion-blur" ${this.settings.useMotionBlur ? 'checked' : ''}>
                            <label for="use-motion-blur">Enable Motion Blur</label>
                        </div>
                        <div class="motion-blur-strength" ${!this.settings.useMotionBlur ? 'style="display:none"' : ''}>
                            <label>Strength:</label>
                            <input type="range" id="motion-blur-strength" min="0.1" max="1" step="0.1" value="${this.settings.motionBlurStrength}">
                            <span id="motion-blur-value">${this.settings.motionBlurStrength}</span>
                        </div>
                    </div>
                    <div class="settings-group">
                        <label>Custom Settings (Advanced)</label>
                        <textarea id="custom-settings" placeholder="Add custom settings here...">${this.getCustomSettingsText()}</textarea>
                    </div>
                </div>
                <div class="settings-editor-footer">
                    <button class="settings-editor-cancel">Cancel</button>
                    <button class="settings-editor-save">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add color picker functionality for background color
        const bgColorPicker = document.getElementById('bg-color-picker');
        const bgRInput = document.getElementById('bg-r');
        const bgGInput = document.getElementById('bg-g');
        const bgBInput = document.getElementById('bg-b');
        
        bgColorPicker.addEventListener('input', () => {
            const rgb = this.hexToRgb(bgColorPicker.value);
            bgRInput.value = rgb.r;
            bgGInput.value = rgb.g;
            bgBInput.value = rgb.b;
        });
        
        const updateBgColorPicker = () => {
            const r = parseInt(bgRInput.value) || 0;
            const g = parseInt(bgGInput.value) || 0;
            const b = parseInt(bgBInput.value) || 0;
            bgColorPicker.value = this.rgbToHex([r, g, b]);
        };
        
        bgRInput.addEventListener('input', updateBgColorPicker);
        bgGInput.addEventListener('input', updateBgColorPicker);
        bgBInput.addEventListener('input', updateBgColorPicker);
        
        // Add color picker functionality for fill color
        const fillColorPicker = document.getElementById('fill-color-picker');
        const fillRInput = document.getElementById('fill-r');
        const fillGInput = document.getElementById('fill-g');
        const fillBInput = document.getElementById('fill-b');
        
        fillColorPicker.addEventListener('input', () => {
            const rgb = this.hexToRgb(fillColorPicker.value);
            fillRInput.value = rgb.r;
            fillGInput.value = rgb.g;
            fillBInput.value = rgb.b;
        });
        
        const updateFillColorPicker = () => {
            const r = parseInt(fillRInput.value) || 0;
            const g = parseInt(fillGInput.value) || 0;
            const b = parseInt(fillBInput.value) || 0;
            fillColorPicker.value = this.rgbToHex([r, g, b]);
        };
        
        fillRInput.addEventListener('input', updateFillColorPicker);
        fillGInput.addEventListener('input', updateFillColorPicker);
        fillBInput.addEventListener('input', updateFillColorPicker);
        
        // Motion blur toggle
        const motionBlurCheckbox = document.getElementById('use-motion-blur');
        const motionBlurStrength = document.querySelector('.motion-blur-strength');
        const strengthSlider = document.getElementById('motion-blur-strength');
        const strengthValue = document.getElementById('motion-blur-value');
        
        motionBlurCheckbox.addEventListener('change', () => {
            motionBlurStrength.style.display = motionBlurCheckbox.checked ? 'block' : 'none';
        });
        
        strengthSlider.addEventListener('input', () => {
            strengthValue.textContent = strengthSlider.value;
        });
        
        // Close and save functionality
        const closeBtn = modal.querySelector('.settings-editor-close');
        const cancelBtn = modal.querySelector('.settings-editor-cancel');
        const saveBtn = modal.querySelector('.settings-editor-save');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', () => {
            // Save settings
            this.settings.backgroundColor = [
                parseInt(bgRInput.value) || 0,
                parseInt(bgGInput.value) || 0,
                parseInt(bgBInput.value) || 0
            ];
            
            // Save fill color settings
            this.settings.fillColor = [
                parseInt(fillRInput.value) || 0,
                parseInt(fillGInput.value) || 0,
                parseInt(fillBInput.value) || 0
            ];
            
            this.settings.fps = parseInt(document.getElementById('settings-fps').value) || 30;
            this.settings.useMotionBlur = motionBlurCheckbox.checked;
            this.settings.motionBlurStrength = parseFloat(strengthSlider.value) || 0.1;
            
            // Update custom settings
            const customSettings = document.getElementById('custom-settings').value;
            this.saveCustomSettings(customSettings);
            
            // Update the settings block
            this.updateSettingsBlock();
            
            closeModal();
        });
    }
    
    getCustomSettingsText() {
        // Return any custom settings that are not the default ones
        const settings = { ...this.settings };
        delete settings.backgroundColor;
        delete settings.fps;
        delete settings.useMotionBlur;
        delete settings.motionBlurStrength;
        
        if (Object.keys(settings).length === 0) {
            return '';
        }
        
        return Object.entries(settings)
            .map(([key, value]) => `  ${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
            .join(',\n');
    }
    
    saveCustomSettings(text) {
        if (!text) return;
        
        // Parse custom settings
        const lines = text.split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*(\w+):\s*(.+?)(?:,\s*|$)/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                
                // Skip the default settings
                if (['backgroundColor', 'fps', 'useMotionBlur', 'motionBlurStrength'].includes(key)) {
                    return;
                }
                
                // Parse the value
                if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                } else if (!isNaN(parseFloat(value)) && !value.includes('"')) {
                    value = parseFloat(value);
                } else if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                
                this.settings[key] = value;
            }
        });
    }
    
    updateSettingsBlock() {
        const settingsBlock = document.querySelector('.settings-block .block-content pre');
        if (!settingsBlock) return;
        
        // If settings is empty, use empty settings object
        if (Object.keys(this.settings).length === 0) {
            settingsBlock.textContent = 'const settings = {};';
            return;
        }
        
        let settingsText = 'const settings = {\n';
        settingsText += this.formatSettingsObject(this.settings, 1);
        settingsText += '};';
        
        settingsBlock.textContent = settingsText;
    }

    // Helper to format settings with proper indentation
    formatSettingsObject(obj, indentLevel) {
        const indent = '  '.repeat(indentLevel);
        let result = '';
        
        // Get all setting keys
        const allKeys = Object.keys(obj);
        
        // Add settings one by one
        for (let i = 0; i < allKeys.length; i++) {
            const key = allKeys[i];
            const value = obj[key];
            const isLast = i === allKeys.length - 1;
            
            if (Array.isArray(value)) {
                // Format arrays
                if (value.length === 0) {
                    result += `${indent}${key}: []${isLast ? '' : ',\n'}`;
                } else {
                    // Check if it's a simple array (all primitive values)
                    const isSimpleArray = value.every(item => 
                        typeof item !== 'object' || item === null
                    );
                    
                    if (isSimpleArray) {
                        result += `${indent}${key}: [${value.map(v => this.formatValue(v)).join(', ')}]${isLast ? '' : ',\n'}`;
                    } else {
                        // Format complex arrays with nested objects
                        result += `${indent}${key}: [\n`;
                        for (let j = 0; j < value.length; j++) {
                            const item = value[j];
                            const itemIsLast = j === value.length - 1;
                            
                            if (typeof item === 'object' && item !== null) {
                                result += `${indent}  {\n`;
                                result += this.formatSettingsObject(item, indentLevel + 2);
                                result += `${indent}  }${itemIsLast ? '' : ','}\n`;
                            } else {
                                result += `${indent}  ${this.formatValue(item)}${itemIsLast ? '' : ','}\n`;
                            }
                        }
                        result += `${indent}]${isLast ? '' : ',\n'}`;
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                // Format nested objects
                result += `${indent}${key}: {\n`;
                result += this.formatSettingsObject(value, indentLevel + 1);
                result += `${indent}}${isLast ? '' : ',\n'}`;
            } else {
                // Format primitive values
                result += `${indent}${key}: ${this.formatValue(value)}${isLast ? '' : ',\n'}`;
            }
        }
        
        return result;
    }

    // Format a single value with proper JavaScript syntax
    formatValue(value) {
        if (typeof value === 'string') {
            return `"${value}"`;
        } else if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
        } else if (typeof value === 'object' && value !== null) {
            return `{${Object.entries(value).map(([k, v]) => `${k}: ${this.formatValue(v)}`).join(', ')}}`;
        } else {
            return String(value);
        }
    }
    
    updateListData() {
        // Update global list data
        this.lists.global = [];
        document.querySelectorAll('#global-list .block').forEach(block => {
            const content = block.querySelector('.block-content pre');
            if (content) {
                // For settings block, update internal settings object instead of adding to list
                if (block.dataset.name === 'settings' || block.classList.contains('settings-block')) {
                    // Don't add settings to the list - they're handled separately
                    // But we could parse the settings if needed
                    // this.parseSettings(content.textContent);
                } else {
                    // Regular global block
                    this.lists.global.push({
                        type: block.dataset.type,
                        name: block.dataset.name,
                        content: content.textContent
                    });
                }
            }
        });
        
        // Update setup list data
        this.lists.setup = [];
        document.querySelectorAll('#setup-list .block').forEach(block => {
            const content = block.querySelector('.block-content pre');
            if (content) {
                this.lists.setup.push({
                    type: block.dataset.type,
                    name: block.dataset.name,
                    content: content.textContent
                });
            }
        });
        
        // Update draw list data
        this.lists.draw = [];
        document.querySelectorAll('#draw-list .block').forEach(block => {
            const content = block.querySelector('.block-content pre');
            if (content) {
                this.lists.draw.push({
                    type: block.dataset.type,
                    name: block.dataset.name,
                    content: content.textContent
                });
            }
        });
    }
    
    filterKeywords(searchText) {
        const keywordBlocks = document.querySelectorAll('#keywords-list .block');
        const searchLower = searchText.toLowerCase();
        
        keywordBlocks.forEach(block => {
            const name = block.dataset.name.toLowerCase();
            const category = block.dataset.category.toLowerCase();
            const isMatch = name.includes(searchLower) || category.includes(searchLower);
            
            block.style.display = isMatch ? 'block' : 'none';
        });
        
        // Show/hide category headers
        const categoryGroups = document.querySelectorAll('#keywords-list .category-group');
        categoryGroups.forEach(group => {
            const visibleBlocks = group.querySelectorAll('.block[style="display: block"]').length;
            group.style.display = visibleBlocks > 0 ? 'block' : 'none';
        });
    }
    
    filterByCategory(category) {
        const categoryGroups = document.querySelectorAll('#keywords-list .category-group');
        
        if (category === 'all') {
            categoryGroups.forEach(group => {
                group.style.display = 'block';
            });
        } else {
            categoryGroups.forEach(group => {
                group.style.display = group.dataset.category === category ? 'block' : 'none';
            });
        }
    }
    
    formatCategoryName(category) {
        const categoryMap = {
            'variable': 'Variables',
            'control': 'Control Flow',
            'math': 'Math',
            'utility': 'Utility',
            'shapes': 'Shapes',
            'color': 'Colors',
            'audio': 'Audio',
            'visualizer': 'Visualizers',
            'other': 'Other'
        };
        
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    rgbToHex(rgb) {
        return `#${rgb.map(c => {
            const hex = Math.max(0, Math.min(255, c)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
    }
    
    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        
        if (hex.length === 3) {
            hex = hex.split('').map(h => h + h).join('');
        }
        
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return { r, g, b };
    }
    
    generateCode() {
        // Get the latest data
        this.updateListData();
        
        let code = '';
        
        // Add settings only if they exist
        if (Object.keys(this.settings).length > 0) {
            code += 'const settings = {\n';
            
            // Add all settings properties
            const settingsKeys = Object.keys(this.settings);
            for (let i = 0; i < settingsKeys.length; i++) {
                const key = settingsKeys[i];
                const value = this.settings[key];
                const isLast = i === settingsKeys.length - 1;
                
                if (Array.isArray(value)) {
                    code += `  ${key}: [${value.join(', ')}]${isLast ? '' : ',\n'}`;
                } else if (typeof value === 'string') {
                    code += `  ${key}: "${value}"${isLast ? '' : ',\n'}`;
                } else {
                    code += `  ${key}: ${value}${isLast ? '' : ',\n'}`;
                }
            }
            
            code += '\n};\n\n';
        }
        
        // Add global variables
        if (this.lists.global.length > 0) {
            this.lists.global.forEach(item => {
                code += item.content + '\n';
            });
            code += '\n';
        }
        
        // Generate setup function ONLY if blocks exist
        if (this.lists.setup.length > 0) {
            code += 'function setup() {\n';
            
            this.lists.setup.forEach(item => {
                code += '  ' + item.content.replace(/\n/g, '\n  ') + '\n';
            });
            
            code += '}\n\n';
        }
        
        // Generate draw function ONLY if blocks exist
        if (this.lists.draw.length > 0) {
            code += 'function draw(time) {\n';
            
            this.lists.draw.forEach(item => {
                code += '  ' + item.content.replace(/\n/g, '\n  ') + '\n';
            });
            
            code += '}';
        }
        
        // Update the editor content
        if (window.editor) {
            window.editor.setValue(code);
            window.logToConsole('Generated code from Block Composer');
        }
        
        // Close the composer
        this.closeComposer();
    }

    createCustomCodeBlock() {
        const modal = document.createElement('div');
        modal.className = 'block-editor-modal';
        
        modal.innerHTML = `
            <div class="block-editor-container">
                <div class="block-editor-header">
                    <h3>Add Custom Code</h3>
                    <button class="block-editor-close">×</button>
                </div>
                <div class="block-editor-content">
                    <div class="form-field">
                        <label for="block-section">Add to Section:</label>
                        <select id="section-type">
                            <option value="global">Global Variables</option>
                            <option value="setup" selected>Setup Function</option>
                            <option value="draw">Draw Function</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="code-name">Block Name (optional):</label>
                        <input type="text" id="code-name" placeholder="Custom Code">
                    </div>
                    <div class="form-field">
                        <label for="custom-code">Code:</label>
                        <textarea id="custom-code" class="block-editor-textarea" 
                            placeholder="Enter your custom code here..."></textarea>
                    </div>
                    <div class="form-help">
                        <p><strong>Tips:</strong></p>
                        <ul>
                            <li>Don't include indentation - it will be added automatically</li>
                            <li>End statements with semicolons</li>
                            <li>For blocks that need braces, include both opening and closing braces</li>
                        </ul>
                    </div>
                </div>
                <div class="block-editor-footer">
                    <button class="block-editor-cancel">Cancel</button>
                    <button class="block-editor-save">Add Code</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get form elements
        const sectionSelect = modal.querySelector('#section-type');
        const nameInput = modal.querySelector('#code-name');
        const codeTextarea = modal.querySelector('#custom-code');
        
        // Close and save functionality
        const closeBtn = modal.querySelector('.block-editor-close');
        const cancelBtn = modal.querySelector('.block-editor-cancel');
        const saveBtn = modal.querySelector('.block-editor-save');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', () => {
            const section = sectionSelect.value;
            const name = nameInput.value.trim() || 'Custom Code';
            const code = codeTextarea.value.trim();
            
            if (!code) {
                alert('Please enter some code.');
                return;
            }
            
            // Create the custom code block
            this.addCustomCodeBlock(section, name, code);
            closeModal();
        });
    }

    addCustomCodeBlock(section, name, code) {
        const listId = section === 'global' ? 'global-list' : 
                      section === 'setup' ? 'setup-list' : 'draw-list';
        
        const list = document.getElementById(listId);
        if (!list) return;
        
        // Create block
        const block = document.createElement('div');
        block.className = 'block target-block';
        block.dataset.name = name;
        block.dataset.type = 'custom';
        block.draggable = true;
        
        block.innerHTML = `
            <div class="block-header">
                <span class="block-title">${name}</span>
                <div class="block-actions">
                    <button class="block-edit" title="Edit">✏️</button>
                    <button class="block-delete" title="Remove">×</button>
                </div>
            </div>
            <div class="block-content">
                <pre>${code}</pre>
            </div>
        `;
        
        // Add event listeners
        const editBtn = block.querySelector('.block-edit');
        const deleteBtn = block.querySelector('.block-delete');
        
        editBtn.addEventListener('click', () => {
            this.editBlock(block, listId);
        });
        
        deleteBtn.addEventListener('click', () => {
            block.remove();
            this.updateListData();
            
            // Update indentation for the list
            if (section === 'setup' || section === 'draw') {
                this.updateIndentationForList(listId);
            }
            
            // Show empty message if no blocks left
            if (list.querySelectorAll('.block').length === 0) {
                const emptyMsg = list.querySelector('.block-list-empty');
                if (emptyMsg) {
                    emptyMsg.style.display = 'block';
                }
            }
        });
        
        // Add to list
        list.appendChild(block);
        
        // Hide empty message
        const emptyMsg = list.querySelector('.block-list-empty');
        if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
        
        // Apply indentation if this is in a setup or draw list
        if (section === 'setup' || section === 'draw') {
            this.applyIndentationToBlock(block, listId);
            this.updateIndentationForList(listId);
        }
        
        // Update list data
        this.updateListData();
    }
    
    clearComposer() {
        // Reset lists
        this.lists.global = [];
        this.lists.setup = [];
        this.lists.draw = [];
        
        // Clear blocks
        document.querySelectorAll('#global-list .block:not(.settings-block)').forEach(block => block.remove());
        document.querySelectorAll('#setup-list .block').forEach(block => block.remove());
        document.querySelectorAll('#draw-list .block').forEach(block => block.remove());
        
        // Show empty messages
        document.querySelectorAll('.block-list-empty').forEach(msg => {
            msg.style.display = 'block';
        });
    }
    
    openComposer() {
        // Handle mobile view - ensure editor is closed to make room
        if (window.innerWidth <= 768 && typeof window.closeEditorPanel === 'function') {
            window.closeEditorPanel();
        }
        
        if (!this.overlay) return;
        
        // Check if we should import existing code
        if (window.editor) {
            const currentCode = window.editor.getValue();
            if (currentCode && currentCode.trim() !== '') {
                try {
                    // Clear existing blocks first
                    this.clearComposer();
                    
                    // Parse the code and set up blocks
                    this.importExistingCode(currentCode);
                    
                    // Ensure settings are properly updated in the UI
                    this.updateSettingsBlock();
                    
                    // Log success
                    console.log('Successfully imported code from editor');
                } catch (err) {
                    console.error('Could not parse existing code:', err);
                }
            }
        }
        
        this.overlay.style.display = 'block';
        document.body.classList.add('composer-open');
        
        // Position the block composer overlay to appear above the mobile editor button
        this.positionRelativeToEditorButton();
        
        // Force a refresh of the mobile layout
        this.handleMobileLayout();
    }
    
    closeComposer() {
        if (!this.overlay) return;
        
        this.overlay.style.display = 'none';
        document.body.classList.remove('composer-open');
        
        // Restore the editor button
        const editorButton = document.getElementById('mobile-editor-toggle');
        if (editorButton && editorButton.dataset.originalText) {
            editorButton.innerHTML = editorButton.dataset.originalText;
            editorButton.style.zIndex = '1000';
        }
    }

    importExistingCode(code) {
        try {
            // Reset lists to avoid duplicate blocks
            this.lists.setup = [];
            this.lists.draw = [];
            
            // Check if the code is empty
            if (!code || code.trim() === '') {
                // Reset settings to empty
                this.settings = {};
                
                // Update the settings block with empty settings
                this.updateSettingsBlock();
                
                // Clear all blocks in setup and draw lists
                document.querySelectorAll('#setup-list .block').forEach(block => block.remove());
                document.querySelectorAll('#draw-list .block').forEach(block => block.remove());
                document.querySelectorAll('#global-list .block:not(.settings-block)').forEach(block => block.remove());
                
                // Show empty messages
                document.querySelectorAll('.block-list-empty').forEach(msg => {
                    msg.style.display = 'block';
                });
                
                return true;
            }
            
            // Parse the code into sections
            const sections = this.parseCodeSections(code);
            
            // Process global variables & settings
            if (sections.globals) {
                // Look for settings object and parse it
                const settingsMatch = sections.globals.match(/const\s+settings\s*=\s*{([\s\S]*?)};/);
                if (settingsMatch && settingsMatch[1]) {
                    // Parse settings from code only
                    this.parseSettings(settingsMatch[1]);
                    
                    // Update the settings block with parsed settings
                    this.updateSettingsBlock();
                }
                
                // Process global variables
                this.processGlobalVariables(sections.globals);
            }
            
            // Clear existing blocks in the lists
            document.querySelectorAll('#setup-list .block').forEach(block => block.remove());
            document.querySelectorAll('#draw-list .block').forEach(block => block.remove());
            
            // Process setup function - only if it exists
            if (sections.setup && sections.setup.trim()) {
                this.processCodeSection(sections.setup, 'setup-list');
            }
            
            // Process draw function - only if it exists
            if (sections.draw && sections.draw.trim()) {
                this.processCodeSection(sections.draw, 'draw-list');
            }
            
            // Update the data model
            this.updateListData();
            
            // Update indentation for sections that have blocks
            if (document.querySelectorAll('#setup-list .block').length > 0) {
                this.updateIndentationForList('setup-list');
            }
            
            if (document.querySelectorAll('#draw-list .block').length > 0) {
                this.updateIndentationForList('draw-list');
            }
            
            // Show/hide empty messages as appropriate
            const setupList = document.getElementById('setup-list');
            const drawList = document.getElementById('draw-list');
            const globalList = document.getElementById('global-list');
            
            if (setupList) {
                const setupEmpty = setupList.querySelector('.block-list-empty');
                if (setupEmpty) {
                    setupEmpty.style.display = setupList.querySelectorAll('.block').length > 0 ? 'none' : 'block';
                }
            }
            
            if (drawList) {
                const drawEmpty = drawList.querySelector('.block-list-empty');
                if (drawEmpty) {
                    drawEmpty.style.display = drawList.querySelectorAll('.block').length > 0 ? 'none' : 'block';
                }
            }
            
            if (globalList) {
                const globalEmpty = globalList.querySelector('.block-list-empty');
                if (globalEmpty) {
                    globalEmpty.style.display = globalList.querySelectorAll('.block').length > 0 ? 'none' : 'block';
                }
            }
            
            return true;
        } catch (err) {
            console.error('Error importing code:', err);
            return false;
        }
    }

    parseCodeSections(code) {
        const sections = {
            globals: '',
            setup: '',
            draw: ''
        };
        
        // Extract setup function with precise regex to get exact content
        const setupMatch = code.match(/function\s+setup\s*\(\)\s*{([\s\S]*?)}/);
        if (setupMatch && setupMatch[1]) {
            sections.setup = setupMatch[1].trim();
        }
        
        // Extract draw function with precise regex, supporting different parameter names
        const drawRegex = /function\s+draw\s*\((?:time|t)?\)\s*{([\s\S]*?)}/;
        const drawMatch = code.match(drawRegex);
        if (drawMatch && drawMatch[1]) {
            sections.draw = drawMatch[1].trim();
        }
        
        // Extract globals - everything before the first function declaration
        const firstFunctionIndex = code.search(/function\s+\w+\s*\(/);
        if (firstFunctionIndex > 0) {
            sections.globals = code.substring(0, firstFunctionIndex).trim();
        }
        
        return sections;
    }

    // Parse settings from code
    parseSettings(settingsText) {
        try {
            // Create a copy of current settings to preserve any values not explicitly overwritten
            const currentSettings = { ...this.settings };
            
            // Track open brackets to properly handle nested structures
            let openBrackets = 0;
            let openBraces = 0;
            let currentKey = null;
            let currentValue = '';
            let parsingKey = true;
            
            // Split into lines for easier processing
            const lines = settingsText.split('\n');
            
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex].trim();
                if (!line) continue;
                
                // Process each character in the line
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (parsingKey) {
                        // Looking for the key name
                        if (char === ':') {
                            currentKey = currentValue.trim();
                            currentValue = '';
                            parsingKey = false;
                        } else {
                            currentValue += char;
                        }
                    } else {
                        // Parsing the value
                        // Track brackets to handle nested structures
                        if (char === '[') openBrackets++;
                        if (char === ']') openBrackets--;
                        if (char === '{') openBraces++;
                        if (char === '}') openBraces--;
                        
                        // Handle end of value (comma or end of line)
                        if (char === ',' && openBrackets === 0 && openBraces === 0) {
                            // Save the current key-value pair
                            if (currentKey) {
                                this.processSettingValue(currentSettings, currentKey, currentValue.trim());
                            }
                            
                            // Reset for next key-value pair
                            currentKey = null;
                            currentValue = '';
                            parsingKey = true;
                        } else {
                            currentValue += char;
                        }
                    }
                }
                
                // If we're at the end of a line and still parsing a value
                if (!parsingKey && currentKey) {
                    // Only consider it complete if no open structures
                    if (openBrackets === 0 && openBraces === 0) {
                        // Save the current key-value pair
                        this.processSettingValue(currentSettings, currentKey, currentValue.trim());
                        
                        // Reset for next key-value pair
                        currentKey = null;
                        currentValue = '';
                        parsingKey = true;
                    } else {
                        // Add a newline character for multiline values
                        currentValue += '\n';
                    }
                }
            }
            
            // Handle any remaining value at the end
            if (currentKey) {
                this.processSettingValue(currentSettings, currentKey, currentValue.trim());
            }
            
            // Update this.settings with parsed values
            this.settings = currentSettings;
            
            console.log("Settings updated:", this.settings);
        } catch (err) {
            console.error('Error parsing settings:', err);
            // Don't reset settings on error
        }
    }

    processGlobalVariables(globalCode) {
        if (!globalCode) return;
    
        // Clear existing global variables (but keep settings block)
        document.querySelectorAll('#global-list .block:not(.settings-block)').forEach(block => block.remove());
        
        // Split the global section into individual statements
        const statements = this.splitIntoStatements(globalCode);
        
        statements.forEach(statement => {
            statement = statement.trim();
            if (!statement) return;
            
            // Skip comments
            if (statement.startsWith('//')) return;
            
            // Check if this is a settings object
            if (statement.match(/^const\s+settings\s*=\s*{/)) {
                // This will be handled separately by parseSettings
                return;
            }
            
            // Check if this is a variable declaration
            const varMatch = statement.match(/^(var|let|const)\s+(\w+)\s*=\s*(.+);$/);
            if (varMatch) {
                const [, varType, varName, varValue] = varMatch;
                this.addGlobalVariable(varName, varType, varValue);
            } else {
                // If not a standard variable, add as custom code block
                this.addCustomCodeBlock('global', 'Custom Global', statement);
            }
        });
    }

    processSettingValue(settingsObj, key, valueStr) {
        try {
            // Remove trailing comma if present
            if (valueStr.endsWith(',')) {
                valueStr = valueStr.slice(0, -1).trim();
            }
    
            // Handle nested objects with { }
            if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
                // Create nested object
                const nestedValue = {};
                const nestedContent = valueStr.slice(1, -1).trim();
                
                // Parse the nested object using a recursive approach
                this.parseNestedObject(nestedValue, nestedContent);
                settingsObj[key] = nestedValue;
            }
            // Handle arrays with [ ]
            else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
                // Get the content inside brackets
                const arrayContent = valueStr.slice(1, -1).trim();
                
                // Split by commas, but respect nested structures
                const arrayValues = this.splitArrayValues(arrayContent);
                
                // Convert each value to appropriate type
                settingsObj[key] = arrayValues.map(val => this.convertToType(val.trim()));
            }
            // Handle basic values
            else {
                settingsObj[key] = this.convertToType(valueStr);
            }
        } catch (e) {
            console.warn(`Error processing setting "${key}": ${e}`);
            // Store as raw string if parsing fails
            settingsObj[key] = valueStr;
        }
    }

    // Split array values respecting nested structures
    splitArrayValues(arrayContent) {
        const values = [];
        let currentValue = '';
        let openBrackets = 0;
        let openBraces = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < arrayContent.length; i++) {
            const char = arrayContent[i];
            
            // Handle quotes
            if ((char === '"' || char === "'") && (i === 0 || arrayContent[i-1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                }
            }
            
            // Track brackets/braces to handle nesting (only outside quotes)
            if (!inQuotes) {
                if (char === '[') openBrackets++;
                if (char === ']') openBrackets--;
                if (char === '{') openBraces++;
                if (char === '}') openBraces--;
            }
            
            // Check for value separator (comma)
            if (char === ',' && openBrackets === 0 && openBraces === 0 && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Add the last value if there is one
        if (currentValue.trim()) {
            values.push(currentValue.trim());
        }
        
        return values;
    }

    // Parse nested object structure
    parseNestedObject(obj, content) {
        let currentKey = null;
        let currentValue = '';
        let parsingKey = true;
        let openBrackets = 0;
        let openBraces = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        // Add trailing space to help with processing last property
        content = content + ' ';
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            
            // Handle quotes
            if ((char === '"' || char === "'") && (i === 0 || content[i-1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                }
                
                // Include quote chars in the value
                if (!parsingKey || inQuotes) {
                    currentValue += char;
                }
                continue;
            }
            
            // Only track brackets/braces when not parsing a key and not in quotes
            if (!parsingKey && !inQuotes) {
                if (char === '[') openBrackets++;
                if (char === ']') openBrackets--;
                if (char === '{') openBraces++;
                if (char === '}') openBraces--;
            }
            
            if (parsingKey) {
                // Looking for the key name
                if (char === ':') {
                    currentKey = currentValue.trim();
                    currentValue = '';
                    parsingKey = false;
                } else {
                    currentValue += char;
                }
            } else {
                // Check for end of value (comma)
                if (char === ',' && openBrackets === 0 && openBraces === 0 && !inQuotes) {
                    // Save the current key-value pair
                    if (currentKey) {
                        obj[currentKey] = this.convertToType(currentValue.trim());
                    }
                    
                    // Reset for next key-value pair
                    currentKey = null;
                    currentValue = '';
                    parsingKey = true;
                } else {
                    currentValue += char;
                }
            }
        }
        
        // Handle the last key-value pair if present
        if (currentKey && currentValue.trim()) {
            obj[currentKey] = this.convertToType(currentValue.trim());
        }
    }

    // Convert string value to appropriate JavaScript type
    convertToType(value) {
        // Remove trailing comma if present
        if (value.endsWith(',')) {
            value = value.slice(0, -1).trim();
        }
        
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;
        
        // Handle quoted strings
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1).trim();
            if (!arrayContent) return [];
            
            const arrayValues = this.splitArrayValues(arrayContent);
            return arrayValues.map(val => this.convertToType(val.trim()));
        }
        
        // Handle objects
        if (value.startsWith('{') && value.endsWith('}')) {
            const obj = {};
            const objContent = value.slice(1, -1).trim();
            this.parseNestedObject(obj, objContent);
            return obj;
        }
        
        // Try number conversion
        if (!isNaN(value) && value.trim() !== '') {
            return Number(value);
        }
        
        // Default to returning the string as is
        return value;
    }

    // Create global variable block
    createGlobalVariableBlock(varLine) {
        try {
            // Extract variable type, name and value
            const match = varLine.match(/^(var|let|const)\s+(\w+)\s*=\s*(.+?);?$/);
            if (!match) return;
            
            const [, varType, varName, varValue] = match;
            
            // Create a block
            this.addGlobalVariable(varName, varType, varValue);
        } catch (err) {
            console.error('Error creating global variable block:', err);
        }
    }

    // Process code section (setup or draw)
    processCodeSection(codeSection, listId) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        // Skip if the section is empty
        if (!codeSection || !codeSection.trim()) return;
        
        // First, normalize the code by ensuring proper spacing around braces
        const normalizedCode = codeSection
            .replace(/\{/g, ' { ')
            .replace(/\}/g, ' } ');
        
        // Parse the code using a more sophisticated approach to handle control structures
        this.parseControlStructures(normalizedCode, listId);
        
        // Hide the empty message since we've added blocks
        const emptyMsg = list.querySelector('.block-list-empty');
        if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
    }
    
    parseControlStructures(code, listId) {
        // Track nesting levels and control structures
        const controlStack = [];
        let currentCode = '';
        let braceLevel = 0;
        let inString = false;
        let stringChar = '';
        let inForLoopDeclaration = false;
        
        // Process the code character by character
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            // Handle string literals to avoid parsing braces inside strings
            if ((char === '"' || char === "'") && (i === 0 || code[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            // Only process special characters when not inside a string
            if (!inString) {
                // Check for for loop signature to prevent breaking on semicolons within for declaration
                if (char === '(' && currentCode.trim().match(/^for\s*$/)) {
                    inForLoopDeclaration = true;
                } else if (char === ')' && inForLoopDeclaration) {
                    inForLoopDeclaration = false;
                }
                
                if (char === '{') {
                    braceLevel++;
                    
                    // If this is the opening brace of a control structure
                    if (currentCode.trim()) {
                        // Check if it's a control structure
                        const trimmedCode = currentCode.trim();
                        
                        if (trimmedCode.match(/^for\s*\(.*\)$/)) {
                            // Create the for loop block
                            this.createBlockFromStatement(trimmedCode + ' {', listId);
                            
                            // Push to control stack
                            controlStack.push('for');
                            
                            // Reset current code for next statement
                            currentCode = '';
                            continue;
                        } 
                        else if (trimmedCode.match(/^if\s*\(.*\)$/)) {
                            // Create the if statement block
                            this.createBlockFromStatement(trimmedCode + ' {', listId);
                            
                            // Push to control stack
                            controlStack.push('if');
                            
                            // Reset current code for next statement
                            currentCode = '';
                            continue;
                        }
                        else if (trimmedCode.match(/^else if\s*\(.*\)$/)) {
                            // Create the else if statement block
                            this.createBlockFromStatement('} ' + trimmedCode + ' {', listId);
                            
                            // Update control stack
                            if (controlStack.length > 0) {
                                controlStack[controlStack.length - 1] = 'else if';
                            } else {
                                controlStack.push('else if');
                            }
                            
                            // Reset current code for next statement
                            currentCode = '';
                            continue;
                        }
                        else if (trimmedCode === 'else') {
                            // Create the else statement block
                            this.createBlockFromStatement('} else {', listId);
                            
                            // Update control stack
                            if (controlStack.length > 0) {
                                controlStack[controlStack.length - 1] = 'else';
                            } else {
                                controlStack.push('else');
                            }
                            
                            // Reset current code for next statement
                            currentCode = '';
                            continue;
                        }
                    }
                } 
                else if (char === '}') {
                    braceLevel--;
                    
                    // If we have a closing brace and there are structures in our stack
                    if (controlStack.length > 0) {
                        // Process any accumulated code before the closing brace
                        if (currentCode.trim()) {
                            // Split by semicolons to get individual statements, but only if we're not in a for loop declaration
                            const statements = this.splitIntoIndividualStatements(currentCode);
                            
                            // Create blocks for each statement
                            statements.forEach(stmt => {
                                if (stmt.trim()) {
                                    this.createBlockFromStatement(stmt, listId);
                                }
                            });
                        }
                        
                        // Only close the control structure if the brace levels match
                        // For nested loops, we only want to close when we're back at the appropriate level
                        if (braceLevel === controlStack.length - 1) {
                            const controlType = controlStack.pop();
                            if (controlType === 'for') {
                                this.createBlockFromStatement('end for', listId);
                            } else {
                                this.createBlockFromStatement('end if', listId);
                            }
                        }
                        
                        // Reset current code for next statement
                        currentCode = '';
                        continue;
                    }
                }
                else if (braceLevel === 0 && char === ';' && !inForLoopDeclaration) {
                    // At top level, semicolons terminate statements (but not in for loop declaration)
                    currentCode += char;
                    
                    const trimmedCode = currentCode.trim();
                    if (trimmedCode) {
                        this.createBlockFromStatement(trimmedCode, listId);
                        currentCode = '';
                        continue;
                    }
                }
            }
            
            // Add character to current code
            currentCode += char;
        }
        
        // Process any remaining code
        if (currentCode.trim()) {
            const statements = this.splitIntoIndividualStatements(currentCode);
            statements.forEach(stmt => {
                if (stmt.trim()) {
                    this.createBlockFromStatement(stmt, listId);
                }
            });
        }
    }

    splitIntoIndividualStatements(code) {
        const statements = [];
        let currentStatement = '';
        let braceLevel = 0;
        let parenLevel = 0;
        let inString = false;
        let stringChar = '';
        let forLoopParamCount = 0;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            // Handle string literals
            if ((char === '"' || char === "'") && (i === 0 || code[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            // Track brace and parenthesis level
            if (!inString) {
                if (char === '{') braceLevel++;
                if (char === '}') braceLevel--;
                
                // Handle for loop detection and special semicolon handling
                if (char === '(') {
                    parenLevel++;
                    // Check if we're entering a for loop declaration
                    const prefix = currentStatement.trim();
                    if (prefix.match(/^for\s*$/)) {
                        forLoopParamCount = 0; // Reset the semicolon counter
                    }
                }
                else if (char === ')') {
                    parenLevel--;
                }
                // Count semicolons inside parentheses which could be for loop params
                else if (char === ';' && parenLevel > 0) {
                    forLoopParamCount++;
                }
                
                // Split on semicolons at the top level, but never inside for loop declarations
                // Regular for loop has exactly 2 semicolons in its declaration
                if (braceLevel === 0 && parenLevel === 0 && char === ';') {
                    currentStatement += char;
                    if (currentStatement.trim()) {
                        statements.push(currentStatement.trim());
                    }
                    currentStatement = '';
                    continue;
                }
            }
            
            currentStatement += char;
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        return statements;
    }

    // Split code into individual statements
    splitIntoStatements(code) {
        const statements = [];
        let current = '';
        let braceCount = 0;
        let inComment = false;
        let inMultiLineComment = false;
        
        // Process line by line
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Handle comments
            if (line.startsWith('//')) {
                continue;
            }
            
            // Handle start of multi-line comments
            if (line.includes('/*')) {
                inMultiLineComment = true;
            }
            
            // Handle end of multi-line comments
            if (inMultiLineComment && line.includes('*/')) {
                inMultiLineComment = false;
                continue;
            }
            
            // Skip lines in multi-line comments
            if (inMultiLineComment) {
                continue;
            }
            
            // Count braces to track blocks
            for (let j = 0; j < line.length; j++) {
                if (line[j] === '{') braceCount++;
                if (line[j] === '}') braceCount--;
            }
            
            // Add line to current statement
            current += line + '\n';
            
            // If braces are balanced and line ends with semicolon or closing brace, complete the statement
            if (braceCount === 0 && (line.endsWith(';') || line.endsWith('}'))) {
                statements.push(current.trim());
                current = '';
            }
        }
        
        // Add any remaining content
        if (current.trim()) {
            statements.push(current.trim());
        }
        
        return statements;
    }

    // Create block from parsed statement
    createBlockFromStatement(statement, listId) {
        try {
            const list = document.getElementById(listId);
            if (!list) return;
            
            // Clean up the statement
            const cleanStatement = statement.trim();
            
            // Check for empty or comment-only statements
            if (!cleanStatement || cleanStatement.startsWith('//')) {
                return;
            }
            
            // Try to determine what kind of statement this is
            let blockType = 'custom'; // Default to custom
            let blockName = '';
            
            // Check for control structures first
            if (cleanStatement.startsWith('if ') || cleanStatement.startsWith('if(')) {
                blockType = 'keyword';
                blockName = 'if';
            } else if (cleanStatement.startsWith('} else if') || cleanStatement.startsWith('}else if')) {
                blockType = 'keyword';
                blockName = 'else if';
            } else if (cleanStatement.startsWith('} else') || cleanStatement.startsWith('}else')) {
                blockType = 'keyword';
                blockName = 'else';
            } else if (cleanStatement === '}' || cleanStatement === 'end if') {
                blockType = 'keyword';
                blockName = 'end if';
            } else if (cleanStatement === 'end for') {
                blockType = 'keyword';
                blockName = 'end';
            } else if (cleanStatement.startsWith('for ') || cleanStatement.startsWith('for(')) {
                blockType = 'keyword';
                blockName = 'for';
            } else {
                // Improved function call detection
                // Look for pattern: functionName(...);
                const funcRegex = /^(\w+)\s*\(.*\);?$/;
                const funcMatch = cleanStatement.match(funcRegex);
                
                if (funcMatch) {
                    blockName = funcMatch[1];
                    blockType = 'function';
                    
                    // Check if it's a known function from keywords.js
                    if (window.keywordInfo && window.keywordInfo[blockName]) {
                        blockType = 'function';
                    }
                } else {
                    // Check for variable declarations
                    const varRegex = /^(var|let|const)\s+\w+/;
                    if (cleanStatement.match(varRegex)) {
                        blockType = 'keyword';
                        blockName = cleanStatement.split(' ')[0]; // var, let, or const
                    } else {
                        // It's truly a custom code block
                        blockName = 'customCode';
                    }
                }
            }
            
            // Create block element
            const block = document.createElement('div');
            block.className = 'block target-block';
            block.dataset.name = blockName;
            block.dataset.type = blockType;
            block.draggable = true;
            
            // Format the display code based on the block type
            let displayCode = cleanStatement;
            if (blockName === 'end if' || blockName === 'end') {
                displayCode = '}';
            } else if (blockName === 'end for') {
                displayCode = '}';
            }
            
            // Create block content
            block.innerHTML = `
                <div class="block-header">
                    <span class="block-title">${blockName}</span>
                    <div class="block-actions">
                        <button class="block-edit" title="Edit">✏️</button>
                        <button class="block-delete" title="Remove">×</button>
                    </div>
                </div>
                <div class="block-content">
                    <pre>${displayCode}</pre>
                </div>
            `;
            
            // Add event listeners
            const editBtn = block.querySelector('.block-edit');
            const deleteBtn = block.querySelector('.block-delete');
            
            editBtn.addEventListener('click', () => {
                this.editBlock(block, listId);
            });
            
            deleteBtn.addEventListener('click', () => {
                block.remove();
                this.updateListData();
                
                // Update indentation
                this.updateIndentationForList(listId);
                
                // Show empty message if needed
                if (list.querySelectorAll('.block').length === 0) {
                    const emptyMsg = list.querySelector('.block-list-empty');
                    if (emptyMsg) {
                        emptyMsg.style.display = 'block';
                    }
                }
            });
            
            // Add to list
            list.appendChild(block);
            
            // Hide empty message
            const emptyMsg = list.querySelector('.block-list-empty');
            if (emptyMsg) {
                emptyMsg.style.display = 'none';
            }
        } catch (err) {
            console.error('Error creating block from statement:', err);
        }
    }

    positionRelativeToEditorButton() {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;
        
        const editorButton = document.getElementById('mobile-editor-toggle');
        if (!editorButton) return;
        
        // Get the button's position
        const buttonRect = editorButton.getBoundingClientRect();
        
        // Move the editor button to appear on top of the composer interface
        // This ensures it's still accessible when the composer is open
        editorButton.style.zIndex = '1001';
        
        // Update the editor button to show a dismiss action when composer is open
        editorButton.dataset.originalText = editorButton.innerHTML;
        editorButton.innerHTML = '<i class="fas fa-times"></i> Close Composer';
        
        // Store original button handler
        if (!editorButton._originalClickHandler) {
            editorButton._originalClickHandler = editorButton.onclick;
            
            // Replace with new handler that checks if composer is open
            editorButton.onclick = (e) => {
                if (this.overlay && this.overlay.style.display === 'block') {
                    this.closeComposer();
                    e.stopPropagation();
                    return;
                }
                
                // Call the original handler
                if (editorButton._originalClickHandler) {
                    editorButton._originalClickHandler.call(editorButton, e);
                }
            };
        }
    }
}

// Initialize the Block Composer
document.addEventListener('DOMContentLoaded', function() {
    // Create styles
    const style = document.createElement('style');
    style.textContent = `
        .block-composer-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            overflow: hidden;
        }
        
        .block-composer-container {
            display: flex;
            flex-direction: column;
            width: 90%;
            height: 90%;
            max-width: 1200px;
            max-height: 800px;
            background-color: #1e1e2e;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            margin: 2% auto;
            overflow: hidden;
        }
        
        .block-composer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background-color: #282a36;
            border-bottom: 1px solid #44475a;
        }
        
        .block-composer-header h2 {
            margin: 0;
            color: #61dafb;
        }
        
        .block-composer-close {
            background: none;
            border: none;
            color: #f8f8f2;
            font-size: 24px;
            cursor: pointer;
        }
        
        .block-composer-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .block-composer-sidebar {
            width: 300px;
            background-color: #21222c;
            border-right: 1px solid #44475a;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .block-composer-search {
            padding: 15px;
            border-bottom: 1px solid #44475a;
        }
        
        .block-composer-search input,
        .block-composer-search select {
            width: 100%;
            padding: 8px 10px;
            background: #282a36;
            border: 1px solid #44475a;
            border-radius: 4px;
            color: #f8f8f2;
            margin-bottom: 10px;
        }
        
        .block-list-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .block-list-container h3 {
            margin: 10px 15px;
            color: #f8f8f2;
            font-size: 16px;
        }
        
        .block-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .block-composer-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .block-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid #44475a;
            overflow: hidden;
        }
        
        .block-section h3 {
            margin: 10px 15px;
            color: #f8f8f2;
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .block-section:last-child {
            border-bottom: none;
        }
        
        .block {
            background: #282a36;
            border: 1px solid #44475a;
            border-radius: 4px;
            margin-bottom: 10px;
            overflow: hidden;
            transition: all 0.2s ease;
        }
        
        .block:hover {
            border-color: #61dafb;
        }
        
        .block-header {
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2d2d3f;
        }
        
        .block-title {
            font-weight: bold;
            color: #f8f8f2;
        }
        
        .block-actions {
            display: flex;
            align-items: center;
        }
        
        .block-actions button {
            background: none;
            border: none;
            color: #f8f8f2;
            cursor: pointer;
            margin-left: 8px;
            font-size: 16px;
            padding: 2px 6px;
            border-radius: 3px;
        }
        
        .block-actions button:hover {
            background: rgba(97, 218, 251, 0.2);
        }
        
        .block-category-badge {
            background: rgba(97, 218, 251, 0.2);
            color: #61dafb;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
            margin-right: 8px;
        }
        
        .block-content {
            padding: 8px 12px;
            border-top: 1px solid rgba(97, 218, 251, 0.2);
        }
        
        .block-content pre {
            margin: 0;
            white-space: pre-wrap;
            font-family: "Consolas", monospace;
            color: #f8f8f2;
            font-size: 14px;
        }
        
        .block-description {
            padding: 8px 12px;
            border-top: 1px solid rgba(97, 218, 251, 0.2);
            background: #383a59;
            font-size: 14px;
            color: #f8f8f2;
        }
        
        .block-description p {
            margin: 0 0 8px 0;
        }
        
        .block-example {
            background: #282a36;
            padding: 8px;
            border-radius: 4px;
            margin: 0;
            font-family: "Consolas", monospace;
            font-size: 13px;
        }
        
        .block-list-empty {
            color: #6272a4;
            padding: 20px;
            text-align: center;
            font-style: italic;
        }
        
        .block-composer-footer {
            padding: 15px 20px;
            background-color: #282a36;
            border-top: 1px solid #44475a;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .block-composer-button.primary {
            background-color: #61dafb;
            color: #282a36;
            border: none;
        }
        
        .block-composer-button.primary:hover {
            background-color: #4cc9f0;
        }
        
        .block-composer-button.secondary {
            background-color: transparent;
            border: 1px solid #61dafb;
            color: #61dafb;
        }
        
        .block-composer-button.secondary:hover {
            background-color: rgba(97, 218, 251, 0.1);
        }
        
        /* Block editor modal */
        .block-editor-modal, .settings-editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1100;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .block-editor-container, .settings-editor-container {
            background-color: #282a36;
            width: 80%;
            max-width: 600px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
        }
        
        .block-editor-header, .settings-editor-header {
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #21222c;
        }
        
        .block-editor-header h3, .settings-editor-header h3 {
            margin: 0;
            color: #61dafb;
        }
        
        .block-editor-close, .settings-editor-close {
            background: none;
            border: none;
            color: #f8f8f2;
            font-size: 20px;
            cursor: pointer;
        }
        
        .block-editor-content, .settings-editor-content {
            padding: 15px;
        }
        
        .block-editor-footer, .settings-editor-footer {
            padding: 12px 15px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background-color: #21222c;
        }
        
        .block-editor-textarea {
            width: 100%;
            min-height: 150px;
            background-color: #1e1e2e;
            color: #f8f8f2;
            border: 1px solid #44475a;
            border-radius: 4px;
            padding: 10px;
            font-family: "Consolas", monospace;
            resize: vertical;
        }
        
        .block-editor-cancel, .block-editor-save, .settings-editor-cancel, .settings-editor-save {
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .block-editor-save, .settings-editor-save {
            background-color: #61dafb;
            color: #282a36;
            border: none;
        }
        
        .block-editor-cancel, .settings-editor-cancel {
            background-color: transparent;
            border: 1px solid #61dafb;
            color: #61dafb;
        }
        
        /* Drag and drop styles */
        .drag-over {
            background-color: rgba(97, 218, 251, 0.1);
            border: 2px dashed #61dafb;
        }
        
        .dragging {
            opacity: 0.6;
        }
        
        .category-group {
            margin-bottom: 15px;
        }
        
        .category-header {
            font-weight: bold;
            color: #61dafb;
            padding: 5px 0;
            margin-bottom: 5px;
            border-bottom: 1px solid #44475a;
        }
        
        /* Settings editor styles */
        .settings-group {
            margin-bottom: 15px;
        }
        
        .settings-group label {
            display: block;
            margin-bottom: 5px;
            color: #f8f8f2;
        }
        
        .settings-group input[type="number"],
        .settings-group input[type="text"],
        .settings-group select,
        .settings-group textarea {
            background-color: #1e1e2e;
            color: #f8f8f2;
            border: 1px solid #44475a;
            border-radius: 4px;
            padding: 6px 10px;
        }
        
        .settings-group textarea {
            width: 100%;
            min-height: 100px;
            font-family: "Consolas", monospace;
            resize: vertical;
        }
        
        .settings-color-inputs {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .settings-color-inputs input[type="number"] {
            width: 60px;
        }
        
        .settings-color-inputs input[type="color"] {
            height: 30px;
            width: 30px;
            padding: 0;
            border: none;
            background: none;
            cursor: pointer;
        }
        
        .motion-blur-strength {
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .motion-blur-strength input[type="range"] {
            flex: 1;
        }
        
        /* Responsive styling */
        @media (max-width: 768px) {
            .block-composer-container {
                width: 95%;
                height: 95%;
                max-width: none;
                max-height: none;
                margin: 2.5% auto;
            }
            
            .block-composer-content {
                flex-direction: column;
            }
            
            .block-composer-sidebar {
                width: 100%;
                height: 300px;
                border-right: none;
                border-bottom: 1px solid #44475a;
            }
            
            .block-section {
                min-height: 150px;
            }
        }

        /* Better styling for function parameter forms */
        .function-description {
            background: rgba(97, 218, 251, 0.1);
            padding: 10px;
            margin-bottom: 15px;
            border-left: 3px solid #61dafb;
            color: #f8f8f2;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
            padding: 15px;
            background: #282a36;
            border-radius: 4px;
        }
        
        .form-group h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #61dafb;
            font-size: 15px;
            border-bottom: 1px solid #44475a;
            padding-bottom: 5px;
        }
        
        .form-field {
            margin-bottom: 12px;
        }
        
        .form-field label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #f8f8f2;
        }
        
        .form-field input {
            width: 100%;
            padding: 8px 10px;
            background: #1e1e2e;
            color: #f8f8f2;
            border: 1px solid #44475a;
            border-radius: 4px;
        }
        
        .form-field input:focus {
            border-color: #61dafb;
            outline: none;
            box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2);
        }
        
        .param-desc {
            font-size: 12px;
            color: #8f8f8f;
            margin-top: 3px;
            font-style: italic;
        }
        
        .form-preview {
            margin-top: 20px;
        }
        
        .form-preview h4 {
            color: #61dafb;
            margin-bottom: 8px;
        }
        
        .preview-code {
            background: #1e1e2e;
            padding: 10px;
            border-radius: 4px;
            font-family: "Consolas", monospace;
            color: #f8f8f2;
            overflow-x: auto;
        }
        
        /* Style for the Block Composer button */
        #block-composer-button {
            position: absolute;
            left: 0%;
            transform: translate(-50%, -50%);
            background-color: #2a2a4a;
            color: #61dafb;
            border: 1px solid rgba(97, 218, 251, 0.5);
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s ease;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        #block-composer-button:hover {
            background-color: #3a3a5a;
            border-color: #61dafb;
            transform: translate(-50%, -50%) translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        /* Drop indicators */
        .drop-target-before {
            border-top: 2px solid #61dafb !important;
            padding-top: 2px;
        }
        
        .drop-target-after {
            border-bottom: 2px solid #61dafb !important;
            padding-bottom: 2px;
        }
        
        /* Visual feedback for dragging */
        .block.dragging {
            opacity: 0.5;
            border: 2px dashed #61dafb;
        }
        
        .block-list.drag-over {
            background-color: rgba(97, 218, 251, 0.05);
        }

        .block[data-indent-level="1"] {
            margin-left: 20px;
        }

        .block[data-indent-level="2"] {
            margin-left: 40px;
        }

        .block[data-indent-level="3"] {
            margin-left: 60px;
        }

        .block[data-indent-level="4"] {
            margin-left: 80px;
        }

        .block[data-indent-level="5"] {
            margin-left: 100px;
        }
    `;

    const additionalStyles = `
        /* Custom code block styling */
        .block[data-type="custom"] {
            border-left: 3px solid #ff79c6;
        }
        
        .form-help {
            margin-top: 15px;
            padding: 10px;
            background: rgba(255, 121, 198, 0.1);
            border-left: 3px solid #ff79c6;
            border-radius: 4px;
        }
        
        .form-help p {
            margin-top: 0;
            margin-bottom: 8px;
            color: #ff79c6;
        }
        
        .form-help ul {
            margin: 0;
            padding-left: 20px;
            color: #f8f8f2;
        }
        
        .form-help li {
            margin-bottom: 5px;
        }
        
        /* Button to add custom code */
        #add-custom-code {
            margin-right: auto; /* Push this button to the left */
            background-color: #ff79c6;
            color: #282a36;
            border: none;
        }
        
        #add-custom-code:hover {
            background-color: #ff92d0;
        }
        
        /* Custom code section in block view */
        .block[data-type="custom"] .block-header {
            background: #4d3d4e;
        }
    `;

    // Add the additional CSS to the style element
    style.textContent += additionalStyles;

    document.head.appendChild(style);
    
    // Create the Block Composer instance
    if (!window.keywordInfo) {
        console.log('Keywords not yet loaded, waiting before initializing Block Composer');
        const checkKeywords = setInterval(() => {
            if (window.keywordInfo) {
                window.blockComposer = new BlockComposer();
                clearInterval(checkKeywords);
                console.log('Block Composer initialized');
                
                // Create button container and position buttons correctly
                createBlockComposerButton();
            }
        }, 300);
    } else {
        window.blockComposer = new BlockComposer();
        console.log('Block Composer initialized');
        
        // Create button container and position buttons correctly
        createBlockComposerButton();
    }

    function createBlockComposerButton() {
        // Find the visual composer button
        const visualComposerBtn = document.getElementById('visual-composer-button');
        if (!visualComposerBtn) return;
        
        // Create a container for the buttons if it doesn't exist
        let buttonContainer = document.querySelector('.composer-button-container');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'composer-button-container';
            visualComposerBtn.parentNode.insertBefore(buttonContainer, visualComposerBtn);
            
            // Move the visual composer button into the container
            buttonContainer.appendChild(visualComposerBtn);
        }
        
        // Create the block composer button
        const blockComposerBtn = document.createElement('button');
        blockComposerBtn.id = 'block-composer-button';
        blockComposerBtn.innerHTML = '<i class="fas fa-puzzle-piece"></i> Block Composer';
        blockComposerBtn.onclick = () => window.openBlockComposer();
        
        // Add it to the container
        buttonContainer.appendChild(blockComposerBtn);
    }
});

// Add window method to open the Block Composer
window.openBlockComposer = function() {
    if (window.blockComposer) {
        window.blockComposer.openComposer();
    } else {
        console.error('Block Composer not initialized');
        alert('Block Composer is not available. Please make sure it is properly loaded.');
    }
};