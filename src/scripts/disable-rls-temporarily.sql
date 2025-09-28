-- Script para deshabilitar RLS temporalmente y solucionar el error de recursión
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

-- Deshabilitar RLS en todas las tablas principales
ALTER TABLE deudores DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE rutas DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma_pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_recibidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE base_diaria_cobradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacion_diaria DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_diarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE cobrador_ruta DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos_rutas_diarias DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'deudores', 'prestamos', 'rutas', 'empresas', 'usuarios',
    'cronograma_pagos', 'pagos_recibidos', 'base_diaria_cobradores',
    'conciliacion_diaria', 'gastos_diarios', 'tipos_gastos',
    'cobrador_ruta', 'prestamos_rutas_diarias'
)
ORDER BY tablename;

-- Probar consultas básicas
SELECT 'deudores' as tabla, COUNT(*) as registros FROM deudores
UNION ALL
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'prestamos' as tabla, COUNT(*) as registros FROM prestamos
UNION ALL
SELECT 'rutas' as tabla, COUNT(*) as registros FROM rutas
UNION ALL
SELECT 'empresas' as tabla, COUNT(*) as registros FROM empresas;
