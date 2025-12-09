import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ContractProvider, useContract } from './context/ContractContext';
import { AuthProvider } from './features/auth/AuthContext';
import LoginPage from './features/auth/LoginPage';
import { Stepper } from './components/Stepper';
import { Step1Inmueble } from './components/steps/Step1Inmueble';
import { Step2Acuerdo } from './components/steps/Step2Acuerdo';
import { Step3Partes } from './components/steps/Step3Partes';
import { Step4Resumen } from './components/steps/Step4Resumen';
import { Step5Borrador } from './components/steps/Step5Borrador';
import { Step6Firma } from './components/steps/Step6Firma';
import ContratoDashboard from './pages/Dashboard/ContratoDashboard';
import ExpedientesList from './pages/ExpedientesList/ExpedientesList';
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
    default:
      return <Step1Inmueble />;
  }
};

const WizardPage: React.FC = () => {
  const { contratoId } = useParams<{ contratoId?: string }>();
  const [searchParams] = useSearchParams();
  const { setCurrentStep, loadContratoExistente } = useContract();

  // Cargar contrato existente si hay contratoId
  React.useEffect(() => {
    const stepParam = searchParams.get('step');

    if (contratoId && contratoId !== 'nuevo') {
      // Cargar datos del contrato existente
      loadContratoExistente(contratoId).then(() => {
        // Establecer el paso indicado en la URL
        if (stepParam) {
          const step = parseInt(stepParam, 10);
          if (step >= 1 && step <= 6) {
            setCurrentStep(step);
          }
        }
      });
    } else if (stepParam) {
      // Solo establecer paso para nuevo contrato
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= 6) {
        setCurrentStep(step);
      }
    }
  }, [contratoId, searchParams]);

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <div className="logo-section">
          <h1 className="brand-title">⚖️ Observatorio Legaltech</h1>
          <p className="brand-subtitle">Plataforma de Contratos de Arras Digitales</p>
        </div>
      </div>

      <div className="wizard-content">
        <Stepper />
        <div className="step-content-wrapper">
          <StepRouter />
        </div>
      </div>

      <footer className="wizard-footer">
        <p>© 2025 Observatorio Legaltech | Powered by ICADE Business School</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ContractProvider>
          <Routes>
            {/* Auth - Login/Register */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<LoginPage />} />

            {/* Home - Lista de Expedientes */}
            <Route path="/" element={<ExpedientesList />} />
            <Route path="/expedientes" element={<ExpedientesList />} />

            {/* Wizard - Nuevo Expediente (público) */}
            <Route path="/wizard/nuevo" element={<WizardPage />} />
            {/* Wizard - Editar Expediente existente */}
            <Route path="/wizard/:contratoId" element={<WizardPage />} />

            {/* Dashboard - Gestión de Expediente */}
            <Route path="/dashboard/contrato/:contratoId" element={<ContratoDashboard />} />
            <Route path="/dashboard/:contratoId" element={<ContratoDashboard />} />

            {/* Redirect de rutas desconocidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ContractProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

