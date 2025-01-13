from app import app, db, ParcelleConfig, Culture
from datetime import datetime

def init_test_data():
    with app.app_context():
        # Création de la parcelle de test
        test_parcelle = ParcelleConfig(
            nom="test",
            rows=3,
            cols=3
        )
        
        # Création de la culture tomate
        test_culture = Culture(
            nom="tomate",
            date_semis="2025-01-20",
            type_culture="pleine terre",
            date_recolte="2025-07-20",  # Date de récolte approximative
            commentaire="Culture de test",
            couleur="#ff0000",  # Rouge pour les tomates
            emoji="🍅"
        )
        
        # Ajout à la base de données
        db.session.add(test_parcelle)
        db.session.add(test_culture)
        db.session.commit()
        
        print("Données de test ajoutées avec succès!")

if __name__ == "__main__":
    init_test_data() 