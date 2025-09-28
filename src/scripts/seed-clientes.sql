-- Script para insertar datos de ejemplo en la tabla deudores
-- Este script debe ejecutarse en Supabase SQL Editor

-- Insertar clientes de ejemplo
INSERT INTO deudores (
  nombre, 
  apellido, 
  cedula, 
  telefono, 
  direccion, 
  ocupacion, 
  estado,
  fecha_nacimiento,
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
  '1985-03-15',
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
  '1978-11-22',
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
  '1990-07-08',
  NOW()
),
(
  'Luis Fernando',
  'Ramírez Pérez',
  15234567,
  '300 123 4567',
  'Cra 15 # 18-35, Ciudad Bolívar, Bogotá',
  'Conductor',
  'activo',
  '1982-12-03',
  NOW()
),
(
  'María José',
  'Ruiz González',
  63345678,
  '310 456 7890',
  'Calle 80 # 102-45, Engativá, Bogotá',
  'Peluquera',
  'activo',
  '1988-05-17',
  NOW()
);

-- Verificar que los datos se insertaron correctamente
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
ORDER BY fecha_creacion DESC;
