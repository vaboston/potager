import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function GardenPlanner() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [crops, setCrops] = useState([]);
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 });
  const [grid, setGrid] = useState([]);
  const [parcelleName, setParcelleName] = useState('');
  const [parcelles, setParcelles] = useState([]);
  const [selectedParcelle, setSelectedParcelle] = useState(null);
  const [potagerSize, setPotagerSize] = useState({ rows: 10, cols: 10 });
  const [parcellePositions, setParcellePositions] = useState({});
  const [cultures, setCultures] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [lastSelectedVersion, setLastSelectedVersion] = useState(null);
  const [versionName, setVersionName] = useState('');

  // Gestion du changement de taille
  const handleSizeChange = (type, value) => {
    const numValue = parseInt(value) || 1;
    const safeValue = Math.max(1, Math.min(numValue, 20));
    setGridSize(prev => ({
      ...prev,
      [type]: safeValue
    }));
  };

  // Chargement des cultures et des parcelles
  useEffect(() => {
    axios.get('http://localhost:8001/cultures')
      .then(response => setCrops(response.data))
      .catch(error => console.error('Erreur chargement cultures:', error));

    axios.get('http://localhost:8001/parcelles')
      .then(response => setParcelles(response.data))
      .catch(error => console.error('Erreur chargement parcelles:', error));
  }, []);

  // Charger les positions au démarrage
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const response = await axios.get('http://localhost:8001/parcelles/positions');
        const positions = {};
        response.data.forEach(pos => {
          positions[pos.parcelle_config_id] = { 
            row: pos.position_y, 
            col: pos.position_x 
          };
        });
        setParcellePositions(positions);
      } catch (error) {
        console.error('Erreur chargement positions:', error);
      }
    };

    loadPositions();
  }, []);

  // Charger les cultures au démarrage
  useEffect(() => {
    axios.get('http://localhost:8001/cultures')
      .then(response => setCultures(response.data))
      .catch(error => console.error('Erreur chargement cultures:', error));
  }, []);

  // Charger les versions au démarrage
  useEffect(() => {
    axios.get('http://localhost:8001/versions')
      .then(response => setVersions(response.data))
      .catch(error => console.error('Erreur chargement versions:', error));
  }, []);

  const handleCellClick = async (index) => {
    if (selectedCrop && selectedParcelle) {
      const row = Math.floor(index / gridSize.cols);
      const col = index % gridSize.cols;
      
      try {
        console.log('Mise à jour de la cellule:', { row, col, emoji: selectedCrop });
        const response = await axios.post('http://localhost:8001/parcelles', {
          parcelle_id: parseInt(selectedParcelle),
          row: row,
          col: col,
          culture_emoji: selectedCrop
        });

        if (response.data.message) {
          const newGrid = [...grid];
          newGrid[index] = selectedCrop;
          console.log('Grille mise à jour:', newGrid);
          setGrid(newGrid);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la culture');
      }
    } else {
      alert('Veuillez sélectionner une parcelle et une culture');
    }
  };

  const handleCreateParcelle = async () => {
    if (parcelleName) {
      try {
        const response = await axios.post('http://localhost:8001/parcelles/create', {
          nom: parcelleName,
          rows: gridSize.rows,
          cols: gridSize.cols
        });
        setParcelles([...parcelles, response.data]);
        setParcelleName('');
      } catch (error) {
        console.error('Erreur création parcelle:', error);
      }
    }
  };

  const handleParcelleSelect = async (id) => {
    if (!id) return;
    
    setSelectedParcelle(id);
    try {
      const response = await axios.get(`http://localhost:8001/parcelles/${id}`);
      console.log('Données reçues:', response.data);
      
      // Mettre à jour la taille de la grille
      setGridSize({
        rows: response.data.rows,
        cols: response.data.cols
      });

      // Utiliser directement la grille reçue
      setGrid(response.data.grid);

    } catch (error) {
      console.error('Erreur chargement parcelle:', error);
      alert('Erreur lors du chargement de la parcelle');
    }
  };

  // Fonction pour déplacer une parcelle
  const handleParcelleDrag = async (parcelleId, newRow, newCol) => {
    try {
      // Mettre à jour l'interface
      setParcellePositions(prev => ({
        ...prev,
        [parcelleId]: { row: newRow, col: newCol }
      }));

      // Sauvegarder dans la base de données
      await axios.post('http://localhost:8001/parcelles/position', {
        parcelleId: parcelleId,
        x: newCol,
        y: newRow
      });
    } catch (error) {
      console.error('Erreur sauvegarde position:', error);
      alert('Erreur lors de la sauvegarde de la position');
    }
  };

  // Fonction pour calculer les échéances des 15 prochains jours
  const getUpcomingDeadlines = () => {
    const today = new Date();
    const in15Days = new Date();
    in15Days.setDate(today.getDate() + 15);
    
    const deadlines = [];
    
    cultures.forEach(culture => {
      const dates = [
        { date: new Date(culture.date_semis), type: 'semis', emoji: '🌱' },
        { date: new Date(culture.date_repiquage), type: 'repiquage', emoji: '🌿' },
        { date: new Date(culture.date_recolte), type: 'récolte', emoji: '🥕' }
      ];
      
      dates.forEach(({ date, type, emoji }) => {
        if (!isNaN(date.getTime()) && date >= today && date <= in15Days) {
          const daysLeft = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
          deadlines.push({
            culture: culture.nom,
            date,
            type,
            emoji,
            daysLeft
          });
        }
      });
    });
    
    return deadlines.sort((a, b) => a.date - b.date);
  };

  // Fonction pour créer une nouvelle version
  const createVersion = () => {
    // Demander le nom de la version via un prompt
    const name = window.prompt("Donnez un nom à cette version :", "");
    if (name === null) return; // L'utilisateur a annulé

    const parcelleCultures = {};
    parcelles.forEach(parcelle => {
      const cultures = grid.filter((cell, index) => {
        const row = Math.floor(index / gridSize.cols);
        const col = index % gridSize.cols;
        return cell && row < parcelle.rows && col < parcelle.cols;
      });
      parcelleCultures[parcelle.id] = cultures;
    });

    axios.post('http://localhost:8001/versions', {
      name: name,
      parcelles,
      parcellePositions,
      parcelleCultures
    })
      .then(response => {
        alert('Version créée avec succès !');
        setVersions([...versions, response.data]);
      })
      .catch(error => console.error('Erreur création version:', error));
  };

  // Composant Modal pour les versions
  const VersionsModal = ({ versions, onClose, onSelect }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2>Versions sauvegardées</h2>
        {versions.map((version) => (
          <div
            key={version.id}
            style={{
              padding: '10px',
              margin: '10px 0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: lastSelectedVersion === version.id ? '#e8f5e9' : 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => onSelect(version)}
          >
            <div>
              <strong>{version.name || 'Sans nom'}</strong>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                Créée le {new Date(version.created_at).toLocaleString()}
              </div>
              {lastSelectedVersion === version.id && (
                <span style={{ 
                  marginLeft: '10px',
                  color: '#4CAF50',
                  fontWeight: 'bold'
                }}>
                  (Version courante)
                </span>
              )}
              {version.is_current && (
                <span style={{ marginLeft: '10px' }}>⏰</span>
              )}
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: '20px' }}>Fermer</button>
      </div>
    </div>
  );

  const handleVersionSelect = (version) => {
    setParcelles(version.parcelles);
    setParcellePositions(version.parcelle_positions);
    
    // Restaurer les cultures de chaque parcelle
    const newGrid = Array(gridSize.rows * gridSize.cols).fill('');
    Object.entries(version.parcelle_cultures).forEach(([parcelleId, cultures]) => {
      cultures.forEach((culture, index) => {
        if (culture) {
          newGrid[index] = culture;
        }
      });
    });
    setGrid(newGrid);
    
    setLastSelectedVersion(version.id);
    setShowVersionsModal(false);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* Partie gauche avec la grille et les contrôles */}
      <div style={{ flex: '1' }}>
        <h1>Organisation du Potager</h1>
        
        {/* Boutons pour gérer les versions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={createVersion} style={{ fontSize: '20px' }}>
            🔄 Créer une version
          </button>
          <button 
            onClick={() => setShowVersionsModal(true)} 
            style={{ fontSize: '20px' }}
          >
            📜 Liste des versions
          </button>
        </div>

        {/* Création de nouvelle parcelle */}
        <div className="parcelle-creation">
          <input
            type="text"
            value={parcelleName}
            onChange={(e) => setParcelleName(e.target.value)}
            placeholder="Nom de la parcelle"
          />
          <input
            type="number"
            value={gridSize.rows}
            onChange={(e) => handleSizeChange('rows', e.target.value)}
            placeholder="Nombre de lignes"
            min="1"
            max="20"
          />
          <input
            type="number"
            value={gridSize.cols}
            onChange={(e) => handleSizeChange('cols', e.target.value)}
            placeholder="Nombre de colonnes"
            min="1"
            max="20"
          />
          <button 
            onClick={handleCreateParcelle}
            disabled={!parcelleName || gridSize.rows * gridSize.cols <= 0}
          >
            Créer une parcelle
          </button>
        </div>

        {/* Sélection de culture */}
        <select 
          value={selectedCrop} 
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="crop-select"
        >
          <option value="">Sélectionner une culture</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.emoji}>
              {crop.nom} {crop.emoji}
            </option>
          ))}
        </select>

        {/* Grille */}
        <div 
          className="simple-grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
            width: `${gridSize.cols * 60}px`
          }}
        >
          {grid.map((cell, index) => (
            <div 
              key={index} 
              className="simple-cell"
              onClick={() => handleCellClick(index)}
              style={{ 
                fontSize: '24px',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ccc',
                backgroundColor: selectedParcelle ? 'white' : '#f0f0f0'
              }}
            >
              {cell}
            </div>
          ))}
        </div>

        {/* Nouveau composant de planning */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px' }}>
            Échéances des 15 prochains jours
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {getUpcomingDeadlines().map((deadline, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{deadline.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{deadline.culture}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {deadline.type} le {deadline.date.toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  backgroundColor: deadline.daysLeft <= 3 ? '#ff4444' : '#4CAF50',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em'
                }}>
                  {deadline.daysLeft === 0 ? "Aujourd'hui" : 
                   deadline.daysLeft === 1 ? "Demain" :
                   `Dans ${deadline.daysLeft} jours`}
                </div>
              </div>
            ))}
            {getUpcomingDeadlines().length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Aucune échéance dans les 15 prochains jours
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nouvelle partie droite avec potager miniature */}
      <div style={{ 
        width: `${Math.max(400, potagerSize.cols * 40)}px`,
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '60px',
        overflowX: 'auto'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '20px' }}>Vue d'ensemble du potager</h2>
        
        {/* Contrôles de taille du potager */}
        <div style={{ marginBottom: '20px' }}>
          <label>Taille du potager : </label>
          <input
            type="number"
            value={potagerSize.rows}
            onChange={(e) => setPotagerSize(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
            min="1"
            max="20"
            style={{ width: '60px', marginRight: '10px' }}
          />
          x
          <input
            type="number"
            value={potagerSize.cols}
            onChange={(e) => setPotagerSize(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
            min="1"
            max="20"
            style={{ width: '60px', marginLeft: '10px' }}
          />
        </div>

        {/* Grille du potager avec parcelles miniatures */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${potagerSize.cols}, 40px)`,
          gap: '2px',
          backgroundColor: '#ddd',
          padding: '4px',
          borderRadius: '4px',
          margin: '0 auto'
        }}>
          {Array.from({ length: potagerSize.rows * potagerSize.cols }).map((_, index) => {
            const row = Math.floor(index / potagerSize.cols);
            const col = index % potagerSize.cols;
            
            // Trouver si une parcelle occupe cette position
            const parcelle = parcelles.find(p => {
              const pos = parcellePositions[p.id] || { row: 0, col: 0 };
              return row >= pos.row && 
                     row < pos.row + p.rows && 
                     col >= pos.col && 
                     col < pos.col + p.cols;
            });

            return (
              <div
                key={index}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: parcelle ? (selectedParcelle === parcelle.id ? '#4CAF50' : '#fff') : '#f0f0f0',
                  border: '1px solid #ccc',
                  cursor: parcelle ? 'move' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  userSelect: 'none'
                }}
                draggable={!!parcelle}
                onDragStart={(e) => {
                  if (parcelle) {
                    e.dataTransfer.setData('parcelleId', parcelle.id.toString());
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const parcelleId = parseInt(e.dataTransfer.getData('parcelleId'));
                  handleParcelleDrag(parcelleId, row, col);
                }}
                onClick={() => parcelle && handleParcelleSelect(parcelle.id)}
              >
                {parcelle && (
                  <div style={{ 
                    fontSize: '8px', 
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '2px'
                  }}>
                    {parcelle.nom}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Liste des parcelles */}
        <div style={{ marginTop: '20px' }}>
          <h3>Parcelles disponibles</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {parcelles.map((parcelle) => (
              <div
                key={parcelle.id}
                style={{
                  width: `${parcelle.cols * 20}px`,
                  height: `${parcelle.rows * 20}px`,
                  backgroundColor: selectedParcelle === parcelle.id ? '#4CAF50' : '#fff',
                  color: selectedParcelle === parcelle.id ? 'white' : 'black',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onClick={() => handleParcelleSelect(parcelle.id)}
              >
                {parcelle.nom}
                <br />
                <small>{parcelle.rows}×{parcelle.cols}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showVersionsModal && (
        <VersionsModal
          versions={versions}
          onClose={() => setShowVersionsModal(false)}
          onSelect={handleVersionSelect}
        />
      )}
    </div>
  );
}

export default GardenPlanner;