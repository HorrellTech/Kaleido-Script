class FileManager {
    constructor() {
        this.files = {
            'main.js': this.getDefaultMainJS(),
            'utils.js': '// Utility functions\n\n// Example function\nfunction calculateDistance(x1, y1, x2, y2) {\n  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));\n}'
        };
        this.currentFile = 'main.js';
        this.fileStructure = {
            'main.js': { type: 'file' },
            'utils.js': { type: 'file' },
            'lib': { 
                type: 'folder',
                children: {}
            }
        };
        this.draggedItem = null;
        this.dragTarget = null;
    }
    
    initialize() {
        // Initial file setup
        this.renderFileTree();
        this.loadFileContent(this.currentFile);
        
        // Set up event handlers
        this.setupEventListeners();
        this.setupDragAndDrop();
        
        // Add the editor area file name header
        const editorHeader = document.querySelector('.editor-header');
        if (editorHeader && !document.getElementById('current-file-name')) {
            const currentFileName = document.createElement('div');
            currentFileName.id = 'current-file-name';
            currentFileName.className = 'current-file-name';
            currentFileName.textContent = this.currentFile;
            editorHeader.appendChild(currentFileName);
        }
    }
    
    setupEventListeners() {
        // New file button
        const newFileBtn = document.getElementById('new-file-btn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                this.showNewFileDialog();
            });
        }
        
        // Save file button
        const saveFileBtn = document.getElementById('save-file-btn');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', () => {
                this.saveCurrentFile();
            });
        }
        
        // Load file button
        const loadFileBtn = document.getElementById('load-file-btn');
        if (loadFileBtn) {
            loadFileBtn.addEventListener('click', () => {
                this.showImportFileDialog();
            });
        }
        
        // Make sure the file list container exists
        const fileListContainer = document.querySelector('.file-list');
        if (!fileListContainer) {
            const fileTab = document.getElementById('files-tab');
            if (fileTab) {
                const fileList = document.createElement('div');
                fileList.className = 'file-list';
                
                // Add file actions buttons at the top
                const fileActions = document.createElement('div');
                fileActions.className = 'file-actions';
                fileActions.innerHTML = `
                    <button id="new-file-btn" title="New File"><i class="fas fa-file-plus"></i> New</button>
                    <button id="save-file-btn" title="Save File"><i class="fas fa-save"></i> Save</button>
                    <button id="load-file-btn" title="Load File"><i class="fas fa-folder-open"></i> Load</button>
                `;
                
                fileTab.appendChild(fileActions);
                fileTab.appendChild(fileList);
                
                // Set up the buttons after creating them
                this.setupEventListeners();
            }
        }
    }
    
    setupDragAndDrop() {
        // Set up global handlers for drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow drop
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault(); // Prevent browser default behavior
            
            if (this.draggedItem && this.dragTarget && this.draggedItem !== this.dragTarget) {
                this.moveItem(
                    this.draggedItem.getAttribute('data-path'),
                    this.dragTarget.getAttribute('data-path') || ''
                );
            }
            
            // Reset drag state
            this.resetDragState();
        });
        
        document.addEventListener('dragend', () => {
            this.resetDragState();
        });
    }
    
    resetDragState() {
        // Remove any drag-related classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        // Reset variables
        this.draggedItem = null;
        this.dragTarget = null;
    }
    
    moveItem(sourcePath, targetPath) {
        // Don't allow moving main.js
        if (sourcePath === 'main.js') {
            if (window.logToConsole) {
                window.logToConsole('Cannot move main.js as it must remain at the root level', 'error');
            }
            return false;
        }
        
        // Get source parts
        const sourceParts = sourcePath.split('/');
        const sourceFileName = sourceParts.pop();
        
        // Check if target is a file or folder
        let targetIsFolder = false;
        let targetFolder = '';
        
        // If targetPath is empty, we're moving to root
        if (!targetPath) {
            targetIsFolder = true;
            targetFolder = '';
        } else {
            // Check if target is a folder
            let targetObj = this.getItemByPath(targetPath);
            if (targetObj && targetObj.type === 'folder') {
                targetIsFolder = true;
                targetFolder = targetPath;
            } else {
                // Target is a file, use its parent folder
                const targetParts = targetPath.split('/');
                targetParts.pop(); // Remove filename
                targetFolder = targetParts.join('/');
            }
        }
        
        // Build the new path
        let newPath;
        if (targetFolder) {
            newPath = `${targetFolder}/${sourceFileName}`;
        } else {
            newPath = sourceFileName;
        }
        
        // Make sure we're not trying to move to the same location
        if (sourcePath === newPath) {
            return false;
        }
        
        // Make sure the new path doesn't already exist
        if (this.getItemByPath(newPath)) {
            if (window.logToConsole) {
                window.logToConsole(`File ${sourceFileName} already exists at destination`, 'error');
            }
            return false;
        }
        
        // Get the content and add to new location
        const content = this.files[sourcePath];
        if (content === undefined) {
            if (window.logToConsole) {
                window.logToConsole(`Failed to move ${sourcePath}: file not found`, 'error');
            }
            return false;
        }
        
        // Move the file content
        this.files[newPath] = content;
        delete this.files[sourcePath];
        
        // Update file structure
        this.removeFromFileStructure(sourcePath);
        this.addToFileStructure(newPath);
        
        // Switch to the moved file if it's the current one
        if (sourcePath === this.currentFile) {
            this.currentFile = newPath;
        }
        
        // Re-render the tree
        this.renderFileTree();
        this.loadFileContent(this.currentFile);
        
        if (window.logToConsole) {
            window.logToConsole(`Moved ${sourcePath} to ${newPath}`, 'info');
        }
        
        return true;
    }
    
    getItemByPath(path) {
        if (!path) return this.fileStructure;
        
        const parts = path.split('/');
        let current = this.fileStructure;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) return null;
            
            if (i === parts.length - 1) {
                return current[part];
            } else {
                if (current[part].type !== 'folder') return null;
                current = current[part].children;
            }
        }
        
        return current;
    }
    
    showNewFileDialog(parentPath = '') {
        const modal = document.createElement('div');
        modal.className = 'file-modal';
        modal.innerHTML = `
            <div class="file-modal-content">
                <h2>Create New File</h2>
                <div class="form-group">
                    <label for="file-name">File Name:</label>
                    <input type="text" id="file-name" placeholder="e.g., helpers.js">
                </div>
                <div class="form-group">
                    <label for="file-path">Parent Folder:</label>
                    <input type="text" id="file-path" value="${parentPath}" placeholder="e.g., lib/ (leave empty for root)">
                </div>
                <div class="form-actions">
                    <button id="create-file-btn">Create</button>
                    <button id="cancel-file-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle create button
        document.getElementById('create-file-btn').addEventListener('click', () => {
            const fileName = document.getElementById('file-name').value;
            const filePath = document.getElementById('file-path').value;
            
            if (fileName) {
                this.createNewFile(fileName, filePath);
                document.body.removeChild(modal);
            } else {
                alert('Please enter a file name');
            }
        });
        
        // Handle cancel button
        document.getElementById('cancel-file-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Focus on the input field
        setTimeout(() => {
            document.getElementById('file-name').focus();
        }, 100);
    }
    
    renderFileTree() {
        const fileList = document.querySelector('.file-list');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        
        // Create the file tree
        const createFileTree = (structure, container, path = '', level = 0) => {
            // Sort items: folders first, then main.js, then other files
            const sortedItems = Object.entries(structure).sort((a, b) => {
                const [aName, aItem] = a;
                const [bName, bItem] = b;
                
                // Folders come first
                if (aItem.type === 'folder' && bItem.type !== 'folder') return -1;
                if (aItem.type !== 'folder' && bItem.type === 'folder') return 1;
                
                // main.js comes before other files
                if (aItem.type === 'file' && bItem.type === 'file') {
                    if (aName === 'main.js') return -1;
                    if (bName === 'main.js') return 1;
                }
                
                // Alphabetical order for the rest
                return aName.localeCompare(bName);
            });
            
            for (const [name, item] of sortedItems) {
                const fullPath = path ? `${path}/${name}` : name;
                
                if (item.type === 'folder') {
                    // Create folder element
                    const folderItem = document.createElement('div');
                    folderItem.className = 'folder-item';
                    folderItem.style.marginLeft = `${level * 12}px`; // Indentation
                    folderItem.innerHTML = `
                        <div class="folder-header" draggable="true" data-path="${fullPath}">
                            <i class="fas fa-folder"></i>
                            <span class="folder-name">${name}</span>
                            <div class="folder-actions">
                                <button class="btn-new-file" title="New File"><i class="fas fa-file-plus"></i></button>
                                <button class="btn-new-folder" title="New Folder"><i class="fas fa-folder-plus"></i></button>
                                <button class="btn-rename-folder" title="Rename"><i class="fas fa-edit"></i></button>
                                <button class="btn-delete-folder" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="folder-content"></div>
                    `;
                    
                    // Add event listener to toggle folder
                    const header = folderItem.querySelector('.folder-header');
                    const content = folderItem.querySelector('.folder-content');
                    
                    header.addEventListener('click', (e) => {
                        if (e.target.closest('.folder-actions')) return;
                        header.parentElement.classList.toggle('open');
                    });
                    
                    // Set up drag and drop for folders
                    this.setupItemDragHandlers(header);
                    
                    // Set up folder as a drop target
                    header.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        header.classList.add('drag-over');
                        this.dragTarget = header;
                    });
                    
                    header.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        if (e.relatedTarget && !header.contains(e.relatedTarget)) {
                            header.classList.remove('drag-over');
                        }
                    });
                    
                    // Set up new file button
                    const newFileBtn = folderItem.querySelector('.btn-new-file');
                    newFileBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showNewFileDialog(fullPath);
                    });
                    
                    // Set up new folder button
                    const newFolderBtn = folderItem.querySelector('.btn-new-folder');
                    newFolderBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showNewFolderDialog(fullPath);
                    });
                    
                    // Set up rename folder button
                    const renameFolderBtn = folderItem.querySelector('.btn-rename-folder');
                    renameFolderBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.renameItem(fullPath);
                    });
                    
                    // Set up delete folder button
                    const deleteFolderBtn = folderItem.querySelector('.btn-delete-folder');
                    deleteFolderBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteFolder(fullPath);
                    });
                    
                    container.appendChild(folderItem);
                    
                    // Recursively add children with increased indent level
                    createFileTree(item.children, content, fullPath, level + 1);
                } else {
                    // Create file element
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    
                    // Apply special styling for main.js
                    if (name === 'main.js') {
                        fileItem.classList.add('main-js-file');
                    }
                    
                    fileItem.style.marginLeft = `${level * 12}px`; // Indentation
                    fileItem.setAttribute('data-path', fullPath);
                    fileItem.setAttribute('draggable', 'true');
                    fileItem.innerHTML = `
                        <i class="fas fa-file-code"></i>
                        <span class="file-name">${name}</span>
                        <div class="file-actions">
                            <button class="btn-rename-file" title="Rename"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete-file" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    
                    // Active class for current file
                    if (fullPath === this.currentFile) {
                        fileItem.classList.add('active');
                    }
                    
                    // Set up drag and drop for files
                    this.setupItemDragHandlers(fileItem);
                    
                    // Set up click handler for file selection
                    fileItem.addEventListener('click', (e) => {
                        if (e.target.closest('.file-actions')) return;
                        this.selectFile(fullPath);
                    });
                    
                    // Set up rename button
                    const renameBtn = fileItem.querySelector('.btn-rename-file');
                    renameBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.renameItem(fullPath);
                    });
                    
                    // Set up delete button
                    const deleteBtn = fileItem.querySelector('.btn-delete-file');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteFile(fullPath);
                    });
                    
                    container.appendChild(fileItem);
                }
            }
        };
        
        createFileTree(this.fileStructure, fileList);
    }
    
    setupItemDragHandlers(element) {
        element.addEventListener('dragstart', (e) => {
            this.draggedItem = element;
            e.dataTransfer.effectAllowed = 'move';
            // Add a class to show it's being dragged
            element.classList.add('dragging');
            
            // Delay adding the class to make it visible
            setTimeout(() => {
                element.classList.add('drag-active');
            }, 0);
        });
        
        element.addEventListener('dragend', () => {
            // Clean up
            element.classList.remove('dragging');
            element.classList.remove('drag-active');
        });
    }
    
    getDefaultMainJS() {
        return `/*
* Main.js
* Created: ${new Date().toLocaleString()}
* Description: This is the main entry point for the application.
* You can add your code here.
*/

var cImage = null;

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
    
    createNewFile(fileName, filePath = '') {
        // Ensure .js extension
        if (!fileName.endsWith('.js')) {
            fileName = fileName + '.js';
        }
        
        // Build the full path
        const fullPath = filePath ? `${filePath}/${fileName}` : fileName;
        
        // Check if file already exists
        if (this.files[fullPath]) {
            alert('File already exists!');
            return false;
        }
        
        // Create default content
        this.files[fullPath] = `// ${fileName}\n// Created: ${new Date().toLocaleString()}\n\n// Your code here\n`;
        
        // Update file structure
        this.addToFileStructure(fullPath);
        
        // Save current file before switching
        this.files[this.currentFile] = window.editor.getValue();
        
        // Switch to new file
        this.currentFile = fullPath;
        this.renderFileTree();
        this.loadFileContent(fullPath);
        
        if (window.logToConsole) {
            window.logToConsole(`Created new file: ${fullPath}`, 'info');
        }
        
        return true;
    }
    
    addToFileStructure(path) {
        const parts = path.split('/');
        const fileName = parts.pop();
        
        let current = this.fileStructure;
        
        // Navigate through the path
        for (const folder of parts) {
            if (!current[folder]) {
                current[folder] = {
                    type: 'folder',
                    children: {}
                };
            }
            
            // Make sure this is a folder
            if (current[folder].type !== 'folder') {
                if (window.logToConsole) {
                    window.logToConsole(`Cannot add to ${folder} as it is not a folder`, 'error');
                }
                return false;
            }
            
            current = current[folder].children;
        }
        
        // Add the file
        current[fileName] = { type: 'file' };
        return true;
    }
    
    showNewFolderDialog(parentPath = '') {
        const modal = document.createElement('div');
        modal.className = 'file-modal';
        modal.innerHTML = `
            <div class="file-modal-content">
                <h2>Create New Folder</h2>
                <div class="form-group">
                    <label for="folder-name">Folder Name:</label>
                    <input type="text" id="folder-name" placeholder="e.g., components">
                </div>
                <div class="form-group">
                    <label for="folder-path">Parent Folder:</label>
                    <input type="text" id="folder-path" value="${parentPath}" placeholder="e.g., lib/ (leave empty for root)">
                </div>
                <div class="form-actions">
                    <button id="create-folder-btn">Create</button>
                    <button id="cancel-folder-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle create button
        document.getElementById('create-folder-btn').addEventListener('click', () => {
            const folderName = document.getElementById('folder-name').value;
            const folderPath = document.getElementById('folder-path').value;
            
            if (folderName) {
                this.createNewFolder(folderName, folderPath);
                document.body.removeChild(modal);
            } else {
                alert('Please enter a folder name');
            }
        });
        
        // Handle cancel button
        document.getElementById('cancel-folder-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Focus on the input field
        setTimeout(() => {
            document.getElementById('folder-name').focus();
        }, 100);
    }
    
    createNewFolder(folderName, parentPath = '') {
        // Build the full path
        const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
        
        // Check if folder already exists
        if (this.getItemByPath(fullPath)) {
            alert('A file or folder with this name already exists!');
            return false;
        }
        
        // Update file structure
        this.addFolderToStructure(fullPath);
        
        // Redraw the file tree
        this.renderFileTree();
        
        if (window.logToConsole) {
            window.logToConsole(`Created new folder: ${fullPath}`, 'info');
        }
        
        return true;
    }
    
    addFolderToStructure(path) {
        const parts = path.split('/');
        const folderName = parts.pop();
        
        let current = this.fileStructure;
        
        // Navigate through the path
        for (const folder of parts) {
            if (!current[folder]) {
                current[folder] = {
                    type: 'folder',
                    children: {}
                };
            }
            
            // Make sure this is a folder
            if (current[folder].type !== 'folder') {
                if (window.logToConsole) {
                    window.logToConsole(`Cannot add to ${folder} as it is not a folder`, 'error');
                }
                return false;
            }
            
            current = current[folder].children;
        }
        
        // Add the folder
        current[folderName] = {
            type: 'folder',
            children: {}
        };
        
        return true;
    }
    
    selectFile(path) {
        if (this.files[path]) {
            // Save current file content before switching
            this.files[this.currentFile] = window.editor.getValue();
            
            // Switch to new file
            this.currentFile = path;
            this.loadFileContent(path);
            
            // Update UI
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-path') === path) {
                    item.classList.add('active');
                }
            });
            
            // Update current file display
            const currentFileName = document.getElementById('current-file-name');
            if (currentFileName) {
                currentFileName.textContent = path;
            }
        }
    }
    
    loadFileContent(path) {
        const content = this.files[path] || '';
        if (window.editor) {
            window.editor.setValue(content);
        }
        
        const currentFileName = document.getElementById('current-file-name');
        if (currentFileName) {
            currentFileName.textContent = path;
        }
    }
    
    saveCurrentFile() {
        // Update the file content in memory
        if (window.editor) {
            this.files[this.currentFile] = window.editor.getValue();
        }
        
        // Download the file
        const content = this.files[this.currentFile];
        const blob = new Blob([content], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = this.currentFile.split('/').pop();
        a.click();
        URL.revokeObjectURL(a.href);
        
        if (window.logToConsole) {
            window.logToConsole(`File saved: ${this.currentFile}`, 'info');
        }
    }
    
    deleteFile(path) {
        if (!confirm(`Are you sure you want to delete ${path}?`)) return;
        
        // Check if it's the last file
        if (Object.keys(this.files).length <= 1) {
            alert('Cannot delete the last file.');
            return;
        }
        
        // Check if trying to delete main.js
        if (path === 'main.js') {
            alert('Cannot delete main.js as it is required for the application.');
            return;
        }
        
        // Delete file content
        delete this.files[path];
        
        // Remove from structure
        this.removeFromFileStructure(path);
        
        // If current file is being deleted, switch to main.js
        if (path === this.currentFile) {
            this.currentFile = 'main.js';
            this.loadFileContent('main.js');
        }
        
        // Update UI
        this.renderFileTree();
        
        if (window.logToConsole) {
            window.logToConsole(`Deleted file: ${path}`, 'info');
        }
    }
    
    removeFromFileStructure(path) {
        const parts = path.split('/');
        const itemName = parts.pop();
        
        let current = this.fileStructure;
        
        // Navigate through the path
        for (const folder of parts) {
            if (!current[folder]) return;
            
            // Make sure this is a folder
            if (current[folder].type !== 'folder') return;
            
            current = current[folder].children;
        }
        
        // Delete the item
        delete current[itemName];
    }
    
    deleteFolder(path) {
        if (!confirm(`Are you sure you want to delete folder ${path} and all its contents?`)) return;
        
        // Get the folder and check if it's a folder
        const folder = this.getItemByPath(path);
        if (!folder || folder.type !== 'folder') {
            if (window.logToConsole) {
                window.logToConsole(`${path} is not a folder or doesn't exist`, 'error');
            }
            return;
        }
        
        // Delete all files within the folder (recursively)
        this.deleteFilesInFolder(path);
        
        // Remove the folder from structure
        this.removeFromFileStructure(path);
        
        // Re-render the tree
        this.renderFileTree();
        
        if (window.logToConsole) {
            window.logToConsole(`Deleted folder: ${path}`, 'info');
        }
    }
    
    deleteFilesInFolder(folderPath) {
        // Get all files in this folder (recursive)
        const files = this.getAllFilesInFolder(folderPath);
        
        // Remove each file from this.files
        for (const file of files) {
            delete this.files[file];
            
            // If current file is being deleted, switch to main.js
            if (file === this.currentFile) {
                this.currentFile = 'main.js';
                this.loadFileContent('main.js');
            }
        }
    }
    
    getAllFilesInFolder(folderPath) {
        const result = [];
        
        const folder = this.getItemByPath(folderPath);
        if (!folder || folder.type !== 'folder') return result;
        
        // Helper function to traverse the folder structure
        const traverse = (path, structure) => {
            for (const [name, item] of Object.entries(structure)) {
                const fullPath = path ? `${path}/${name}` : name;
                
                if (item.type === 'file') {
                    result.push(fullPath);
                } else if (item.type === 'folder') {
                    traverse(fullPath, item.children);
                }
            }
        };
        
        traverse(folderPath, folder.children);
        return result;
    }
    
    renameItem(path) {
        // Get the item
        const item = this.getItemByPath(path);
        if (!item) {
            if (window.logToConsole) {
                window.logToConsole(`${path} does not exist`, 'error');
            }
            return;
        }
        
        // Don't allow renaming main.js
        if (path === 'main.js') {
            if (window.logToConsole) {
                window.logToConsole('Cannot rename main.js as it is required for the application', 'error');
            }
            return;
        }
        
        // Get the item name
        const parts = path.split('/');
        const oldName = parts.pop();
        const parentPath = parts.join('/');
        
        // Prompt for new name
        const newName = prompt(`Enter new name for ${oldName}:`, oldName);
        if (!newName || newName === oldName) return;
        
        // Make sure it has .js extension for files
        let finalName = newName;
        if (item.type === 'file' && !finalName.endsWith('.js')) {
            finalName = finalName + '.js';
        }
        
        // Build the new path
        const newPath = parentPath ? `${parentPath}/${finalName}` : finalName;
        
        // Check if new path already exists
        if (this.getItemByPath(newPath)) {
            if (window.logToConsole) {
                window.logToConsole(`A file or folder with name ${finalName} already exists in this location`, 'error');
            }
            return;
        }
        
        // If it's a file, move its content
        if (item.type === 'file') {
            this.files[newPath] = this.files[path];
            delete this.files[path];
            
            // Update current file path if needed
            if (this.currentFile === path) {
                this.currentFile = newPath;
            }
        }
        
        // Update the file structure
        this.renameInFileStructure(path, finalName);
        
        // Re-render the tree
        this.renderFileTree();
        this.loadFileContent(this.currentFile);
        
        if (window.logToConsole) {
            window.logToConsole(`Renamed ${path} to ${finalName}`, 'info');
        }
    }
    
    renameInFileStructure(path, newName) {
        const parts = path.split('/');
        const oldName = parts.pop();
        
        let current = this.fileStructure;
        
        // Navigate through the path
        for (const folder of parts) {
            if (!current[folder]) return;
            current = current[folder].children;
        }
        
        // Make sure the item exists
        if (!current[oldName]) return;
        
        // Store the item and delete the old entry
        const item = current[oldName];
        delete current[oldName];
        
        // Create new entry with the same item data
        current[newName] = item;
        
        // If it's a folder, we need to update all file paths within it
        if (item.type === 'folder') {
            const oldPrefix = path;
            const newPrefix = [...parts, newName].join('/');
            this.updateFilePathsInFolder(oldPrefix, newPrefix);
        }
    }
    
    updateFilePathsInFolder(oldPrefix, newPrefix) {
        // Get all files in this.files and update paths
        for (const filePath in this.files) {
            if (filePath.startsWith(oldPrefix + '/')) {
                const newPath = filePath.replace(oldPrefix, newPrefix);
                this.files[newPath] = this.files[filePath];
                delete this.files[filePath];
                
                // Update current file path if needed
                if (this.currentFile === filePath) {
                    this.currentFile = newPath;
                }
            }
        }
    }
    
    showImportFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.txt';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (files.length === 0) return;
            
            for (const file of files) {
                this.importFile(file);
            }
        };
        
        input.click();
    }
    
    importFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileName = file.name;
            const content = event.target.result;
            
            // Check if file exists
            if (this.files[fileName] && !confirm(`File ${fileName} already exists. Overwrite?`)) {
                return;
            }
            
            // Save current file content
            this.files[this.currentFile] = window.editor.getValue();
            
            // Add the imported file
            this.files[fileName] = content;
            this.addToFileStructure(fileName);
            
            // Switch to the imported file
            this.currentFile = fileName;
            this.renderFileTree();
            this.loadFileContent(fileName);
            
            if (window.logToConsole) {
                window.logToConsole(`Imported file: ${fileName}`, 'info');
            }
        };
        
        reader.readAsText(file);
    }
    
    getAllFiles() {
        return this.files;
    }
    
    // Add module import functionality to interpreter
    importModule(modulePath) {
        // Get the module code from our file system
        const files = this.getAllFiles();
        if (!files[modulePath]) {
            window.logToConsole(`Module not found: ${modulePath}`, 'error');
            return false;
        }
        
        // Evaluate the module code in the current context
        try {
            // Parse the code to support exports
            const moduleCode = files[modulePath];
            
            // Create a module context
            const moduleExports = {};
            const module = { exports: moduleExports };
            
            // Wrap the code to provide module.exports
            const wrappedCode = `
                (function(module, exports) {
                    ${moduleCode}
                    return module.exports;
                })(module, module.exports)
            `;
            
            // Evaluate the code
            const result = eval(wrappedCode);
            
            // Add any exports to the global scope
            if (typeof result === 'object') {
                for (const [key, value] of Object.entries(result)) {
                    window[key] = value;
                }
            }
            
            window.logToConsole(`Imported module: ${modulePath}`, 'info');
            return true;
        } catch (error) {
            console.error(`Error importing module ${modulePath}:`, error);
            window.logToConsole(`Error importing module ${modulePath}: ${error.message}`, 'error');
            return false;
        }
    }
}

// Add custom CSS for the new file tree styles
const style = document.createElement('style');
style.textContent = `
.file-list {
    padding: 8px;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 13px;
    overflow-y: auto;
    max-height: calc(100% - 40px);
}

.file-actions {
    display: flex;
    padding: 8px;
    gap: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 5px;
}

.file-actions button {
    padding: 4px 8px;
    background: rgba(66, 133, 244, 0.1);
    border: none;
    border-radius: 4px;
    color: #e0e0e0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.file-actions button:hover {
    background: rgba(66, 133, 244, 0.2);
}

.file-item {
    display: flex;
    align-items: center;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 4px;
    height: 24px;
}

.file-item.active {
    background-color: rgba(66, 133, 244, 0.2);
    color: white;
}

.file-item:hover {
    background-color: rgba(66, 133, 244, 0.1);
}

.file-item i {
    margin-right: 6px;
    color: #777;
    font-size: 12px;
}

.file-item .file-name {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-item .file-actions {
    display: none;
    margin-left: auto;
    gap: 3px;
    padding: 0;
    border: none;
    margin: 0;
}

.file-item:hover .file-actions {
    display: flex;
}

.file-item .file-actions button {
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    color: #999;
    border: none;
    border-radius: 3px;
}

.file-item .file-actions button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.folder-item {
    margin: 2px 0;
}

.folder-header {
    display: flex;
    align-items: center;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 4px;
    height: 24px;
}

.folder-header:hover {
    background-color: rgba(66, 133, 244, 0.1);
}

.folder-header i {
    margin-right: 6px;
    color: #1e88e5;
    font-size: 12px;
}

.folder-header .folder-name {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.folder-header .folder-actions {
    display: none;
    margin-left: auto;
    gap: 3px;
    padding: 0;
    border: none;
    margin: 0;
}

.folder-header:hover .folder-actions {
    display: flex;
}

.folder-header .folder-actions button {
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    color: #999;
    border: none;
    border-radius: 3px;
}

.folder-header .folder-actions button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.folder-content {
    display: none;
    margin-left: 10px;
}

.folder-item.open > .folder-content {
    display: block;
}

/* Main JS file styling */
.file-item.main-js-file {
    background-color: rgba(66, 133, 244, 0.05);
}

.file-item.main-js-file i {
    color: #42a5f5;
}

/* Drag and drop styling */
.file-item.dragging, .folder-header.dragging {
    opacity: 0.5;
}

.file-item.drag-active, .folder-header.drag-active {
    border: 1px dashed #42a5f5;
}

.file-item.drag-over, .folder-header.drag-over {
    background-color: rgba(66, 133, 244, 0.2);
    outline: 1px dashed #42a5f5;
}

/* Current file name display */
.editor-header {
    padding: 5px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.current-file-name {
    padding: 4px 8px;
    font-family: monospace;
    font-size: 14px;
    color: #e0e0e0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}
`;
document.head.appendChild(style);

// Add the import method to interpreter
if (window.interpreter) {
    window.interpreter.importModule = function(modulePath) {
        if (window.fileManager) {
            return window.fileManager.importModule(modulePath);
        }
        return false;
    };
}