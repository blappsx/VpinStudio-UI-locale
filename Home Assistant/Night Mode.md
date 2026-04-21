📘 Tutoriel — Exécuter un hook et créer un switch ON/OFF (Night Mode)
🎯 Objectif

Mettre en place dans Home Assistant :

un appel API permettant d’exécuter un hook
un interrupteur ON/OFF permettant de piloter le Night Mode :
ON → 5-NightModeOn.bat
OFF → 4-NightModeOff.bat
1️⃣ Création de la commande REST

L’API permet d’exécuter un hook via une requête POST sur :

/api/v1/hooks
Configuration

Dans le fichier configuration.yaml :

rest_command:
  vpin_run_hook:
    url: "http://ADRESSE_IP:PORT/api/v1/hooks"
    method: POST
    content_type: "application/json"
    payload: >
      {
        "name": "{{ hook_name }}",
        "commands": [],
        "gameId": 0
      }
🔎 Explication
hook_name : nom du fichier .bat à exécuter
gameId : facultatif ici, fixé à 0
commands : laissé vide (usage avancé)
2️⃣ Création d’un stockage d’état

L’API ne retourne pas l’état du Night Mode.
Il est donc nécessaire de conserver un état local dans Home Assistant.

Configuration
input_boolean:
  vpin_night_mode_state:
    name: Night Mode
3️⃣ Création du switch ON/OFF

Un switch template permet de piloter le hook en fonction de l’état.

Configuration
template:
  - switch:
      - name: Night Mode VPIN
        unique_id: vpin_night_mode
        icon: mdi:weather-night

        state: "{{ is_state('input_boolean.vpin_night_mode_state', 'on') }}"

        turn_on:
          - service: rest_command.vpin_run_hook
            data:
              hook_name: "5-NightModeOn.bat"
          - service: input_boolean.turn_on
            target:
              entity_id: input_boolean.vpin_night_mode_state

        turn_off:
          - service: rest_command.vpin_run_hook
            data:
              hook_name: "4-NightModeOff.bat"
          - service: input_boolean.turn_off
            target:
              entity_id: input_boolean.vpin_night_mode_state
4️⃣ Redémarrage

Après modification de configuration.yaml :

Vérifier la configuration
Redémarrer Home Assistant
5️⃣ Ajout dans l’interface
Carte simple
type: tile
entity: switch.night_mode_vpin
name: Night Mode
Alternative
type: entities
entities:
  - entity: switch.night_mode_vpin
6️⃣ Fonctionnement
Action utilisateur	Résultat
Activation du switch	Exécution de 5-NightModeOn.bat
Désactivation du switch	Exécution de 4-NightModeOff.bat
État du switch	Basé sur input_boolean
7️⃣ Utilisation vocale

Le switch peut être utilisé avec un assistant vocal :

« Activer Night Mode »
« Désactiver Night Mode »
⚠️ Remarques importantes
Le nom des hooks doit correspondre exactement aux fichiers présents côté serveur
L’état est simulé dans Home Assistant (pas de retour API)
Un redémarrage est nécessaire après ajout du rest_command
✅ Résultat

Un contrôle complet du Night Mode est disponible :

depuis l’interface Home Assistant
via automatisations
via commandes vocales
🔁 Extension

Ce modèle peut être réutilisé pour d’autres hooks en modifiant simplement :

le nom du hook dans hook_name
le nom du switch
