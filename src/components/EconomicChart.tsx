import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Invoice, ReceivedInvoice } from '../types';
import { PeriodType } from './ControlPanelScreen';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Calendar, Info, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EconomicChartProps {
  invoices: Invoice[];
  receivedInvoices: ReceivedInvoice[];
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  onClose?: () => void;
}

interface DataPoint {
  label: string;
  shortLabel: string;
  ingresos: number;
  gastos: number;
  diferencia: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function parseDateComponents(dateStr: string | number | undefined): { year: number; month: number; quarter: number } | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month, quarter: Math.ceil(month / 3) };
      }
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return { year, month, quarter };
}

// Generate smooth bezier curve path for SVG
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

export const EconomicChart: React.FC<EconomicChartProps> = ({
  invoices,
  receivedInvoices,
  periodType,
  onPeriodTypeChange,
}) => {
  const currentYear = new Date().getFullYear();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef<number>(0);

  // Cycle through periods on lateral scroll / wheel / touch swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Strictly prevent the outer page horizontal scroller from capturing this event
      e.stopPropagation();
      e.preventDefault();

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Determine the dominant delta: lateral scroll (deltaX / shiftKey) or vertical wheel
      const delta = (absX >= absY || e.shiftKey) ? (e.shiftKey ? e.deltaY : e.deltaX) : e.deltaY;
      if (Math.abs(delta) < 8) return;

      const now = Date.now();
      if (now - lastScrollRef.current < 260) return;
      lastScrollRef.current = now;

      const modes: PeriodType[] = ['mensual', 'trimestral', 'anual'];
      const currentIndex = modes.indexOf(periodType);

      if (delta > 0) {
        // Forward cyclical: mensual -> trimestral -> anual -> mensual
        const next = modes[(currentIndex + 1) % modes.length];
        onPeriodTypeChange(next);
      } else if (delta < 0) {
        // Backward cyclical: mensual -> anual -> trimestral -> mensual
        const prev = modes[(currentIndex - 1 + modes.length) % modes.length];
        onPeriodTypeChange(prev);
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
        e.stopPropagation();
        const modes: PeriodType[] = ['mensual', 'trimestral', 'anual'];
        const currentIndex = modes.indexOf(periodType);

        if (deltaX < 0) {
          // Swipe left -> next period
          const next = modes[(currentIndex + 1) % modes.length];
          onPeriodTypeChange(next);
        } else {
          // Swipe right -> prev period
          const prev = modes[(currentIndex - 1 + modes.length) % modes.length];
          onPeriodTypeChange(prev);
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [periodType, onPeriodTypeChange]);

  // Aggregate data based on periodType
  const chartData: DataPoint[] = useMemo(() => {
    if (periodType === 'mensual') {
      return Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const matchingInvoices = invoices.filter((inv) => {
          const comp = parseDateComponents(inv.date);
          return comp && comp.year === currentYear && comp.month === monthNum;
        });
        const matchingReceived = receivedInvoices.filter((inv) => {
          const comp = parseDateComponents(inv.date);
          return comp && comp.year === currentYear && comp.month === monthNum;
        });

        const ingresos = matchingInvoices.reduce((sum, inv) => {
          const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
          return sum + base;
        }, 0);

        const gastos = matchingReceived.reduce((sum, inv) => sum + (inv.baseImponible || 0), 0);

        return {
          label: `${MONTH_NAMES[i]} ${currentYear}`,
          shortLabel: MONTH_SHORT[i],
          ingresos,
          gastos,
          diferencia: ingresos - gastos,
        };
      });
    }

    if (periodType === 'trimestral') {
      return [1, 2, 3, 4].map((q) => {
        const matchingInvoices = invoices.filter((inv) => {
          const comp = parseDateComponents(inv.date);
          return comp && comp.year === currentYear && comp.quarter === q;
        });
        const matchingReceived = receivedInvoices.filter((inv) => {
          const comp = parseDateComponents(inv.date);
          return comp && comp.year === currentYear && comp.quarter === q;
        });

        const ingresos = matchingInvoices.reduce((sum, inv) => {
          const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
          return sum + base;
        }, 0);

        const gastos = matchingReceived.reduce((sum, inv) => sum + (inv.baseImponible || 0), 0);

        const quarterLabels: Record<number, string> = {
          1: '1T (Ene-Mar)',
          2: '2T (Abr-Jun)',
          3: '3T (Jul-Sep)',
          4: '4T (Oct-Dic)',
        };

        return {
          label: `${quarterLabels[q]} ${currentYear}`,
          shortLabel: `${q}T`,
          ingresos,
          gastos,
          diferencia: ingresos - gastos,
        };
      });
    }

    // Anual: List last 4 years + current
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    return years.map((yr) => {
      const matchingInvoices = invoices.filter((inv) => {
        const comp = parseDateComponents(inv.date);
        return comp && comp.year === yr;
      });
      const matchingReceived = receivedInvoices.filter((inv) => {
        const comp = parseDateComponents(inv.date);
        return comp && comp.year === yr;
      });

      const ingresos = matchingInvoices.reduce((sum, inv) => {
        const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
        return sum + base;
      }, 0);

      const gastos = matchingReceived.reduce((sum, inv) => sum + (inv.baseImponible || 0), 0);

      return {
        label: `Año ${yr}`,
        shortLabel: `${yr}`,
        ingresos,
        gastos,
        diferencia: ingresos - gastos,
      };
    });
  }, [periodType, invoices, receivedInvoices, currentYear]);

  // Overall sums in chart
  const totalChartIngresos = useMemo(() => chartData.reduce((s, d) => s + d.ingresos, 0), [chartData]);
  const totalChartGastos = useMemo(() => chartData.reduce((s, d) => s + d.gastos, 0), [chartData]);

  // SVG Coordinates calculation
  const svgWidth = 720;
  const svgHeight = 260;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 40;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const rawMax = Math.max(
    ...chartData.map((d) => Math.max(d.ingresos, d.gastos)),
    100
  );
  // Round max value nicely
  const maxVal = Math.ceil((rawMax * 1.15) / 100) * 100;

  const getX = (idx: number) => {
    if (chartData.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (chartData.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padTop + plotHeight - (val / (maxVal || 1)) * plotHeight;
  };

  // Points for lines
  const ingresosPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.ingresos) }));
  const gastosPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.gastos) }));

  const ingresosPath = createSmoothPath(ingresosPoints);
  const gastosPath = createSmoothPath(gastosPoints);

  // Closed area paths for gradient fills
  const ingresosArea = ingresosPoints.length > 0
    ? `${ingresosPath} L ${ingresosPoints[ingresosPoints.length - 1].x} ${padTop + plotHeight} L ${ingresosPoints[0].x} ${padTop + plotHeight} Z`
    : '';

  const gastosArea = gastosPoints.length > 0
    ? `${gastosPath} L ${gastosPoints[gastosPoints.length - 1].x} ${padTop + plotHeight} L ${gastosPoints[0].x} ${padTop + plotHeight} Z`
    : '';

  // Y-axis grid levels (0%, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: padTop + plotHeight - pct * plotHeight,
  }));

  const activePoint = hoveredIdx !== null ? chartData[hoveredIdx] : null;

  return (
    <div
      ref={containerRef}
      id="economic-chart-container"
      className="w-full bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-2.5 sm:p-4 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 select-none"
    >
      {/* Interactive SVG Chart Canvas (directamente sin cabeceras intermedias ni datos encima) */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Amber gradient for Ingresos */}
            <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
            {/* Rose gradient for Gastos */}
            <linearGradient id="gastosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y Labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                stroke="#262626"
                strokeDasharray={i === 0 ? undefined : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#737373"
                fontFamily="monospace"
              >
                {Math.round(tick.val)}€
              </text>
            </g>
          ))}

          {/* Area Fills */}
          {ingresosArea && <path d={ingresosArea} fill="url(#ingresosGradient)" />}
          {gastosArea && <path d={gastosArea} fill="url(#gastosGradient)" />}

          {/* Curved Lines */}
          {gastosPath && (
            <path
              d={gastosPath}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]"
            />
          )}

          {ingresosPath && (
            <path
              d={ingresosPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]"
            />
          )}

          {/* Vertical Guides & Data Points */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const yIngresos = getY(d.ingresos);
            const yGastos = getY(d.gastos);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)}>
                {/* Transparent hit area for easy hover/tap */}
                <rect
                  x={x - (plotWidth / (chartData.length || 1)) / 2}
                  y={padTop}
                  width={plotWidth / (chartData.length || 1)}
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + plotHeight}
                    stroke="#F59E0B"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                )}

                {/* X Axis Label */}
                <text
                  x={x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  fontSize={periodType === 'mensual' ? '9.5' : '11'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fill={isHovered ? '#F59E0B' : '#A3A3A3'}
                >
                  {d.shortLabel}
                </text>

                {/* Gastos Point Dot */}
                <circle
                  cx={x}
                  cy={yGastos}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#F43F5E"
                  stroke="#171717"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Ingresos Point Dot */}
                <circle
                  cx={x}
                  cy={yIngresos}
                  r={isHovered ? 6 : 4}
                  fill="#F59E0B"
                  stroke="#171717"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        <AnimatePresence>
          {activePoint && hoveredIdx !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                left: `${Math.min(Math.max(getX(hoveredIdx) / svgWidth * 100, 15), 85)}%`,
                top: '10px',
              }}
              className="absolute -translate-x-1/2 pointer-events-none z-30 bg-neutral-900/95 border border-amber-400/50 rounded-xl p-2.5 shadow-2xl backdrop-blur-md min-w-[170px]"
            >
              <div className="text-xs font-black text-white border-b border-neutral-800 pb-1 mb-1.5 flex items-center justify-between">
                <span>{activePoint.label}</span>
                <span className="text-[10px] text-amber-300 font-normal">Detalle</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Ingresos:</span>
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(activePoint.ingresos)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Gastos:</span>
                  </span>
                  <span className="font-mono font-bold">{formatCurrency(activePoint.gastos)}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-300 pt-1 border-t border-neutral-800 font-semibold">
                  <span>Balance:</span>
                  <span
                    className={`font-mono font-bold ${
                      activePoint.diferencia >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(activePoint.diferencia)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Helper Notice about Scroll Wheel Switching */}
      <div className="mt-2 pt-2 border-t border-neutral-850/80 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-neutral-200">Scroll sobre el gráfico:</strong> cambia automáticamente entre{' '}
            <span className="text-amber-300">Mensual</span> ⇄ <span className="text-amber-300">Trimestral</span> ⇄{' '}
            <span className="text-amber-300">Anual</span>
          </span>
        </div>
        <span className="hidden sm:inline-block font-mono text-neutral-500">
          Año {currentYear}
        </span>
      </div>
    </div>
  );
};
