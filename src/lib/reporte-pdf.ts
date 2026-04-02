import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DashboardConsolidado, DashboardData } from '@/hooks/useDashboard'
import { formatCOPFull } from '@/lib/contabilidad-utils'

// ─── Paleta de colores corporativa ────────────────────────────────────────────
const COLOR = {
  azul:       [30,  41,  82]  as [number, number, number],
  azulClaro:  [59,  79, 148]  as [number, number, number],
  verde:      [22, 163, 74]   as [number, number, number],
  rojo:       [220, 38,  38]  as [number, number, number],
  amarillo:   [202, 138,  4]  as [number, number, number],
  grisOscuro: [30,  30,  30]  as [number, number, number],
  grisMedio:  [100, 100, 100] as [number, number, number],
  grisSuave:  [245, 247, 250] as [number, number, number],
  blanco:     [255, 255, 255] as [number, number, number],
  lineaTabla: [220, 225, 235] as [number, number, number],
}

function fmt(v: number) {
  return formatCOPFull(v)
}

function colorUtilidad(v: number): [number, number, number] {
  return v > 0 ? COLOR.verde : v < 0 ? COLOR.rojo : COLOR.grisMedio
}

// ─── Encabezado de página ────────────────────────────────────────────────────
function dibujarHeader(
  doc: jsPDF,
  mesLabel: string,
  rutasLabel: string,
  pageNum: number,
  totalPages: number
) {
  const W = doc.internal.pageSize.getWidth()

  // Banda superior azul
  doc.setFillColor(...COLOR.azul)
  doc.rect(0, 0, W, 22, 'F')

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLOR.blanco)
  doc.text('CREDI RUTA — Reporte Ejecutivo', 14, 9)

  // Período
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 210, 240)
  doc.text(`Período: ${mesLabel}  |  ${rutasLabel}`, 14, 16.5)

  // Número de página
  doc.setFontSize(8)
  doc.setTextColor(200, 210, 240)
  doc.text(`Pág. ${pageNum} / ${totalPages}`, W - 14, 16.5, { align: 'right' })

  // Fecha de generación
  const ahora = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  doc.text(`Generado: ${ahora}`, W - 14, 9, { align: 'right' })
}

// ─── Pie de página ────────────────────────────────────────────────────────────
function dibujarFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(...COLOR.azul)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(180, 190, 220)
  doc.text('Documento confidencial — Uso interno exclusivo', 14, H - 3.5)
  doc.text('CrediRuta © ' + new Date().getFullYear(), W - 14, H - 3.5, { align: 'right' })
}

// ─── Título de sección ────────────────────────────────────────────────────────
function seccion(doc: jsPDF, titulo: string, y: number): number {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...COLOR.azulClaro)
  doc.rect(14, y, W - 28, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR.blanco)
  doc.text(titulo.toUpperCase(), 18, y + 4.7)
  return y + 12
}

// ─── Fila KPI inline (label + valor) ─────────────────────────────────────────
function filaKPI(
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  w: number,
  colorValor?: [number, number, number]
) {
  doc.setFillColor(...COLOR.grisSuave)
  doc.roundedRect(x, y, w, 9, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR.grisMedio)
  doc.text(label, x + 3, y + 5.8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...(colorValor ?? COLOR.grisOscuro))
  doc.text(valor, x + w - 3, y + 5.8, { align: 'right' })
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
export function generarReportePDF(
  data: DashboardData,
  filtros: { fechaInicio: string; fechaFin: string; rutaIds: string[] },
  rutasNombres: string[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const MAR = 14
  const CONTENT_W = W - MAR * 2

  const mesLabel = filtros.fechaInicio === filtros.fechaFin
    ? filtros.fechaInicio
    : `${filtros.fechaInicio} al ${filtros.fechaFin}`
  const rutasLabel =
    rutasNombres.length === 0 || filtros.rutaIds.length === 0
      ? 'Todas las rutas'
      : rutasNombres.join(', ')

  // ── Página 1: KPIs + Performance ─────────────────────────────────────────
  dibujarHeader(doc, mesLabel, rutasLabel, 1, 3)
  dibujarFooter(doc)

  const c = data.consolidado
  let y = 30

  // ── SECCIÓN 1: Indicadores Clave ──────────────────────────────────────────
  y = seccion(doc, 'Indicadores Clave del Período', y)

  const colW = (CONTENT_W - 6) / 4
  const kpis1 = [
    { label: 'Cartera Total',       valor: fmt(c.cartera),              color: COLOR.azulClaro },
    { label: 'Caja Actual',         valor: fmt(c.cajaActual),           color: c.cajaActual >= 0 ? COLOR.verde : COLOR.rojo },
    { label: 'Préstamos Realizados', valor: String(c.prestamosRealizados), color: COLOR.grisOscuro },
    { label: 'Préstamos Pagados',   valor: String(c.prestamosPagados),  color: COLOR.verde },
  ]
  kpis1.forEach((k, i) => {
    filaKPI(doc, k.label, k.valor, MAR + i * (colW + 2), y, colW, k.color)
  })
  y += 13

  const kpis2 = [
    { label: 'Ingresos por Intereses', valor: fmt(c.intereses),     color: COLOR.verde },
    { label: 'Ingresos por Seguros',   valor: fmt(c.seguros),       color: COLOR.verde },
    { label: 'Gastos Totales',         valor: fmt(c.totalGastos),   color: COLOR.amarillo },
    { label: 'Utilidad Neta',          valor: fmt(c.utilidadNeta),  color: colorUtilidad(c.utilidadNeta) },
  ]
  kpis2.forEach((k, i) => {
    filaKPI(doc, k.label, k.valor, MAR + i * (colW + 2), y, colW, k.color)
  })
  y += 13

  const kpis3 = [
    { label: 'Capital Invertido',     valor: fmt(c.inversionTotal),   color: COLOR.azulClaro },
    { label: 'Monto Saldado',         valor: fmt(c.valorSaldado),     color: COLOR.amarillo },
    { label: 'Devolución de Ruta',    valor: fmt(c.devolucionRuta),   color: COLOR.verde },
    { label: 'Tasa de Morosidad',     valor: `${c.tasaMorosidad}%`,   color: c.tasaMorosidad > 15 ? COLOR.rojo : c.tasaMorosidad > 0 ? COLOR.amarillo : COLOR.verde },
  ]
  kpis3.forEach((k, i) => {
    filaKPI(doc, k.label, k.valor, MAR + i * (colW + 2), y, colW, k.color)
  })
  y += 16

  // ── SECCIÓN 2: Performance por Ruta ──────────────────────────────────────
  y = seccion(doc, 'Performance por Ruta', y)

  if (data.porRuta.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MAR, right: MAR },
      head: [[
        'Ruta', 'Cartera', 'Caja', 'P. Realizados', 'Intereses',
        'Seguros', 'Gastos', 'Util. Neta', 'Morosidad',
      ]],
      body: data.porRuta.map((r) => [
        r.nombreRuta,
        fmt(r.cartera),
        fmt(r.cajaActual),
        `${r.prestamosRealizados} (${fmt(r.montoPrestado)})`,
        fmt(r.intereses),
        fmt(r.seguros),
        fmt(r.totalGastos),
        fmt(r.utilidadNeta),
        `${r.tasaMorosidad}%`,
      ]),
      foot: [[
        'TOTAL',
        fmt(c.cartera),
        fmt(c.cajaActual),
        `${c.prestamosRealizados}`,
        fmt(c.intereses),
        fmt(c.seguros),
        fmt(c.totalGastos),
        fmt(c.utilidadNeta),
        `${c.tasaMorosidad}%`,
      ]],
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        font: 'helvetica',
        textColor: COLOR.grisOscuro,
        lineColor: COLOR.lineaTabla,
        lineWidth: 0.2,
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: COLOR.azul,
        textColor: COLOR.blanco,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      footStyles: {
        fillColor: COLOR.azulClaro,
        textColor: COLOR.blanco,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: COLOR.grisSuave },
      columnStyles: {
        0: { cellWidth: 28 },
        7: {
          textColor: c.utilidadNeta > 0 ? COLOR.verde : COLOR.rojo,
          fontStyle: 'bold',
        },
        8: { halign: 'center' },
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 7) {
          const ruta = data.porRuta[hookData.row.index]
          if (ruta) {
            hookData.cell.styles.textColor = ruta.utilidadNeta > 0 ? COLOR.verde : COLOR.rojo
          }
        }
        if (hookData.section === 'body' && hookData.column.index === 8) {
          const ruta = data.porRuta[hookData.row.index]
          if (ruta) {
            hookData.cell.styles.textColor =
              ruta.tasaMorosidad > 15 ? COLOR.rojo
              : ruta.tasaMorosidad > 0 ? COLOR.amarillo
              : COLOR.verde
          }
        }
      },
    })
  }

  // ── Página 2: PyG + Salud ─────────────────────────────────────────────────
  doc.addPage()
  dibujarHeader(doc, mesLabel, rutasLabel, 2, 3)
  dibujarFooter(doc)

  y = 30
  y = seccion(doc, 'Estado de Pérdidas y Ganancias', y)

  const pyg = data.pyg
  const COL_L = MAR
  const COL_R = W / 2 + 2
  const COL_W_HALF = CONTENT_W / 2 - 3

  // ── Columna izquierda: detalle ─────────────────────────────────────────
  const startY = y
  let yL = y

  // Ingresos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.azulClaro)
  doc.text('INGRESOS', COL_L, yL)
  yL += 5

  const ingresos = [
    { label: 'Intereses acumulados', valor: pyg.interesesAcumulados },
    { label: 'Seguros cobrados',     valor: pyg.segurosCobrados },
  ]
  ingresos.forEach((row) => {
    filaKPI(doc, `(+)  ${row.label}`, fmt(row.valor), COL_L, yL, COL_W_HALF, COLOR.verde)
    yL += 11
  })

  // Utilidad Bruta
  doc.setFillColor(...COLOR.azulClaro)
  doc.roundedRect(COL_L, yL, COL_W_HALF, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR.blanco)
  doc.text('Utilidad Bruta', COL_L + 3, yL + 6.5)
  doc.text(fmt(pyg.utilidadBruta), COL_L + COL_W_HALF - 3, yL + 6.5, { align: 'right' })
  yL += 14

  // Gastos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.rojo)
  doc.text('GASTOS OPERATIVOS', COL_L, yL)
  yL += 5

  if (pyg.detalleGastos.length > 0) {
    pyg.detalleGastos.forEach((g) => {
      filaKPI(doc, `(-)  ${g.nombre}`, fmt(g.monto), COL_L, yL, COL_W_HALF, COLOR.rojo)
      yL += 11
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR.grisMedio)
    doc.text('Sin gastos en el período', COL_L + 3, yL + 4)
    yL += 9
  }

  if (pyg.movimientosCapital > 0) {
    yL += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.amarillo)
    doc.text('MOVIMIENTOS DE CAPITAL', COL_L, yL)
    yL += 5

    pyg.detalleMovimientosCapital.forEach((m) => {
      filaKPI(doc, `(-)  ${m.nombre}`, fmt(m.monto), COL_L, yL, COL_W_HALF, COLOR.amarillo)
      yL += 11
    })
  }

  // ── Columna derecha: resultados ───────────────────────────────────────
  let yR = startY

  const tarjetaResultado = (
    titulo: string,
    valor: number,
    color: [number, number, number],
    xPos: number,
    yPos: number,
    wCard: number
  ) => {
    doc.setFillColor(...color)
    doc.roundedRect(xPos, yPos, wCard, 22, 3, 3, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255, 0.7)
    doc.setTextColor(220, 235, 255)
    doc.text(titulo, xPos + 4, yPos + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...COLOR.blanco)
    doc.text(fmt(valor), xPos + 4, yPos + 17)
    return yPos + 26
  }

  yR = tarjetaResultado('Utilidad Bruta', pyg.utilidadBruta, COLOR.azulClaro, COL_R, yR, COL_W_HALF)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR.rojo)
  doc.text(`(−) Gastos Operativos: ${fmt(pyg.totalGastos)}`, COL_R, yR)
  yR += 8

  yR = tarjetaResultado('Utilidad Operativa', pyg.utilidadOperativa, COLOR.azulClaro, COL_R, yR, COL_W_HALF)

  if (pyg.movimientosCapital > 0) {
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR.amarillo)
    doc.text(`(−) Movimientos capital: ${fmt(pyg.movimientosCapital)}`, COL_R, yR)
    yR += 8
  }

  // Tarjeta Utilidad Neta — grande
  const utilColor: [number, number, number] = pyg.utilidadNeta >= 0 ? COLOR.verde : COLOR.rojo
  doc.setFillColor(...utilColor)
  doc.roundedRect(COL_R, yR, COL_W_HALF, 28, 3, 3, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 255, 220)
  doc.text('UTILIDAD NETA', COL_R + 4, yR + 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLOR.blanco)
  doc.text(fmt(pyg.utilidadNeta), COL_R + 4, yR + 21)
  if (pyg.utilidadBruta > 0) {
    const margen = Math.round((pyg.utilidadNeta / pyg.utilidadBruta) * 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(200, 240, 200)
    doc.text(`Margen: ${margen}% de la utilidad bruta`, COL_R + 4, yR + 27)
  }

  // ── Página 3: Salud de Cartera ────────────────────────────────────────────
  doc.addPage()
  dibujarHeader(doc, mesLabel, rutasLabel, 3, 3)
  dibujarFooter(doc)

  y = 30
  y = seccion(doc, 'Salud de la Cartera', y)

  // Morosidad
  const moroColor: [number, number, number] =
    c.tasaMorosidad === 0 ? COLOR.verde
    : c.tasaMorosidad <= 15 ? COLOR.amarillo
    : COLOR.rojo

  doc.setFillColor(...moroColor)
  doc.roundedRect(MAR, y, CONTENT_W, 18, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR.blanco)
  doc.text(`Tasa de Morosidad: ${c.tasaMorosidad}%`, MAR + 6, y + 11)
  const moroMsg =
    c.tasaMorosidad === 0 ? 'Cartera sana — Sin préstamos vencidos'
    : c.tasaMorosidad <= 15 ? 'Nivel aceptable — Monitorear cobranza'
    : 'Alerta — Revisión urgente de cartera'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(moroMsg, CONTENT_W + MAR - 6, y + 11, { align: 'right' })
  y += 24

  // KPIs de salud
  const saludKpis = [
    { label: 'Préstamos Activos',  valor: String(c.prestamosActivos),  color: COLOR.verde },
    { label: 'Préstamos Vencidos', valor: String(c.prestamosVencidos), color: c.prestamosVencidos > 0 ? COLOR.rojo : COLOR.grisMedio },
    { label: 'Préstamos Pagados',  valor: String(c.prestamosPagados),  color: COLOR.azulClaro },
    { label: 'Clientes Activos',   valor: String(c.clientesActivos),   color: COLOR.azulClaro },
  ]
  const col4W = (CONTENT_W - 6) / 4
  saludKpis.forEach((k, i) => {
    filaKPI(doc, k.label, k.valor, MAR + i * (col4W + 2), y, col4W, k.color)
  })
  y += 14

  const saludKpis2 = [
    { label: 'Capital Invertido',  valor: fmt(c.inversionTotal),  color: COLOR.azulClaro },
    { label: 'Valor Saldado',      valor: fmt(c.valorSaldado),    color: COLOR.amarillo },
    { label: 'Devolución de Ruta', valor: fmt(c.devolucionRuta),  color: COLOR.verde },
    { label: 'Monto Pagado',       valor: fmt(c.montoPagado),     color: COLOR.verde },
  ]
  saludKpis2.forEach((k, i) => {
    filaKPI(doc, k.label, k.valor, MAR + i * (col4W + 2), y, col4W, k.color)
  })
  y += 16

  // Tabla de detalle de gastos
  if (data.pyg.detalleGastos.length > 0) {
    y = seccion(doc, 'Detalle de Gastos Operativos', y)
    autoTable(doc, {
      startY: y,
      margin: { left: MAR, right: MAR },
      head: [['Concepto', 'Monto']],
      body: data.pyg.detalleGastos.map((g) => [g.nombre, fmt(g.monto)]),
      foot: [['Total Gastos', fmt(data.pyg.totalGastos)]],
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        font: 'helvetica',
        textColor: COLOR.grisOscuro,
      },
      headStyles: { fillColor: COLOR.azul, textColor: COLOR.blanco, fontStyle: 'bold' },
      footStyles: { fillColor: COLOR.azulClaro, textColor: COLOR.blanco, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLOR.grisSuave },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'right', textColor: COLOR.rojo, fontStyle: 'bold' },
      },
    })
  }

  // Guardar
  const nombreArchivo = `CrediRuta_Reporte_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`
  doc.save(nombreArchivo)
}
