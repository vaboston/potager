import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function GardenPlanner() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [crops, setCrops] = useState([]);
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 });
  const [grid, setGrid] = useState(Array(gridSize.rows * gridSize.cols).fill(''));
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
  const [parcelleGrids, setParcelleGrids] = useState({});

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
    axios.get('http://localhost:8001/cultures/popular')
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
        // Charger d'abord les positions
        const positionsResponse = await axios.get('http://localhost:8001/parcelles/positions');
        const positions = {};
        positionsResponse.data.forEach(pos => {
          positions[pos.parcelle_config_id] = {
            row: pos.position_y,
            col: pos.position_x
          };
        });
        setParcellePositions(positions);

        // Ensuite charger les parcelles
        const parcellesResponse = await axios.get('http://localhost:8001/parcelles');
        setParcelles(parcellesResponse.data);
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
      .then(response => {
        setVersions(response.data);
        // Trouver la version la plus récente
        if (response.data.length > 0) {
          const mostRecent = response.data.reduce((prev, current) => {
            return new Date(current.created_at) > new Date(prev.created_at) ? current : prev;
          });
          setLastSelectedVersion(mostRecent.id);
          handleVersionSelect(mostRecent); // Charger automatiquement la version la plus récente
        }
      })
      .catch(error => console.error('Erreur chargement versions:', error));
  }, []);

  // Charger les données initiales des parcelles
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Charger toutes les parcelles
        const parcellesResponse = await axios.get('http://localhost:8001/parcelles');
        setParcelles(parcellesResponse.data);
        
        // Pour chaque parcelle, charger sa grille
        for (const parcelle of parcellesResponse.data) {
          const response = await axios.get(`http://localhost:8001/parcelles/${parcelle.id}`);
          setParcelleGrids(prev => ({
            ...prev,
            [parcelle.id]: response.data.grid
          }));
        }
      } catch (error) {
        console.error('Erreur chargement données initiales:', error);
      }
    };

    loadInitialData();
  }, []);

  // Charger la taille du potager au démarrage
  useEffect(() => {
    axios.get('http://localhost:8001/potager/size')
      .then(response => {
        if (response.data) {
          setPotagerSize({
            rows: response.data.rows || 10,
            cols: response.data.cols || 10
          });
        }
      })
      .catch(error => console.error('Erreur chargement taille potager:', error));
  }, []);

  // Modifier la fonction de changement de taille
  const handlePotagerSizeChange = (type, value) => {
    const newSize = { ...potagerSize, [type]: parseInt(value) || 1 };
    setPotagerSize(newSize);
    
    // Sauvegarder la nouvelle taille
    axios.post('http://localhost:8001/potager/size', newSize)
      .catch(error => console.error('Erreur sauvegarde taille potager:', error));
  };

  const handleCellClick = async (index) => {
    if (!selectedParcelle) {
        alert('Veuillez sélectionner une parcelle');
        return;
    }

    const row = Math.floor(index / gridSize.cols);
    const col = index % gridSize.cols;
    
    try {
        // Si la case contient déjà une culture, on l'efface
        const currentEmoji = grid[index];
        const newEmoji = currentEmoji ? '' : selectedCrop;

        const response = await axios.post('http://localhost:8001/parcelles', {
            parcelle_id: parseInt(selectedParcelle),
            row: row,
            col: col,
            culture_emoji: newEmoji
        });

        if (response.data.message) {
            const newGrid = [...grid];
            newGrid[index] = newEmoji;
            setGrid(newGrid);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        alert('Erreur lors de la mise à jour de la culture');
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
      
      setGridSize({
        rows: response.data.rows,
        cols: response.data.cols
      });

      setGrid(response.data.grid);
      setParcelleGrids(prev => ({
        ...prev,
        [id]: response.data.grid
      }));

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

      // Sélectionner automatiquement la parcelle après le drag & drop
      handleParcelleSelect(parcelleId);

    } catch (error) {
      console.error('Erreur sauvegarde position:', error);
      setParcellePositions(prev => ({ ...prev }));
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
        {versions.map((version) => {
          const isCurrentVersion = version.id === lastSelectedVersion;
          return (
            <div
              key={version.id}
              style={{
                padding: '10px',
                margin: '10px 0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: isCurrentVersion ? '#e8f5e9' : 'white',
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
                {isCurrentVersion && (
                  <div style={{ 
                    marginTop: '5px',
                    color: '#4CAF50',
                    fontWeight: 'bold',
                    fontSize: '0.9em'
                  }}>
                    Version courante ✓
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button 
          onClick={onClose} 
          style={{ 
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Fermer
        </button>
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

  const handleDeleteParcelle = async () => {
    if (!selectedParcelle) {
      alert('Veuillez sélectionner une parcelle à supprimer');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette parcelle ?')) {
      try {
        await axios.delete(`http://localhost:8001/parcelles/${selectedParcelle}`);
        setParcelles(parcelles.filter(p => p.id !== selectedParcelle));
        setSelectedParcelle(null);
        setGrid(Array(gridSize.rows * gridSize.cols).fill(''));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la parcelle');
      }
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* Colonne de gauche pour les cultures */}
      <div style={{ width: '250px' }}>
        <div className="cultures-list" style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          position: 'sticky',
          top: '20px'
        }}>
          {/* Section création de parcelle */}
          <h3>Créer une parcelle</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <input
              type="text"
              value={parcelleName}
              onChange={(e) => setParcelleName(e.target.value)}
              placeholder="Nom de la parcelle"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                value={gridSize.rows}
                onChange={(e) => handleSizeChange('rows', e.target.value)}
                placeholder="Lignes"
                min="1"
                max="20"
                style={{
                  width: '50%',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
              <input
                type="number"
                value={gridSize.cols}
                onChange={(e) => handleSizeChange('cols', e.target.value)}
                placeholder="Colonnes"
                min="1"
                max="20"
                style={{
                  width: '50%',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <button 
              onClick={handleCreateParcelle}
              disabled={!parcelleName || gridSize.rows * gridSize.cols <= 0}
              style={{
                padding: '8px',
                backgroundColor: !parcelleName || gridSize.rows * gridSize.cols <= 0 ? '#cccccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !parcelleName || gridSize.rows * gridSize.cols <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Créer une parcelle
            </button>
          </div>

          {/* Section liste des cultures */}
          <h3>Cultures disponibles</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.emoji)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  border: selectedCrop === crop.emoji ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: selectedCrop === crop.emoji ? '#e8f5e9' : 'white',
                  cursor: 'pointer',
                  width: 'fit-content',
                  textAlign: 'left',
                  margin: '0'
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '1.2em' }}>{crop.emoji}</span>
                <div style={{ display: 'inline-block' }}>
                  <div style={{ fontWeight: 'bold', display: 'inline' }}>{crop.nom}</div>
                  <small style={{ 
                    color: '#666',
                    marginLeft: '8px',
                    display: 'inline'
                  }}>
                    ({crop.usage_count || 0})
                  </small>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne centrale avec la grille et les contrôles */}
      <div style={{ flex: '1', maxWidth: '800px' }}>
        <h1>Organisation du Potager</h1>
        
        {/* Boutons pour gérer les versions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={handleDeleteParcelle} 
            style={{ 
              fontSize: '14px',
              backgroundColor: selectedParcelle ? '#ff4444' : '#cccccc',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: selectedParcelle ? 'pointer' : 'not-allowed'
            }}
            disabled={!selectedParcelle}
          >
            ❌ Supp. parcelle
          </button>
          <button 
            onClick={createVersion} 
            style={{ 
              fontSize: '14px',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Créer une version
          </button>
          <button 
            onClick={() => setShowVersionsModal(true)} 
            style={{ 
              fontSize: '14px',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📋 Liste des versions
          </button>
        </div>

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
      <div style={{ width: '400px' }}>
        <h2 style={{ marginTop: '0', marginBottom: '20px' }}>Vue d'ensemble du potager</h2>
        
        {/* Contrôles de taille du potager */}
        <div style={{ marginBottom: '20px' }}>
          <label>Taille du potager : </label>
          <input
            type="number"
            value={potagerSize.rows}
            onChange={(e) => handlePotagerSizeChange('rows', e.target.value)}
            min="1"
            max="20"
            style={{ width: '60px', marginRight: '10px' }}
          />
          x
          <input
            type="number"
            value={potagerSize.cols}
            onChange={(e) => handlePotagerSizeChange('cols', e.target.value)}
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
                  backgroundColor: parcelle ? (selectedParcelle === parcelle.id ? '#4CAF50' : '#c8e6c9') : '#f0f0f0',
                  border: '1px solid #ccc',
                  cursor: parcelle ? 'move' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
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
                {parcelle && parcelleGrids[parcelle.id] && (() => {
                  const pos = parcellePositions[parcelle.id] || { row: 0, col: 0 };
                  const relativeRow = row - pos.row;
                  const relativeCol = col - pos.col;
                  const gridIndex = (relativeRow * parcelle.cols) + relativeCol;
                  return parcelleGrids[parcelle.id][gridIndex] || '';
                })()}
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
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
                onClick={() => handleParcelleSelect(parcelle.id)}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {parcelle.nom}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                  {parcelle.rows}×{parcelle.cols}
                </div>
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