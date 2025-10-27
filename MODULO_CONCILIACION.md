# Módulo de Base Diaria y Conciliación

## Descripción General

El módulo de Base Diaria y Conciliación es un sistema que muestra en una **tabla por día** todos los movimientos de cada cobrador: préstamos realizados, cobros recibidos, seguros cobrados y gastos aprobados.

## Vista Principal: Tabla de Movimientos Diarios

La tabla muestra por cada día y cobrador:

| Columna | Descripción |
|---------|-------------|
| **Fecha** | Día del movimiento |
| **Cobrador** | Nombre del cobrador |
| **Ruta** | Ruta asignada |
| **Base** | Dinero inicial entregado al cobrador |
| **Prestado** | Total de préstamos desembolsados ese día (rojo, resta) |
| **Cobrado** | Total de cobros recibidos ese día (verde, suma) |
| **Seguros** | Total de seguros cobrados ese día (verde, suma) |
| **Gastos** | Total de gastos aprobados ese día (rojo, resta) |
| **Teórico** | Dinero que debería devolver según la fórmula |
| **Estado** | Pendiente o Conciliado |
| **Diferencia** | Sobrante/Faltante (solo si está conciliado) |
| **Acción** | Botón para conciliar |

## Fórmula de Conciliación

```
Dinero Teórico a Devolver = Base + Cobros + Seguros - Préstamos - Gastos
Diferencia = Dinero Efectivamente Devuelto - Dinero Teórico
```

### Ejemplo de Cálculo

```
Base Entregada:           $500,000
+ Cobros Realizados:      $300,000
+ Seguros:                $ 50,000
- Préstamos Nuevos:       $200,000
- Gastos Aprobados:       $ 30,000
= Teórico a Devolver:     $620,000

Efectivamente Devuelto:   $615,000
Diferencia (Faltante):    -$ 5,000 ❌
```

## Características Principales

### 1. Vista de Tabla Consolidada
- **Una fila por día y cobrador**: Toda la información consolidada en una sola vista
- **Cálculo automático**: El sistema calcula automáticamente los totales del día
- **Colores intuitivos**: 
  - 🟢 Verde para ingresos (cobros, seguros)
  - 🔴 Rojo para salidas (préstamos, gastos)
- **Fila de totales**: Al final de la tabla se suman todos los movimientos

### 2. Filtros Avanzados
Filtra la información por:
- **Rango de fechas**: Desde/hasta
- **Cobrador específico**: Ver solo un cobrador
- **Ruta específica**: Ver solo una ruta
- Por defecto muestra el día actual

### 3. Proceso de Conciliación Simple
1. En la tabla, identificar la fila a conciliar (estado "Pendiente")
2. Click en botón **"Conciliar"**
3. Se abre un diálogo con:
   - Resumen automático de movimientos del día
   - Campo para ingresar el dinero efectivamente devuelto
   - Selector de persona que entrega la base
   - Campo de observaciones
4. El sistema calcula automáticamente la diferencia
5. Guarda la conciliación con un click

## Estados y Badges

### Estados de Conciliación

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pendiente** | 🟡 Amarillo | Aún no se ha conciliado |
| **Cuadrado** | 🟢 Verde | Diferencia = 0, perfecto |
| **Sobrante** | 🔵 Azul | Diferencia > 0, hay más dinero |
| **Faltante** | 🔴 Rojo | Diferencia < 0, falta dinero |
| **Auditoría** | 🟠 Naranja | Diferencia > $50,000, requiere revisión |

## Flujo de Uso

### Uso Diario Típico

1. **Al inicio del día:**
   - El supervisor entrega la base al cobrador
   - Se registra en el sistema (módulo de Rutas)

2. **Durante el día:**
   - Se registran préstamos desembolsados
   - Se registran pagos recibidos
   - Se registran gastos realizados

3. **Al final del día:**
   - Ir a **Base Diaria** desde el menú
   - La tabla muestra automáticamente los movimientos del día
   - Click en **"Conciliar"** para cada cobrador
   - Ingresar el dinero que devuelve el cobrador
   - Revisar la diferencia calculada
   - Guardar la conciliación

### Revisión de Días Anteriores

1. Usar los filtros de fecha para seleccionar el rango deseado
2. La tabla mostrará todos los movimientos del período
3. Las filas conciliadas muestran la diferencia final
4. Las pendientes aún pueden conciliarse

## Ventajas de este Diseño

✅ **Vista consolidada**: Toda la información en una sola tabla
✅ **Cálculo automático**: No hay que hacer cuentas manualmente
✅ **Fila de totales**: Sumas totales para análisis rápido
✅ **Estados visuales**: Identificación rápida con colores
✅ **Filtros flexibles**: Buscar por fecha, cobrador o ruta
✅ **Historial completo**: Ver conciliaciones pasadas
✅ **Auditoría automática**: Detecta diferencias grandes

## Datos que se Calculan Automáticamente

El sistema calcula en tiempo real:

1. **Total Prestado**: Suma de todos los préstamos desembolsados ese día en esa ruta
2. **Total Cobrado**: Suma de todos los pagos recibidos ese día en esa ruta
3. **Total Seguros**: Valor ingresado manualmente al conciliar (ya que puede variar)
4. **Total Gastos**: Suma de gastos aprobados ese día en esa ruta
5. **Dinero Teórico**: Cálculo según la fórmula
6. **Diferencia**: Solo después de conciliar, compara lo devuelto vs lo teórico

## Estructura de la Base de Datos

### Tabla: `conciliacion_diaria`

La conciliación se guarda con:
- Referencia a la base diaria
- Todos los totales calculados
- Dinero efectivamente devuelto
- Diferencia calculada
- Estado de conciliación (cuadrado/sobrante/faltante/auditoría)
- Persona que entregó la base
- Usuario que concilió
- Observaciones

## Mejores Prácticas

1. **Conciliar al final del día**: Procesar cada día antes de iniciar el siguiente
2. **Verificar cálculos**: Revisar que los totales de la tabla coincidan con registros físicos
3. **Documentar diferencias**: Siempre agregar observaciones si hay sobrante o faltante
4. **Revisar auditorías**: Atender inmediatamente diferencias mayores a $50,000
5. **Usar filtros**: Para análisis de períodos o cobradores específicos

## Interfaz de Usuario

### Diseño
- Tabla responsiva con scroll horizontal
- Colores diferenciados para ingresos/egresos
- Badges con iconos para estados
- Diálogo modal para conciliación
- Resumen automático en el diálogo
- Alerta visual de la diferencia calculada

### Accesibilidad
- Navegación por teclado
- Colores con suficiente contraste
- Etiquetas descriptivas
- Tooltips informativos

## Soporte Técnico

### Archivos del Módulo

```
src/
├── pages/
│   └── BaseDiaria.tsx           # Página principal con tabla
├── types/
│   └── conciliacion.ts          # Interfaces TypeScript
└── hooks/
    └── useConciliacion.ts        # Hooks (si se necesitan más adelante)
```

### Consultas SQL Importantes

El sistema realiza consultas para:
1. Obtener bases diarias del período
2. Sumar pagos del día por ruta
3. Sumar préstamos del día por ruta
4. Sumar gastos aprobados del día por ruta
5. Verificar si existe conciliación

Todo se consolida en una sola vista de tabla.

## Ejemplo Visual de la Tabla

```
┌────────────┬──────────────┬─────────┬──────────┬──────────┬─────────┬─────────┬─────────┬─────────┬──────────┬────────────┬─────────┐
│   Fecha    │   Cobrador   │  Ruta   │   Base   │ Prestado │ Cobrado │ Seguros │ Gastos  │ Teórico │  Estado  │ Diferencia │ Acción  │
├────────────┼──────────────┼─────────┼──────────┼──────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────────┼─────────┤
│ 27/10/2024 │ Juan Pérez   │ Centro  │ $500,000 │ $200,000 │ $300,000│ $50,000 │ $30,000 │ $620,000│ Cuadrado │    $0      │ ✅      │
│ 27/10/2024 │ María López  │ Norte   │ $400,000 │ $150,000 │ $250,000│ $40,000 │ $25,000 │ $515,000│ Sobrante │ +$10,000   │ ✅      │
│ 27/10/2024 │ Pedro Gómez  │ Sur     │ $600,000 │ $300,000 │ $400,000│ $60,000 │ $40,000 │ $720,000│ Pendiente│     -      │[Conciliar]│
└────────────┴──────────────┴─────────┴──────────┴──────────┴─────────┴─────────┴─────────┴─────────┴──────────┴────────────┴─────────┘
                                       TOTALES:  │$1,500,000│ $650,000 │ $950,000│ $150,000│ $95,000 │$1,855,000│            │ +$10,000 │
```

## Notas Importantes

- La tabla se actualiza automáticamente al cambiar los filtros
- Los movimientos pendientes pueden conciliarse en cualquier momento
- Las conciliaciones guardadas no se pueden modificar (solo consultar)
- La diferencia solo aparece después de conciliar
- Los totales se calculan sumando todas las filas visibles

¡El módulo está diseñado para ser simple, rápido y visual! 🎯
