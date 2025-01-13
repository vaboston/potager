from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

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
            'emoji': self.emoji
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

# Route pour récupérer toutes les cultures
@app.route('/cultures', methods=['GET'])
def get_cultures():
    # Exclure l'allée de la liste des cultures retournées
    cultures = Culture.query.filter(Culture.nom != "Allée").all()
    return jsonify([culture.to_dict() for culture in cultures])

# Route pour ajouter une culture
@app.route('/cultures', methods=['POST'])
def add_culture():
    data = request.get_json()
    new_culture = Culture(
        nom=data['nom'],
        date_semis=data['date_semis'],
        type_culture=data['type_culture'],
        date_repiquage=data.get('date_repiquage'),
        date_recolte=data.get('date_recolte'),
        commentaire=data.get('commentaire'),
        emoji=data.get('emoji'),
        couleur=data.get('couleur')
    )
    db.session.add(new_culture)
    db.session.commit()
    return jsonify({"message": "Culture ajoutée avec succès !"}), 201

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

    if parcelle:
        parcelle.culture_emoji = data['culture_emoji']
    else:
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

# Ajouter ces nouvelles routes après les autres routes
@app.route('/parcelles/position', methods=['POST'])
def update_parcelle_position():
    data = request.get_json()
    parcelle_id = data.get('parcelleId')
    position_x = data.get('x')
    position_y = data.get('y')
    
    position = ParcellePosition.query.filter_by(parcelle_config_id=parcelle_id).first()
    
    if position:
        position.position_x = position_x
        position.position_y = position_y
    else:
        position = ParcellePosition(
            parcelle_config_id=parcelle_id,
            position_x=position_x,
            position_y=position_y
        )
        db.session.add(position)
    
    db.session.commit()
    return jsonify({"message": "Position mise à jour"})

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
    db.session.commit()  # Commit immédiat pour éviter les conflits
    
    new_version = Version(
        name=data.get('name'),
        parcelles=data['parcelles'],
        parcelle_positions=data['parcellePositions'],
        parcelle_cultures=data.get('parcelleCultures', {}),
        is_current=True  # La nouvelle version est toujours courante
    )
    db.session.add(new_version)
    db.session.commit()
    return jsonify(new_version.to_dict()), 201

# Route pour récupérer toutes les versions
@app.route('/versions', methods=['GET'])
def get_versions():
    versions = Version.query.order_by(Version.created_at.desc()).all()
    return jsonify([version.to_dict() for version in versions])

def init_default_data():
    # Vérifier si l'allée existe déjà
    allee = Culture.query.filter_by(nom="Allée").first()
    if not allee:
        allee_culture = Culture(
            nom="Allée",
            date_semis="1970-01-01",
            type_culture="pleine terre",
            date_recolte="2100-01-01",  # Date lointaine car c'est permanent
            commentaire="Allée de passage",
            couleur="#8B4513",  # Marron
            emoji="⬛"  # Carré noir (apparaîtra en marron avec la couleur)
        )
        db.session.add(allee_culture)
        db.session.commit()
        print("Allée créée avec succès!")

# Création de la base de données
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        init_default_data()
    app.run(port=8001, debug=True)
