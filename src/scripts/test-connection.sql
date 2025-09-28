-- Script para probar la conexión y insertar datos de prueba

-- 1. Verificar que las tablas existen y están accesibles
SELECT 'deudores' as tabla, COUNT(*) as registros FROM deudores;
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios;
SELECT 'prestamos' as tabla, COUNT(*) as registros FROM prestamos;
SELECT 'rutas' as tabla, COUNT(*) as registros FROM rutas;
SELECT 'empresas' as tabla, COUNT(*) as registros FROM empresas;

-- 2. Si no hay datos, insertar algunos registros de prueba
INSERT INTO deudores (
  nombre, 
  apellido, 
  cedula, 
  telefono, 
  direccion, 
  ocupacion, 
  estado,
  fecha_creacion
) VALUES 
(
  'Andrea',
  'Morales Jiménez',
  52456789,
  '315 234 5678',
  'Cra 68 # 42-15, Kennedy, Bogotá',
  'Comerciante',
  'activo',
  NOW()
),
(
  'Jorge',
  'Herrera Castro',
  79123456,
  '301 876 5432',
  'Calle 145 # 92-08, Suba, Bogotá',
  'Mecánico',
  'moroso',
  NOW()
),
(
  'Carolina',
  'Vargas López',
  41789234,
  '318 567 8901',
  'Tv 78 # 65-20, Bosa, Bogotá',
  'Vendedora',
  'activo',
  NOW()
)
ON CONFLICT (cedula) DO NOTHING;

-- 3. Verificar que los datos se insertaron
SELECT 
  id,
  nombre,
  apellido,
  cedula,
  telefono,
  direccion,
  ocupacion,
  estado,
  fecha_creacion
FROM deudores
ORDER BY fecha_creacion DESC
LIMIT 10;

-- 4. Probar una consulta simple que debería funcionar
SELECT COUNT(*) as total_deudores FROM deudores WHERE estado = 'activo';
