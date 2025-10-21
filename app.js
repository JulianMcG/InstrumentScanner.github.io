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

// ========================================
// Tab Navigation
// ========================================
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
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
            
            // Activate target
            document.getElementById(targetPage).classList.add('active');
            btn.classList.add('active');
            
            // Handle camera based on page
            if (targetPage === 'scan-page') {
                // Restart camera when returning to scan page
                if (!isScanning) {
                    setTimeout(() => startScanning(), 100);
                }
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
    if (isScanning || html5QrCode) return;
    
    const readerElement = document.getElementById('reader');
    
    // Make reader visible
    readerElement.style.display = 'block';
    
    // Initialize scanner
    html5QrCode = new Html5Qrcode("reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
        ]
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
    }).catch(err => {
        console.error("Unable to start scanner", err);
        // Show a non-intrusive error
        showMessage("Camera access needed. Please allow camera permissions in Safari settings.", false);
        isScanning = false;
    });
}

function onScanSuccess(decodedText) {
    // Vibrate on successful scan (if supported)
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    // Stop scanning temporarily
    pauseScanning();
    
    // Store the scanned code
    currentScannedCode = decodedText;
    
    // Show the form
    document.getElementById('serial-number').value = decodedText;
    document.getElementById('scan-form').classList.remove('hidden');
    
    // Try to auto-fill if instrument exists
    const existingInstrument = instruments.find(i => i.serialNumber === decodedText);
    if (existingInstrument) {
        document.getElementById('instrument-type').value = existingInstrument.instrumentType;
        document.getElementById('person-name').value = existingInstrument.personName;
    } else {
        // Clear form for new instrument
        document.getElementById('instrument-type').value = '';
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
    // Ignore scan errors (they happen constantly while scanning)
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
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode = null;
            isScanning = false;
        }).catch(err => {
            console.error("Error stopping scanner", err);
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
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            const filter = btn.dataset.filter;
            renderInventory(filter);
        });
    });
}

function renderInventory(filter = 'all') {
    const inventoryList = document.getElementById('inventory-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filter instruments
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
// Service Worker Registration
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
