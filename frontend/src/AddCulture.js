import React, { useState } from 'react';
import axios from 'axios';

function AddCulture() {
  const [formData, setFormData] = useState({
    nom: '',
    date_semis: '',
    type_culture: 'pleine terre',
    date_repiquage: '',
    date_recolte: '',
    commentaire: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post('http://localhost:8001/cultures', formData)
      .then(() => {
        alert('Culture ajoutée avec succès !');
        setFormData({
          nom: '',
          date_semis: '',
          type_culture: 'pleine terre',
          date_repiquage: '',
          date_recolte: '',
          commentaire: ''
        });
      })
      .catch(error => {
        alert('Erreur lors de l’ajout de la culture.');
        console.error(error);
      });
  };

  return (
    <div>
      <h1>Ajouter une Culture</h1>
      <form onSubmit={handleSubmit}>
        <label>Nom :</label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          required
        />

        <label>Date de semis :</label>
        <input
          type="date"
          name="date_semis"
          value={formData.date_semis}
          onChange={handleChange}
          required
        />

        <label>Type de culture :</label>
        <select
          name="type_culture"
          value={formData.type_culture}
          onChange={handleChange}
        >
          <option value="pleine terre">Pleine Terre</option>
          <option value="serre">Sous Serre</option>
        </select>

        <label>Date de repiquage (si applicable) :</label>
        <input
          type="date"
          name="date_repiquage"
          value={formData.date_repiquage}
          onChange={handleChange}
        />

        <label>Date de récolte :</label>
        <input
          type="date"
          name="date_recolte"
          value={formData.date_recolte}
          onChange={handleChange}
        />

        <label>Commentaire :</label>
        <textarea
          name="commentaire"
          value={formData.commentaire}
          onChange={handleChange}
        ></textarea>

        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}

export default AddCulture;
