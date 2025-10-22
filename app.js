// ========================================
// Instrument Scanner App - iOS Native Style
// ========================================

// State
let html5QrCode = null;
let currentScannedCode = null;
let instruments = [];
let isScanning = false;

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadInstruments();
    initTabNavigation();
    initScanPage();
    initInventoryPage();
    initSearchPage();
    initHamburgerMenus();
    updateStats();
    renderInventory();
    
    // Auto-start camera on load
    setTimeout(() => {
        startScanning();
    }, 100);
});

// ========================================
// Data Management
// ========================================
function loadInstruments() {
    const stored = localStorage.getItem('instruments');
    if (stored) {
        instruments = JSON.parse(stored);
    }
}

function saveInstruments() {
    localStorage.setItem('instruments', JSON.stringify(instruments));
}

function addOrUpdateInstrument(serialNumber, instrumentType, personName, status) {
    const timestamp = new Date().toLocaleString();
    
    // Add school identifier if not present
    if (!serialNumber.includes('-MHSN')) {
        serialNumber = serialNumber + '-MHSN';
    }
    
    // Auto-detect instrument type based on barcode number
    if (!instrumentType) {
        instrumentType = detectInstrumentType(serialNumber);
    }
    
    // Check if instrument already exists
    const existingIndex = instruments.findIndex(i => i.serialNumber === serialNumber);
    
    if (existingIndex !== -1) {
        // Update existing instrument
        instruments[existingIndex] = {
            ...instruments[existingIndex],
            personName,
            status,
            timestamp,
            instrumentType
        };
    } else {
        // Add new instrument
        instruments.push({
            serialNumber,
            instrumentType,
            personName,
            status,
            timestamp,
            id: Date.now()
        });
    }
    
    saveInstruments();
    updateStats();
    renderInventory();
}

function detectInstrumentType(serialNumber) {
    // Remove school identifier for detection
    const cleanNumber = serialNumber.replace('-MHSN', '');
    const num = parseInt(cleanNumber);
    
    // Instrument type detection based on hundreds digit
    const hundreds = Math.floor(num / 100);
    
    switch (hundreds) {
        case 1: return 'Flute';           // 100-199
        case 2: return 'Clarinet';        // 200-299
        case 3: return 'Saxophone';       // 300-399
        case 4: return 'Trumpet';         // 400-499
        case 5: return 'Trombone';        // 500-599
        case 6: return 'French Horn';      // 600-699
        case 7: return 'Tuba';            // 700-799
        case 8: return 'Drum';            // 800-899
        case 9: return 'Percussion';      // 900-999
        default: return 'Other';
    }
}

// ========================================
// Tab Navigation
// ========================================
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const circleButton = document.querySelector('.tab-btn-circle');
    const pillContainer = document.querySelector('.tab-bar-pill');
    
    // Handle pill tab buttons
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.dataset.page;
            
            // Update active states
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            circleButton.classList.remove('active');
            
            // Activate target
            document.getElementById(targetPage).classList.add('active');
            btn.classList.add('active');
            
            // Update pill container data attribute for sliding animation
            if (targetPage === 'inventory-page') {
                pillContainer.setAttribute('data-active', 'inventory');
            } else {
                pillContainer.setAttribute('data-active', 'scan');
            }
            
            // Handle camera based on page
            if (targetPage === 'scan-page') {
                // Restart camera when returning to scan page
                setTimeout(() => {
                    if (!isScanning) {
                        startScanning();
                    }
                }, 200);
            } else {
                // Stop camera when leaving scan page
                stopScanning();
            }
            
            // If switching to inventory, refresh it
            if (targetPage === 'inventory-page') {
                renderInventory();
            }
        });
    });
    
    // Handle circle button
    circleButton.addEventListener('click', () => {
        const targetPage = circleButton.dataset.page;
        
        // Update active states
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activate target
        document.getElementById(targetPage).classList.add('active');
        circleButton.classList.add('active');
        
        // Hide pill indicator when search is active
        pillContainer.setAttribute('data-active', 'search');
        
        // Stop camera when leaving scan page
        stopScanning();
    });
}

// ========================================
// Scan Page
// ========================================
function initScanPage() {
    const checkOutBtn = document.getElementById('check-out-btn');
    const checkInBtn = document.getElementById('check-in-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    checkOutBtn.addEventListener('click', () => handleCheckInOut('checked-out'));
    checkInBtn.addEventListener('click', () => handleCheckInOut('checked-in'));
    cancelBtn.addEventListener('click', resetScanForm);
}

function startScanning() {
    // Prevent multiple scanner instances
    if (isScanning || html5QrCode) {
        console.log("Scanner already running or initializing");
        return;
    }
    
    const readerElement = document.getElementById('reader');
    
    // Clear any existing content
    readerElement.innerHTML = '';
    
    // Make reader visible
    readerElement.style.display = 'block';
    
    // Initialize scanner
    html5QrCode = new Html5Qrcode("reader");
    
    const config = {
        fps: 30, // Increased FPS for faster scanning
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: false,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native barcode detection for better accuracy
        }
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        console.log("Scanner started successfully");
    }).catch(err => {
        console.error("Unable to start scanner", err);
        // Let the browser handle camera permissions natively
        isScanning = false;
    });
}

function onScanSuccess(decodedText) {
    console.log("Barcode scanned successfully:", decodedText);
    
    // Vibrate on successful scan (if supported)
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    // Stop scanning temporarily
    pauseScanning();
    
    // Store the scanned code
    currentScannedCode = decodedText;
    
    // Hide scan guide
    const scanGuide = document.querySelector('.scan-guide');
    if (scanGuide) scanGuide.style.display = 'none';
    
    // Show the form
    document.getElementById('serial-number').value = decodedText;
    document.getElementById('scan-form').classList.remove('hidden');
    
    // Auto-detect instrument type based on barcode
    const detectedType = detectInstrumentType(decodedText);
    document.getElementById('instrument-type').value = detectedType;
    
    // Try to auto-fill person name if instrument exists
    const existingInstrument = instruments.find(i => i.serialNumber === decodedText);
    if (existingInstrument) {
        document.getElementById('person-name').value = existingInstrument.personName;
    } else {
        // Clear person name for new instrument
        document.getElementById('person-name').value = '';
    }
    
    // Focus on the first empty field
    if (!existingInstrument) {
        document.getElementById('instrument-type').focus();
    } else {
        document.getElementById('person-name').focus();
    }
}

function onScanError(errorMessage) {
    // Log scan errors for debugging
    console.log("Scan error:", errorMessage);
}

function pauseScanning() {
    if (html5QrCode && isScanning) {
        html5QrCode.pause(true);
    }
}

function resumeScanning() {
    if (html5QrCode && isScanning) {
        html5QrCode.resume();
    }
}

function stopScanning() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            isScanning = false;
            document.getElementById('reader').style.display = 'none';
        }).catch(err => {
            console.error("Error stopping scanner", err);
            html5QrCode = null;
            isScanning = false;
        });
    }
}

function handleCheckInOut(status) {
    const serialNumber = document.getElementById('serial-number').value;
    const instrumentType = document.getElementById('instrument-type').value;
    const personName = document.getElementById('person-name').value;
    
    // Validate
    if (!instrumentType) {
        showMessage('Please select an instrument type', false);
        return;
    }
    
    if (!personName) {
        showMessage('Please enter a student name', false);
        return;
    }
    
    // Save the instrument
    addOrUpdateInstrument(serialNumber, instrumentType, personName, status);
    
    // Show success message
    const statusText = status === 'checked-out' ? 'checked out' : 'checked in';
    const successText = `${instrumentType} ${statusText} to ${personName}`;
    showMessage(successText, true);
    
    // Hide form and resume scanning
    document.getElementById('scan-form').classList.add('hidden');
    
    // Show scan guide again
    const scanGuide = document.querySelector('.scan-guide');
    if (scanGuide) scanGuide.style.display = 'flex';
    
    // Reset after 1.5 seconds and resume scanning
    setTimeout(() => {
        hideMessage();
        resumeScanning();
    }, 1500);
    
    currentScannedCode = null;
}

function resetScanForm() {
    document.getElementById('scan-form').classList.add('hidden');
    document.getElementById('serial-number').value = '';
    document.getElementById('instrument-type').value = '';
    document.getElementById('person-name').value = '';
    currentScannedCode = null;
    
    // Show scan guide again
    const scanGuide = document.querySelector('.scan-guide');
    if (scanGuide) scanGuide.style.display = 'flex';
    
    // Resume scanning
    resumeScanning();
}

function showMessage(text, isSuccess) {
    const messageEl = document.getElementById('success-message');
    const textEl = document.getElementById('success-text');
    textEl.textContent = text;
    messageEl.classList.remove('hidden');
    if (!isSuccess) {
        messageEl.style.color = '#FF3B30'; // iOS red for errors
    } else {
        messageEl.style.color = '#34C759'; // iOS green for success
    }
}

function hideMessage() {
    document.getElementById('success-message').classList.add('hidden');
}

// ========================================
// Inventory Page
// ========================================
function initInventoryPage() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterContainer = document.querySelector('.filter-buttons');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            const filter = btn.dataset.filter;
            
            // Update container data attribute for animated indicator
            filterContainer.setAttribute('data-active', filter);
            
            renderInventory(filter);
        });
    });
}

function initSearchPage() {
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        
        // Show/hide clear button
        if (searchTerm) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        
        renderSearchResults(searchTerm);
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderSearchResults('');
        searchInput.focus();
    });
}

function renderInventory(filter = 'all') {
    const inventoryList = document.getElementById('inventory-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filter instruments by status
    let filteredInstruments = instruments;
    if (filter === 'checked-out') {
        filteredInstruments = instruments.filter(i => i.status === 'checked-out');
    } else if (filter === 'checked-in') {
        filteredInstruments = instruments.filter(i => i.status === 'checked-in');
    }
    
    // Show/hide empty state
    if (filteredInstruments.length === 0) {
        inventoryList.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.querySelector('#empty-state p:first-of-type').textContent = 'No instruments yet';
        document.querySelector('#empty-state p:last-of-type').textContent = 'Start by scanning an instrument';
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Group by instrument type
    const grouped = {};
    filteredInstruments.forEach(instrument => {
        const type = instrument.instrumentType;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(instrument);
    });
    
    // Render grouped instruments
    let html = '';
    const sortedTypes = Object.keys(grouped).sort();
    
    sortedTypes.forEach(type => {
        html += `<div class="category-header">${type}s</div>`;
        
        // Sort by timestamp (newest first)
        grouped[type].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        grouped[type].forEach(instrument => {
            html += createInstrumentCard(instrument);
        });
    });
    
    inventoryList.innerHTML = html;
}

function renderSearchResults(searchTerm = '') {
    const searchResults = document.getElementById('search-results');
    const emptyState = document.getElementById('search-empty-state');
    
    // If no search term, show empty state
    if (!searchTerm) {
        searchResults.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.querySelector('#search-empty-state p:first-of-type').textContent = 'Search for instruments';
        document.querySelector('#search-empty-state p:last-of-type').textContent = 'Enter a name, serial number, or instrument type';
        return;
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const filteredInstruments = instruments.filter(i => {
        return i.instrumentType.toLowerCase().includes(searchLower) ||
               i.personName.toLowerCase().includes(searchLower) ||
               i.serialNumber.toLowerCase().includes(searchLower) ||
               i.timestamp.toLowerCase().includes(searchLower);
    });
    
    // Show/hide empty state
    if (filteredInstruments.length === 0) {
        searchResults.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.querySelector('#search-empty-state p:first-of-type').textContent = 'No results found';
        document.querySelector('#search-empty-state p:last-of-type').textContent = 'Try a different search term';
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Group by instrument type
    const grouped = {};
    filteredInstruments.forEach(instrument => {
        const type = instrument.instrumentType;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(instrument);
    });
    
    // Render grouped instruments
    let html = '';
    const sortedTypes = Object.keys(grouped).sort();
    
    sortedTypes.forEach(type => {
        html += `<div class="category-header">${type}s</div>`;
        
        // Sort by timestamp (newest first)
        grouped[type].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        grouped[type].forEach(instrument => {
            html += createInstrumentCard(instrument);
        });
    });
    
    searchResults.innerHTML = html;
}

function createInstrumentCard(instrument) {
    const statusClass = instrument.status === 'checked-out' ? 'checked-out' : 'checked-in';
    const statusText = instrument.status === 'checked-out' ? 'Checked Out' : 'Available';
    
    return `
        <div class="instrument-card">
            <div class="instrument-header">
                <div>
                    <div class="instrument-title">${instrument.instrumentType}</div>
                    <div class="instrument-type">Serial: ${instrument.serialNumber}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="instrument-details">
                <div class="detail-row">
                    <span class="detail-label">Student</span>
                    <span class="detail-value">${instrument.personName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${instrument.timestamp}</span>
                </div>
            </div>
        </div>
    `;
}

function updateStats() {
    const checkedOut = instruments.filter(i => i.status === 'checked-out').length;
    const checkedIn = instruments.filter(i => i.status === 'checked-in').length;
    
    document.getElementById('checked-out-count').textContent = checkedOut;
    document.getElementById('checked-in-count').textContent = checkedIn;
}

// ========================================
// Hamburger Menu Functions
// ========================================
function initHamburgerMenus() {
    const hamburgerMenus = document.querySelectorAll('.hamburger-menu');
    const hamburgerOverlay = document.getElementById('hamburger-overlay');
    const closeHamburger = document.getElementById('close-hamburger');
    const manualEntryOption = document.getElementById('manual-entry-option');
    const addInstrumentOption = document.getElementById('add-instrument-option');
    
    // Add click listeners to all hamburger menus
    hamburgerMenus.forEach(menu => {
        menu.addEventListener('click', () => {
            hamburgerOverlay.classList.remove('hidden');
        });
    });
    
    closeHamburger.addEventListener('click', () => {
        hamburgerOverlay.classList.add('hidden');
    });
    
    hamburgerOverlay.addEventListener('click', (e) => {
        if (e.target === hamburgerOverlay) {
            hamburgerOverlay.classList.add('hidden');
        }
    });
    
    manualEntryOption.addEventListener('click', () => {
        hamburgerOverlay.classList.add('hidden');
        showManualEntryForm();
    });
    
    addInstrumentOption.addEventListener('click', () => {
        hamburgerOverlay.classList.add('hidden');
        showAddInstrumentForm();
    });
}

// ========================================
// Manual Entry Functions
// ========================================
function showManualEntryForm() {
    const serialNumber = prompt('Enter barcode manually:');
    if (serialNumber && serialNumber.trim()) {
        // Simulate a successful scan
        currentScannedCode = serialNumber.trim();
        
        // Show the form
        document.getElementById('serial-number').value = serialNumber.trim();
        document.getElementById('scan-form').classList.remove('hidden');
        
        // Auto-detect instrument type based on barcode
        const detectedType = detectInstrumentType(serialNumber.trim());
        document.getElementById('instrument-type').value = detectedType;
        
        // Try to auto-fill person name if instrument exists
        const existingInstrument = instruments.find(i => i.serialNumber === serialNumber.trim());
        if (existingInstrument) {
            document.getElementById('person-name').value = existingInstrument.personName;
        } else {
            // Clear person name for new instrument
            document.getElementById('person-name').value = '';
        }
        
        // Focus on the first empty field
        if (!existingInstrument) {
            document.getElementById('instrument-type').focus();
        } else {
            document.getElementById('person-name').focus();
        }
    }
}

function showAddInstrumentForm() {
    const instrumentType = prompt('Enter instrument type:');
    if (instrumentType && instrumentType.trim()) {
        const serialNumber = prompt('Enter serial number:');
        if (serialNumber && serialNumber.trim()) {
            const personName = prompt('Enter student name:');
            if (personName && personName.trim()) {
                // Add as checked-in by default
                addOrUpdateInstrument(serialNumber.trim(), instrumentType.trim(), personName.trim(), 'checked-in');
                showMessage(`${instrumentType} added to inventory`, true);
            }
        }
    }
}

// ========================================
// Service Worker Registration
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
