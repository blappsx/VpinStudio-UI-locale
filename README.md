# 🕹️ VPinStudio Local UI

A modern and responsive **web interface** designed to interact with the [VPin Studio](https://github.com/syd711/vpin-studio) API.  
It provides a clean and efficient way to **browse, launch, and manage Visual Pinball tables** directly from your browser.

You can open this html page without any webserver. Either on your phone or your computer. Simply unzip file and open index.html

---

## 🚀 Features
- Retrieve and display all available **emulators** and **tables** from the VPinStudio API  
- Launch games directly through **Emulator (PUT)** or **Frontend (GET)** modes  
- Display detailed **technical sheets** for each table (name, version, manufacturer, ROM, authors, etc.)  
- Load and display **Wheel images** as background and media thumbnails  
- Real-time **search, sorting, and counters**  
- **Hook integration** (execute `.bat` files via POST)  
- **System controls**: Restart, Mute, and Unmute  
- **Dynamic Restart button** that automatically shows the detected frontend name  
- **Avatar and system info** (cab image + name + version) displayed in the header  
- **Language selector (FR / EN)** – full bilingual interface  
- Fully **responsive design**, optimized for both desktop and mobile  
- Dark theme focused on readability and clarity  

<img width="703" height="147" alt="image" src="https://github.com/user-attachments/assets/a4570e57-fa86-4c58-8836-1a61e8f54ef3" />

---

## 🧩 Tech stack
- **HTML5** + **CSS3** (custom dark theme)  
- **Vanilla JavaScript (ES6)** — modular architecture (`/js/` folder)  
- **REST API** integration with [VPin Studio](https://github.com/syd711/vpin-studio)  

### JS modules
| Module | Role |
|--------|------|
| `main.js` | Entry point, initialization, and event coordination |
| `api.js` | Handles REST API requests |
| `table.js` | Table rendering, sorting, filtering |
| `modal.js` | Technical sheet modal logic |
| `hooks.js` | Dynamic hook buttons and mute/unmute actions |
| `header.js` | Avatar and system information loading |
| `frontend.js` | Dynamic Restart button label |
| `i18n.js` | Translation system (FR/EN) |
| `state.js`, `utils.js`, `config.js` | Core helpers and app state management |

---

## ⚙️ Usage
1. Copy all project files (`index.html`, `styles.css`, `/js/`) into any local web directory.  
2. Edit the default API base address in the input field (e.g. `http://192.168.0.5:8089/api/v1`).  
3. Click **Refresh** to load emulators and tables.  
4. (optional) To add custom **Hooks**, place your `.bat` files in the folder:  `VPin-Studio\resources\hooks` on the VPin-Studio cab server.  
5. Interact directly with your VPin Studio setup!  

---

## 🌐 Language selector
Use the dropdown at the top right of the interface to switch between **English** 🇬🇧 and **French** 🇫🇷.  
Your language preference is saved locally and automatically restored on next load.

---

## 👨‍💻 Credits
Developed by **Cédric Blap / ChatGPT**  
Powered by the **[VPin Studio](https://github.com/syd711/vpin-studio)** (open-source project).  
Special thanks to **Syd711** and **leprinco** for their work on the backend, help and ideas.

---

## 🖼️ Screenshots
<img width="706" height="623" alt="image" src="https://github.com/user-attachments/assets/9d760d42-6ceb-4816-a065-e921e027f70d" />
<img width="704" height="1047" alt="image" src="https://github.com/user-attachments/assets/cdcd28a1-b6c0-423a-8a92-63c937945392" />
<img width="714" height="924" alt="image" src="https://github.com/user-attachments/assets/addd7ea0-4406-4e65-bb3d-96ab03e69d4a" />

---

## 📄 License
MIT License  
Free to use and adapt for personal or internal use.  
Based on the open-source principles of the VPin Studio ecosystem.


