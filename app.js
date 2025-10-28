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
    initItemOptions();
    updateStats();
    renderInventory();
    
    // Auto-start camera on load
    setTimeout(() => {
        startScanning();
    }, 100);
});

// ========================================
// Barcode Validation
// ========================================
// Allowed instrument code ranges, using the prefixed system from barcode-list.txt
const ALLOWED_INSTRUMENT_RANGES = [
    [100, 119],   // Flute
    [200, 219],   // BB Clarinet
    [300, 319],   // Piccolo
    [400, 419],   // Oboe
    [500, 519],   // Bassoon
    [600, 619],   // Eb Clarinet
    [700, 719],   // Alto Clarinet
    [800, 819],   // Bb Bass Clarinet
    [900, 919],   // Alto Saxophone
    [1000, 1019], // Tenor Saxophone
    [1100, 1119], // Baritone Saxophone
    [1200, 1219], // Trumpet
    [1300, 1319], // French Horn
    [1400, 1419], // Trombone
    [1500, 1519], // Euphonium
    [1600, 1619], // Tuba
    [1700, 1719], // Melophone
    [1800, 1819], // Marching Trombone
    [1900, 1919], // Marching Baritone
    [2000, 2019], // Sousaphone
];

function normalizeBarcodeForValidation(code) {
    if (!code) return '';
    const trimmed = String(code).trim();
    const lower = trimmed.toLowerCase();
    // Allow optional "-mhsn" suffix during validation only
    return lower.replace(/-mhsn$/, '');
}

function isValidBarcode(code) {
    const normalized = normalizeBarcodeForValidation(code);
    // Uniforms: u-<1..100>
    if (/^u-\d+$/.test(normalized)) {
        const n = parseInt(normalized.slice(2), 10);
        return n >= 1 && n <= 100;
    }
    // Instruments: i-<ranges above>
    if (/^i-\d+$/.test(normalized)) {
        const n = parseInt(normalized.slice(2), 10);
        for (const [start, end] of ALLOWED_INSTRUMENT_RANGES) {
            if (n >= start && n <= end) return true;
        }
        return false;
    }
    // Otherwise invalid/noisy
    return false;
}

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

function addOrUpdateInstrument(serialNumber, instrumentType, personName, status, physicalSerialNumber = null) {
    const timestamp = new Date().toLocaleString();
    
    // Auto-detect instrument type based on barcode number
    if (!instrumentType) {
        instrumentType = detectInstrumentType(serialNumber);
    }
    
    // Check if instrument already exists
    const existingIndex = instruments.findIndex(i => i.serialNumber === serialNumber);
    
    if (existingIndex !== -1) {
        // Update existing instrument - preserve existing data if new data is empty
        instruments[existingIndex] = {
            ...instruments[existingIndex],
            personName: personName || instruments[existingIndex].personName,
            status,
            timestamp,
            instrumentType,
            physicalSerialNumber: physicalSerialNumber || instruments[existingIndex].physicalSerialNumber
        };
    } else {
        // Add new instrument
        instruments.push({
            serialNumber,
            instrumentType,
            personName,
            status,
            timestamp,
            physicalSerialNumber,
            id: Date.now()
        });
    }
    
    saveInstruments();
    updateStats();
    renderInventory();
}

function detectInstrumentType(serialNumber) {
    // Handle uniform codes
    if (serialNumber.startsWith('u-')) {
        return 'Uniform';
    }
    
    // Handle instrument codes with 'i-' prefix
    if (serialNumber.startsWith('i-')) {
        // Remove 'i-' prefix and school identifier for detection
        const cleanNumber = serialNumber.replace('i-', '').replace('-MHSN', '');
        const num = parseInt(cleanNumber);
        
        // Instrument type detection based on hundreds digit
        const hundreds = Math.floor(num / 100);
        
        switch (hundreds) {
            case 1: return 'Flute';           // i-100-i-199
            case 2: return 'BB Clarinet';     // i-200-i-299
            case 3: return 'Piccolo';         // i-300-i-319
            case 4: return 'Oboe';            // i-400-i-419
            case 5: return 'Bassoon';         // i-500-i-519
            case 6: return 'Eb Clarinet';     // i-600-i-619
            case 7: return 'Alto Clarinet';   // i-700-i-719
            case 8: return 'Bb Bass Clarinet'; // i-800-i-819
            case 9: return 'Alto Saxophone';  // i-900-i-919
            case 10: return 'Tenor Saxophone'; // i-1000-i-1019
            case 11: return 'Baritone Saxophone'; // i-1100-i-1119
            case 12: return 'Trumpet';        // i-1200-i-1219
            case 13: return 'French Horn';    // i-1300-i-1319
            case 14: return 'Trombone';       // i-1400-i-1419
            case 15: return 'Euphonium';      // i-1500-i-1519
            case 16: return 'Tuba';           // i-1600-i-1619
            case 17: return 'Melophone';      // i-1700-i-1719
            case 18: return 'Marching Trombone'; // i-1800-i-1819
            case 19: return 'Marching Baritone'; // i-1900-i-1919
            case 20: return 'Sousaphone';     // i-2000-i-2019
            default: return 'Other';
        }
    }
    
    // Handle legacy codes without prefix (for backward compatibility)
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
        fps: 60, // Maximum FPS for fastest scanning
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: false,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native barcode detection for better accuracy
        },
        useBarCodeDetectorIfSupported: true, // Additional barcode detection
        verbose: false // Reduce console output for better performance
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
    // Ignore invalid/noisy scans; keep scanning until valid
    if (!isValidBarcode(decodedText)) {
        console.log('Ignoring invalid barcode:', decodedText);
        return;
    }

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

    // Try to auto-fill person name and serial number if instrument exists
    const existingInstrument = instruments.find(i => i.serialNumber === decodedText);
    if (existingInstrument) {
        document.getElementById('person-name').value = existingInstrument.personName || '';
        document.getElementById('serial-number-input').value = existingInstrument.physicalSerialNumber || '';
        // Hide serial number input for existing instruments or uniforms
        document.getElementById('serial-number-group').style.display = 'none';
    } else {
        // Clear person name for new instrument
        document.getElementById('person-name').value = '';
        // Show serial number input for new instruments (but not uniforms)
        if (detectedType === 'Uniform') {
            document.getElementById('serial-number-group').style.display = 'none';
        } else {
            document.getElementById('serial-number-group').style.display = 'block';
        }
        document.getElementById('serial-number-input').value = '';
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
        showMessage('Please select an item type', false);
        return;
    }
    
    // Get the physical serial number if provided
    const physicalSerialNumber = document.getElementById('serial-number-input').value;
    
    // Save the instrument
    addOrUpdateInstrument(serialNumber, instrumentType, personName, status, physicalSerialNumber);
    
    // Show success message
    const statusText = status === 'checked-out' ? 'checked out' : 'checked in';
    const successText = personName ? 
        `${instrumentType} ${statusText} to ${personName}` : 
        `${instrumentType} ${statusText}`;
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
    const chips = document.querySelectorAll('.chip');
    
    // Handle filter buttons (for category filter)
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const container = btn.closest('.filter-buttons');
            const buttons = container.querySelectorAll('.filter-btn');
            
            // Update active state for this container
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update container data attribute for animated indicator
            const filter = btn.dataset.filter;
            container.setAttribute('data-active', filter);
            
            // Get current filters from both sections
            const filterSections = document.querySelectorAll('.filter-section');
            const categoryContainer = filterSections[0] ? filterSections[0].querySelector('.filter-buttons') : null;
            const statusContainer = filterSections[1] ? filterSections[1].querySelector('.chip-container') : null;
            
            const activeCategory = categoryContainer ? categoryContainer.querySelector('.filter-btn.active').dataset.filter : 'all';
            const activeStatus = statusContainer ? statusContainer.querySelector('.chip.active').dataset.filter : 'all';
            
            // Apply filters
            renderInventory(activeStatus, activeCategory);
            updateStats();
        });
    });
    
    // Handle chips (for status filter)
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const container = chip.closest('.chip-container');
            const chipButtons = container.querySelectorAll('.chip');
            
            // Update active state for this container
            chipButtons.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Get current filters from both sections
            const filterSections = document.querySelectorAll('.filter-section');
            const categoryContainer = filterSections[0] ? filterSections[0].querySelector('.filter-buttons') : null;
            const statusContainer = filterSections[1] ? filterSections[1].querySelector('.chip-container') : null;
            
            const activeCategory = categoryContainer ? categoryContainer.querySelector('.filter-btn.active').dataset.filter : 'all';
            const activeStatus = statusContainer ? statusContainer.querySelector('.chip.active').dataset.filter : 'all';
            
            // Apply filters
            renderInventory(activeStatus, activeCategory);
            updateStats();
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

function renderInventory(filter = 'all', category = 'all') {
    const inventoryList = document.getElementById('inventory-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filter instruments by category first
    let filteredInstruments = instruments;
    if (category === 'instruments') {
        filteredInstruments = instruments.filter(i => i.instrumentType !== 'Uniform');
    } else if (category === 'uniforms') {
        filteredInstruments = instruments.filter(i => i.instrumentType === 'Uniform');
    }
    
    // Then filter by status
    if (filter === 'checked-out') {
        filteredInstruments = filteredInstruments.filter(i => i.status === 'checked-out');
    } else if (filter === 'checked-in') {
        filteredInstruments = filteredInstruments.filter(i => i.status === 'checked-in');
    }
    
    // Show/hide empty state
    if (filteredInstruments.length === 0) {
        inventoryList.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.querySelector('#empty-state p:first-of-type').textContent = 'No items yet';
        document.querySelector('#empty-state p:last-of-type').textContent = 'Start by scanning an item';
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
        document.querySelector('#search-empty-state p:first-of-type').textContent = 'Search for items';
        document.querySelector('#search-empty-state p:last-of-type').textContent = 'Enter a name, serial number, or item type';
        return;
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const filteredInstruments = instruments.filter(i => {
        return i.instrumentType.toLowerCase().includes(searchLower) ||
               (i.personName && i.personName.toLowerCase().includes(searchLower)) ||
               i.serialNumber.toLowerCase().includes(searchLower) ||
               (i.physicalSerialNumber && i.physicalSerialNumber.toLowerCase().includes(searchLower)) ||
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
        <div class="instrument-card" data-id="${instrument.id}" onclick="showItemOptions(${instrument.id})">
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
                    <span class="detail-value">${instrument.personName || 'Not assigned'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${instrument.timestamp}</span>
                </div>
                ${instrument.physicalSerialNumber && instrument.instrumentType !== 'Uniform' ? `
                <div class="detail-row">
                    <span class="detail-label">Physical Serial</span>
                    <span class="detail-value">${instrument.physicalSerialNumber}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function updateStats() {
    // Get current category filter
    const categoryContainer = document.querySelector('.filter-section:first-child .filter-buttons');
    const activeCategory = categoryContainer ? categoryContainer.querySelector('.filter-btn.active').dataset.filter : 'all';
    
    let itemsToCount = instruments;
    let labelPrefix = 'Instruments';
    
    if (activeCategory === 'instruments') {
        itemsToCount = instruments.filter(i => i.instrumentType !== 'Uniform');
        labelPrefix = 'Instruments';
    } else if (activeCategory === 'uniforms') {
        itemsToCount = instruments.filter(i => i.instrumentType === 'Uniform');
        labelPrefix = 'Uniforms';
    } else {
        // For 'all', show instruments by default
        itemsToCount = instruments.filter(i => i.instrumentType !== 'Uniform');
        labelPrefix = 'Instruments';
    }
    
    const checkedOut = itemsToCount.filter(i => i.status === 'checked-out').length;
    const checkedIn = itemsToCount.filter(i => i.status === 'checked-in').length;
    
    document.getElementById('checked-out-count').textContent = checkedOut;
    document.getElementById('checked-in-count').textContent = checkedIn;
    
    // Update labels based on category
    document.querySelector('.stat-out .stat-label').textContent = `${labelPrefix} Checked Out`;
    document.querySelector('.stat-in .stat-label').textContent = `${labelPrefix} Available`;
}

// ========================================
// Item Options Functions
// ========================================
let currentItemId = null;

function showItemOptions(itemId) {
    currentItemId = itemId;
    const overlay = document.getElementById('item-options-overlay');
    overlay.classList.remove('hidden');
}

function initItemOptions() {
    const overlay = document.getElementById('item-options-overlay');
    const closeBtn = document.getElementById('close-item-options');
    const editBtn = document.getElementById('edit-item-btn');
    const removeBtn = document.getElementById('remove-item-btn');
    
    // Handle close
    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
    });
    
    // Handle overlay click to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });
    
    // Handle edit
    editBtn.addEventListener('click', () => {
        editItem(currentItemId);
        overlay.classList.add('hidden');
    });
    
    // Handle remove
    removeBtn.addEventListener('click', () => {
        removeItem(currentItemId);
        overlay.classList.add('hidden');
    });
}

function editItem(itemId) {
    const item = instruments.find(i => i.id === itemId);
    if (!item) return;
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form-overlay';
    editForm.innerHTML = `
        <div class="edit-form-content">
            <div class="edit-form-header">
                <h2>Edit Item</h2>
                <button class="close-edit-form">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="edit-form-body">
                <div class="form-group">
                    <label for="edit-item-type">Item Type</label>
                    <select id="edit-item-type">
                        <option value="Uniform">Uniform</option>
                        <option value="Trumpet">Trumpet</option>
                        <option value="Trombone">Trombone</option>
                        <option value="BB Clarinet">BB Clarinet</option>
                        <option value="Flute">Flute</option>
                        <option value="Piccolo">Piccolo</option>
                        <option value="Oboe">Oboe</option>
                        <option value="Bassoon">Bassoon</option>
                        <option value="Eb Clarinet">Eb Clarinet</option>
                        <option value="Alto Clarinet">Alto Clarinet</option>
                        <option value="Bb Bass Clarinet">Bb Bass Clarinet</option>
                        <option value="Alto Saxophone">Alto Saxophone</option>
                        <option value="Tenor Saxophone">Tenor Saxophone</option>
                        <option value="Baritone Saxophone">Baritone Saxophone</option>
                        <option value="French Horn">French Horn</option>
                        <option value="Euphonium">Euphonium</option>
                        <option value="Tuba">Tuba</option>
                        <option value="Melophone">Melophone</option>
                        <option value="Marching Trombone">Marching Trombone</option>
                        <option value="Marching Baritone">Marching Baritone</option>
                        <option value="Sousaphone">Sousaphone</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-student-name">Student Name</label>
                    <input type="text" id="edit-student-name" placeholder="Enter student name (optional)">
                </div>
                <div class="form-group" id="edit-serial-group">
                    <label for="edit-serial-number">Serial Number</label>
                    <input type="text" id="edit-serial-number" placeholder="Enter serial number">
                </div>
                <div class="form-group">
                    <label for="edit-status">Status</label>
                    <select id="edit-status">
                        <option value="checked-in">Available</option>
                        <option value="checked-out">Checked Out</option>
                    </select>
                </div>
            </div>
            <div class="edit-form-actions">
                <button class="btn btn-secondary" id="cancel-edit">Cancel</button>
                <button class="btn btn-success" id="save-edit">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(editForm);
    
    // Populate form with current values
    document.getElementById('edit-item-type').value = item.instrumentType;
    document.getElementById('edit-student-name').value = item.personName || '';
    document.getElementById('edit-serial-number').value = item.physicalSerialNumber || '';
    document.getElementById('edit-status').value = item.status;
    
    // Show/hide serial number based on item type
    const serialGroup = document.getElementById('edit-serial-group');
    if (item.instrumentType === 'Uniform') {
        serialGroup.style.display = 'none';
    } else {
        serialGroup.style.display = 'block';
    }
    
    // Handle item type change
    document.getElementById('edit-item-type').addEventListener('change', (e) => {
        if (e.target.value === 'Uniform') {
            serialGroup.style.display = 'none';
        } else {
            serialGroup.style.display = 'block';
        }
    });
    
    // Handle cancel
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.body.removeChild(editForm);
    });
    
    document.querySelector('.close-edit-form').addEventListener('click', () => {
        document.body.removeChild(editForm);
    });
    
    // Handle save
    document.getElementById('save-edit').addEventListener('click', () => {
        const newType = document.getElementById('edit-item-type').value;
        const newName = document.getElementById('edit-student-name').value;
        const newSerial = document.getElementById('edit-serial-number').value;
        const newStatus = document.getElementById('edit-status').value;
        
        // Update item
        item.instrumentType = newType;
        item.personName = newName.trim();
        item.physicalSerialNumber = newType === 'Uniform' ? '' : newSerial.trim();
        item.status = newStatus;
        item.timestamp = new Date().toLocaleString();
        
        saveInstruments();
        updateStats();
        renderInventory();
        showMessage('Item updated successfully', true);
        
        document.body.removeChild(editForm);
    });
    
    // Handle overlay click to close
    editForm.addEventListener('click', (e) => {
        if (e.target === editForm) {
            document.body.removeChild(editForm);
        }
    });
}

function removeItem(itemId) {
    const item = instruments.find(i => i.id === itemId);
    if (!item) return;
    
    const confirmMessage = `Are you sure you want to remove this ${item.instrumentType}?`;
    if (confirm(confirmMessage)) {
        const index = instruments.findIndex(i => i.id === itemId);
        if (index !== -1) {
            instruments.splice(index, 1);
            saveInstruments();
            updateStats();
            renderInventory();
            showMessage('Item removed successfully', true);
        }
    }
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
        if (!isValidBarcode(serialNumber.trim())) {
            showMessage('Invalid barcode. Please enter a valid code.', false);
            return;
        }
        // Simulate a successful scan
        currentScannedCode = serialNumber.trim();
        
        // Show the form
        document.getElementById('serial-number').value = serialNumber.trim();
        document.getElementById('scan-form').classList.remove('hidden');
        
        // Auto-detect instrument type based on barcode
        const detectedType = detectInstrumentType(serialNumber.trim());
        document.getElementById('instrument-type').value = detectedType;
        
        // Try to auto-fill person name and serial number if instrument exists
        const existingInstrument = instruments.find(i => i.serialNumber === serialNumber.trim());
        if (existingInstrument) {
            document.getElementById('person-name').value = existingInstrument.personName || '';
            document.getElementById('serial-number-input').value = existingInstrument.physicalSerialNumber || '';
            document.getElementById('serial-number-group').style.display = 'none';
        } else {
            // Clear person name for new instrument
            document.getElementById('person-name').value = '';
            // Show serial number input for new instruments (but not uniforms)
            if (detectedType === 'Uniform') {
                document.getElementById('serial-number-group').style.display = 'none';
            } else {
                document.getElementById('serial-number-group').style.display = 'block';
            }
            document.getElementById('serial-number-input').value = '';
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
    const instrumentType = prompt('Enter item type:');
    if (instrumentType && instrumentType.trim()) {
        const serialNumber = prompt('Enter barcode/serial number:');
        if (serialNumber && serialNumber.trim()) {
            const personName = prompt('Enter student name (optional):');
            // Add as checked-in by default
            addOrUpdateInstrument(serialNumber.trim(), instrumentType.trim(), personName ? personName.trim() : '', 'checked-in');
            showMessage(`${instrumentType} added to inventory`, true);
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

