/**
 * Legal Texts Registry
 * 
 * Versionado de textos legales para mandatos y autorizaciones.
 * Cada texto tiene:
 * - text_id: identificador estable
 * - version: fecha de versión (cambiar solo si cambia el texto legal)
 * - template: plantilla con placeholders
 * - language: idioma (es-ES)
 */

export interface LegalTextEntry {
    text_id: string;
    version: string;
    language: string;
    template: string;
}

export type LegalTextId =
    | 'UI_MANDATO_ASESOR_COMPRADOR'
    | 'UI_MANDATO_ASESOR_VENDEDOR'
    | 'UI_MANDATO_DUAL_ASESOR_COMUN'
    | 'UI_AUTORIZACION_NOTARIA';

/**
 * Registry de textos legales versionados
 */
export const LEGAL_TEXTS: Record<LegalTextId, LegalTextEntry> = {
    UI_MANDATO_ASESOR_COMPRADOR: {
        text_id: 'UI_MANDATO_ASESOR_COMPRADOR',
        version: '2025-12-14',
        language: 'es-ES',
        template: `AUTORIZACIÓN Y MANDATO DE ASESORÍA – PARTE COMPRADORA

Yo, {{NOMBRE_COMPRADOR}}, con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, en calidad de PARTE COMPRADORA en el expediente de contrato de arras número {{NUMERO_EXPEDIENTE}}, mediante el presente acto:

1. OTORGO mandato a {{NOMBRE_ASESOR}} (en adelante, el "Asesor") para actuar en mi nombre y representación en la plataforma Chrono-Flare, exclusivamente en relación con el expediente mencionado.

2. ALCANCE DEL MANDATO. El Asesor queda autorizado a:
   {{#SI_PUEDE_SUBIR_DOCS}}• Subir documentación en mi nombre{{/SI_PUEDE_SUBIR_DOCS}}
   {{#SI_PUEDE_INVITAR}}• Invitar a otros participantes al expediente{{/SI_PUEDE_INVITAR}}
   {{#SI_PUEDE_VALIDAR}}• Revisar y validar documentos{{/SI_PUEDE_VALIDAR}}
   {{#SI_PUEDE_FIRMAR}}• Firmar documentos en mi nombre (requiere autorización específica){{/SI_PUEDE_FIRMAR}}

3. LIMITACIONES. Este mandato:
   - Se limita exclusivamente al expediente indicado
   - No implica poder general de administración ni disposición
   - No autoriza la modificación de términos esenciales sin mi consentimiento expreso

4. REVOCABILIDAD. Puedo revocar este mandato en cualquier momento a través de la plataforma.

5. REGISTRO. Este otorgamiento queda sellado con marca de tiempo cualificada (QTSP) conforme al Reglamento (UE) 910/2014 (eIDAS).

Acepto expresamente los términos anteriores.`
    },

    UI_MANDATO_ASESOR_VENDEDOR: {
        text_id: 'UI_MANDATO_ASESOR_VENDEDOR',
        version: '2025-12-14',
        language: 'es-ES',
        template: `AUTORIZACIÓN Y MANDATO DE ASESORÍA – PARTE VENDEDORA

Yo, {{NOMBRE_VENDEDOR}}, con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, en calidad de PARTE VENDEDORA en el expediente de contrato de arras número {{NUMERO_EXPEDIENTE}}, mediante el presente acto:

1. OTORGO mandato a {{NOMBRE_ASESOR}} (en adelante, el "Asesor") para actuar en mi nombre y representación en la plataforma Chrono-Flare, exclusivamente en relación con el expediente mencionado.

2. ALCANCE DEL MANDATO. El Asesor queda autorizado a:
   {{#SI_PUEDE_SUBIR_DOCS}}• Subir documentación en mi nombre{{/SI_PUEDE_SUBIR_DOCS}}
   {{#SI_PUEDE_INVITAR}}• Invitar a otros participantes al expediente{{/SI_PUEDE_INVITAR}}
   {{#SI_PUEDE_VALIDAR}}• Revisar y validar documentos{{/SI_PUEDE_VALIDAR}}
   {{#SI_PUEDE_FIRMAR}}• Firmar documentos en mi nombre (requiere autorización específica){{/SI_PUEDE_FIRMAR}}

3. LIMITACIONES. Este mandato:
   - Se limita exclusivamente al expediente indicado
   - No implica poder general de administración ni disposición
   - No autoriza la modificación de términos esenciales sin mi consentimiento expreso

4. REVOCABILIDAD. Puedo revocar este mandato en cualquier momento a través de la plataforma.

5. REGISTRO. Este otorgamiento queda sellado con marca de tiempo cualificada (QTSP) conforme al Reglamento (UE) 910/2014 (eIDAS).

Acepto expresamente los términos anteriores.`
    },

    UI_MANDATO_DUAL_ASESOR_COMUN: {
        text_id: 'UI_MANDATO_DUAL_ASESOR_COMUN',
        version: '2025-12-14',
        language: 'es-ES',
        template: `AUTORIZACIÓN Y MANDATO DE INTERMEDIACIÓN – ASESOR COMÚN DE AMBAS PARTES

ADVERTENCIA PREVIA: El asesor/agencia actúa como intermediario de AMBAS PARTES. Esto implica un deber de neutralidad e imparcialidad. Se recomienda consultar asesoramiento legal independiente.

Yo, {{NOMBRE_PARTE}}, con {{TIPO_DOCUMENTO}} número {{NUMERO_DOCUMENTO}}, en calidad de {{ROL_PARTE}} en el expediente de contrato de arras número {{NUMERO_EXPEDIENTE}}, mediante el presente acto:

1. CONSIENTO que {{NOMBRE_ASESOR}} (en adelante, el "Asesor Común") actúe como intermediario de ambas partes en la plataforma Chrono-Flare para el expediente mencionado.

2. RECONOZCO que:
   - El Asesor Común representa simultáneamente a comprador y vendedor
   - Existe un potencial conflicto de intereses que acepto expresamente
   - El Asesor debe actuar con imparcialidad y transparencia

3. ALCANCE. El Asesor Común queda autorizado a:
   {{#SI_PUEDE_SUBIR_DOCS}}• Subir documentación{{/SI_PUEDE_SUBIR_DOCS}}
   {{#SI_PUEDE_INVITAR}}• Gestionar participantes{{/SI_PUEDE_INVITAR}}
   {{#SI_PUEDE_VALIDAR}}• Coordinar la validación documental{{/SI_PUEDE_VALIDAR}}

4. LIMITACIONES ESPECIALES:
   - No puede favorecer a una parte sobre otra
   - Debe comunicar a ambas partes cualquier información relevante
   - No puede firmar en nombre de las partes sin autorización expresa de cada una

5. EFECTIVIDAD. Este mandato dual requiere la aceptación de AMBAS PARTES para surtir pleno efecto.

6. REGISTRO. Este otorgamiento queda sellado con marca de tiempo cualificada (QTSP).

Acepto expresamente los términos anteriores, con pleno conocimiento de la intermediación dual.`
    },

    UI_AUTORIZACION_NOTARIA: {
        text_id: 'UI_AUTORIZACION_NOTARIA',
        version: '2025-12-14',
        language: 'es-ES',
        template: `AUTORIZACIÓN DE ACCESO Y ACTUACIÓN NOTARIAL

Las partes del expediente de contrato de arras número {{NUMERO_EXPEDIENTE}}, mediante el presente acto:

1. AUTORIZAN a la Notaría {{NOMBRE_NOTARIA}}, con domicilio en {{DOMICILIO_NOTARIA}}, para acceder al expediente electrónico en la plataforma Chrono-Flare.

2. ALCANCE DE LA AUTORIZACIÓN. La Notaría queda autorizada a:
   • Acceder a toda la documentación del expediente en modo lectura
   • Subir documentos notariales: escrituras, copias simples, actas notariales
   • Validar documentos aportados por las partes
   • Comunicar el estado de tramitación de la escritura pública

3. FINALIDAD. Esta autorización tiene por objeto:
   • Facilitar la preparación de la escritura pública de compraventa
   • Verificar la documentación aportada
   • Coordinar la firma notarial

4. LIMITACIONES:
   - La Notaría no puede modificar documentos aportados por las partes
   - No puede invitar a terceros sin autorización expresa
   - Su actuación se limita a las funciones propias de la fe pública notarial

5. VIGENCIA. Esta autorización permanece vigente hasta la conclusión del expediente o su revocación expresa.

6. REGISTRO. Esta autorización queda sellada con marca de tiempo cualificada (QTSP) conforme al Reglamento (UE) 910/2014 (eIDAS).

Autorizado por las partes del expediente.`
    }
};

/**
 * Obtiene un texto legal por su ID
 */
export function getLegalText(textId: LegalTextId): LegalTextEntry {
    const entry = LEGAL_TEXTS[textId];
    if (!entry) {
        throw new Error(`Legal text not found: ${textId}`);
    }
    return entry;
}

/**
 * Renderiza un texto legal con variables
 */
export function renderLegalText(
    textId: LegalTextId,
    variables: Record<string, string>
): string {
    const entry = getLegalText(textId);
    let rendered = entry.template;

    // Reemplazar variables simples {{VAR}}
    for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Procesar bloques condicionales {{#SI_XXX}}...{{/SI_XXX}}
    const conditionalRegex = /{{#SI_(\w+)}}(.*?){{\/SI_\1}}/gs;
    rendered = rendered.replace(conditionalRegex, (match, varName, content) => {
        const isTrue = variables[`SI_${varName}`] === 'true' || variables[varName] === 'true';
        return isTrue ? content : '';
    });

    // Limpiar líneas vacías resultantes de condicionales
    rendered = rendered.replace(/\n\s*\n\s*\n/g, '\n\n');

    return rendered;
}

/**
 * Obtiene el text_id apropiado según el tipo de mandato
 */
export function getTextIdForMandatoTipo(
    mandatoTipo: 'PARTE_COMPRADORA' | 'PARTE_VENDEDORA' | 'AMBAS_PARTES' | 'NOTARIA'
): LegalTextId {
    switch (mandatoTipo) {
        case 'PARTE_COMPRADORA':
            return 'UI_MANDATO_ASESOR_COMPRADOR';
        case 'PARTE_VENDEDORA':
            return 'UI_MANDATO_ASESOR_VENDEDOR';
        case 'AMBAS_PARTES':
            return 'UI_MANDATO_DUAL_ASESOR_COMUN';
        case 'NOTARIA':
            return 'UI_AUTORIZACION_NOTARIA';
        default:
            throw new Error(`Unknown mandato tipo: ${mandatoTipo}`);
    }
}
