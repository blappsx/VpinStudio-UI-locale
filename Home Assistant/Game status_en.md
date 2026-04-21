# 📘 Tutorial — Display Image, Plays Count, Total Time and Scores in Home Assistant

## 🎯 Objective

Set up in Home Assistant:

- dynamic table image
- table name
- total number of plays
- total play time
- raw scores

---

## 1️⃣ Game status

```yaml
rest:
  - resource: http://ADRESSE_IP:PORT/api/v1/gamestatus
    sensor:
      - name: vpin_gamestatus
        value_template: >
          {% if value_json.active %}active{% else %}inactive{% endif %}
```

---

## 2️⃣ Target game ID

```yaml
template:
  - sensor:
      - name: vpin_target_game_id
        state: >
          {% if state_attr('sensor.vpin_gamestatus','active') %}
            {{ state_attr('sensor.vpin_gamestatus','gameId') }}
          {% else %}
            {{ state_attr('sensor.vpin_gamestatus','lastActiveId') }}
          {% endif %}
```

---

## 3️⃣ Table details

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/frontend/tabledetails/{{ states('sensor.vpin_target_game_id') }}"
    sensor:
      - name: vpin_active_table_details
        value_template: "{{ value_json.gameDisplayName }}"
```

---

## 4️⃣ Wheel image

```yaml
template:
  - sensor:
      - name: vpin_active_wheel_url
        state: >
          http://ADRESSE_IP:PORT/api/v1/media/{{ states('sensor.vpin_target_game_id') }}/Wheel/
```

---

## 5️⃣ Stats

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/alx/{{ states('sensor.vpin_target_game_id') }}"
    sensor:
      - name: vpin_alx_raw
        json_attributes:
          - entries
```

---

## 6️⃣ Scores

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/games/scores/{{ states('sensor.vpin_target_game_id') }}"
    sensor:
      - name: vpin_scores_raw
        json_attributes:
          - raw
```

---

## 7️⃣ UI

```yaml
type: picture
image: "{{ states('sensor.vpin_active_wheel_url') }}"
```
