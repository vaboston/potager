# Gestion de Potager

Ce projet est une application de gestion de potager qui permet aux utilisateurs de suivre les cultures, les semis, les repiquages et les récoltes. L'application utilise Flask pour le backend et une base de données SQLite pour stocker les informations sur les cultures et les parcelles.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API](#api)
- [Contributions](#contributions)
- [Licence](#licence)

## Fonctionnalités

- Gestion des cultures : ajout, modification et suppression de cultures.
- Suivi des dates de semis, de repiquage et de récolte.
- Notifications Slack pour les semis à venir.
- Interface utilisateur pour visualiser et gérer les parcelles.

## Technologies utilisées

- **Backend** : Flask, Flask-SQLAlchemy
- **Base de données** : SQLite
- **Frontend** : React (ou autre technologie frontale selon votre choix)
- **Notifications** : Slack Webhook

## Installation

1. Clonez le dépôt :

   ```bash
   git clone https://github.com/vaboston/potager.git
   cd potager
   ```

2. Créez un environnement virtuel et activez-le :

   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows, utilisez `venv\Scripts\activate`
   ```

3. Installez les dépendances :

   ```bash
   pip install -r requirements.txt
   ```

4. Initialisez la base de données et ajoutez des données de test :

   ```bash
   python backend/init_test_data.py
   ```

## Utilisation

1. Démarrez le serveur Flask :

   ```bash
   python backend/app.py
   ```

2. Accédez à l'application via votre navigateur à l'adresse `http://localhost:8001`.

3. Utilisez l'interface pour gérer vos cultures et parcelles.

## API

### Importer des cultures

- **Endpoint** : `/cultures/import`
- **Méthode** : `POST`
- **Corps de la requête** :
