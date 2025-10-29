# Uso del Componente DataTable Genérico

Este documento explica cómo usar los componentes de tabla genéricos `DataTable`, `DataTableRow` y `DataTableCell` en tu aplicación.

## Componentes Disponibles

### 1. DataTable
Componente principal de tabla con paginación integrada.

### 2. DataTableRow
Componente para renderizar filas personalizadas.

### 3. DataTableCell
Componente para celdas individuales dentro de una fila.

## Instalación

Los componentes ya están disponibles en:
- `@/components/ui/data-table`
- `@/components/ui/data-table-row`

## Ejemplo Básico

```tsx
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { DataTableRow, DataTableCell } from '@/components/ui/data-table-row'
import { usePagination } from '@/hooks/usePagination'

interface MiDato {
  id: string
  nombre: string
  email: string
  estado: string
}

function MiComponente() {
  const [datos, setDatos] = useState<MiDato[]>([])
  const [loading, setLoading] = useState(false)
  
  // Hook de paginación
  const { paginatedData, pagination, controls } = usePagination(datos, 10)
  
  // Definir columnas
  const columnas: DataTableColumn<MiDato>[] = [
    { key: 'nombre', header: 'Nombre', className: 'col-span-3 font-bold' },
    { key: 'email', header: 'Email', className: 'col-span-4' },
    { key: 'estado', header: 'Estado', className: 'col-span-2 text-center' },
    { key: 'acciones', header: 'Acciones', className: 'col-span-3 text-center' },
  ]
  
  // Renderizar cada fila
  const renderFila = (dato: MiDato) => (
    <DataTableRow gridCols="grid-cols-12">
      <DataTableCell className="col-span-3 font-medium">
        {dato.nombre}
      </DataTableCell>
      
      <DataTableCell className="col-span-4 text-muted-foreground">
        {dato.email}
      </DataTableCell>
      
      <DataTableCell className="col-span-2 text-center">
        <Badge>{dato.estado}</Badge>
      </DataTableCell>
      
      <DataTableCell className="col-span-3 text-center">
        <Button size="sm">Ver</Button>
      </DataTableCell>
    </DataTableRow>
  )
  
  return (
    <DataTable
      columns={columnas}
      data={paginatedData}
      loading={loading}
      error={null}
      emptyMessage="No hay datos"
      emptyDescription="No se encontraron registros"
      renderRow={renderFila}
      pagination={pagination}
      paginationControls={controls}
      showPagination={true}
      itemsPerPageOptions={[5, 10, 20, 50]}
      gridCols="grid-cols-12"
      showHeader={true}
    />
  )
}
```

## Props del DataTable

| Prop | Tipo | Descripción | Requerido | Default |
|------|------|-------------|-----------|---------|
| `columns` | `DataTableColumn<T>[]` | Definición de columnas | ✅ | - |
| `data` | `T[]` | Datos a mostrar | ✅ | - |
| `loading` | `boolean` | Estado de carga | ❌ | `false` |
| `error` | `string \| null` | Mensaje de error | ❌ | `null` |
| `emptyMessage` | `string` | Mensaje cuando no hay datos | ❌ | "No se encontraron resultados" |
| `emptyDescription` | `string` | Descripción del estado vacío | ❌ | "No hay datos para mostrar" |
| `renderRow` | `(item: T) => ReactNode` | Función para renderizar filas | ✅ | - |
| `pagination` | `PaginationState` | Estado de paginación | ❌ | - |
| `paginationControls` | `PaginationControls` | Controles de paginación | ❌ | - |
| `showPagination` | `boolean` | Mostrar paginación | ❌ | `true` |
| `itemsPerPageOptions` | `number[]` | Opciones de items por página | ❌ | `[5, 10, 20, 50]` |
| `gridCols` | `string` | Clases de grid de Tailwind | ❌ | `"grid-cols-12"` |
| `showHeader` | `boolean` | Mostrar encabezados | ❌ | `true` |

## DataTableColumn Interface

```typescript
interface DataTableColumn<T> {
  key: string              // Identificador único de la columna
  header: string           // Texto del encabezado
  className?: string       // Clases CSS de Tailwind para el encabezado
  render?: (item: T) => ReactNode  // (Opcional) Función de renderizado personalizada
}
```

## Props del DataTableRow

| Prop | Tipo | Descripción | Default |
|------|------|-------------|---------|
| `children` | `ReactNode` | Contenido de la fila | - |
| `gridCols` | `string` | Clases de grid | `"grid-cols-12"` |
| `className` | `string` | Clases adicionales | `""` |
| `onClick` | `() => void` | Manejador de click | - |

## Props del DataTableCell

| Prop | Tipo | Descripción | Default |
|------|------|-------------|---------|
| `children` | `ReactNode` | Contenido de la celda | - |
| `className` | `string` | Clases CSS | `""` |
| `onClick` | `(e: React.MouseEvent) => void` | Manejador de click | - |

## Hook usePagination

```typescript
const { paginatedData, pagination, controls } = usePagination(datos, itemsPorPagina)
```

### Retorna:

#### `paginatedData`
Array de datos de la página actual.

#### `pagination` (PaginationState)
```typescript
{
  currentPage: number      // Página actual
  itemsPerPage: number     // Items por página
  totalItems: number       // Total de items
  totalPages: number       // Total de páginas
  from: number            // Índice del primer item
  to: number              // Índice del último item
}
```

#### `controls` (PaginationControls)
```typescript
{
  goToPage: (page: number) => void    // Ir a página específica
  nextPage: () => void                 // Página siguiente
  prevPage: () => void                 // Página anterior
  goToFirstPage: () => void           // Primera página
  goToLastPage: () => void            // Última página
  setItemsPerPage: (items: number) => void  // Cambiar items por página
}
```

## Ejemplos Avanzados

### Tabla con Acciones y Click en Fila

```tsx
const renderFila = (item: MiDato) => (
  <DataTableRow
    gridCols="grid-cols-12"
    onClick={() => navigate(`/detalle/${item.id}`)}
    className="cursor-pointer"
  >
    <DataTableCell className="col-span-4">{item.nombre}</DataTableCell>
    <DataTableCell className="col-span-4">{item.email}</DataTableCell>
    <DataTableCell 
      className="col-span-4 text-center"
      onClick={(e) => e.stopPropagation()} // Prevenir click en fila
    >
      <Button size="sm" onClick={() => handleDelete(item.id)}>
        Eliminar
      </Button>
    </DataTableCell>
  </DataTableRow>
)
```

### Tabla con Colores Condicionales

```tsx
const renderFila = (item: Prestamo) => (
  <DataTableRow
    gridCols="grid-cols-12"
    className={item.cuotasVencidas > 0 ? 'bg-red-50' : ''}
  >
    <DataTableCell className="col-span-3">{item.numero}</DataTableCell>
    <DataTableCell className={`col-span-3 ${item.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
      {formatCurrency(item.saldo)}
    </DataTableCell>
    <DataTableCell className="col-span-6">
      {item.cuotasVencidas > 0 && (
        <Badge variant="destructive">
          {item.cuotasVencidas} cuotas vencidas
        </Badge>
      )}
    </DataTableCell>
  </DataTableRow>
)
```

### Tabla sin Paginación

```tsx
<DataTable
  columns={columnas}
  data={todosLosDatos}  // Pasar todos los datos directamente
  loading={loading}
  renderRow={renderFila}
  showPagination={false}  // Ocultar paginación
  gridCols="grid-cols-8"
/>
```

### Grid Personalizado

```tsx
// Definir grid personalizado (total debe ser 12 o el número que uses)
const columnas: DataTableColumn<T>[] = [
  { key: 'col1', header: 'Col 1', className: 'col-span-2' },    // 2/12
  { key: 'col2', header: 'Col 2', className: 'col-span-3' },    // 3/12
  { key: 'col3', header: 'Col 3', className: 'col-span-4' },    // 4/12
  { key: 'col4', header: 'Col 4', className: 'col-span-3' },    // 3/12
]

const renderFila = (item: T) => (
  <DataTableRow gridCols="grid-cols-12">
    <DataTableCell className="col-span-2">...</DataTableCell>
    <DataTableCell className="col-span-3">...</DataTableCell>
    <DataTableCell className="col-span-4">...</DataTableCell>
    <DataTableCell className="col-span-3">...</DataTableCell>
  </DataTableRow>
)
```

## Buenas Prácticas

### 1. Usar Tipos TypeScript
```typescript
interface MiDato {
  id: string  // ¡Siempre incluir un ID único!
  // ... otros campos
}

const columnas: DataTableColumn<MiDato>[] = [...]
```

### 2. Memoizar Funciones de Renderizado
```typescript
const renderFila = useCallback((item: MiDato) => (
  <DataTableRow>
    {/* ... */}
  </DataTableRow>
), []) // Agregar dependencias si las hay
```

### 3. Mantener Consistencia en el Grid
Asegúrate de que las columnas sumen el total del grid:
```typescript
// ✅ Correcto (2 + 4 + 3 + 3 = 12)
grid-cols-12
col-span-2, col-span-4, col-span-3, col-span-3

// ❌ Incorrecto (2 + 4 + 4 + 4 = 14 > 12)
grid-cols-12
col-span-2, col-span-4, col-span-4, col-span-4
```

### 4. Agregar Keys Únicas
Siempre asegúrate de que tus datos tengan un campo `id` único.

### 5. Manejo de Estados
```typescript
// Estado de carga
{loading && <Skeleton />}

// Estado de error
{error && <Alert variant="destructive">{error}</Alert>}

// Estado vacío
{!loading && !error && data.length === 0 && <EmptyState />}
```

## Páginas de Ejemplo

Revisa estos archivos para ver implementaciones completas:

1. **BaseDiaria.tsx** - Tabla con clicks en filas, colores condicionales y navegación
2. **Prestamos.tsx** - Tabla básica con paginación (puede ser refactorizada)
3. **Clientes.tsx** - Tabla simple (puede usar el componente genérico)

## Notas Importantes

⚠️ **Requisitos del Tipo de Datos:**
- Tu tipo de datos DEBE tener un campo `id` de tipo `string` o `number`
- El id debe ser único para cada registro

⚠️ **Grid System:**
- Por defecto usa `grid-cols-12` (Tailwind CSS)
- Puedes usar otros valores como `grid-cols-6`, `grid-cols-8`, etc.
- Las columnas siempre deben sumar el total del grid

⚠️ **Paginación:**
- El hook `usePagination` maneja automáticamente el estado
- Los controles incluyen navegación por páginas y cambio de items por página
- Se resetea a la página 1 cuando cambian los datos

## Soporte

Para preguntas o problemas, revisa:
- Componentes en `src/components/ui/`
- Hook en `src/hooks/usePagination.ts`
- Ejemplo completo en `src/pages/BaseDiaria.tsx`

