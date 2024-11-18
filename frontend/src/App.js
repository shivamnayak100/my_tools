import React from 'react';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';
import BottomNavbar from './components/BottomNavbar/BottomNavbar'; 
import TopNavbar from './components/TopNavbar/TopNavbar'; 
import WordToPDF from './components/WordToPDF/WordToPDF';
import ExcelToPDF from './components/ExcelToPDF/ExcelToPDF';

function App() {
  return (
    <Router>
      <div className="App">
        <TopNavbar />
        
        <Routes>
          <Route path="/" element={<ExcelToPDF />} />
          <Route path="/word-to-pdf" element={<WordToPDF />} />
        </Routes>
        
        <BottomNavbar />
      </div>
    </Router>
  );
}

export default App;
