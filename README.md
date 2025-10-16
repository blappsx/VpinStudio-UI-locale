# 🕹️ VPinStudio Local UI

A modern and responsive **web interface** designed to interact with the [VPin Studio](https://github.com/syd711/vpin-studio) API.  
It provides a clean and efficient way to **browse, launch, and manage Visual Pinball tables** directly from your browser.

---

## 🚀 Features
- Retrieve and display all available emulators and tables from the VPinStudio API  
- Launch games directly through **Emulator (PUT)** or **Frontend (GET)** modes  
- Display detailed **technical sheets** for each table (name, version, manufacturer, ROM, authors, etc.)  
- Load and display **Wheel images** as background and media thumbnails  
- Real-time **search, sorting, and counters**  
- **Hook integration** (execute `.bat` files via POST)  
- System control buttons: **Restart**, **Mute**, and **Unmute**  
- Fully **responsive design**, optimized for both desktop and mobile  
- Dark theme with a focus on usability and clarity  

---

## 🧩 Tech stack
- **HTML5** + **CSS3** (custom dark theme)  
- **Vanilla JavaScript (ES6)** — no external dependencies  
- **REST API** integration with VPin Studio  

---

## ⚙️ Usage
1. Copy the three files (`index.html`, `styles.css`, `app.js`) into any web directory.  
2. Edit the default API base address in the input field (e.g. `http://192.168.0.5:8089/api/v1`).  
3. Click **Refresh** to load emulators and tables.  
4. Interact directly with your VPin Studio setup!

---

## 👨‍💻 Credits
Developed by **Cédric Blap / ChatGPT**  
Powered by the **[VPin Studio backend](https://github.com/syd711/vpin-studio)** (open-source project).  

---

## 📄 License
Free to use and adapt for personal or internal use.  
Based on the open-source principles of the VPin Studio ecosystem.
