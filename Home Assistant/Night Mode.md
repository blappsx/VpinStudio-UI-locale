# 📘 Tutoriel — Exécuter un hook et créer un switch ON/OFF (Night Mode)

## 🎯 Objectif

Mettre en place dans Home Assistant :

- un appel API permettant d’exécuter un hook
- un **interrupteur ON/OFF** permettant de piloter le Night Mode :
  - ON → `5-NightModeOn.bat`
  - OFF → `4-NightModeOff.bat`

---

# 1️⃣ Création de la commande REST

L’API permet d’exécuter un hook via une requête POST sur :
