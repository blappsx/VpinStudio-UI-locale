Voici une **version française** du tutoriel, rédigée pour relecture rapide.

---

# 📘 Tutoriel — Afficher l’image de la table, le nombre de parties, le temps total et les scores dans Home Assistant

## 🎯 Objectif

Mettre en place dans Home Assistant un ensemble de capteurs et de cartes permettant d’afficher :

* l’image dynamique de la table en cours ou de la dernière table jouée
* le nom de la table
* le nombre total de parties
* le temps total joué
* les scores bruts

Le résultat final repose sur **3 blocs distincts** à placer dans une vue Home Assistant en mode **Sections** :

1. un bloc avec l’image et le nom de la table
2. un bloc avec le temps total et le nombre de parties
3. un bloc avec les scores

---

## 1️⃣ Principe général

Le fonctionnement repose sur plusieurs appels API :

* récupération du statut de la table active
* récupération des détails de la table
* récupération de la wheel
* récupération des statistiques ALX
* récupération des scores

L’ensemble est ensuite exploité dans Home Assistant avec :

* des capteurs `rest`
* des capteurs `template`
* des cartes Lovelace

---

## 2️⃣ Récupération du statut de la table

Ce premier capteur permet de savoir si une table est actuellement active, et de récupérer :

* `active`
* `gameId`
* `lastActiveId`

### Configuration

Dans `configuration.yaml` :

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

## 3️⃣ Détermination de l’ID de la table à afficher

Si une table est active, son `gameId` est utilisé.
Sinon, c’est `lastActiveId` qui est retenu afin d’afficher la dernière table jouée.

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

## 4️⃣ Récupération des détails de la table

Ce capteur permet d’obtenir le nom de la table à partir de l’ID calculé précédemment.

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
            Aucune table
          {% endif %}
        json_attributes:
          - gameDisplayName
          - gameName
          - gameFileName
          - manufacturer
          - gameYear
```

---

## 5️⃣ Construction de l’URL de la wheel

Un capteur template permet de générer automatiquement l’URL de la wheel à afficher dans l’interface.

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

## 6️⃣ Récupération des statistiques de jeu

L’endpoint ALX permet de récupérer notamment :

* le nombre de parties
* le temps total joué
* le nom de la table
* le nombre de highscores
* le nombre total de scores

### Capteur REST brut

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
            Aucune donnée
          {% endif %}
        json_attributes:
          - startDate
          - entries
```

### Capteurs template dérivés

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

## 7️⃣ Récupération des scores bruts

L’endpoint des scores permet de récupérer un bloc de texte brut via la clé `raw`.

### Capteur REST

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
            Aucun score
          {% endif %}
        json_attributes:
          - raw
          - createdAt
          - scores
```

### Capteur template nettoyé

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
            Aucun score
          {% endif %}
        attributes:
          raw_text: >
            {% set raw = state_attr('sensor.vpin_scores_raw', 'raw') %}
            {% if raw %}
              {{ raw | replace('�', ' ') }}
            {% else %}
              Aucun score
            {% endif %}
          created_at: >
            {{ state_attr('sensor.vpin_scores_raw', 'createdAt') or '' }}
```

---

## 8️⃣ Redémarrage

Après ajout ou modification de ces capteurs dans `configuration.yaml` :

1. vérifier la configuration
2. redémarrer Home Assistant

---

## 9️⃣ Création des 3 blocs dans l’interface

L’affichage final s’effectue avec **3 cartes distinctes**, à placer dans la même section.

---

## Bloc 1 — Image dynamique + nom de la table

Cette carte affiche :

* la wheel
* le nom de la table
* le statut actif / inactif

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

## Bloc 2 — Temps total + nombre de parties

Cette carte affiche les deux statistiques principales dans un bloc simple à deux colonnes.

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

## Bloc 3 — Scores bruts

Cette carte affiche le bloc `raw` renvoyé par l’API.

````yaml
type: markdown
title: Scores
content: |
  ```text
  {{ state_attr('sensor.vpin_scores_raw_text', 'raw_text') or 'Aucun score' }}
````
---

## 🔟 Résultat

Une fois la configuration en place, la vue Home Assistant affiche :

- la table active ou la dernière table jouée
- sa wheel
- son temps total de jeu
- son nombre de parties
- ses scores bruts

<img width="829" height="449" alt="image" src="https://github.com/user-attachments/assets/6ff44891-240d-4221-9ce3-c436edda08ed" />

<img width="830" height="692" alt="image" src="https://github.com/user-attachments/assets/60b90548-a797-4197-891a-b3a1ff4b2fff" />



---

## ⚠️ Remarques importantes

- Les adresses `ADRESSE_IP` et `PORT` doivent être adaptées à l’installation  
- La carte du bloc 1 utilise `custom:button-card`, qui doit être installé au préalable  
- Si aucune table n’est active, la dernière table jouée est affichée  
- Le bloc scores affiche le texte brut tel que fourni par l’API, avec nettoyage du caractère `�`  


Si cette version convient, je pourrai faire la **génération propre du fichier Markdown GitHub** au message suivant.
