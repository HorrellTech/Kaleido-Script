/**
 * File System Manager for KaleidoScript
 * Handles virtual file system for imported assets
 */
class FileSystemManager {
    constructor() {
        // Root structure with default directories
        this.fileSystem = {
            'Sprites': { type: 'directory', children: {} },
            'Images': { type: 'directory', children: {} },
            'Textures': { type: 'directory', children: {} },
            'Sounds': { type: 'directory', children: {} },
            'Music': { type: 'directory', children: {} },
            '3D Models': { type: 'directory', children: {} },
            'Videos': { type: 'directory', children: {} }
        };
        
        this.currentPath = []; // Current directory path (empty means root)
        
        // Keep track of file blobs/URLs to prevent memory leaks
        this.fileURLs = {};
        
        // Initialize the UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            // DOM is already ready
            this.initializeUI();
        }
    }
    
    initializeUI() {
        // Create the filesystem UI container in imports tab
        const importsTab = document.getElementById('imports-tab');
        if (!importsTab) return;
        
        // Clear existing content
        importsTab.innerHTML = '';
        
        // Create filesystem toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'fs-toolbar';
        toolbar.innerHTML = `
            <button id="fs-back-btn" title="Go Back"><i class="fas fa-arrow-left"></i></button>
            <button id="fs-home-btn" title="Go to Root"><i class="fas fa-home"></i></button>
            <button id="fs-new-folder-btn" title="New Folder"><i class="fas fa-folder-plus"></i></button>
            <button id="fs-import-btn" title="Import File"><i class="fas fa-file-import"></i></button>
            <div class="fs-path-display">Root</div>
        `;
        
        // Create filesystem container
        const fsContainer = document.createElement('div');
        fsContainer.className = 'fs-container';
        
        // Create preview/details panel
        const previewPanel = document.createElement('div');
        previewPanel.className = 'fs-preview-panel';
        previewPanel.innerHTML = `
            <div class="fs-preview">
                <div class="fs-no-preview">Select a file to preview</div>
            </div>
            <div class="fs-file-info">
                <div class="fs-file-name"></div>
                <div class="fs-file-meta"></div>
                <div class="fs-file-actions"></div>
            </div>
        `;
        
        // Add to imports tab
        importsTab.appendChild(toolbar);
        importsTab.appendChild(fsContainer);
        importsTab.appendChild(previewPanel);
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load initial view
        this.refreshView();
        
        if (window.logToConsole) {
            window.logToConsole('File System initialized successfully', 'info');
        } else {
            console.log('File System initialized successfully');
        }
    }
    
    initEventListeners() {
        // Back button
        const backBtn = document.getElementById('fs-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.currentPath.length > 0) {
                    this.currentPath.pop();
                    this.refreshView();
                }
            });
        }
        
        // Home button
        const homeBtn = document.getElementById('fs-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.currentPath = [];
                this.refreshView();
            });
        }
        
        // New folder button
        const newFolderBtn = document.getElementById('fs-new-folder-btn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                this.createNewFolder();
            });
        }
        
        // Import file button
        const importBtn = document.getElementById('fs-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importFile();
            });
        }
    }
    
    refreshView() {
        // Update path display
        const pathDisplay = document.querySelector('.fs-path-display');
        if (pathDisplay) {
            pathDisplay.textContent = this.currentPath.length > 0 
                ? this.currentPath.join(' / ') 
                : 'Root';
        }
        
        // Get current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Update file listing
        const fsContainer = document.querySelector('.fs-container');
        if (fsContainer) {
            fsContainer.innerHTML = '';
            
            // Sort items: directories first, then files
            const sortedItems = Object.entries(currentDir).sort((a, b) => {
                if (a[1].type === 'directory' && b[1].type !== 'directory') return -1;
                if (a[1].type !== 'directory' && b[1].type === 'directory') return 1;
                return a[0].localeCompare(b[0]);
            });
            
            // Create items - use a list-style layout
            const listContainer = document.createElement('div');
            listContainer.className = 'fs-list';
            
            // Create items
            for (const [name, item] of sortedItems) {
                const itemElement = document.createElement('div');
                itemElement.className = `fs-item ${item.type === 'directory' ? 'fs-directory' : 'fs-file'}`;
                itemElement.dataset.name = name;
                itemElement.dataset.type = item.type;
                
                // Get file type icon
                let icon = 'fa-file';
                if (item.type === 'directory') {
                    icon = 'fa-folder';
                } else if (item.fileType) {
                    // Select icon based on mime type
                    if (item.fileType.startsWith('image/')) {
                        icon = 'fa-file-image';
                    } else if (item.fileType.startsWith('audio/')) {
                        icon = 'fa-file-audio';
                    } else if (item.fileType.startsWith('video/')) {
                        icon = 'fa-file-video';
                    } else if (item.fileType.includes('model')) {
                        icon = 'fa-cube';
                    }
                }
                
                // Build the item content
                itemElement.innerHTML = `
                    <div class="fs-item-content">
                        <div class="fs-item-icon"><i class="fas ${icon}"></i></div>
                        <div class="fs-item-name">${name}</div>
                    </div>
                `;
                
                // Add action buttons container separately from the name
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'fs-item-actions';
                
                // Different actions for directories vs files
                if (item.type === 'directory') {
                    actionsContainer.innerHTML = `
                        <button class="fs-add-subfolder" title="Create subfolder">
                            <i class="fas fa-folder-plus"></i>
                        </button>
                        <button class="fs-add-file" title="Upload file here">
                            <i class="fas fa-file-upload"></i>
                        </button>
                    `;
                    
                    // Add single-click handler for folder navigation
                    itemElement.querySelector('.fs-item-content').addEventListener('click', () => {
                        this.currentPath.push(name);
                        this.refreshView();
                    });
                } else {
                    // For files, add a copy path button
                    actionsContainer.innerHTML = `
                        <button class="fs-copy-path" title="Copy path for script">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="fs-preview" title="Preview file">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                    
                    // Click to preview file
                    itemElement.querySelector('.fs-item-content').addEventListener('click', () => {
                        this.previewFile(name, item);
                    });
                }
                
                itemElement.appendChild(actionsContainer);
                
                // Add event listeners for action buttons
                if (item.type === 'directory') {
                    // Add subfolder button
                    const addSubfolderBtn = itemElement.querySelector('.fs-add-subfolder');
                    if (addSubfolderBtn) {
                        addSubfolderBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.createSubfolder(name);
                        });
                    }
                    
                    // Add file button
                    const addFileBtn = itemElement.querySelector('.fs-add-file');
                    if (addFileBtn) {
                        addFileBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.importFileToFolder(name);
                        });
                    }
                } else {
                    // Copy path button
                    const copyPathBtn = itemElement.querySelector('.fs-copy-path');
                    if (copyPathBtn) {
                        copyPathBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.copyPathToClipboard(name, item);
                        });
                    }
                    
                    // Preview button
                    const previewBtn = itemElement.querySelector('.fs-preview');
                    if (previewBtn) {
                        previewBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.previewFile(name, item);
                        });
                    }
                }
                
                // Add right-click context menu for all items
                itemElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, name, item);
                });
                
                listContainer.appendChild(itemElement);
            }
            
            fsContainer.appendChild(listContainer);
        }
        
        // Clear preview when changing directories
        this.clearPreview();
    }
    
    // Method to copy file path for use in scripts
    copyPathToClipboard(name, item, event) {
        // Build the path string
        let pathStr = '';
        if (this.currentPath.length > 0) {
            pathStr = this.currentPath.join('/') + '/';
        }
        pathStr += name;
        
        // Copy to clipboard
        navigator.clipboard.writeText(pathStr)
            .then(() => {
                if (window.logToConsole) {
                    window.logToConsole(`Path copied to clipboard: ${pathStr}`, 'info');
                }
            })
            .catch(err => {
                console.error('Failed to copy path:', err);
            });
        
        // Show a temporary message
        const tooltip = document.createElement('div');
        tooltip.className = 'fs-tooltip';
        tooltip.textContent = 'Path copied!';
        document.body.appendChild(tooltip);
        
        // Position near the button
        const rect = event.target.closest('button').getBoundingClientRect();
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.left = `${rect.left}px`;
        
        // Remove after a delay
        setTimeout(() => {
            document.body.removeChild(tooltip);
        }, 1500);
    }
    
    createNewFolder() {
        const folderName = prompt('Enter new folder name:');
        if (!folderName || folderName.trim() === '') return;
        
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if folder with this name already exists
        if (currentDir[folderName]) {
            alert(`A folder or file named "${folderName}" already exists.`);
            return;
        }
        
        // Create new folder
        currentDir[folderName] = {
            type: 'directory',
            children: {},
            created: new Date().toISOString()
        };
        
        // Refresh view
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Created folder: ${folderName}`, 'info');
        }
    }
    
    createSubfolder(parentFolder) {
        const folderName = prompt(`Enter name for new subfolder in "${parentFolder}":`);
        if (!folderName || folderName.trim() === '') return;
        
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if parent folder exists
        if (!currentDir[parentFolder] || currentDir[parentFolder].type !== 'directory') {
            alert(`Parent folder "${parentFolder}" not found.`);
            return;
        }
        
        // Check if subfolder already exists
        if (currentDir[parentFolder].children[folderName]) {
            alert(`A folder or file named "${folderName}" already exists in "${parentFolder}".`);
            return;
        }
        
        // Create subfolder
        currentDir[parentFolder].children[folderName] = {
            type: 'directory',
            children: {},
            created: new Date().toISOString()
        };
        
        // If we want to navigate into it, update the path and refresh
        this.currentPath.push(parentFolder);
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Created subfolder: ${folderName} in ${parentFolder}`, 'info');
        }
    }
    
    importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // Allow multiple file selection
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            // Process each file
            for (const file of files) {
                this.processImportedFile(file);
            }
        };
        
        input.click();
    }
    
    importFileToFolder(folderName) {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true; // Allow multiple file selection
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            // Find current directory
            let currentDir = this.fileSystem;
            for (const folder of this.currentPath) {
                if (currentDir[folder] && currentDir[folder].type === 'directory') {
                    currentDir = currentDir[folder].children;
                }
            }
            
            // Check if folder exists
            if (!currentDir[folderName] || currentDir[folderName].type !== 'directory') {
                alert(`Folder "${folderName}" not found.`);
                return;
            }
            
            // Navigate into the folder
            this.currentPath.push(folderName);
            
            // Process each file
            for (const file of files) {
                this.processImportedFile(file);
            }
        };
        
        input.click();
    }
    
    processImportedFile(file) {
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if file with this name already exists
        let fileName = file.name;
        let counter = 1;
        
        while (currentDir[fileName]) {
            // Add number suffix to filename
            const parts = file.name.split('.');
            const ext = parts.pop();
            const baseName = parts.join('.');
            fileName = `${baseName} (${counter}).${ext}`;
            counter++;
        }
        
        // Create object URL for the file
        const fileURL = URL.createObjectURL(file);
        
        // Store file metadata
        currentDir[fileName] = {
            type: 'file',
            fileType: file.type,
            size: file.size,
            created: new Date().toISOString(),
            url: fileURL,
            originalName: file.name
        };
        
        // Store URL for clean-up later
        this.fileURLs[fileName] = fileURL;
        
        // Refresh view
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Imported file: ${fileName}`, 'info');
        }
        
        // Auto-categorize files based on type
        this.autoCategorizeFile(file, fileName, fileURL);
    }
    
    autoCategorizeFile(file, fileName, fileURL) {
        // Automatically make imported files available to the various subsystems
        
        // Images
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                // Register image with appropriate subsystems
                if (window.imageProcessor) {
                    window.imageProcessor.registerImage(fileName, img);
                }
            };
            img.src = fileURL;
        } 
        // Audio
        else if (file.type.startsWith('audio/')) {
            if (window.audioProcessor) {
                window.audioProcessor.registerAudioFile(fileName, fileURL);
            }
            if (window.interpreter) {
                window.interpreter.registerAudioFile(fileName, fileURL);
            }
        }
        // Video
        else if (file.type.startsWith('video/')) {
            // Register with video processor if we add one later
        }
    }
    
    previewFile(name, item) {
        // Show file preview in the preview panel
        const previewPanel = document.querySelector('.fs-preview');
        const fileInfo = document.querySelector('.fs-file-info');
        const fileName = document.querySelector('.fs-file-name');
        const fileMeta = document.querySelector('.fs-file-meta');
        const fileActions = document.querySelector('.fs-file-actions');
        
        if (!previewPanel || !fileInfo || !fileName || !fileMeta || !fileActions) return;
        
        // Clear previous preview content
        previewPanel.innerHTML = '';
        
        // Update file info
        fileName.textContent = name;
        
        // Calculate and display file path with proper checks
        const currentPath = this.currentPath.length > 0 ? this.currentPath.join('/') + '/' : '';
        const fullPath = currentPath + name;
        
        // Generate preview based on file type
        if (item.type === 'file' && item.url) {
            if (item.fileType && item.fileType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = item.url;
                img.className = 'fs-image-preview';
                previewPanel.appendChild(img);
            } else if (item.fileType && item.fileType.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.src = item.url;
                audio.controls = true;
                audio.className = 'fs-audio-preview';
                previewPanel.appendChild(audio);
            } else if (item.fileType && item.fileType.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = item.url;
                video.controls = true;
                video.className = 'fs-video-preview';
                previewPanel.appendChild(video);
            } else {
                previewPanel.innerHTML = `
                    <div class="fs-generic-preview">
                        <i class="fas fa-file fa-4x"></i>
                        <p>Preview not available for this file type</p>
                        <p class="fs-file-path">${fullPath}</p>
                    </div>
                `;
            }
        }
        
        // Format file size
        let sizeStr = '';
        if (item.size) {
            if (item.size < 1024) {
                sizeStr = `${item.size} bytes`;
            } else if (item.size < 1024 * 1024) {
                sizeStr = `${(item.size / 1024).toFixed(2)} KB`;
            } else {
                sizeStr = `${(item.size / (1024 * 1024)).toFixed(2)} MB`;
            }
        }
        
        // Format date
        let dateStr = '';
        if (item.created) {
            dateStr = new Date(item.created).toLocaleString();
        }
        
        fileMeta.innerHTML = `
            ${item.fileType ? `<div>Type: ${item.fileType}</div>` : ''}
            <div>Path: <code>${fullPath}</code></div>
            ${sizeStr ? `<div>Size: ${sizeStr}</div>` : ''}
            ${dateStr ? `<div>Created: ${dateStr}</div>` : ''}
        `;
        
        // Create action buttons
        fileActions.innerHTML = `
            <button class="fs-copy-path" title="Copy path to clipboard"><i class="fas fa-copy"></i> Copy Path</button>
            <button class="fs-insert-code" title="Insert code reference"><i class="fas fa-code"></i> Insert Code</button>
            <button class="fs-delete" title="Delete file"><i class="fas fa-trash"></i> Delete</button>
        `;
        
        // Add event listeners to action buttons
        const copyPathBtn = fileActions.querySelector('.fs-copy-path');
        if (copyPathBtn) {
            copyPathBtn.addEventListener('click', (event) => {
                this.copyPathToClipboard(name, item);
            });
        }
        
        const insertCodeBtn = fileActions.querySelector('.fs-insert-code');
        if (insertCodeBtn) {
            insertCodeBtn.addEventListener('click', () => {
                this.insertCodeForFile(name, item, fullPath);
            });
        }
        
        const deleteBtn = fileActions.querySelector('.fs-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteFile(name);
            });
        }
    }
    
    clearPreview() {
        const previewPanel = document.querySelector('.fs-preview');
        const fileName = document.querySelector('.fs-file-name');
        const fileMeta = document.querySelector('.fs-file-meta');
        const fileActions = document.querySelector('.fs-file-actions');
        
        if (previewPanel) {
            previewPanel.innerHTML = '<div class="fs-no-preview">Select a file to preview</div>';
        }
        
        if (fileName) fileName.textContent = '';
        if (fileMeta) fileMeta.textContent = '';
        if (fileActions) fileActions.innerHTML = '';
    }
    
    insertCodeForFile(name, item, path) {
        if (!window.editor) {
            alert('Editor not available');
            return;
        }
        
        // Use the full path if provided, otherwise just the filename
        const filePath = path || name;
        let codeToInsert = '';
        
        if (item.fileType && item.fileType.startsWith('image/')) {
            codeToInsert = `loadImage("${filePath}")`;
        } 
        else if (item.fileType && item.fileType.startsWith('audio/')) {
            codeToInsert = `loadAudio("${filePath}")`;
        }
        else if (item.fileType && item.fileType.startsWith('video/')) {
            codeToInsert = `loadVideo("${filePath}")`;
        }
        else {
            codeToInsert = `loadFile("${filePath}")`;
        }
        
        window.editor.replaceSelection(codeToInsert);
        
        if (window.logToConsole) {
            window.logToConsole(`Inserted code reference to: ${filePath}`, 'info');
        }
    }
    
    // Rest of the methods (deleteFile, etc.) remain unchanged...
    deleteFile(name) {
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            return;
        }
        
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if file exists
        if (!currentDir[name]) {
            alert(`File "${name}" not found.`);
            return;
        }
        
        // Clean up URL if this is a file
        if (currentDir[name].type === 'file' && this.fileURLs[name]) {
            URL.revokeObjectURL(this.fileURLs[name]);
            delete this.fileURLs[name];
        }
        
        // Remove from any subsystems
        if (window.audioProcessor && window.audioProcessor.audioFiles && window.audioProcessor.audioFiles[name]) {
            delete window.audioProcessor.audioFiles[name];
        }
        
        if (window.interpreter && window.interpreter.audioFiles && window.interpreter.audioFiles[name]) {
            delete window.interpreter.audioFiles[name];
        }
        
        // Delete from file system
        delete currentDir[name];
        
        // Refresh view
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Deleted file: ${name}`, 'info');
        }
    }
    
    deleteFolder(name) {
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete the folder "${name}" and all its contents? This cannot be undone.`)) {
            return;
        }
        
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if folder exists
        if (!currentDir[name] || currentDir[name].type !== 'directory') {
            alert(`Folder "${name}" not found.`);
            return;
        }
        
        // Clean up all files recursively
        this.cleanupDirectoryFiles(currentDir[name].children);
        
        // Delete the folder
        delete currentDir[name];
        
        // Refresh view
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Deleted folder: ${name}`, 'info');
        }
    }
    
    cleanupDirectoryFiles(directory) {
        // Recursively clean up file URLs in a directory
        for (const [name, item] of Object.entries(directory)) {
            if (item.type === 'file') {
                // Clean up file URL
                if (this.fileURLs[name]) {
                    URL.revokeObjectURL(this.fileURLs[name]);
                    delete this.fileURLs[name];
                }
                
                // Remove from subsystems
                if (window.audioProcessor && window.audioProcessor.audioFiles && window.audioProcessor.audioFiles[name]) {
                    delete window.audioProcessor.audioFiles[name];
                }
                
                if (window.interpreter && window.interpreter.audioFiles && window.interpreter.audioFiles[name]) {
                    delete window.interpreter.audioFiles[name];
                }
            } else if (item.type === 'directory') {
                // Recurse into subdirectories
                this.cleanupDirectoryFiles(item.children);
            }
        }
    }
    
    showContextMenu(event, name, item) {
        // Remove any existing context menus
        this.hideContextMenu();
        
        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'fs-context-menu';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        
        // Get the current path string
        const currentPath = this.currentPath.length > 0 ? this.currentPath.join('/') + '/' : '';
        const fullPath = currentPath + name;
        
        let menuItems = '';
        
        if (item.type === 'directory') {
            menuItems = `
                <div class="fs-context-item" data-action="open">
                    <i class="fas fa-folder-open"></i> Open Folder
                </div>
                <div class="fs-context-item" data-action="new-subfolder">
                    <i class="fas fa-folder-plus"></i> Create Subfolder
                </div>
                <div class="fs-context-item" data-action="upload-here">
                    <i class="fas fa-file-upload"></i> Upload Files Here
                </div>
                <div class="fs-context-item" data-action="rename">
                    <i class="fas fa-edit"></i> Rename
                </div>
                <div class="fs-context-separator"></div>
                <div class="fs-context-item fs-context-danger" data-action="delete">
                    <i class="fas fa-trash"></i> Delete Folder
                </div>
            `;
        } else {
            menuItems = `
                <div class="fs-context-item" data-action="preview">
                    <i class="fas fa-eye"></i> Preview
                </div>
                <div class="fs-context-item" data-action="copy-path">
                    <i class="fas fa-copy"></i> Copy Path (${fullPath})
                </div>
                <div class="fs-context-item" data-action="insert-code">
                    <i class="fas fa-code"></i> Insert Code
                </div>
                <div class="fs-context-item" data-action="rename">
                    <i class="fas fa-edit"></i> Rename
                </div>
                <div class="fs-context-item" data-action="download">
                    <i class="fas fa-download"></i> Download
                </div>
                <div class="fs-context-separator"></div>
                <div class="fs-context-item fs-context-danger" data-action="delete">
                    <i class="fas fa-trash"></i> Delete File
                </div>
            `;
        }
        
        contextMenu.innerHTML = menuItems;
        
        // Add to document
        document.body.appendChild(contextMenu);
        
        // Add click event listeners
        const contextItems = contextMenu.querySelectorAll('.fs-context-item');
        for (const menuItem of contextItems) {
            menuItem.addEventListener('click', () => {
                const action = menuItem.dataset.action;
                
                // Handle different actions
                switch (action) {
                    case 'open':
                        if (item.type === 'directory') {
                            this.currentPath.push(name);
                            this.refreshView();
                        }
                        break;
                    case 'new-subfolder':
                        this.createSubfolder(name);
                        break;
                    case 'upload-here':
                        this.importFileToFolder(name);
                        break;
                    case 'preview':
                        this.previewFile(name, item);
                        break;
                    case 'copy-path':
                        navigator.clipboard.writeText(fullPath);
                        if (window.logToConsole) {
                            window.logToConsole(`Copied path to clipboard: ${fullPath}`, 'info');
                        }
                        break;
                    case 'insert-code':
                        this.insertCodeForFile(name, item, fullPath);
                        break;
                    case 'rename':
                        this.renameItem(name, item);
                        break;
                    case 'download':
                        if (item.url) {
                            const a = document.createElement('a');
                            a.href = item.url;
                            a.download = name;
                            a.click();
                        }
                        break;
                    case 'delete':
                        if (item.type === 'directory') {
                            this.deleteFolder(name);
                        } else {
                            this.deleteFile(name);
                        }
                        break;
                }
                
                this.hideContextMenu();
            });
        }
        
        // Click outside to close
        document.addEventListener('click', this.hideContextMenu);
        
        // Prevent context menu from going off-screen
        const menuRect = contextMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            contextMenu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
        }
    }
    
    hideContextMenu = () => {
        const existingMenu = document.querySelector('.fs-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        document.removeEventListener('click', this.hideContextMenu);
    }
    
    renameItem(oldName, item) {
        const newName = prompt(`Rename "${oldName}" to:`, oldName);
        if (!newName || newName.trim() === '' || newName === oldName) return;
        
        // Find current directory
        let currentDir = this.fileSystem;
        for (const folder of this.currentPath) {
            if (currentDir[folder] && currentDir[folder].type === 'directory') {
                currentDir = currentDir[folder].children;
            }
        }
        
        // Check if item with new name already exists
        if (currentDir[newName]) {
            alert(`A file or folder named "${newName}" already exists.`);
            return;
        }
        
        // Copy the item with the new name
        currentDir[newName] = {...item};
        
        // If it's a file, update file URL mapping
        if (item.type === 'file' && this.fileURLs[oldName]) {
            this.fileURLs[newName] = this.fileURLs[oldName];
            delete this.fileURLs[oldName];
            
            // Update subsystem references if needed
            if (window.audioProcessor && window.audioProcessor.audioFiles && window.audioProcessor.audioFiles[oldName]) {
                window.audioProcessor.audioFiles[newName] = window.audioProcessor.audioFiles[oldName];
                delete window.audioProcessor.audioFiles[oldName];
            }
            
            if (window.interpreter && window.interpreter.audioFiles && window.interpreter.audioFiles[oldName]) {
                window.interpreter.audioFiles[newName] = window.interpreter.audioFiles[oldName];
                delete window.interpreter.audioFiles[oldName];
            }
        }
        
        // Delete the old item
        delete currentDir[oldName];
        
        // Refresh view
        this.refreshView();
        
        // Log to console
        if (window.logToConsole) {
            window.logToConsole(`Renamed "${oldName}" to "${newName}"`, 'info');
        }
    }
    
    // Method to get a file by path
    getFileByPath(path) {
        if (!path) return null;
        
        // Split the path into components
        const parts = path.split('/');
        
        // Navigate to the directory
        let currentDir = this.fileSystem;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (currentDir[part] && currentDir[part].type === 'directory') {
                currentDir = currentDir[part].children;
            } else {
                return null; // Directory not found
            }
        }
        
        // Look up the file in the final directory
        const fileName = parts[parts.length - 1];
        return currentDir[fileName];
    }
}

// Initialize as a global when the script loads
window.fileSystemManager = new FileSystemManager();