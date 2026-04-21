# 📘 Tutorial — Display Table Image, Number of Plays, Total Time and Scores in Home Assistant

## 🎯 Objective

Set up in Home Assistant a set of sensors and cards to display:

* the dynamic image of the current or last played table
* the table name
* the total number of plays
* the total play time
* raw scores

The final result is based on **3 separate blocks** to be placed in a Home Assistant view using **Sections layout**:

1. a block with the image and table name
2. a block with total time and number of plays
3. a block with scores

---

## 1️⃣ General principle

The system relies on multiple API calls:

* retrieving the active table status
* retrieving table details
* retrieving the wheel image
* retrieving ALX statistics
* retrieving scores

All of this is then used in Home Assistant via:

* `rest` sensors
* `template` sensors
* Lovelace cards

---

## 2️⃣ Retrieving table status

This first sensor determines whether a table is currently active and retrieves:

* `active`
* `gameId`
* `lastActiveId`

### Configuration

In `configuration.yaml`:

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

## 3️⃣ Determining the table ID to display

If a table is active, its `gameId` is used.
Otherwise, `lastActiveId` is used to display the last played table.

### Configuration

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

## 4️⃣ Retrieving table details

This sensor retrieves the table name using the computed ID.

### Configuration

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/frontend/tabledetails/{{ states('sensor.vpin_target_game_id') }}"
    scan_interval: 10
    sensor:
      - name: vpin_active_table_details
        value_template: >
          {% if states('sensor.vpin_target_game_id') | int(0) > 0 %}
            {{ value_json.gameDisplayName or value_json.gameName or ('#' ~ states('sensor.vpin_target_game_id')) }}
          {% else %}
            No table
          {% endif %}
        json_attributes:
          - gameDisplayName
          - gameName
          - gameFileName
          - manufacturer
          - gameYear
```

---

## 5️⃣ Building the wheel URL

A template sensor generates the wheel image URL dynamically.

### Configuration

```yaml
template:
  - sensor:
      - name: vpin_active_wheel_url
        state: >
          {% set gid = states('sensor.vpin_target_game_id') | int(0) %}
          {% if gid > 0 %}
            http://ADRESSE_IP:PORT/api/v1/media/{{ gid }}/Wheel/
          {% else %}
            /local/placeholder_vpin.png
          {% endif %}
```

---

## 6️⃣ Retrieving game statistics

The ALX endpoint provides:

* number of plays
* total play time
* table name
* number of highscores
* total scores

### Raw REST sensor

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/alx/{{ states('sensor.vpin_target_game_id') | int(0) }}"
    scan_interval: 30
    sensor:
      - name: vpin_alx_raw
        unique_id: vpin_alx_raw
        value_template: >
          {% if value_json.entries is defined and value_json.entries | count > 0 %}
            {{ value_json.entries[0].displayName }}
          {% else %}
            No data
          {% endif %}
        json_attributes:
          - startDate
          - entries
```

### Derived template sensors

```yaml
template:
  - sensor:
      - name: vpin_alx_total_time
        unique_id: vpin_alx_total_time
        icon: mdi:timer-outline
        state: >
          {% set entries = state_attr('sensor.vpin_alx_raw', 'entries') %}
          {% if entries and entries | count > 0 %}
            {% set secs = entries[0].timePlayedSecs | int(0) %}
            {% set h = secs // 3600 %}
            {% set m = (secs % 3600) // 60 %}
            {{ '%02d:%02d' | format(h, m) }}
          {% else %}
            00:00
          {% endif %}

      - name: vpin_alx_number_of_plays
        unique_id: vpin_alx_number_of_plays
        icon: mdi:play-circle-outline
        state: >
          {% set entries = state_attr('sensor.vpin_alx_raw', 'entries') %}
          {% if entries and entries | count > 0 %}
            {{ entries[0].numberOfPlays | int(0) }}
          {% else %}
            0
          {% endif %}
```

---

## 7️⃣ Retrieving raw scores

The scores endpoint provides a raw text block via `raw`.

### REST sensor

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/games/scores/{{ states('sensor.vpin_target_game_id') | int(0) }}"
    scan_interval: 30
    sensor:
      - name: vpin_scores_raw
        unique_id: vpin_scores_raw
        value_template: >
          {% if value_json.raw is defined %}
            {{ value_json.raw | replace('�', ' ') | truncate(255, True, '') }}
          {% else %}
            No score
          {% endif %}
        json_attributes:
          - raw
          - createdAt
          - scores
```

### Cleaned template sensor

```yaml
template:
  - sensor:
      - name: vpin_scores_raw_text
        unique_id: vpin_scores_raw_text
        icon: mdi:trophy-outline
        state: >
          {% set raw = state_attr('sensor.vpin_scores_raw', 'raw') %}
          {% if raw %}
            {{ raw | replace('�', ' ') | replace('\n', ' | ') | truncate(255, True, '') }}
          {% else %}
            No score
          {% endif %}
        attributes:
          raw_text: >
            {% set raw = state_attr('sensor.vpin_scores_raw', 'raw') %}
            {% if raw %}
              {{ raw | replace('�', ' ') }}
            {% else %}
              No score
            {% endif %}
          created_at: >
            {{ state_attr('sensor.vpin_scores_raw', 'createdAt') or '' }}
```

---

## 8️⃣ Restart

After adding or modifying these sensors:

1. check configuration
2. restart Home Assistant

---

## 9️⃣ Creating the 3 UI blocks

The final display uses **3 separate cards** in the same section.

---

## Block 1 — Image + table name

Displays:

* wheel image
* table name
* active/inactive status

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
    return d?.state && d.state !== 'unknown' ? d.state : 'Aucune table';
  ]]]
state_display: |
  [[[
    return entity?.state === 'active' ? 'En cours de jeu' : 'Inactive';
  ]]]
tap_action:
  action: none
hold_action:
  action: none
custom_fields:
  badge: |
    [[[
      return entity?.state === 'active' ? '🟢 Active' : '⚪ Inactive';
    ]]]
styles:
  card:
    - padding: 18px
    - border-radius: 20px
    - overflow: hidden
    - background: |
        [[[
          return entity?.state === 'active'
            ? 'linear-gradient(180deg, rgba(34,197,94,0.18), rgba(21,25,34,1))'
            : 'linear-gradient(180deg, rgba(120,120,120,0.10), rgba(21,25,34,1))';
        ]]]
  grid:
    - grid-template-areas: '"i" "n" "s"'
    - grid-template-columns: 1fr
    - grid-template-rows: auto min-content min-content
  img_cell:
    - justify-self: center
    - align-self: center
    - padding-bottom: 12px
  entity_picture:
    - width: 260px
    - height: 260px
    - object-fit: contain
    - border-radius: 16px
    - filter: |
        [[[
          return entity?.state === 'active'
            ? 'grayscale(0%) drop-shadow(0 10px 30px rgba(0,0,0,0.45))'
            : 'grayscale(100%) opacity(0.55)';
        ]]]
  name:
    - justify-self: center
    - text-align: center
    - font-size: 20px
    - font-weight: 700
    - color: |
        [[[
          return entity?.state === 'active' ? '#ffffff' : '#cbd5e1';
        ]]]
  state:
    - justify-self: center
    - text-align: center
    - font-size: 13px
    - color: |
        [[[
          return entity?.state === 'active' ? '#22c55e' : '#94a3b8';
        ]]]
  custom_fields:
    badge:
      - position: absolute
      - top: 12px
      - right: 12px
      - background: rgba(0,0,0,0.35)
      - padding: 6px 10px
      - border-radius: 999px
      - font-size: 12px
      - font-weight: 600
```

---

## Block 2 — Total time + number of plays

```yaml
type: grid
columns: 2
square: false
cards:
  - type: custom:button-card
    entity: sensor.vpin_alx_total_time
    name: Temps total
    show_state: true
    show_icon: true
    icon: mdi:timer-outline
    styles:
      card:
        - padding: 16px
        - border-radius: 18px
      icon:
        - color: '#60a5fa'
      name:
        - font-size: 14px
        - font-weight: 600
      state:
        - font-size: 22px
        - font-weight: 700

  - type: custom:button-card
    entity: sensor.vpin_alx_number_of_plays
    name: Nombre de parties
    show_state: true
    show_icon: true
    icon: mdi:play-circle-outline
    styles:
      card:
        - padding: 16px
        - border-radius: 18px
      icon:
        - color: '#22c55e'
      name:
        - font-size: 14px
        - font-weight: 600
      state:
        - font-size: 22px
        - font-weight: 700
```

---

## Block 3 — Raw scores

````yaml
type: markdown
title: Scores
content: |
  ```text
  {{ state_attr('sensor.vpin_scores_raw_text', 'raw_text') or 'Aucun score' }}
````

---

## 🔟 Result

Once configured, the Home Assistant view displays:

* the current or last played table
* its wheel
* total play time
* number of plays
* raw scores

<img width="829" height="449" alt="image" src="https://github.com/user-attachments/assets/6ff44891-240d-4221-9ce3-c436edda08ed" />

<img width="830" height="692" alt="image" src="https://github.com/user-attachments/assets/60b90548-a797-4197-891a-b3a1ff4b2fff" />

---

## ⚠️ Important notes

* Replace `ADRESSE_IP` and `PORT` with your setup
* Block 1 requires `custom:button-card`
* If no table is active, the last played one is shown
* Scores are displayed as raw text cleaned from `�`
