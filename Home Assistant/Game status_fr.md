# 📘 Tutoriel — Afficher l’image, le nombre de parties, le temps total et les scores dans Home Assistant

## 🎯 Objectif

Mettre en place dans Home Assistant :

- l’image dynamique de la table
- le nom de la table
- le nombre total de parties
- le temps total joué
- les scores bruts

---

## 1️⃣ Récupération du statut

```yaml
rest:
  - resource: http://ADRESSE_IP:PORT/api/v1/gamestatus
    scan_interval: 10
    sensor:
      - name: vpin_gamestatus
        value_template: >
          {% if value_json.active %}active{% else %}inactive{% endif %}
        json_attributes:
          - active
          - gameId
          - lastActiveId
```

---

## 2️⃣ ID de la table cible

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

## 3️⃣ Détails de la table

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/frontend/tabledetails/{{ states('sensor.vpin_target_game_id') }}"
    sensor:
      - name: vpin_active_table_details
        value_template: "{{ value_json.gameDisplayName }}"
```

---

## 4️⃣ URL de la wheel

```yaml
template:
  - sensor:
      - name: vpin_active_wheel_url
        state: >
          http://ADRESSE_IP:PORT/api/v1/media/{{ states('sensor.vpin_target_game_id') }}/Wheel/
```

---

## 5️⃣ Statistiques

```yaml
rest:
  - resource_template: "http://ADRESSE_IP:PORT/api/v1/alx/{{ states('sensor.vpin_target_game_id') }}"
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

## 7️⃣ Interface

### Bloc image

```yaml
type: picture
image: "{{ states('sensor.vpin_active_wheel_url') }}"
```

### Bloc stats

```yaml
type: entities
entities:
  - sensor.vpin_alx_total_time
  - sensor.vpin_alx_number_of_plays
```

### Bloc scores

```yaml
type: markdown
content: |
  {{ state_attr('sensor.vpin_scores_raw','raw') }}
```
