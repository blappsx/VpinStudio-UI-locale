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
  
<img width="703" height="147" alt="image" src="https://github.com/user-attachments/assets/a4570e57-fa86-4c58-8836-1a61e8f54ef3" />


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
4. To add custom **Hooks**, place your `.bat` files in the folder: `VPin-Studio\resources\hooks` on the VPin-Studio cab server.
5. Interact directly with your VPin Studio setup!

---

## 👨‍💻 Credits
Developed by **Cédric Blap / ChatGPT**  
Powered by the **[VPin Studio backend](https://github.com/syd711/vpin-studio)** (open-source project).  

<img width="706" height="623" alt="image" src="https://github.com/user-attachments/assets/9d760d42-6ceb-4816-a065-e921e027f70d" />
<img width="704" height="1047" alt="image" src="https://github.com/user-attachments/assets/cdcd28a1-b6c0-423a-8a92-63c937945392" />
<img width="714" height="924" alt="image" src="https://github.com/user-attachments/assets/addd7ea0-4406-4e65-bb3d-96ab03e69d4a" />

