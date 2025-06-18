import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ContractAnalysis } from './pages/ContractAnalysis';
import { DeploymentStatus } from './pages/DeploymentStatus';
import { ContractVerification } from './pages/ContractVerification';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis/:id" element={<ContractAnalysis />} />
            <Route path="/deploy/:id" element={<DeploymentStatus />} />
            <Route path="/verify/:contractId" element={<ContractVerification />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;