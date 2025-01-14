import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function GardenPlanner() {
  const [selectedCrop, setSelectedCrop] = useState(null);
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
  const [currentVersion, setCurrentVersion] = useState(null);
  const [hoverTooltip, setHoverTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

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
      const currentCell = grid[index];
      const newCellData = currentCell ? '' : `${selectedCrop?.emoji},${selectedCrop?.id},${selectedCrop?.nom}`; // Ajout de l'emoji, l'ID et le nom
  
      const response = await axios.post('http://localhost:8001/parcelles', {
        parcelle_id: parseInt(selectedParcelle),
        row: row,
        col: col,
        culture_emoji: newCellData,
        culture_id: selectedCrop?.id
      });
  
      if (response.data.message) {
        const newGrid = [...grid];
        newGrid[index] = selectedCrop?.emoji || ''; // Stocker uniquement l'emoji
        setGrid(newGrid);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la parcelle:', error);
    }
  };

  const handleCellHover = async (e, cellData) => {
    if (!cellData) {
      setHoverTooltip({ visible: false, x: 0, y: 0, text: '' });
      return;
    }
  
    const [emoji, id, nom] = cellData.split(',');
  
    try {
      const response = await axios.get(`http://localhost:8001/cultures/${id}`);
      const { nom: nomCulture } = response.data;
  
      setHoverTooltip({
        visible: true,
        x: e.clientX + 10,
        y: e.clientY + 10,
        text: `${emoji} ${nomCulture}`
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de la culture:', error);
      setHoverTooltip({
        visible: true,
        x: e.clientX + 10,
        y: e.clientY + 10,
        text: `${emoji} ${nom}`
      });
    }
  };

  const handleCellLeave = () => {
    setHoverTooltip({ visible: false, text: '', x: 0, y: 0 });
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
        
        {/* Boutons d'import/export en haut */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          justifyContent: 'center' 
        }}>
          <input
            type="file"
            id="importVersion"
            style={{ display: 'none' }}
            onChange={handleImportVersion}
            accept=".json"
          />
          <label
            htmlFor="importVersion"
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📥 Importer une version
          </label>
        </div>

        {/* Liste des versions avec bouton d'export pour chacune */}
        {versions.map((version) => {
          const isCurrentVersion = version.id === lastSelectedVersion;
          return (
            <div key={version.id} style={{
              padding: '10px',
              margin: '10px 0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: isCurrentVersion ? '#e8f5e9' : 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span onClick={() => onSelect(version)} style={{ cursor: 'pointer', flex: 1 }}>
                  {version.name} {isCurrentVersion && '(Version actuelle)'}
                  <br />
                  <small>{new Date(version.created_at).toLocaleString()}</small>
                </span>
                <button
                  onClick={() => handleExportVersion(version.id)}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  📤
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Bouton fermer existant */}
        <button onClick={onClose} style={{ 
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Fermer
        </button>
      </div>
    </div>
  );

  const handleVersionSelect = (version) => {
    setParcelles(version.parcelles);
    setParcellePositions(version.parcelle_positions);
    
    // Mettre à jour les grilles de parcelles
    const newParcelleGrids = {};
    version.parcelles.forEach(parcelle => {
      const parcelleId = parcelle.id.toString();
      if (version.parcelle_cultures && version.parcelle_cultures[parcelleId]) {
        newParcelleGrids[parcelleId] = version.parcelle_cultures[parcelleId];
      } else {
        // Créer une grille vide si aucune culture n'est trouvée
        const gridSize = parcelle.rows * parcelle.cols;
        newParcelleGrids[parcelleId] = Array(gridSize).fill('');
      }
    });
    
    setParcelleGrids(newParcelleGrids);
    setLastSelectedVersion(version.id);
    setCurrentVersion(version);
    setShowVersionsModal(false);
    
    // Si une parcelle est sélectionnée, mettre à jour sa grille
    if (selectedParcelle) {
      const parcelleId = selectedParcelle.toString();
      if (newParcelleGrids[parcelleId]) {
        setGrid(newParcelleGrids[parcelleId]);
      }
    }
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

  const handleExportVersion = async (versionId) => {
    try {
      const response = await axios.get(`http://localhost:8001/versions/export/${versionId}`);
      const data = JSON.stringify(response.data, null, 2);
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `version_${versionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export : ' + error.message);
    }
  };

  const handleImportVersion = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const versionData = JSON.parse(e.target.result);
          await axios.post('http://localhost:8001/versions/import', versionData);
          alert('Version importée avec succès !');
          // Recharger la liste des versions
          const response = await axios.get('http://localhost:8001/versions');
          setVersions(response.data);
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
    <div>
      {/* Contenu principal */}
      <div style={{ padding: '20px', display: 'flex', gap: '20px', marginBottom: '200px' }}>
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
                  onClick={() => setSelectedCrop({
                    id: crop.id,
                    emoji: crop.emoji,
                    nom: crop.nom
                  })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    border: selectedCrop?.id === crop.id ? '2px solid #4CAF50' : '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: selectedCrop?.id === crop.id ? '#e8f5e9' : 'white',
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0 }}>Organisation du Potager</h1>
            {currentVersion && (
              <span style={{ 
                color: '#666', 
                fontSize: '0.9em',
                fontStyle: 'italic'
              }}>
                (Version : {currentVersion.name})
              </span>
            )}
          </div>
          
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
                onMouseEnter={(e) => handleCellHover(e, cell)}
                onMouseLeave={handleCellLeave}
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
                {cell ? cell.split(',')[0] : ''} {/* Afficher uniquement l'emoji */}
              </div>
            ))}
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
            margin: '0',
            width: 'fit-content',
            minWidth: 'min-content'
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
  const cellData = parcelleGrids[parcelle.id][gridIndex];

  return cellData ? cellData.split(',')[0] : ''; // Afficher uniquement l'emoji
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
      </div>

      {/* Pied de page fixe pour les échéances */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        padding: '15px',
        zIndex: 1000
      }}>
        <div style={{ 
          maxWidth: '100%',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            Échéances des 15 prochains jours
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            overflowX: 'auto',
            paddingBottom: '5px'
          }}>
            {getUpcomingDeadlines().map((deadline, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  gap: '12px',
                  minWidth: '300px',
                  flex: '1'
                }}
              >
                <span style={{ fontSize: '24px' }}>{deadline.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{deadline.culture}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {deadline.type} le {deadline.date.toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  backgroundColor: deadline.daysLeft <= 3 ? '#ff4444' : '#4CAF50',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.9em',
                  whiteSpace: 'nowrap'
                }}>
                  {deadline.daysLeft === 0 ? "Aujourd'hui" : 
                   deadline.daysLeft === 1 ? "Demain" :
                   `Dans ${deadline.daysLeft} jours`}
                </div>
              </div>
            ))}
            {getUpcomingDeadlines().length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                padding: '20px',
                width: '100%'
              }}>
                Aucune échéance dans les 15 prochains jours
              </div>
            )}
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

      {hoverTooltip.visible && (
        <div
          style={{
            position: 'fixed',
            top: hoverTooltip.y,
            left: hoverTooltip.x,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {hoverTooltip.text}
        </div>
      )}
    </div>
  );
}

export default GardenPlanner;