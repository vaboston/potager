import React, { useState, useEffect } from 'react';
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
    emoji: emojis[0]
  });
  const [cultures, setCultures] = useState([]); // Pour stocker la liste des cultures existantes
  const [selectedCultureId, setSelectedCultureId] = useState(''); // Pour suivre la culture sélectionnée

  // Charger les cultures existantes au chargement du composant
  useEffect(() => {
    axios.get('http://localhost:8001/cultures')
      .then(response => {
        setCultures(response.data);
      })
      .catch(error => console.error('Erreur lors du chargement des cultures:', error));
  }, []);

  // Fonction pour charger une culture existante
  const handleCultureSelect = (event) => {
    const cultureId = event.target.value;
    setSelectedCultureId(cultureId);

    if (cultureId) {
      axios.get(`http://localhost:8001/cultures/${cultureId}`)
        .then(response => {
          const culture = response.data;
          setFormData({
            nom: culture.nom,
            date_semis: culture.date_semis,
            type_culture: culture.type_culture,
            date_repiquage: culture.date_repiquage || '',
            date_recolte: culture.date_recolte || '',
            commentaire: culture.commentaire || '',
            couleur: culture.couleur || '#ffffff',
            emoji: culture.emoji
          });
        })
        .catch(error => console.error('Erreur lors du chargement de la culture:', error));
    } else {
      // Réinitialiser le formulaire si "Nouvelle culture" est sélectionné
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
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const apiCall = selectedCultureId
      ? axios.put(`http://localhost:8001/cultures/${selectedCultureId}`, formData)
      : axios.post('http://localhost:8001/cultures', formData);

    apiCall
      .then(() => {
        alert(selectedCultureId ? 'Culture modifiée avec succès !' : 'Culture ajoutée avec succès !');
        // Recharger la liste des cultures
        return axios.get('http://localhost:8001/cultures');
      })
      .then(response => {
        setCultures(response.data);
        // Réinitialiser le formulaire et la sélection
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
        setSelectedCultureId('');
      })
      .catch(error => {
        alert('Erreur lors de l\'opération.');
        console.error(error);
      });
  };

  // Fonction pour exporter les cultures
  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:8001/cultures');
      const data = JSON.stringify(response.data, null, 2);
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cultures.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export : ' + error.message);
    }
  };

  // Fonction pour importer les cultures
  const handleImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const cultures = JSON.parse(e.target.result);
          await axios.post('http://localhost:8001/cultures/import', cultures);
          alert('Import réussi !');
          // Recharger la liste des cultures
          const response = await axios.get('http://localhost:8001/cultures');
          setCultures(response.data);
        } catch (error) {
          alert('Erreur lors de l\'import : ' + error.message);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert('Erreur lors de la lecture du fichier : ' + error.message);
    }
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
      }}>
        🌱 {selectedCultureId ? 'Modifier une Culture' : 'Ajouter une Culture'}
      </h1>

      {/* Sélecteur de culture existante */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select
          value={selectedCultureId}
          onChange={handleCultureSelect}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Nouvelle culture</option>
          {cultures.map(culture => (
            <option key={culture.id} value={culture.id}>
              {culture.emoji} {culture.nom}
            </option>
          ))}
        </select>
        
        {selectedCultureId && (
          <button
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette culture ?')) {
                axios.delete(`http://localhost:8001/cultures/${selectedCultureId}`)
                  .then(() => {
                    alert('Culture supprimée avec succès !');
                    setCultures(cultures.filter(c => c.id !== parseInt(selectedCultureId)));
                    setSelectedCultureId('');
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
                  .catch(error => console.error('Erreur lors de la suppression:', error));
              }
            }}
            style={{
              padding: '0 15px',
              borderRadius: '5px',
              border: '1px solid #ff4444',
              backgroundColor: 'white',
              color: '#ff4444',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              transition: 'all 0.3s'
            }}
            onMouseOver={e => {
              e.target.style.backgroundColor = '#ff4444';
              e.target.style.color = 'white';
            }}
            onMouseOut={e => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#ff4444';
            }}
          >
            ❌
          </button>
        )}
      </div>

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
          {selectedCultureId ? 'Modifier la culture' : 'Ajouter la culture'}
        </button>
      </form>

      {/* Ajouter les boutons d'import/export en haut à droite */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '10px',
        marginBottom: '20px' 
      }}>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
          id="import-input"
        />
        <label
          htmlFor="import-input"
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          📥 Importer
        </label>
        <button
          onClick={handleExport}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          📤 Exporter
        </button>
      </div>
    </div>
  );
}

export default AddCulture;
