// BytaOS Core Functions

function openWindow(name) {
    const windowElement = document.getElementById(`${name.toLowerCase()}-window`);
    if (windowElement) {
        windowElement.style.display = 'flex';
        
        // Add the status dot to the dock icon
        const icon = document.querySelector(`.dock-icon-container[data-name="${name}"] .status-dot`);
        if (icon) {
            icon.style.display = 'block'; // Show the dot
        }

        // Load files when Files window is opened
        if (name === "Files") {
            listFiles();
        }

        // Load apps when Launcher window is opened
        if (name === "Launcher") {
            loadAppList();
        }
    }
}

function closeWindow(name) {
    const windowElement = document.getElementById(`${name.toLowerCase()}-window`);
    if (windowElement) {
        windowElement.style.display = 'none';
        
        // Remove the status dot from the dock icon
        const icon = document.querySelector(`.dock-icon-container[data-name="${name}"] .status-dot`);
        if (icon) {
            icon.style.display = 'none'; // Hide the dot
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

function listFiles() {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    const fileSystem = getFileSystem();
    fileSystem.forEach((file, index) => {
        const fileItem = document.createElement('li');
        fileItem.textContent = file.name;
        fileItem.onclick = () => editFile(index);
        filesList.appendChild(fileItem);
    });
}

function createFile() {
    const fileName = prompt("Enter new file name:");
    if (fileName) {
        let fileSystem = getFileSystem();
        if (fileSystem.some(file => file.name === fileName)) {
            alert("File already exists!");
            return;
        }
        fileSystem.push({ name: fileName, content: "" });
        setFileSystem(fileSystem);
        listFiles();
    }
}

function editFile(index) {
    let fileSystem = getFileSystem();
    const file = fileSystem[index];
    const newContent = prompt(`Edit content of ${file.name}:`, file.content);
    if (newContent !== null) {
        fileSystem[index].content = newContent;
        setFileSystem(fileSystem);
        listFiles();
    }
}

function deleteFile(index) {
    let fileSystem = getFileSystem();
    fileSystem.splice(index, 1);
    setFileSystem(fileSystem);
    listFiles();
}

// Handle terminal input
function handleTerminalInput(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('terminal-input').value.trim();
        const output = document.getElementById('terminal-output');
        
        output.innerHTML += `<div>> ${input}</div>`;
        
        if (input.toLowerCase() === 'help') {
            output.innerHTML += '<div>Available commands: help, echo, clear</div>';
        } else if (input.toLowerCase().startsWith('echo ')) {
            output.innerHTML += `<div>${input.substring(5)}</div>`;
        } else if (input.toLowerCase() === 'clear') {
            output.innerHTML = '';
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

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format, with 12 for midnight and noon
    hours = hours.toString().padStart(2, '0');

    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
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
    { name: 'Bin', id: 'bin-window', icon: 'icons/apps/bin.png' }
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
    const content = document.getElementById('note-content').value;
    if (title && content) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        const existingNoteIndex = notes.findIndex(note => note.title === title);
        
        if (existingNoteIndex !== -1) {
            // Replace the content of the existing note
            notes[existingNoteIndex].content = content;
        } else {
            // Add a new note
            notes.push({ title, content });
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
        li.innerText = note.title;
        li.onclick = () => displayNoteContent(note);
        notesList.appendChild(li);
    });
}

function displayNoteContent(note) {
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
}

function clearNoteFields() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
}

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

// Apply dragging and resizing to all windows
document.querySelectorAll('.window').forEach(windowElement => {
    makeDraggable(windowElement);
    makeResizable(windowElement);
});

// Dummy file system as an array of file names
const fileSystem = [
    "Document1.txt",
    "Document2.txt",
    "Image1.png",
    "Folder1"
];

function listFiles() {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    fileSystem.forEach(file => {
        const fileItem = document.createElement('li');
        fileItem.textContent = file;
        fileItem.onclick = () => openFile(file);
        filesList.appendChild(fileItem);
    });
}

function openFile(fileName) {
    console.log("Opening:", fileName);
}

function deleteFile(fileName) {
    const index = fileSystem.indexOf(fileName);
    if (index !== -1) {
        fileSystem.splice(index, 1);
        listFiles();
    }
}
