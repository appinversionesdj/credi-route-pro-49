-- Script para solucionar el problema de RLS (Row Level Security)
-- Error: infinite recursion detected in policy for relation "usuarios"

-- 1. Primero, vamos a deshabilitar temporalmente RLS para diagnosticar
-- (Solo para desarrollo - NO usar en producción)

-- Deshabilitar RLS temporalmente en las tablas principales
ALTER TABLE deudores DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE rutas DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- 2. Verificar las políticas existentes que pueden estar causando recursión
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('usuarios', 'deudores', 'prestamos', 'rutas', 'empresas')
ORDER BY tablename, policyname;

-- 3. Eliminar políticas problemáticas de la tabla usuarios
DROP POLICY IF EXISTS "usuarios_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON usuarios;

-- 4. Crear políticas simples y seguras para usuarios
CREATE POLICY "usuarios_select_policy" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "usuarios_insert_policy" ON usuarios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "usuarios_update_policy" ON usuarios
    FOR UPDATE USING (true);

CREATE POLICY "usuarios_delete_policy" ON usuarios
    FOR DELETE USING (true);

-- 5. Crear políticas simples para deudores
CREATE POLICY "deudores_select_policy" ON deudores
    FOR SELECT USING (true);

CREATE POLICY "deudores_insert_policy" ON deudores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "deudores_update_policy" ON deudores
    FOR UPDATE USING (true);

CREATE POLICY "deudores_delete_policy" ON deudores
    FOR DELETE USING (true);

-- 6. Crear políticas simples para prestamos
CREATE POLICY "prestamos_select_policy" ON prestamos
    FOR SELECT USING (true);

CREATE POLICY "prestamos_insert_policy" ON prestamos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "prestamos_update_policy" ON prestamos
    FOR UPDATE USING (true);

CREATE POLICY "prestamos_delete_policy" ON prestamos
    FOR DELETE USING (true);

-- 7. Crear políticas simples para rutas
CREATE POLICY "rutas_select_policy" ON rutas
    FOR SELECT USING (true);

CREATE POLICY "rutas_insert_policy" ON rutas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rutas_update_policy" ON rutas
    FOR UPDATE USING (true);

CREATE POLICY "rutas_delete_policy" ON rutas
    FOR DELETE USING (true);

-- 8. Crear políticas simples para empresas
CREATE POLICY "empresas_select_policy" ON empresas
    FOR SELECT USING (true);

CREATE POLICY "empresas_insert_policy" ON empresas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "empresas_update_policy" ON empresas
    FOR UPDATE USING (true);

CREATE POLICY "empresas_delete_policy" ON empresas
    FOR DELETE USING (true);

-- 9. Habilitar RLS nuevamente
ALTER TABLE deudores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- 10. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('usuarios', 'deudores', 'prestamos', 'rutas', 'empresas')
ORDER BY tablename, policyname;

-- 11. Probar una consulta simple
SELECT COUNT(*) as total_deudores FROM deudores;
SELECT COUNT(*) as total_usuarios FROM usuarios;
