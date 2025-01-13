import React, { useState } from 'react';
import axios from 'axios';

// Liste d'emojis de légumes, fruits, et plantes
const emojis = [
  '🌱', '🥕', '🍅', '🥬', '🌽', '🍆', '🥒', '🫑', '🍓', '🍇',
  '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑',
  '🍒', '🍈', '🥔', '🥜', '🌶️', '🧄', '🧅', '🍠'
];

function AddCulture() {
  const [formData, setFormData] = useState({
    nom: '',
    date_semis: '',
    type_culture: 'pleine terre',
    date_repiquage: '',
    date_recolte: '',
    commentaire: '',
    couleur: '#ffffff',
    emoji: emojis[0]  // Emoji par défaut
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
          commentaire: '',
          couleur: '#ffffff',
          emoji: emojis[0]
        });
      })
      .catch(error => {
        alert('Erreur lors de l’ajout de la culture.');
        console.error(error);
      });
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '30px'
      }}>🌱 Ajouter une Culture</h1>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'grid',
        gap: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Nom de la culture :
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Type de culture :
              </label>
              <select
                name="type_culture"
                value={formData.type_culture}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="pleine terre">Pleine Terre</option>
                <option value="serre">Sous Serre</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Emoji représentatif :
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'emoji', value: emoji } })}
                    style={{
                      fontSize: '20px',
                      padding: '5px',
                      border: formData.emoji === emoji ? '2px solid #4CAF50' : '1px solid #ddd',
                      borderRadius: '5px',
                      backgroundColor: formData.emoji === emoji ? '#e8f5e9' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Date de semis :
              </label>
              <input
                type="date"
                name="date_semis"
                value={formData.date_semis}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Date de repiquage :
              </label>
              <input
                type="date"
                name="date_repiquage"
                value={formData.date_repiquage}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                Date de récolte :
              </label>
              <input
                type="date"
                name="date_recolte"
                value={formData.date_recolte}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section commentaire en bas */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
            Commentaire :
          </label>
          <textarea
            name="commentaire"
            value={formData.commentaire}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px',
              minHeight: '100px',
              resize: 'vertical'
            }}
          ></textarea>
        </div>

        <button 
          type="submit"
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            marginTop: '20px'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={e => e.target.style.backgroundColor = '#4CAF50'}
        >
          Ajouter la culture
        </button>
      </form>
    </div>
  );
}

export default AddCulture;
