import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CalendarTable from './CalendarTable';
import AddCulture from './AddCulture';
import GardenPlanner from './GardenPlanner';


function App() {
  return (
    <Router>
      <nav style={{
        padding: '20px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Link to="/" style={{
            textDecoration: 'none',
            color: '#333',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.3s',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold'
          }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            Calendrier
          </Link>

          <Link to="/add-culture" style={{
            textDecoration: 'none',
            color: '#333',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.3s',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold'
          }}>
            <span style={{ fontSize: '24px' }}>🌱</span>
            Ajouter une Culture
          </Link>

          <Link to="/organisation" style={{
            textDecoration: 'none',
            color: '#333',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.3s',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold'
          }}>
            <span style={{ fontSize: '24px' }}>🏡</span>
            Organisation du Potager
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CalendarTable />} />
        <Route path="/add-culture" element={<AddCulture />} />
        <Route path="/organisation" element={<GardenPlanner />} />
      </Routes>
    </Router>
  );
}

export default App;
