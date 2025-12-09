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
      // Get contratoId if available
      const contratoId = (contrato as any).id;

      if (contratoId) {
        // Use backend API for existing contracts
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/pdf/${contratoId}/borrador`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error generating PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `borrador-${contratoId.substring(0, 8)}-${timestamp}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('PDF downloaded from backend API');
      } else {
        // For new contracts (no ID yet), use html2pdf client-side
        const html2pdf = (await import('html2pdf.js')).default;

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `borrador-nuevo-${timestamp}.pdf`;

        // Get the preview element directly (it's already rendered and visible)
        const previewElement = document.querySelector('.borrador-preview');
        if (!previewElement) {
          throw new Error('No se encontró la vista previa del contrato');
        }

        // Create a clone for PDF generation with proper styling
        const element = document.createElement('div');
        element.style.width = '210mm';
        element.style.padding = '20mm';
        element.style.fontFamily = 'Georgia, "Times New Roman", serif';
        element.innerHTML = `
          <style>
            @page { margin: 15mm; }
            body { font-family: Georgia, 'Times New Roman', serif; }
            .cartela { font-size: 11px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
            .titulo-principal { font-size: 24px; margin: 16px 0; text-align: center; }
            .intro-text { font-size: 13px; line-height: 1.6; margin: 12px 0; }
            .aviso-legal { background: #fff3cd; border: 1px solid #ffeeba; padding: 12px; border-radius: 4px; margin: 16px 0; }
            .expositivo { margin: 20px 0; }
            .expositivo h3 { font-size: 18px; margin: 12px 0; }
            .expositivo p { font-size: 14px; line-height: 1.8; text-align: justify; }
            .portada h3 { font-size: 18px; margin: 16px 0 8px 0; }
            .portada-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
            .portada-section { border: 1px solid #eee; padding: 12px; border-radius: 4px; }
            .portada-section h4 { font-size: 14px; margin: 0 0 8px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .portada-section p { margin: 6px 0; font-size: 12px; }
            .portada-section ul { margin: 8px 0; padding-left: 20px; }
            .portada-section li { margin: 8px 0; font-size: 12px; }
            .terminos { margin: 24px 0; }
            .terminos h3 { font-size: 20px; margin: 16px 0; text-align: center; }
            .terminos h4 { font-size: 16px; margin: 16px 0 8px 0; border-top: 1px solid #eee; padding-top: 12px; }
            .terminos p { font-size: 13px; line-height: 1.7; text-align: justify; margin: 8px 0; }
            .firma-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin: 40px 0; }
            .firma-box { text-align: center; }
            .firma-linea { border-bottom: 1px solid #000; margin: 40px 20px 8px 20px; }
          </style>
          <div style="text-align: center; color: #999; font-size: 12px; margin-bottom: 20px;">
            ⚠️ BORRADOR - NO VINCULANTE
          </div>
          ${previewElement.innerHTML}
        `;

        document.body.appendChild(element);

        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg' as const, quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        await html2pdf().from(element).set(opt).save(filename);

        setTimeout(() => {
          if (element.parentNode) {
            document.body.removeChild(element);
          }
        }, 1000);

        console.log('PDF generated client-side:', filename);
      }
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
