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
class Parcelle(db.Model):
    __tablename__ = 'parcelle'
    id = db.Column(db.Integer, primary_key=True)
    row = db.Column(db.Integer, nullable=False)
    col = db.Column(db.Integer, nullable=False)
    culture_nom = db.Column(db.String(50), nullable=True)

# Route pour récupérer toutes les cultures
@app.route('/cultures', methods=['GET'])
def get_cultures():
    cultures = Culture.query.all()
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
def get_parcelles():
    parcelles = Parcelle.query.all()
    return jsonify([
        {"row": parcelle.row, "col": parcelle.col, "culture_nom": parcelle.culture_nom}
        for parcelle in parcelles
    ])

# Route pour mettre à jour une parcelle
@app.route('/parcelles', methods=['POST'])
def update_parcelle():
    data = request.get_json()
    parcelle = Parcelle.query.filter_by(row=data['row'], col=data['col']).first()

    if parcelle:
        parcelle.culture_nom = data['culture_nom']
    else:
        parcelle = Parcelle(row=data['row'], col=data['col'], culture_nom=data['culture_nom'])
        db.session.add(parcelle)

    db.session.commit()
    return jsonify({"message": "Parcelle mise à jour avec succès"})

# Création de la base de données
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(port=8001, debug=True)
