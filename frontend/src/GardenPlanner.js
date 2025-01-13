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

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* Partie gauche avec la grille et les contrôles */}
      <div style={{ flex: '1' }}>
        <h1>Organisation du Potager</h1>
        
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
      </div>

      {/* Partie droite avec les boutons de parcelles */}
      <div style={{ 
        width: '200px', 
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '60px'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '20px' }}>Mes Parcelles</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {parcelles.map((parcelle) => (
            <button
              key={parcelle.id}
              onClick={() => handleParcelleSelect(parcelle.id)}
              style={{
                padding: '10px',
                backgroundColor: selectedParcelle === parcelle.id ? '#4CAF50' : '#fff',
                color: selectedParcelle === parcelle.id ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {parcelle.nom}
              <br />
              <small>{parcelle.rows}×{parcelle.cols}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GardenPlanner;