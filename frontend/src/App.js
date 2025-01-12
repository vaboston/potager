import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CalendarTable from './CalendarTable';
import AddCulture from './AddCulture';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Calendrier</Link> | <Link to="/add-culture">Ajouter une Culture</Link>
      </nav>

      <Routes>
        <Route path="/" element={<CalendarTable />} />
        <Route path="/add-culture" element={<AddCulture />} />
      </Routes>
    </Router>
  );
}

export default App;
