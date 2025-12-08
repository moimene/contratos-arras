import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContract } from '../../context/ContractContext';
import * as ICADE from '../../contracts/icade-template';
import {
  generateExpositivo,
  generatePortadaHTML,
  generateTerminosHTML,
} from '../../contracts/template-utils';

export const Step5Borrador: React.FC = () => {
  const { inmueble, contrato, compradores, vendedores, setCurrentStep, setContratoId } = useContract();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCreatingExpedition, setIsCreatingExpedition] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Simulate generation delay to show loading state
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Generate complete contract HTML
  const contractHTML = useMemo(() => {
    const data = { inmueble, contrato, compradores, vendedores };

    const tipoArras = contrato.tipo_arras || 'PENITENCIALES';
    const title = ICADE.ICADE_TITLES[tipoArras as keyof typeof ICADE.ICADE_TITLES] || ICADE.ICADE_TITLES.PENITENCIALES;
    const intro = ICADE.ICADE_INTRO[tipoArras as keyof typeof ICADE.ICADE_INTRO] || ICADE.ICADE_INTRO.PENITENCIALES;

    return `
      <div class="borrador-document">
        <div class="cartela">${ICADE.ICADE_METADATA.cartela}</div>
        
        <h2 class="titulo-principal">${title}</h2>
        
        <p class="intro-text">${intro}</p>
        
        <div class="aviso-legal">
          <strong>⚠️ Aviso:</strong> Este borrador es orientativo y no constituye asesoramiento jurídico. Debe revisarse por un profesional antes de su firma.
        </div>
        
        ${generateExpositivo(data)}
        
        <div class="portada">
          ${generatePortadaHTML(data)}
        </div>
        
        ${generateTerminosHTML(data)}
        
        <div class="firma-section">
          <div class="firma-box">
            <p><strong>PARTE VENDEDORA</strong></p>
            <div class="firma-linea"></div>
            <small>Firma y fecha</small>
          </div>
          <div class="firma-box">
            <p><strong>PARTE COMPRADORA</strong></p>
            <div class="firma-linea"></div>
            <small>Firma y fecha</small>
          </div>
        </div>
      </div>
    `;
  }, [inmueble, contrato, compradores, vendedores]);

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import of html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      // Generate descriptive filename
      const timestamp = new Date().toISOString().split('T')[0];
      const contratoId = (contrato as any).id || 'nuevo';
      const filename = `${contratoId}-borrador-${timestamp}.pdf`;

      // Create a temporary container for PDF generation
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '210mm'; // A4 width

      // Add watermark styling
      element.innerHTML = `
            <style>
                @page { margin: 20mm; }
                body { font-family: Georgia, 'Times New Roman', serif; }
                .watermark-container { position: relative; }
                .watermark-overlay {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 72px;
                    font-weight: bold;
                    color: rgba(200, 0, 0, 0.15);
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                    letter-spacing: 8px;
                }
                .cartela { font-size: 11px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
                .titulo-principal { font-size: 24px; margin: 16px 0; text-align: center; }
                .intro-text { font-size: 13px; line-height: 1.6; margin: 12px 0; }
                .aviso-legal { background: #fff3cd; border: 1px solid #ffeeba; padding: 12px; border-radius: 4px; margin: 16px 0; }
                .expositivo { margin: 20px 0; }
                .expositivo h3 { font-size: 18px; margin: 12px 0; }
                .expositivo p { font-size: 14px; line-height: 1.8; text-align: justify; }
                .portada h3 { font-size: 18px; margin: 16px 0 8px 0; }
                .portada-instrucciones { font-size: 12px; font-style: italic; color: #666; }
                .portada-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
                .portada-section { border: 1px solid #eee; padding: 12px; border-radius: 4px; }
                .portada-section h4 { font-size: 14px; margin: 0 0 8px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
                .portada-section p { margin: 6px 0; font-size: 12px; }
                .portada-section ul { margin: 8px 0; padding-left: 20px; }
                .portada-section li { margin: 8px 0; font-size: 12px; }
                .portada-section .representante { color: #0066cc; }
                .portada-full { grid-column: 1 / -1; }
                .terminos { margin: 24px 0; page-break-before: always; }
                .terminos h3 { font-size: 20px; margin: 16px 0; text-align: center; }
                .terminos h4 { font-size: 16px; margin: 16px 0 8px 0; border-top: 1px solid #eee; padding-top: 12px; }
                .terminos p { font-size: 13px; line-height: 1.7; text-align: justify; margin: 8px 0; }
                .terminos .clausula-num { font-weight: 600; margin-top: 12px; }
                .firma-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin: 40px 0; page-break-inside: avoid; }
                .firma-box { text-align: center; }
                .firma-linea { border-bottom: 1px solid #000; margin: 40px 20px 8px 20px; }
                
                .conformity-badge {
                    position: fixed;
                    top: 10mm;
                    right: 10mm;
                    background: linear-gradient(135deg, #0066cc, #004999);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 600;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
                    z-index: 10000;
                    letter-spacing: 0.5px;
                }
            </style>
            <div class="watermark-container">
                <div class="watermark-overlay">BORRADOR – NO FIRMADO</div>
                ${contrato.modoEstandarObservatorio ? '<div class="conformity-badge">✓ Conforme Observatorio Legaltech</div>' : ''}
                ${contractHTML}
            </div>
        `;

      document.body.appendChild(element);

      // Configure html2pdf options
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      console.log('Starting PDF generation...');

      // Use html2pdf's built-in save method which handles the download properly
      // Pass filename to save() to ensure correct .pdf extension
      await html2pdf().from(element).set(opt).save(filename);

      console.log('PDF saved successfully:', filename);

      // Clean up temporary element after a short delay to ensure PDF is generated
      setTimeout(() => {
        if (element.parentNode) {
          document.body.removeChild(element);
        }
      }, 1000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const handleCrearExpediente = async () => {
    if (isCreatingExpedition) return;
    setIsCreatingExpedition(true);

    try {
      console.log('🚀 Creating expediente (HTML preview only, no PDF)...');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/contracts/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datosWizard: { inmueble, contrato, compradores, vendedores }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating expediente');
      }

      const data = await response.json();
      console.log('✅ Expediente created:', data);

      if (data.success && data.contratoId) {
        setContratoId(data.contratoId);
        setCurrentStep(6); // Go to Step 6 (Firma)
      } else {
        alert('Error: No contract ID received. ' + JSON.stringify(data));
      }

    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`Error creating expediente: ${error.message}\n\nMake sure backend is running.`);
    } finally {
      setIsCreatingExpedition(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(6);
  };

  return (
    <div className="step-5-container">
      <div className="step-5-header">
        <h2 className="step-title">📄 Paso 5: Borrador del Contrato</h2>
        <p className="step-description">
          Revisa el borrador completo del contrato de arras conforme al modelo del Observatorio Legaltech Garrigues-ICADE.
        </p>
      </div>

      <div className="borrador-info">
        <div className="info-banner">
          <p>📌 Este borrador incorpora los términos esenciales aceptados en el paso anterior.</p>
          <p>ℹ️ Puedes descargar el PDF para revisión externa antes de continuar con la firma.</p>
        </div>
      </div>

      {isGenerating ? (
        <div className="borrador-loading">
          <div className="loading-spinner"></div>
          <p className="loading-text">Generando borrador del contrato...</p>
          <p className="loading-subtext">📝 Aplicando términos del Observatorio Legaltech</p>
        </div>
      ) : (
        <div className="borrador-preview" dangerouslySetInnerHTML={{ __html: contractHTML }} />
      )}

      <form onSubmit={handleSubmit} className="step-form">
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-secondary">
            ← Atrás
          </button>
          <button type="button" onClick={handleDownloadPDF} className="btn btn-accent">
            📥 Descargar PDF Borrador
          </button>
          <button
            type="button"
            onClick={handleCrearExpediente}
            className="btn btn-success"
            disabled={isCreatingExpedition}
            style={{ minWidth: '220px', fontWeight: 'bold' }}
          >
            {isCreatingExpedition ? '⚙️ Creando Expediente...' : '🚀 Finalizar y Crear Expediente'}
          </button>
          <button type="submit" className="btn btn-primary">
            Continuar a Firma →
          </button>
        </div>
      </form>
    </div>
  );
};
