import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarTable.css';

function CalendarTable() {
  const [cultures, setCultures] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Charger les cultures depuis l'API
  useEffect(() => {
    axios.get('http://localhost:8001/cultures')
      .then(response => {
        // Filtrer pour exclure la culture "Allée"
        const filteredCultures = response.data.filter(culture => culture.nom !== "Allée");
        setCultures(filteredCultures);
      })
      .catch(error => console.error('Erreur lors du chargement des cultures', error));
  }, []);

  // Fonction pour afficher les émojis en fonction des dates
  const getEmojiForDay = (culture, day, monthIndex) => {
    const semisDate = new Date(culture.date_semis);
    const repiquageDate = culture.date_repiquage ? new Date(culture.date_repiquage) : null;
    const recolteDate = culture.date_recolte ? new Date(culture.date_recolte) : null;

    if (semisDate.getMonth() === monthIndex && semisDate.getDate() === day) {
      return '🌱'; // Emoji pour le semis
    }
    if (repiquageDate && repiquageDate.getMonth() === monthIndex && repiquageDate.getDate() === day) {
      return '🌿'; // Emoji pour le repiquage
    }
    if (recolteDate && recolteDate.getMonth() === monthIndex && recolteDate.getDate() === day) {
      return '🥕'; // Emoji pour la récolte
    }
    return '';
  };

  // Fonction pour vérifier si une case doit être colorée
  const isHighlightedDay = (culture, day, monthIndex) => {
    const semisDate = new Date(culture.date_semis);
    const repiquageDate = culture.date_repiquage ? new Date(culture.date_repiquage) : null;
    const recolteDate = culture.date_recolte ? new Date(culture.date_recolte) : null;

    const currentDate = new Date(semisDate.getFullYear(), monthIndex, day);

    // Vérifier si la date est entre semis et repiquage
    const isBetweenSemisAndRepiquage = repiquageDate && 
      currentDate >= semisDate && 
      currentDate <= repiquageDate;

    // Vérifier si la date est entre repiquage et récolte
    const isBetweenRepiquageAndRecolte = repiquageDate && recolteDate && 
      currentDate >= repiquageDate && 
      currentDate <= recolteDate;

    // Vérifier si la date est entre semis et récolte (si pas de repiquage)
    const isBetweenSemisAndRecolte = !repiquageDate && recolteDate && 
      currentDate >= semisDate && 
      currentDate <= recolteDate;

    return isBetweenSemisAndRepiquage || isBetweenRepiquageAndRecolte || isBetweenSemisAndRecolte;
  };

  // Fonction pour afficher le tooltip
  const showTooltip = (text, event) => {
    setTooltip({
      visible: true,
      text,
      x: event.clientX + 10,
      y: event.clientY + 10
    });
  };

  // Fonction pour cacher le tooltip
  const hideTooltip = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  // Fonction pour supprimer une culture
  const deleteCulture = (id) => {
    axios.delete(`http://localhost:8001/cultures/${id}`)
      .then(() => {
        alert('Culture supprimée avec succès !');
        setCultures(cultures.filter(culture => culture.id !== id));
      })
      .catch(error => console.error('Erreur lors de la suppression de la culture', error));
  };

  return (
    <div>
      <h1>Calendrier des Cultures</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Légumes</th>
            {months.map((month, index) => (
              <th key={index}>{month}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cultures.map((culture) => (
            <tr key={culture.id}>
              <td>
                <strong>{culture.nom}</strong>
                <br />
                <span 
                  onMouseEnter={(e) => showTooltip(culture.type_culture === 'pleine terre' ? 'Pleine terre' : 'Sous serre', e)}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'help' }}
                >
                  {culture.temp_emoji}
                </span>
                <br />
                <em>{culture.commentaire}</em>
              </td>
              {months.map((_, monthIndex) => (
                <td key={monthIndex}>
                  <div className="days-container">
                    {Array.from({ length: 31 }, (_, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`day ${isHighlightedDay(culture, dayIndex + 1, monthIndex) ? 'highlight' : ''}`}
                        onMouseEnter={(e) => showTooltip(`Jour ${dayIndex + 1}`, e)}
                        onMouseLeave={hideTooltip}
                      >
                        <div className="day-content">
                          {getEmojiForDay(culture, dayIndex + 1, monthIndex)}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
              <td>
                <button
                  onClick={() => deleteCulture(culture.id)}
                  className="delete-button"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip.visible && (
        <div
          className="tooltip"
          style={{ 
            top: tooltip.y, 
            left: tooltip.x,
            backgroundColor: '#333',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            position: 'fixed',
            zIndex: 1000
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default CalendarTable;
