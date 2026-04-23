# 📘 Tutorial — Execute a Hook and Create an ON/OFF Switch (Night Mode)

## 🎯 Objective

Set up in Home Assistant:

- an API call to execute a hook
- an **ON/OFF switch** to control Night Mode:
  - ON → `5-NightModeOn.bat`
  - OFF → `4-NightModeOff.bat`
- The files `5-NightModeOn.bat` and `4-NightModeOff.bat` must be placed on the server in the VPinStudio hooks folder
- Example files are available here: https://github.com/blappsx/VpinStudio-UI-locale/tree/main/hooks

---

## 1️⃣ Creating the REST Command

The API allows executing a hook via a POST request to:

```text
/api/v1/hooks
```

### Configuration

In the `configuration.yaml` file:

```yaml
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
```

### Explanation

- `hook_name`: name of the `.bat` file to execute  
- `gameId`: optional here, set to `0`  
- `commands`: left empty  

---

## 2️⃣ Creating a State Storage

The API does not return the Night Mode state.  
It is therefore necessary to store the state locally in Home Assistant.

### Configuration

```yaml
input_boolean:
  vpin_night_mode_state:
    name: Night Mode
```

---

## 3️⃣ Creating the ON/OFF Switch

A template switch is used to control the hook based on its state.

### Configuration

```yaml
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
```

---

## 4️⃣ Restart

After modifying `configuration.yaml`:

1. Check the configuration  
2. Restart Home Assistant  

---

## 5️⃣ Adding to the Interface

### Simple card

```yaml
type: tile
entity: switch.night_mode_vpin
name: Night Mode
```

### Alternative

```yaml
type: entities
entities:
  - entity: switch.night_mode_vpin
```

---

## 6️⃣ Behavior

| User action | Result |
|------------|--------|
| Switch ON | Executes `5-NightModeOn.bat` |
| Switch OFF | Executes `4-NightModeOff.bat` |
| Switch state | Based on `input_boolean` |

---

## 7️⃣ Voice Usage

The switch can be used with a voice assistant:

- "Turn on Night Mode"
- "Turn off Night Mode"

---

## ⚠️ Important Notes

- Hook names must exactly match the files on the server  
- The state is simulated in Home Assistant  
- A restart is required after adding the `rest_command`  

---

## ✅ Result

Full control of Night Mode is available:

- from the Home Assistant interface  
- via automations  
- via voice commands  

---

## 🔁 Extension

This model can be reused for other hooks by simply modifying:

- the hook name in `hook_name`
- the switch name
