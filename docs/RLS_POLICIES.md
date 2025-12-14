# Supabase RLS Policies

Políticas de Row Level Security para implementar manualmente en Supabase Dashboard.

> [!IMPORTANT]
> Estas políticas aseguran que solo usuarios autenticados con permisos correctos puedan acceder/modificar datos.

---

## eventos

```sql
-- Solo miembros del contrato pueden ver eventos
CREATE POLICY "Eventos: read for participants" ON eventos
FOR SELECT USING (
  contrato_id IN (
    SELECT cp.contrato_id FROM contratos_partes cp
    JOIN partes p ON cp.parte_id = p.id
    WHERE p.usuario_id = auth.uid() OR p.email = auth.jwt()->>'email'
  )
);

-- Solo sistema puede insertar eventos (via service role)
CREATE POLICY "Eventos: insert via service role" ON eventos
FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## archivos

```sql
-- Solo miembros del contrato pueden ver archivos
CREATE POLICY "Archivos: read for participants" ON archivos
FOR SELECT USING (
  contrato_id IN (
    SELECT cp.contrato_id FROM contratos_partes cp
    JOIN partes p ON cp.parte_id = p.id
    WHERE p.usuario_id = auth.uid() OR p.email = auth.jwt()->>'email'
  )
);

-- Participantes pueden subir archivos
CREATE POLICY "Archivos: insert for participants" ON archivos
FOR INSERT WITH CHECK (
  contrato_id IN (
    SELECT cp.contrato_id FROM contratos_partes cp
    JOIN partes p ON cp.parte_id = p.id
    WHERE p.usuario_id = auth.uid()
  )
);
```

---

## contratos_arras

```sql
-- Solo miembros pueden ver su contrato
CREATE POLICY "Contratos: read for participants" ON contratos_arras
FOR SELECT USING (
  id IN (
    SELECT cp.contrato_id FROM contratos_partes cp
    JOIN partes p ON cp.parte_id = p.id
    WHERE p.usuario_id = auth.uid() OR p.email = auth.jwt()->>'email'
  )
);
```

---

## Storage: documentos bucket

```sql
-- En Storage > Policies para bucket 'documentos':

-- Read: participantes del contrato
((bucket_id = 'documentos') AND (
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM contratos_arras WHERE id IN (
      SELECT contrato_id FROM contratos_partes cp
      JOIN partes p ON cp.parte_id = p.id
      WHERE p.usuario_id = auth.uid()
    )
  )
))

-- Write: participantes del contrato
((bucket_id = 'documentos') AND (
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM contratos_arras WHERE id IN (
      SELECT contrato_id FROM contratos_partes cp
      JOIN partes p ON cp.parte_id = p.id
      WHERE p.usuario_id = auth.uid()
    )
  )
))
```

---

## Implementación

1. Ir a Supabase Dashboard > Database > Policies
2. Crear cada política copiando el SQL
3. Habilitar RLS en cada tabla: `ALTER TABLE nombre ENABLE ROW LEVEL SECURITY;`
