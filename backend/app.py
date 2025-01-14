from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import logging

# Configuration du logger
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialisation de Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///potager.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Activer CORS
CORS(app)

# Initialisation de la base de données
db = SQLAlchemy(app)


# Modèle de la table Culture
class Culture(db.Model):
    __tablename__ = 'culture'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    date_semis = db.Column(db.String(10), nullable=False)
    type_culture = db.Column(db.String(20), nullable=False)
    date_repiquage = db.Column(db.String(10), nullable=True)
    date_recolte = db.Column(db.String(10), nullable=True)
    commentaire = db.Column(db.String(255), nullable=True)
    couleur = db.Column(db.String(7), nullable=False)
    emoji = db.Column(db.String(10), nullable=True)
    temp_emoji = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'date_semis': self.date_semis,
            'type_culture': self.type_culture,
            'date_repiquage': self.date_repiquage,
            'date_recolte': self.date_recolte,
            'commentaire': self.commentaire,
            'couleur': self.couleur,
            'emoji': self.emoji,
            'temp_emoji': self.temp_emoji
        }

# Modèle pour l'organisation du potager (parcelles)
class ParcelleConfig(db.Model):
    __tablename__ = 'parcelle_config'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    rows = db.Column(db.Integer, nullable=False)
    cols = db.Column(db.Integer, nullable=False)
    parcelles = db.relationship('Parcelle', backref='config', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'rows': self.rows,
            'cols': self.cols
        }

class Parcelle(db.Model):
    __tablename__ = 'parcelle'
    id = db.Column(db.Integer, primary_key=True)
    parcelle_config_id = db.Column(db.Integer, db.ForeignKey('parcelle_config.id'), nullable=False)
    row = db.Column(db.Integer, nullable=False)
    col = db.Column(db.Integer, nullable=False)
    culture_emoji = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'parcelle_config_id': self.parcelle_config_id,
            'row': self.row,
            'col': self.col,
            'culture_emoji': self.culture_emoji
        }

# Ajouter ce nouveau modèle après les autres modèles
class ParcellePosition(db.Model):
    __tablename__ = 'parcelle_position'
    id = db.Column(db.Integer, primary_key=True)
    parcelle_config_id = db.Column(db.Integer, db.ForeignKey('parcelle_config.id'), nullable=False)
    position_x = db.Column(db.Integer, nullable=False)
    position_y = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'parcelle_config_id': self.parcelle_config_id,
            'position_x': self.position_x,
            'position_y': self.position_y
        }

# Modèle pour les versions du potager
class Version(db.Model):
    __tablename__ = 'version'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=True)
    parcelles = db.Column(db.PickleType, nullable=False)
    parcelle_positions = db.Column(db.PickleType, nullable=False)
    parcelle_cultures = db.Column(db.PickleType, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    is_current = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'parcelles': self.parcelles,
            'parcelle_positions': self.parcelle_positions,
            'parcelle_cultures': self.parcelle_cultures,
            'created_at': self.created_at,
            'is_current': self.is_current
        }

# Après les autres modèles, avant les routes
class PotagerConfig(db.Model):
    __tablename__ = 'potager_config'
    id = db.Column(db.Integer, primary_key=True)
    rows = db.Column(db.Integer, nullable=False, default=10)
    cols = db.Column(db.Integer, nullable=False, default=10)

    def to_dict(self):
        return {
            'rows': self.rows,
            'cols': self.cols
        }

# Route pour récupérer toutes les cultures
@app.route('/cultures', methods=['GET'])
def get_cultures():
    cultures = Culture.query.all()
    return jsonify([culture.to_dict() for culture in cultures])

# Route pour ajouter une culture
@app.route('/cultures', methods=['POST'])
def add_culture():
    try:
        data = request.get_json()
        logger.info(f"Tentative d'ajout d'une culture : {data}")
        
        # Déterminer l'emoji de température en fonction du type de culture
        temp_emoji = '❄️' if data['type_culture'] == 'pleine terre' else '��️'
        
        new_culture = Culture(
            nom=data['nom'],
            date_semis=data['date_semis'],
            type_culture=data['type_culture'],
            date_repiquage=data.get('date_repiquage'),
            date_recolte=data.get('date_recolte'),
            commentaire=data.get('commentaire'),
            emoji=data.get('emoji'),
            couleur=data.get('couleur', '#ffffff'),
            temp_emoji=temp_emoji
        )
        db.session.add(new_culture)
        db.session.commit()
        return jsonify({"message": "Culture ajoutée avec succès !"}), 201

    except Exception as e:
        logger.error(f"Erreur lors de l'ajout d'une culture : {str(e)}")
        return jsonify({"error": str(e)}), 500

# Route pour supprimer une culture par ID
@app.route('/cultures/<int:id>', methods=['DELETE'])
def delete_culture(id):
    culture = Culture.query.get_or_404(id)
    db.session.delete(culture)
    db.session.commit()
    return jsonify({"message": "Culture supprimée avec succès !"}), 200

# Route pour récupérer les parcelles sauvegardées
@app.route('/parcelles', methods=['GET'])
def get_all_parcelles():
    parcelles_config = ParcelleConfig.query.all()
    return jsonify([p.to_dict() for p in parcelles_config])

# Route pour mettre à jour une parcelle
@app.route('/parcelles', methods=['POST'])
def update_parcelle():
    data = request.get_json()
    parcelle = Parcelle.query.filter_by(
        parcelle_config_id=data['parcelle_id'],
        row=data['row'],
        col=data['col']
    ).first()

    # Si une parcelle existe déjà à cet emplacement et qu'on reçoit un emoji vide,
    # on supprime la culture de cette case
    if parcelle and data.get('culture_emoji') == '':
        db.session.delete(parcelle)
    # Si une parcelle existe, on met à jour son emoji
    elif parcelle:
        parcelle.culture_emoji = data['culture_emoji']
    # Si aucune parcelle n'existe et qu'on a un emoji, on en crée une nouvelle
    elif data.get('culture_emoji'):
        parcelle = Parcelle(
            parcelle_config_id=data['parcelle_id'],
            row=data['row'],
            col=data['col'],
            culture_emoji=data['culture_emoji']
        )
        db.session.add(parcelle)

    db.session.commit()
    return jsonify({"message": "Parcelle mise à jour avec succès"})

# Route pour créer une parcelle
@app.route('/parcelles/create', methods=['POST'])
def create_parcelle():
    data = request.get_json()
    
    if not data.get('nom'):
        return jsonify({"error": "Le nom est requis"}), 400
        
    rows = max(1, min(data.get('rows', 1), 20))
    cols = max(1, min(data.get('cols', 1), 20))
    
    new_parcelle_config = ParcelleConfig(
        nom=data['nom'],
        rows=rows,
        cols=cols
    )
    db.session.add(new_parcelle_config)
    db.session.commit()
    
    return jsonify(new_parcelle_config.to_dict())

# Route pour récupérer une parcelle
@app.route('/parcelles/<int:id>', methods=['GET'])
def get_parcelle(id):
    try:
        parcelle_config = ParcelleConfig.query.get_or_404(id)
        parcelles = Parcelle.query.filter_by(parcelle_config_id=id).all()
        
        # Créer une grille vide
        grid = [''] * (parcelle_config.rows * parcelle_config.cols)
        
        # Remplir la grille avec les cultures existantes
        for p in parcelles:
            index = p.row * parcelle_config.cols + p.col
            if 0 <= index < len(grid):
                # S'assurer que l'emoji est une chaîne UTF-8 valide
                emoji = p.culture_emoji if p.culture_emoji else ''
                grid[index] = emoji
                print(f"Ajout de l'emoji {emoji} (type: {type(emoji)}) à l'index {index}")
        
        response_data = {
            'id': parcelle_config.id,
            'nom': parcelle_config.nom,
            'rows': parcelle_config.rows,
            'cols': parcelle_config.cols,
            'grid': grid
        }
        
        print(f"Grille finale: {grid}")
        return jsonify(response_data)

    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Modifier la route pour mettre à jour la position d'une parcelle
@app.route('/parcelles/position', methods=['POST'])
def update_parcelle_position():
    try:
        data = request.get_json()
        parcelle_id = data.get('parcelleId')
        x = data.get('x', 0)  # Valeur par défaut 0
        y = data.get('y', 0)  # Valeur par défaut 0

        if parcelle_id is None:
            return jsonify({"error": "parcelleId manquant"}), 400

        # Vérifier si la parcelle existe
        parcelle = ParcelleConfig.query.get(parcelle_id)
        if not parcelle:
            return jsonify({"error": "Parcelle non trouvée"}), 404

        # Mettre à jour ou créer la position
        position = ParcellePosition.query.filter_by(parcelle_config_id=parcelle_id).first()
        if position:
            position.position_x = x
            position.position_y = y
        else:
            position = ParcellePosition(
                parcelle_config_id=parcelle_id,
                position_x=x,
                position_y=y
            )
            db.session.add(position)

        db.session.commit()
        return jsonify({"message": "Position mise à jour avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/parcelles/positions', methods=['GET'])
def get_parcelle_positions():
    positions = ParcellePosition.query.all()
    return jsonify([pos.to_dict() for pos in positions])

# Route pour créer une version
@app.route('/versions', methods=['POST'])
def create_version():
    data = request.get_json()
    
    # Mettre à jour toutes les versions existantes comme non courantes
    Version.query.update({Version.is_current: False})
    
    # Récupérer le contenu actuel des parcelles
    parcelle_cultures = {}
    for parcelle in data['parcelles']:
        parcelle_id = parcelle['id']
        # Récupérer toutes les cultures de cette parcelle
        cultures = Parcelle.query.filter_by(parcelle_config_id=parcelle_id).all()
        grid = [''] * (parcelle['rows'] * parcelle['cols'])
        for culture in cultures:
            index = culture.row * parcelle['cols'] + culture.col
            if 0 <= index < len(grid):
                grid[index] = culture.culture_emoji
        parcelle_cultures[str(parcelle_id)] = grid
    
    new_version = Version(
        name=data.get('name'),
        parcelles=data['parcelles'],
        parcelle_positions=data['parcellePositions'],
        parcelle_cultures=parcelle_cultures,  # Utiliser les cultures récupérées
        is_current=True
    )
    db.session.add(new_version)
    db.session.commit()
    return jsonify(new_version.to_dict()), 201

# Route pour récupérer toutes les versions
@app.route('/versions', methods=['GET'])
def get_versions():
    versions = Version.query.order_by(Version.created_at.desc()).all()
    return jsonify([version.to_dict() for version in versions])

# Ajouter ces nouvelles routes avant la fonction init_default_data()
@app.route('/potager/size', methods=['GET'])
def get_potager_size():
    config = PotagerConfig.query.first()
    if not config:
        config = PotagerConfig()  # Utilise les valeurs par défaut
        db.session.add(config)
        db.session.commit()
    return jsonify(config.to_dict())

@app.route('/potager/size', methods=['POST'])
def update_potager_size():
    data = request.get_json()
    config = PotagerConfig.query.first()
    
    if not config:
        config = PotagerConfig()
        db.session.add(config)
    
    config.rows = max(1, min(data.get('rows', 10), 20))  # Limite entre 1 et 20
    config.cols = max(1, min(data.get('cols', 10), 20))  # Limite entre 1 et 20
    
    db.session.commit()
    return jsonify(config.to_dict())

# Modifier la fonction init_default_data pour inclure la configuration du potager
def init_default_data():
    print("Démarrage de l'initialisation des données...")
    
    # Configuration par défaut du potager
    default_config = PotagerConfig.query.first()
    if not default_config:
        print("Création de la configuration par défaut du potager...")
        default_config = PotagerConfig(rows=10, cols=10)
        db.session.add(default_config)
        db.session.commit()
        print("Configuration du potager créée.")
    
    # Forcer la suppression de l'allée existante si elle existe
    try:
        Culture.query.filter_by(nom="Allée").delete()
        db.session.commit()
        print("Ancienne allée supprimée.")
    except Exception as e:
        print(f"Erreur lors de la suppression de l'ancienne allée: {str(e)}")
        db.session.rollback()

    # Créer une nouvelle allée
    print("Création de l'allée...")
    try:
        allee_culture = Culture(
            nom="Allée",
            date_semis=datetime.strptime("1970-01-01", "%Y-%m-%d"),
            type_culture="pleine terre",
            date_recolte=datetime.strptime("2100-01-01", "%Y-%m-%d"),
            commentaire="Allée de passage",
            couleur="#8B4513",
            emoji="⬛"
        )
        db.session.add(allee_culture)
        db.session.commit()
        print("Allée créée avec succès!")
        
        # Vérification immédiate
        verification = Culture.query.filter_by(nom="Allée").first()
        if verification:
            print(f"Vérification: Allée trouvée avec l'ID {verification.id}")
        else:
            print("Erreur: L'allée n'a pas été créée correctement")
            
    except Exception as e:
        print(f"Erreur lors de la création de l'allée: {str(e)}")
        db.session.rollback()

    print("Configuration initiale terminée!")

# Ajouter cette nouvelle route après les autres routes de parcelles
@app.route('/parcelles/<int:id>', methods=['DELETE'])
def delete_parcelle(id):
    try:
        # Supprimer d'abord toutes les positions associées
        ParcellePosition.query.filter_by(parcelle_config_id=id).delete()
        
        # Supprimer toutes les cultures de la parcelle
        Parcelle.query.filter_by(parcelle_config_id=id).delete()
        
        # Supprimer la configuration de la parcelle
        parcelle = ParcelleConfig.query.get_or_404(id)
        db.session.delete(parcelle)
        db.session.commit()
        
        return jsonify({"message": "Parcelle supprimée avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Ajouter cette nouvelle route après les autres routes
@app.route('/cultures/popular', methods=['GET'])
def get_popular_cultures():
    try:
        # Sous-requête pour compter les occurrences de chaque emoji dans les parcelles
        culture_counts = db.session.query(
            Parcelle.culture_emoji,
            db.func.count(Parcelle.culture_emoji).label('count')
        ).group_by(Parcelle.culture_emoji).subquery()

        # Joindre avec la table Culture et trier par popularité
        popular_cultures = db.session.query(
            Culture,
            db.func.coalesce(culture_counts.c.count, 0).label('usage_count')
        ).outerjoin(
            culture_counts,
            Culture.emoji == culture_counts.c.culture_emoji
        ).order_by(
            db.desc('usage_count'),
            Culture.nom
        ).all()

        # Formater les résultats
        result = [{
            **culture.to_dict(),
            'usage_count': count
        } for culture, count in popular_cultures]

        return jsonify(result)

    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Ajouter cette nouvelle route après la route GET /cultures
@app.route('/cultures/<int:id>', methods=['PUT'])
def update_culture(id):
    try:
        culture = Culture.query.get_or_404(id)
        data = request.get_json()
        
        temp_emoji = '❄️' if data['type_culture'] == 'pleine terre' else '🌡️'
        
        culture.nom = data['nom']
        culture.date_semis = data['date_semis']
        culture.type_culture = data['type_culture']
        culture.date_repiquage = data.get('date_repiquage')
        culture.date_recolte = data.get('date_recolte')
        culture.commentaire = data.get('commentaire')
        culture.emoji = data.get('emoji')
        culture.couleur = data.get('couleur')
        culture.temp_emoji = temp_emoji
        
        db.session.commit()
        return jsonify({"message": "Culture mise à jour avec succès!", "culture": culture.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Ajouter également une route pour récupérer une culture spécifique
@app.route('/cultures/<int:id>', methods=['GET'])
def get_culture(id):
    try:
        culture = Culture.query.get_or_404(id)
        return jsonify({
            'id': culture.id,
            'nom': culture.nom
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Modifions la route pour récupérer une version spécifique
@app.route('/versions/<int:id>', methods=['GET'])
def get_version(id):
    version = Version.query.get_or_404(id)
    
    # Récupérer toutes les parcelles associées à cette version
    parcelles_data = []
    for parcelle in version.parcelles:
        parcelle_dict = parcelle.copy()  # Copie du dictionnaire de la parcelle
        # Ajouter les cultures associées à cette parcelle
        if str(parcelle['id']) in version.parcelle_cultures:
            parcelle_dict['cultures'] = version.parcelle_cultures[str(parcelle['id'])]
        parcelles_data.append(parcelle_dict)

    response_data = version.to_dict()
    response_data['parcelles'] = parcelles_data
    
    return jsonify(response_data)

# Ajouter cette nouvelle route pour l'import des cultures
@app.route('/cultures/import', methods=['POST'])
def import_cultures():
    try:
        cultures_data = request.get_json()
        
        # Supprimer toutes les cultures existantes si nécessaire
        # Culture.query.delete()
        
        for culture_data in cultures_data:
            # Retirer l'ID pour éviter les conflits
            if 'id' in culture_data:
                del culture_data['id']
                
            culture = Culture(**culture_data)
            db.session.add(culture)
            
        db.session.commit()
        return jsonify({"message": "Cultures importées avec succès !"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Après la route GET /versions/<int:id>

@app.route('/versions/export/<int:id>', methods=['GET'])
def export_version(id):
    try:
        version = Version.query.get_or_404(id)
        version_data = version.to_dict()
        
        # Récupérer les positions des parcelles
        parcelle_positions = {}
        positions = ParcellePosition.query.filter(ParcellePosition.parcelle_config_id.in_([p['id'] for p in version.parcelles])).all()
        for position in positions:
            parcelle_positions[position.parcelle_config_id] = {
                'position_x': position.position_x,
                'position_y': position.position_y
            }
        
        # Inclure les positions dans les données exportées
        version_data['parcelle_positions'] = parcelle_positions
        
        # Nettoyer les données pour l'export
        if 'created_at' in version_data:
            version_data['created_at'] = version_data['created_at'].isoformat()
            
        return jsonify(version_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/versions/import', methods=['POST'])
def import_version():
    try:
        data = request.get_json()
        
        # Mettre à jour toutes les versions existantes comme non courantes
        Version.query.update({Version.is_current: False})
        
        # Créer la nouvelle version
        new_version = Version(
            name=data.get('name', 'Version importée'),
            parcelles=data['parcelles'],
            parcelle_positions=data['parcelle_positions'],
            parcelle_cultures=data['parcelle_cultures'],
            is_current=True
        )
        
        db.session.add(new_version)
        db.session.commit()
        
        return jsonify({"message": "Version importée avec succès!", "id": new_version.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Création de la base de données
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Tables créées.")
        init_default_data()
    app.run(host='0.0.0.0', port=8001, debug=True)
