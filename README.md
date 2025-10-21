# 📹 Instrument Scanner App

A beautiful, simple mobile web app for band directors to track instrument check-ins and check-outs using barcode scanning.

## 🎯 Features

- **Barcode Scanning**: Use your iPhone camera to scan instrument barcodes
- **Check In/Out**: Easily track who has which instrument
- **Inventory Management**: View all instruments organized by type
- **Offline Support**: Works without internet connection
- **Full-Screen Mode**: Add to iPhone home screen for app-like experience

## 📱 How to Install on iPhone

1. **Host the Files**: You need to put these files on a web server. Here are some easy options:
   
   ### Option A: GitHub Pages (Free & Easy)
   - Create a GitHub account if you don't have one
   - Create a new repository
   - Upload all files to the repository
   - Go to Settings → Pages
   - Enable GitHub Pages
   - Your app will be at: `https://yourusername.github.io/repository-name`
   
   ### Option B: Local Testing (For Development)
   - Open Terminal on your Mac
   - Navigate to this folder: `cd "/Users/julianmcguire/Desktop/Instrument Scanner"`
   - Run: `python3 -m http.server 8000`
   - On your iPhone (connected to same WiFi), open Safari and go to: `http://YOUR-MAC-IP:8000`
   - To find your Mac's IP: System Preferences → Network

2. **Add to Home Screen** (on iPhone):
   - Open the app URL in Safari
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"
   - The app icon will appear on your home screen!

3. **Grant Camera Permission**:
   - When you first try to scan, Safari will ask for camera permission
   - Tap "Allow" to enable barcode scanning

## 🏷️ Barcode System - Simple Plan

### What Barcodes to Use

Use **Code128** or **Code39** barcodes - these are standard and work great!

### Barcode Format

Keep it simple! Use this format:
```
INSTRUMENT-NUMBER
```

Examples:
- `TRUMPET-001`
- `TRUMPET-002`
- `CLARINET-001`
- `FLUTE-001`
- `TROMBONE-001`
- `DRUM-001`

### How to Create Barcodes

#### Option 1: Free Online Generator (Easiest!)
1. Go to: **https://barcode.tec-it.com/en**
2. Select "Code 128" as barcode type
3. Enter your code (e.g., `TRUMPET-001`)
4. Click "Generate Barcode"
5. Download as PNG or PDF
6. Print it out!

#### Option 2: Use a Barcode App
- Download "Barcode Generator" from App Store (free)
- Create barcodes on your phone
- AirDrop them to your Mac and print

### How to Label Instruments

1. **Print the barcodes** on adhesive labels (like Avery labels)
2. **Stick them on instruments** in a visible spot:
   - Trumpets/Trombones: On the bell or case
   - Clarinets/Flutes: On the case
   - Drums/Percussion: On the shell or case

3. **Pro Tip**: Print the barcode AND write the code by hand underneath as a backup!

### Sample Barcode List

Here's a starter list you can create:

| Instrument | Barcode Code | Quantity |
|------------|--------------|----------|
| Trumpet    | TRUMPET-001 to TRUMPET-020 | 20 |
| Trombone   | TROMBONE-001 to TROMBONE-015 | 15 |
| Clarinet   | CLARINET-001 to CLARINET-025 | 25 |
| Flute      | FLUTE-001 to FLUTE-020 | 20 |
| Saxophone  | SAX-001 to SAX-010 | 10 |
| French Horn| HORN-001 to HORN-008 | 8 |
| Tuba       | TUBA-001 to TUBA-005 | 5 |
| Drum       | DRUM-001 to DRUM-030 | 30 |

## 📖 How to Use the App

### Checking Out an Instrument

1. Tap the **Scan** tab at the bottom
2. Tap **"Start Camera"**
3. Point camera at the barcode
4. Once scanned, the serial number appears automatically
5. Select the **Instrument Type** from dropdown
6. Enter the **Student's Name**
7. Tap **"✓ Check Out"**
8. Done! ✅

### Checking In an Instrument

1. Follow steps 1-6 above
2. Tap **"↩ Check In"** instead
3. The instrument is now marked as available!

### Viewing Inventory

1. Tap the **Inventory** tab at the bottom
2. See all instruments organized by type
3. Use filter buttons to view:
   - **All**: Every instrument
   - **Checked Out**: Currently with students
   - **Available**: Ready to be checked out
4. Each card shows:
   - Instrument type
   - Serial number
   - Student name
   - Status (Checked Out or Available)
   - Timestamp of last action

## 🔧 App Files Explained

- `index.html` - The main page structure
- `styles.css` - Makes everything look pretty
- `app.js` - The brain of the app (handles scanning, data storage)
- `manifest.json` - Makes it installable as a home screen app
- `service-worker.js` - Allows offline functionality
- `icon-192.png` & `icon-512.png` - App icons (see below)

## 🎨 Creating App Icons

The app needs two icon files. Here's how to create them:

### Easy Method: Use an Icon Generator
1. Go to: **https://favicon.io/favicon-generator/**
2. Settings:
   - Text: 📹 (camera emoji)
   - Background: Gradient (Purple to Blue)
   - Shape: Rounded
3. Generate and download
4. Rename files to `icon-192.png` and `icon-512.png`
5. Place in the app folder

### Or Use These Temporary Placeholders:
For now, you can skip the icons - the app will still work! The icons only affect how it looks on your home screen.

## 💾 Data Storage

- All data is stored **locally on the iPhone** using browser storage
- Data persists even after closing the app
- **Important**: If you clear Safari data, you'll lose your inventory
- **Backup tip**: Periodically export your data (see Advanced section below)

## 🆘 Troubleshooting

### Camera Won't Start
- Make sure you granted camera permission
- Try closing and reopening the app
- Make sure Safari has camera access (Settings → Safari → Camera)

### Barcode Won't Scan
- Make sure there's good lighting
- Hold the phone steady
- Try getting closer/further from the barcode
- Make sure the barcode is clear and not wrinkled

### App Won't Install to Home Screen
- Make sure you're using **Safari** (not Chrome or other browsers)
- The website must be served over HTTPS (or localhost for testing)

### Data Disappeared
- Check if you accidentally cleared Safari data
- Unfortunately, local data can't be recovered if cleared
- This is why regular backups are recommended

## 🚀 Advanced Features (Future Ideas)

Want to enhance the app? Here are some ideas:

1. **Export Data**: Add a button to export inventory as CSV
2. **Search Function**: Add search bar to find specific instruments
3. **Edit Records**: Add ability to edit past check-ins/outs
4. **Email Reports**: Send daily/weekly reports
5. **Cloud Backup**: Sync data to cloud storage
6. **Multiple Users**: Login system for multiple teachers

## 📞 Need Help?

This is a simple, self-contained web app with no database or backend. Everything runs in the browser!

### Common Questions:

**Q: Can multiple people use this at once?**
A: Each device has its own data. For multiple users, you'd need to add cloud sync (advanced).

**Q: What if I lose my phone?**
A: The data is only on that phone. Consider exporting backups periodically.

**Q: Can I use this on Android?**
A: Yes! It works on any modern smartphone browser. The install process is similar.

**Q: Does this cost money?**
A: Nope! If you use GitHub Pages, it's completely free.

## 🎓 Learning Resources

Want to understand how this works?

- **HTML**: Structure of web pages - [Mozilla MDN HTML Guide](https://developer.mozilla.org/en-US/docs/Web/HTML)
- **CSS**: Styling and design - [CSS Tricks](https://css-tricks.com/)
- **JavaScript**: The programming logic - [JavaScript.info](https://javascript.info/)
- **PWAs**: Progressive Web Apps - [web.dev PWA Guide](https://web.dev/progressive-web-apps/)

## 📄 License

Feel free to use, modify, and share this app however you like!

---

**Made with ❤️ for band directors who deserve better tools!**

🎺 Happy scanning! 🎷

