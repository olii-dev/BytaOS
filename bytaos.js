// BytaOS

// Global variable for tracking currently editing file
let currentEditingFile = null;

function openWindow(name) {
    const windowElement = document.getElementById(`${name.toLowerCase()}-window`);
    if (windowElement) {
        windowElement.style.display = 'flex';

        const icon = document.querySelector(`.dock-icon-container[data-name="${name}"] .status-dot`);
        if (icon) {
            icon.style.display = 'block';
        }

        // Bring launcher to front with highest z-index
        if (name === "Launcher") {
            windowElement.style.zIndex = 9999;
            loadAppList();
        }

        if (name === "Files") {
            listFiles();
        }

        if (name === "Calendar") {
            loadCalendar();
        }

        if (name === "Bin") {
            listBin();
        }

        if (name === "Notes") {
            loadNotes();
        }
    }
}

function closeWindow(name) {
    const windowElement = document.getElementById(`${name.toLowerCase()}-window`);
    if (windowElement) {
        windowElement.style.display = 'none';

        const icon = document.querySelector(`.dock-icon-container[data-name="${name}"] .status-dot`);
        if (icon) {
            icon.style.display = 'none';
        }
    } else {
        console.error(`Element with ID ${name.toLowerCase()}-window not found.`);
    }
}

function getFileSystem() {
    return JSON.parse(localStorage.getItem('fileSystem')) || [];
}

function setFileSystem(files) {
    localStorage.setItem('fileSystem', JSON.stringify(files));
}

function getBin() {
    return JSON.parse(localStorage.getItem('bin')) || [];
}

function setBin(bin) {
    localStorage.setItem('bin', JSON.stringify(bin));
}

// Current path for navigation
let currentPath = [];

function listFiles(folderPath = null) {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    const fileSystem = getFileSystem();
    
    // Update current path
    if (folderPath === null) {
        currentPath = [];
    } else {
        currentPath = folderPath;
    }
    
    const currentFolder = currentPath.length === 0 ? fileSystem : findFolderByPath(currentPath);

    // Add back button if not at root
    if (currentPath.length > 0) {
        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.onclick = () => {
            const parentPath = currentPath.slice(0, -1);
            listFiles(parentPath.length === 0 ? null : parentPath);
        };
        backButton.classList.add('back-button');
        filesList.appendChild(backButton);
    }
    
    // Add create button at the current location
    const createButton = document.createElement('button');
    createButton.textContent = "+ Create New File/Folder";
    createButton.classList.add('button-3d');
    createButton.style.marginBottom = '10px';
    createButton.style.width = '100%';
    createButton.onclick = () => createFile(currentPath.length > 0 ? currentPath : null);
    filesList.appendChild(createButton);

    if (currentFolder.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'No files or folders';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#999';
        emptyMessage.style.cursor = 'default';
        filesList.appendChild(emptyMessage);
        return;
    }

    currentFolder.forEach((file, index) => {
        const fileItem = document.createElement('li');
        
        const fileIcon = document.createElement('img');
        const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
        
        if (file.type === 'folder') {
            fileIcon.src = currentTheme === 'dark' ? 'icons/apps-light/folder-light.png' : 'icons/apps/folder.png';
        } else {
            fileIcon.src = currentTheme === 'dark' ? 'icons/apps-light/image-light.png' : 'icons/apps/image.png';
        }
        
        fileIcon.classList.add('file-icon');
        fileItem.appendChild(fileIcon);
        
        const fileName = document.createElement('span');
        fileName.textContent = file.name;
        fileItem.appendChild(fileName);
        
        fileItem.onclick = () => openFile(file, index, currentPath);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Delete";
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                moveToBin(currentPath, index);
            }
        };
        deleteButton.classList.add('delete-button');
        fileItem.appendChild(deleteButton);

        filesList.appendChild(fileItem);
    });
}

function createFile(folderPath = null) {
    const fileName = prompt("Enter file or folder name:");
    if (!fileName || fileName.trim() === '') {
        return;
    }
    
    const trimmedName = fileName.trim();
    let fileSystem = getFileSystem();
    
    // Get the current folder - this returns a reference to the array
    let currentFolder;
    if (folderPath && folderPath.length > 0) {
        currentFolder = fileSystem;
        // Navigate to the correct folder
        for (let i = 0; i < folderPath.length; i++) {
            const folderIndex = currentFolder.findIndex(file => file.name === folderPath[i] && file.type === 'folder');
            if (folderIndex !== -1) {
                currentFolder = currentFolder[folderIndex].content;
            } else {
                alert("Folder path not found!");
                return;
            }
        }
    } else {
        currentFolder = fileSystem;
    }
    
    if (currentFolder.some(file => file.name === trimmedName)) {
        alert("A file or folder with this name already exists!");
        return;
    }
    
    const type = prompt("Type 'file' for file or 'folder' for folder:", "file");
    
    if (type === null) {
        return;
    }
    
    const isFolder = type.toLowerCase() === 'folder';
    
    // Add the new file/folder to the current folder
    currentFolder.push({ 
        name: trimmedName, 
        type: isFolder ? 'folder' : 'file', 
        content: isFolder ? [] : "",
        created: new Date().toISOString()
    });
    
    // Save the entire file system
    setFileSystem(fileSystem);
    
    // Refresh the file list
    listFiles(folderPath);
}

function openFile(file, index, folderPath = null) {
    if (file.type === 'folder') {
        // Navigate into the folder
        const newPath = folderPath ? [...folderPath, file.name] : [file.name];
        listFiles(newPath);
    } else {
        // Open file editor modal
        currentEditingFile = {
            file: file,
            index: index,
            folderPath: folderPath
        };
        
        document.getElementById('editor-file-name').textContent = file.name;
        document.getElementById('file-content-editor').value = file.content || '';
        document.getElementById('file-editor-modal').classList.add('active');
        document.getElementById('file-content-editor').focus();
    }
}

function closeFileEditor() {
    document.getElementById('file-editor-modal').classList.remove('active');
    currentEditingFile = null;
}

function saveFileContent() {
    if (!currentEditingFile) return;
    
    const newContent = document.getElementById('file-content-editor').value;
    const fileSystem = getFileSystem();
    const currentFolder = currentEditingFile.folderPath && currentEditingFile.folderPath.length > 0 
        ? findFolderByPath(currentEditingFile.folderPath) 
        : fileSystem;
    
    currentFolder[currentEditingFile.index].content = newContent;
    setFileSystem(fileSystem);
    listFiles(currentEditingFile.folderPath);
    closeFileEditor();
}

function moveToBin(folderPath, index) {
    let fileSystem = getFileSystem();
    let bin = getBin();
    const currentFolder = folderPath && folderPath.length > 0 ? findFolderByPath(folderPath) : fileSystem;
    const file = currentFolder[index];

    bin.push(file);
    setBin(bin);

    currentFolder.splice(index, 1);
    setFileSystem(fileSystem);
    
    listFiles(folderPath);
    listBin();
}

function findFolderByPath(path) {
    const fileSystem = getFileSystem();
    let currentFolder = fileSystem;
    
    for (let i = 0; i < path.length; i++) {
        const folderIndex = currentFolder.findIndex(file => file.name === path[i] && file.type === 'folder');
        if (folderIndex !== -1) {
            currentFolder = currentFolder[folderIndex].content;
        } else {
            return fileSystem; // Return root if path not found
        }
    }
    return currentFolder;
}

function findFolder(folder) {
    const fileSystem = getFileSystem();
    let currentFolder = fileSystem;
    const path = folder.path;
    for (let i = 0; i < path.length; i++) {
        const folderIndex = currentFolder.findIndex(file => file.name === path[i] && file.type === 'folder');
        if (folderIndex !== -1) {
            currentFolder = currentFolder[folderIndex].content;
        }
    }
    return currentFolder;
}

// Handle terminal input
function handleTerminalInput(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminal-input').value.trim();
        const output = document.getElementById('terminal-output');

        output.innerHTML += `<div>> ${input}</div>`;

        if (input.toLowerCase() === 'help') {
            output.innerHTML += '<div>Available commands: help, echo, clear, ls, mkdir, rm</div>';
        } else if (input.toLowerCase().startsWith('echo ')) {
            output.innerHTML += `<div>${input.substring(5)}</div>`;
        } else if (input.toLowerCase() === 'clear') {
            output.innerHTML = '';
        } else if (input.toLowerCase() === 'ls') {
            const fileSystem = getFileSystem();
            const fileList = fileSystem.map(file => file.name).join('<br>');
            output.innerHTML += `<div>${fileList}</div>`;
        } else if (input.toLowerCase().startsWith('mkdir ')) {
            const dirName = input.substring(6);
            const fileSystem = getFileSystem();
            if (!fileSystem.some(file => file.name === dirName && file.type === 'folder')) {
                fileSystem.push({ name: dirName, type: 'folder', content: [] });
                setFileSystem(fileSystem);
                output.innerHTML += `<div>Directory "${dirName}" created.</div>`;
            } else {
                output.innerHTML += `<div>Directory "${dirName}" already exists.</div>`;
            }
        } else if (input.toLowerCase().startsWith('rm ')) {
            const fileName = input.substring(3);
            let fileSystem = getFileSystem();
            const index = fileSystem.findIndex(file => file.name === fileName);
            if (index !== -1) {
                moveToBin(null, index);
                output.innerHTML += `<div>File "${fileName}" moved to Bin.</div>`;
            } else {
                output.innerHTML += `<div>File "${fileName}" not found.</div>`;
            }
        } else {
            output.innerHTML += '<div>Unknown command</div>';
        }

        output.scrollTop = output.scrollHeight;
        document.getElementById('terminal-input').value = '';
    }
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Retrieve clock format from localStorage
    const clockFormat = localStorage.getItem('clockFormat') || '12'; // Default to 12-hour format

    if (clockFormat === '12') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert to 12-hour format
        document.getElementById('clock').textContent = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } else {
        // 24-hour format
        document.getElementById('clock').textContent = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
    }
}

setInterval(updateClock, 1000);
updateClock();

// Drag and Drop Functionality
let currentWindow = null;
let offsetX = 0, offsetY = 0;
let highestZIndex = 1000;

document.addEventListener('mousedown', (e) => {
    // Check if click is outside launcher - if so, close it
    const launcherWindow = document.getElementById('launcher-window');
    const launcherIcon = document.querySelector('.dock-icon-container[data-name="Launcher"]');
    
    if (launcherWindow && launcherWindow.style.display === 'flex') {
        // Check if click is outside launcher and not on launcher icon
        if (!launcherWindow.contains(e.target) && !launcherIcon.contains(e.target)) {
            closeWindow('Launcher');
        }
    }
    
    // Check if clicked element is window-header or a child of window-header
    const header = e.target.closest('.window-header');
    if (header && !header.parentElement.id.includes('launcher')) {
        currentWindow = header.parentElement;
        
        // Bring window to front
        highestZIndex++;
        currentWindow.style.zIndex = highestZIndex;
        
        // Get the current position and immediately set it to pixels to prevent jumping
        const rect = currentWindow.getBoundingClientRect();
        
        // Convert to pixel positioning if not already
        if (!currentWindow.style.left || currentWindow.style.left.includes('%')) {
            currentWindow.style.left = `${rect.left}px`;
            currentWindow.style.top = `${rect.top}px`;
        }
        
        // Calculate offset from mouse to window's current position
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        currentWindow.classList.add('dragging');
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (currentWindow) {
        // Calculate new position based on mouse position minus the offset
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;
        
        const windowWidth = currentWindow.offsetWidth;
        const windowHeight = currentWindow.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Keep window within screen bounds
        newLeft = Math.max(0, Math.min(newLeft, screenWidth - windowWidth));
        newTop = Math.max(0, Math.min(newTop, screenHeight - windowHeight));

        currentWindow.style.left = `${newLeft}px`;
        currentWindow.style.top = `${newTop}px`;
    }
});

document.addEventListener('mouseup', () => {
    if (currentWindow) {
        currentWindow.classList.remove('dragging');
        currentWindow = null;
    }
});

// Dock App Name
const dockIcons = document.querySelectorAll('.dock-icon-container');
const appNameElement = document.getElementById('app-name');

dockIcons.forEach(icon => {
    icon.addEventListener('mouseover', () => {
        const appName = icon.getAttribute('data-name');
        appNameElement.textContent = appName;
        appNameElement.style.opacity = 1;
    });

    icon.addEventListener('mouseout', () => {
        appNameElement.style.opacity = 0;
    });
});

function handleDockIconClick(appName) {
    openWindow(appName);  // This opens the selected app
}

// Add event listeners to dock icons
document.querySelectorAll('.dock-icon-container').forEach(icon => {
    const appName = icon.getAttribute('data-name');
    icon.addEventListener('click', () => handleDockIconClick(appName));
});

// Launcher Search
// Array of apps for search
const apps = [
    { name: 'Terminal', id: 'terminal-window', icon: 'icons/apps/terminal.png' },
    { name: 'Files', id: 'files-window', icon: 'icons/apps/folder.png' },
    { name: 'Settings', id: 'settings-window', icon: 'icons/apps/settings.png' },
    { name: 'Bin', id: 'bin-window', icon: 'icons/apps/bin.png' },
    { name: 'Notes', id: 'notes-window', icon: 'icons/apps/notes.png' },
    { name: 'Calendar', id: 'calendar-window', icon: 'icons/apps/calendar.svg' },
];

// Load all apps in launcher (show first 4, excluding Launcher itself)
function loadAppList() {
    const resultsList = document.getElementById('search-results');
    resultsList.innerHTML = '';

    // Filter out Launcher and take first 4
    const appsToShow = apps.filter(app => app.name !== 'Launcher').slice(0, 4);

    appsToShow.forEach(app => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<img src="${app.icon}" alt="${app.name} icon" class="launcher-icon"><span>${app.name}</span>`;
        listItem.addEventListener('click', () => {
            openWindow(app.name);
            closeWindow('Launcher'); // Close launcher after opening app
        });
        resultsList.appendChild(listItem);
    });
}

document.getElementById('search-bar').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const results = apps.filter(app => app.name.toLowerCase().startsWith(query)).slice(0, 4); // Limit to 4 results

    const resultsList = document.getElementById('search-results');
    resultsList.innerHTML = '';

    results.forEach(app => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<img src="${app.icon}" alt="${app.name} icon" class="launcher-icon"><span>${app.name}</span>`;
        listItem.addEventListener('click', () => {
            openWindow(app.name);
            closeWindow('Launcher'); // Close launcher after opening app
        });
        resultsList.appendChild(listItem);
    });

    if (results.length === 0 && query.length > 0) {
        resultsList.innerHTML = '<li>No results found</li>';
    }
});

// Notes App Functions

function saveNote() {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content-hidden').value;
    const tags = document.getElementById('note-tags').value.split(',').map(tag => tag.trim());
    if (title && content) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        const existingNoteIndex = notes.findIndex(note => note.title === title);

        if (existingNoteIndex !== -1) {
            notes[existingNoteIndex] = { title, content, tags };
        } else {
            notes.push({ title, content, tags });
        }

        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        clearNoteFields();
    }
}

function deleteNote() {
    const title = document.getElementById('note-title').value;
    if (title) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes = notes.filter(note => note.title !== title);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        clearNoteFields();
    }
}

function loadNotes() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerText = `${note.title} [${note.tags.join(', ')}]`;
        li.onclick = () => displayNoteContent(note);
        notesList.appendChild(li);
    });
}

function displayNoteContent(note) {
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content-hidden').value = note.content;
    document.getElementById('note-content').innerHTML = note.content;
    document.getElementById('note-tags').value = note.tags.join(', ');
}

function clearNoteFields() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content-hidden').value = '';
    document.getElementById('note-content').innerHTML = '';
    document.getElementById('note-tags').value = '';
}

document.getElementById('note-search').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const notesList = document.getElementById('notes-list');
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notesList.innerHTML = '';

    notes.forEach(note => {
        if (note.title.toLowerCase().includes(query) || note.tags.some(tag => tag.toLowerCase().includes(query))) {
            const li = document.createElement('li');
            li.innerText = `${note.title} [${note.tags.join(', ')}]`;
            li.onclick = () => displayNoteContent(note);
            notesList.appendChild(li);
        }
    });
});

function formatText(command) {
    document.execCommand(command, false, null);
}

document.getElementById('note-content').addEventListener('input', function () {
    const content = this.innerHTML;
    document.getElementById('note-content-hidden').value = content;
});

// Load notes when the Notes window is opened (handled in openWindow function)

// Make windows draggable - removed as these functions reference non-existent selectors

// Let windows be resizable - removed as these functions reference non-existent selectors

// Settings
function openSettings() {
    const settingsWindow = document.getElementById('settings-window');
    settingsWindow.style.display = 'flex';
    loadSettings();  // Load current settings when the window opens
}

function closeSettings() {
    const settingsWindow = document.getElementById('settings-window');
    settingsWindow.style.display = 'none';
}

function saveSettings() {
    const selectedTheme = document.getElementById('theme-select').value;
    const selectedClockFormat = document.getElementById('clock-select').value;

    localStorage.setItem('theme', selectedTheme);
    localStorage.setItem('clockFormat', selectedClockFormat);

    applyTheme(selectedTheme);
    updateClock();
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedClockFormat = localStorage.getItem('clockFormat') || '12';

    document.getElementById('theme-select').value = savedTheme;
    document.getElementById('clock-select').value = savedClockFormat;

    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add(theme);
    
    // Switch menu logo based on theme
    const menuLogo = document.querySelector('.menu-logo');
    if (menuLogo) {
        if (theme === 'dark') {
            menuLogo.src = 'icons/byta-logo-white.png';
        } else {
            menuLogo.src = 'icons/byta-logo-black.png';
        }
    }
    
    // Switch dock app icons based on theme
    const dockIcons = {
        'Terminal': theme === 'dark' ? 'icons/apps-light/terminal-light.png' : 'icons/apps/terminal.png',
        'Notes': theme === 'dark' ? 'icons/apps-light/notes-light.png' : 'icons/apps/notes.png',
        'Files': theme === 'dark' ? 'icons/apps-light/folder-light.png' : 'icons/apps/folder.png',
        'Settings': theme === 'dark' ? 'icons/apps-light/settings-light.png' : 'icons/apps/settings.png',
        'Calendar': theme === 'dark' ? 'icons/apps-light/calendar-light.png' : 'icons/apps/calendar.svg',
        'Launcher': theme === 'dark' ? 'icons/apps-light/launcher-light.png' : 'icons/launcher.png'
    };
    
    // Update dock icons
    document.querySelectorAll('.dock-icon-container').forEach(container => {
        const appName = container.getAttribute('data-name');
        const icon = container.querySelector('.dock-icon');
        if (icon && dockIcons[appName]) {
            icon.src = dockIcons[appName];
        }
    });
    
    // Update apps array for launcher
    apps.forEach(app => {
        if (app.name === 'Terminal') {
            app.icon = theme === 'dark' ? 'icons/apps-light/terminal-light.png' : 'icons/apps/terminal.png';
        } else if (app.name === 'Notes') {
            app.icon = theme === 'dark' ? 'icons/apps-light/notes-light.png' : 'icons/apps/notes.png';
        } else if (app.name === 'Files') {
            app.icon = theme === 'dark' ? 'icons/apps-light/folder-light.png' : 'icons/apps/folder.png';
        } else if (app.name === 'Settings') {
            app.icon = theme === 'dark' ? 'icons/apps-light/settings-light.png' : 'icons/apps/settings.png';
        } else if (app.name === 'Bin') {
            app.icon = theme === 'dark' ? 'icons/apps-light/bin-light.png' : 'icons/apps/bin.png';
        } else if (app.name === 'Calendar') {
            app.icon = theme === 'dark' ? 'icons/apps-light/calendar-light.png' : 'icons/apps/calendar.svg';
        }
    });
}

document.addEventListener('DOMContentLoaded', loadSettings);

// Calendar App
function loadCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = ''; // Clear previous content

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentDate = now.getDate();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Create calendar header
    const monthYear = document.createElement('div');
    monthYear.classList.add('calendar-header');
    monthYear.textContent = `${now.toLocaleString('default', { month: 'long' })} ${year}`;
    calendarBody.appendChild(monthYear);

    // Create calendar days
    const daysContainer = document.createElement('div');
    daysContainer.classList.add('calendar-days');
    calendarBody.appendChild(daysContainer);

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        daysContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const calendarDay = document.createElement('div');
        calendarDay.classList.add('calendar-day');
        if (day === currentDate) {
            calendarDay.classList.add('current-day');
        }
        calendarDay.textContent = day;
        daysContainer.appendChild(calendarDay);
    }
}

// Bin App
function listBin() {
    const binList = document.getElementById('bin-list');
    binList.innerHTML = '';
    const bin = getBin();

    if (bin.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Bin is empty';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#999';
        emptyMessage.style.cursor = 'default';
        binList.appendChild(emptyMessage);
        return;
    }

    bin.forEach((file, index) => {
        const fileItem = document.createElement('li');
        
        const fileIcon = document.createElement('img');
        const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
        
        if (file.type === 'folder') {
            fileIcon.src = currentTheme === 'dark' ? 'icons/apps-light/folder-light.png' : 'icons/apps/folder.png';
        } else {
            fileIcon.src = currentTheme === 'dark' ? 'icons/apps-light/image-light.png' : 'icons/apps/image.png';
        }
        
        fileIcon.classList.add('file-icon');
        fileItem.appendChild(fileIcon);
        
        const fileName = document.createElement('span');
        fileName.textContent = file.name;
        fileItem.appendChild(fileName);

        const restoreButton = document.createElement('button');
        restoreButton.textContent = "Restore";
        restoreButton.onclick = () => {
            restoreFromBin(index);
        };
        restoreButton.classList.add('restore-button');
        fileItem.appendChild(restoreButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => {
            if (confirm(`Permanently delete "${file.name}"? This cannot be undone!`)) {
                deletePermanently(index);
            }
        };
        deleteButton.classList.add('delete-button');
        fileItem.appendChild(deleteButton);

        binList.appendChild(fileItem);
    });
}

function restoreFromBin(index) {
    let bin = getBin();
    const file = bin[index];
    let fileSystem = getFileSystem();

    fileSystem.push(file);
    setFileSystem(fileSystem);

    bin.splice(index, 1);
    setBin(bin);

    listFiles();
    listBin();
}

function deletePermanently(index) {
    let bin = getBin();
    bin.splice(index, 1);
    setBin(bin);
    listBin();
}
// Close file editor modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('file-editor-modal');
        if (modal && modal.classList.contains('active')) {
            closeFileEditor();
        }
    }
});

// Close file editor modal when clicking outside
document.getElementById('file-editor-modal').addEventListener('click', (e) => {
    if (e.target.id === 'file-editor-modal') {
        closeFileEditor();
    }
});
