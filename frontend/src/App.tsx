import React from 'react';
import { ContractProvider, useContract } from './context/ContractContext';
import { Stepper } from './components/Stepper';
import { Step1Inmueble } from './components/steps/Step1Inmueble';
import { Step2Acuerdo } from './components/steps/Step2Acuerdo';
import { Step3Partes } from './components/steps/Step3Partes';
import { Step4Resumen } from './components/steps/Step4Resumen';
import { Step5Borrador } from './components/steps/Step5Borrador';
import { Step6Firma } from './components/steps/Step6Firma';
import { Step7Documentos, Step8Minuta, Step9Incidencias, Step10Certificado } from './components/steps/StepsPlaceholder';
import './index.css';

const StepRouter: React.FC = () => {
  const { currentStep } = useContract();

  switch (currentStep) {
    case 1:
      return <Step1Inmueble />;
    case 2:
      return <Step2Acuerdo />;
    case 3:
      return <Step3Partes />;
    case 4:
      return <Step4Resumen />;
    case 5:
      return <Step5Borrador />;
    case 6:
      return <Step6Firma />;
    case 7:
      return <Step7Documentos />;
    case 8:
      return <Step8Minuta />;
    case 9:
      return <Step9Incidencias />;
    case 10:
      return <Step10Certificado />;
    default:
      return <div className="step-container"><h2>Paso {currentStep}: En construcción...</h2></div>;
  }
};

function AppContent() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">📝 Sistema de Contratos de Arras</h1>
        <p className="app-subtitle">
          Gestión integral de contratos de arras con firma electrónica y certificación legal
        </p>
      </header>

      <Stepper />

      <StepRouter />
    </div>
  );
}

function App() {
  return (
    <ContractProvider>
      <AppContent />
    </ContractProvider>
  );
}

export default App;
