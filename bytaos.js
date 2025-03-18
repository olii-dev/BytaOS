// BytaOS

function openWindow(name) {
    const windowElement = document.getElementById(`${name.toLowerCase()}-window`);
    if (windowElement) {
        windowElement.style.display = 'flex';

        const icon = document.querySelector(`.dock-icon-container[data-name="${name}"] .status-dot`);
        if (icon) {
            icon.style.display = 'block';
        }

        if (name === "Files") {
            listFiles();
        }

        if (name === "Launcher") {
            loadAppList();
        }

        if (name === "Calendar") {
            loadCalendar();
        }

        if (name === "Bin") {
            listBin();
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

function listFiles(folder = null) {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    const fileSystem = getFileSystem();
    const currentFolder = folder ? findFolder(folder) : fileSystem;

    if (folder) {
        const backButton = document.createElement('button');
        backButton.textContent = "..";
        backButton.onclick = () => listFiles();
        backButton.classList.add('back-button');
        filesList.appendChild(backButton);
    }

    currentFolder.forEach((file, index) => {
        const fileItem = document.createElement('li');
        const fileIcon = document.createElement('img');
        fileIcon.src = file.type === 'folder' ? 'icons/folder.png' : 'icons/file.png';
        fileIcon.classList.add('file-icon');
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(document.createTextNode(file.name));
        fileItem.onclick = () => openFile(file, index);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Delete";
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            moveToBin(folder, index);
        };
        deleteButton.classList.add('delete-button');
        fileItem.appendChild(deleteButton);

        filesList.appendChild(fileItem);
    });
}

function createFile(folder = null) {
    const fileName = prompt("Enter new file or folder name:");
    if (fileName) {
        let fileSystem = getFileSystem();
        const currentFolder = folder ? findFolder(folder) : fileSystem;
        const type = prompt("Is this a file or a folder? (file/folder)");

        if (!currentFolder.some(file => file.name === fileName)) {
            currentFolder.push({ name: fileName, type: type === 'folder' ? 'folder' : 'file', content: type === 'folder' ? [] : "" });
            setFileSystem(fileSystem);
            listFiles(folder);
        } else {
            alert("File or folder already exists!");
        }
    }
}

function openFile(file, index, folder = null) {
    if (file.type === 'folder') {
        listFiles(file);
    } else {
        const newContent = prompt(`Edit content of ${file.name}:`, file.content);
        if (newContent !== null) {
            const fileSystem = getFileSystem();
            const currentFolder = folder ? findFolder(folder) : fileSystem;
            currentFolder[index].content = newContent;
            setFileSystem(fileSystem);
            listFiles(folder);
        }
    }
}

function moveToBin(folder, index) {
    let fileSystem = getFileSystem();
    let bin = getBin();
    const file = folder ? findFolder(folder)[index] : fileSystem[index];

    bin.push(file);
    setBin(bin);

    if (folder) {
        const currentFolder = findFolder(folder);
        currentFolder.splice(index, 1);
    } else {
        fileSystem.splice(index, 1);
    }

    setFileSystem(fileSystem);
    listFiles(folder);
    listBin();
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
let startX = 0, startY = 0;
let startLeft = 0, startTop = 0;

document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('window-header') && !e.target.parentElement.id.includes('launcher')) {
        currentWindow = e.target.parentElement;
        startX = e.clientX;
        startY = e.clientY;

        const rect = currentWindow.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        currentWindow.classList.add('dragging');

        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (currentWindow) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        const windowWidth = currentWindow.offsetWidth;
        const windowHeight = currentWindow.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

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
    { name: 'Launcher', id: 'launcher-window', icon: 'icons/launcher.png' },
    { name: 'Terminal', id: 'terminal-window', icon: 'icons/apps/terminal.png' },
    { name: 'Files', id: 'files-window', icon: 'icons/apps/folder.png' },
    { name: 'Settings', id: 'settings-window', icon: 'icons/apps/settings.png' },
    { name: 'Bin', id: 'bin-window', icon: 'icons/apps/bin.png' },
    { name: 'Notes', id: 'notes-window', icon: 'icons/apps/notes.png' },
    { name: 'Calendar', id: 'calendar-window', icon: 'icons/apps/calendar.png' },
];

document.getElementById('search-bar').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const results = apps.filter(app => app.name.toLowerCase().startsWith(query));

    const resultsList = document.getElementById('search-results');
    resultsList.innerHTML = '';

    results.forEach(app => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<img src="${app.icon}" alt="${app.name} icon" class="launcher-icon"><span>${app.name}</span>`;
        listItem.addEventListener('click', () => {
            openWindow(app.name);
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

// Load notes when the Notes window is opened
document.getElementById('notes-window').addEventListener('load', loadNotes);

// Make windows draggable
function makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    element.querySelector('.title-bar').addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
        });
    });

    function onMouseMove(e) {
        if (isDragging) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    }
}

// Let windows be resizable
function makeResizable(element) {
    const resizer = element.querySelector('.resizer');
    let startX, startY, startWidth, startHeight;

    resizer.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', resize);
        });
    });

    function resize(e) {
        element.style.width = startWidth + e.clientX - startX + 'px';
        element.style.height = startHeight + e.clientY - startY + 'px';
    }
}

document.querySelectorAll('.window').forEach(windowElement => {
    makeDraggable(windowElement);
    makeResizable(windowElement);
});

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
}

const settingsIcon = document.createElement('div');
settingsIcon.className = 'dock-icon-container';
settingsIcon.setAttribute('data-name', 'Settings');
settingsIcon.innerHTML = `<img src="icons/settings.png" alt="Settings" class="dock-icon">`;
settingsIcon.addEventListener('click', openSettings);
document.querySelector('.dock-icons').appendChild(settingsIcon);

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

    bin.forEach((file, index) => {
        const fileItem = document.createElement('li');
        const fileIcon = document.createElement('img');
        fileIcon.src = file.type === 'folder' ? 'icons/folder.png' : 'icons/file.png';
        fileIcon.classList.add('file-icon');
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(document.createTextNode(file.name));

        const restoreButton = document.createElement('button');
        restoreButton.textContent = "Restore";
        restoreButton.onclick = () => restoreFromBin(index);
        restoreButton.classList.add('restore-button');
        fileItem.appendChild(restoreButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Delete Permanently";
        deleteButton.onclick = () => deletePermanently(index);
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