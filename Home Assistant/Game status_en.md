# 📘 Tutorial — Display Table Image, Number of Plays, Total Time and Scores in Home Assistant

## 🎯 Objective

Set up in Home Assistant a set of sensors and cards to display:

- the dynamic image of the current or last played table  
- the table name  
- the total number of plays  
- the total play time  
- raw scores  

The final result is based on **3 separate blocks** to be placed in a Home Assistant view using **Sections layout**:

1. a block with the image and table name  
2. a block with total time and number of plays  
3. a block with scores  

---

## 1️⃣ General principle

The system relies on multiple API calls:

- retrieving the active table status  
- retrieving table details  
- retrieving the wheel image  
- retrieving ALX statistics  
- retrieving scores  

---

## 2️⃣ Game status

```yaml
rest:
  - resource: http://ADRESSE_IP:PORT/api/v1/gamestatus
    scan_interval: 10
    sensor:
      - name: vpin_gamestatus
        value_template: >
          {% if value_json.active %}
            active
          {% else %}
            inactive
          {% endif %}
        json_attributes:
          - active
          - gameId
          - lastActiveId
```

---

## 3️⃣ Target game ID

```yaml
template:
  - sensor:
      - name: vpin_target_game_id
        state: >
          {% set active = state_attr('sensor.vpin_gamestatus', 'active') %}
          {% set game_id = state_attr('sensor.vpin_gamestatus', 'gameId') | int(0) %}
          {% set last_id = state_attr('sensor.vpin_gamestatus', 'lastActiveId') | int(0) %}
          {% if active and game_id > 0 %}
            {{ game_id }}
          {% elif last_id > 0 %}
            {{ last_id }}
          {% else %}
            0
          {% endif %}
```

---

## 4️⃣ Table details

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/frontend/tabledetails/{{ states('sensor.vpin_target_game_id') }}"
    scan_interval: 10
    sensor:
      - name: vpin_active_table_details
        value_template: >
          {% if states('sensor.vpin_target_game_id') | int(0) > 0 %}
            {{ value_json.gameDisplayName }}
          {% else %}
            No table
          {% endif %}
```

---

## 5️⃣ Wheel URL

```yaml
template:
  - sensor:
      - name: vpin_active_wheel_url
        state: >
          http://ADRESSE_IP:PORT/api/v1/media/{{ states('sensor.vpin_target_game_id') }}/Wheel/
```

---

## 6️⃣ Statistics

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/alx/{{ states('sensor.vpin_target_game_id') }}"
    scan_interval: 30
    sensor:
      - name: vpin_alx_raw
        json_attributes:
          - entries
```

```yaml
template:
  - sensor:
      - name: vpin_alx_total_time
        state: >
          {% set e = state_attr('sensor.vpin_alx_raw', 'entries') %}
          {% if e %}
            {% set s = e[0].timePlayedSecs %}
            {{ (s // 3600) ~ ':' ~ ((s % 3600) // 60) }}
          {% endif %}

      - name: vpin_alx_number_of_plays
        state: >
          {{ state_attr('sensor.vpin_alx_raw', 'entries')[0].numberOfPlays if state_attr('sensor.vpin_alx_raw','entries') else 0 }}
```

---

## 7️⃣ Scores

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/games/scores/{{ states('sensor.vpin_target_game_id') }}"
    scan_interval: 30
    sensor:
      - name: vpin_scores_raw
        json_attributes:
          - raw
```

---

## 8️⃣ UI — Block 1 (Image + Name)

```yaml
type: custom:button-card
entity: sensor.vpin_gamestatus
show_icon: false
show_entity_picture: true
show_name: true
show_state: true
entity_picture: |
  [[[
    return states['sensor.vpin_active_wheel_url']?.state || '';
  ]]]
name: |
  [[[
    const d = states['sensor.vpin_active_table_details'];
    return d?.state && d.state !== 'unknown' ? d.state : 'No table';
  ]]]
state_display: |
  [[[
    return entity?.state === 'active' ? 'Playing' : 'Inactive';
  ]]]
```

---

## 9️⃣ UI — Block 2 (Stats)

```yaml
type: grid
columns: 2
cards:
  - type: entity
    entity: sensor.vpin_alx_total_time
  - type: entity
    entity: sensor.vpin_alx_number_of_plays
```

---

## 🔟 UI — Block 3 (Scores)

```yaml
type: markdown
content: |
  {{ state_attr('sensor.vpin_scores_raw','raw') }}
```

---

## ✅ Result

The dashboard displays:

- current or last played table  
- wheel image  
- total play time  
- number of plays  
- raw scores  
