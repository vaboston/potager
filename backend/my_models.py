from . import db

class Culture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    semis_date = db.Column(db.String(20), nullable=False)
    type_culture = db.Column(db.String(20), nullable=False)
    repiquage_date = db.Column(db.String(20), nullable=True)
    recolte_date = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'semis_date': self.semis_date,
            'type_culture': self.type_culture,
            'repiquage_date': self.repiquage_date,
            'recolte_date': self.recolte_date
        }
