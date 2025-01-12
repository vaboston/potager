import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function CalendarView() {
  const [cultures, setCultures] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8001/cultures')
      .then(response => setCultures(response.data))
      .catch(error => console.error('Erreur lors du chargement des cultures', error));
  }, []);
    const events = cultures.map(culture => ({
      title: culture.name,
      start: new Date(culture.semis_date),
      end: new Date(culture.recolte_date || culture.semis_date),
    }));

  return (
    <div>
      <h1>Calendrier des Cultures</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
}

export default CalendarView;
