import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function GardenPlanner() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [grid, setGrid] = useState(Array(25).fill(''));
  const [crops, setCrops] = useState([]);

  // Charger les cultures et la grille au démarrage
  useEffect(() => {
    // Charger les cultures depuis la base de données
    axios.get('http://localhost:8001/cultures')
      .then(response => setCrops(response.data))
      .catch(error => console.error('Erreur chargement cultures:', error));

    // Charger l'état de la grille
    axios.get('http://localhost:8001/parcelles')
      .then(response => {
        const newGrid = Array(25).fill('');
        response.data.forEach(parcelle => {
          const index = parcelle.row * 5 + parcelle.col;
          newGrid[index] = parcelle.culture_emoji;
        });
        setGrid(newGrid);
      })
      .catch(error => console.error('Erreur chargement grille:', error));
  }, []);

  const handleCellClick = async (index) => {
    if (selectedCrop) {
      const row = Math.floor(index / 5);
      const col = index % 5;
      
      try {
        await axios.post('http://localhost:8001/parcelles', {
          row: row,
          col: col,
          culture_emoji: selectedCrop
        });

        const newGrid = [...grid];
        newGrid[index] = selectedCrop;
        setGrid(newGrid);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Organisation du Potager</h1>
      
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

      <div className="simple-grid">
        {grid.map((cell, index) => (
          <div 
            key={index} 
            className="simple-cell"
            onClick={() => handleCellClick(index)}
          >
            {cell || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GardenPlanner;