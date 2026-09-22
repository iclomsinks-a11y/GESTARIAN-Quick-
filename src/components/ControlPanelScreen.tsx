import React, { useState, useMemo } from 'react';
import { Invoice, ReceivedInvoice, ProviderData } from '../types';
import { IssuedInvoicesScreen } from './IssuedInvoicesScreen';
import { ReceivedInvoicesScreen } from './ReceivedInvoicesScreen';
import { EconomicChart } from './EconomicChart';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PeriodType = 'mensual' | 'trimestral' | 'anual';

interface ControlPanelScreenProps {
  invoices: Invoice[];
  receivedInvoices: ReceivedInvoice[];
  providers?: ProviderData[];
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  // Actions for Issued Invoices
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRectifyInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenWhatsApp: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  // Actions for Received Invoices
  onSaveReceivedInvoice: (invoice: ReceivedInvoice) => void;
  onDeleteReceivedInvoice: (id: string) => void;
  // Sub-view can be controlled or internally managed
  initialSubView?: 'emitidas' | 'recibidas';
}

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

export const ControlPanelScreen: React.FC<ControlPanelScreenProps> = ({
  invoices,
  receivedInvoices,
  providers = [],
  periodType,
  onPeriodTypeChange,
  onNewInvoice,
  onViewInvoice,
  onRectifyInvoice,
  onDeleteInvoice,
  onOpenWhatsApp,
  onPrintInvoice,
  onSaveReceivedInvoice,
  onDeleteReceivedInvoice,
  initialSubView = 'emitidas',
}) => {
  // State for switching between Issued and Received invoices
  const [activeSubView, setActiveSubView] = useState<'emitidas' | 'recibidas'>(initialSubView);
  // State for toggling the economic chart
  const [showChart, setShowChart] = useState<boolean>(true);

  // Period date navigation state (defaults to current date)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3); // 1-4

  // Check if an item matches the period filter (mensual, trimestral, anual)
  const matchesPeriod = (dateStr: string | number | undefined): boolean => {
    const comp = parseDateComponents(dateStr);
    if (!comp) return true;

    if (periodType === 'mensual') {
      return comp.year === currentYear && comp.month === currentMonth;
    }
    if (periodType === 'trimestral') {
      return comp.year === currentYear && comp.quarter === currentQuarter;
    }
    return comp.year === currentYear;
  };

  // Filtered invoices for calculations
  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) => matchesPeriod(inv.date));
  }, [invoices, periodType, currentYear, currentMonth, currentQuarter]);

  const periodReceivedInvoices = useMemo(() => {
    return receivedInvoices.filter((inv) => matchesPeriod(inv.date));
  }, [receivedInvoices, periodType, currentYear, currentMonth, currentQuarter]);

  // Las 7 Líneas de Cálculo Económico
  // Línea 1: Total Ingresado (Base Imponible de Facturas Emitidas)
  const totalIngresado = useMemo(() => {
    return periodInvoices.reduce((sum, inv) => {
      const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
      return sum + base;
    }, 0);
  }, [periodInvoices]);

  // Línea 2: Total Gastos (Base Imponible de Facturas Recibidas)
  const totalGastos = useMemo(() => {
    return periodReceivedInvoices.reduce((sum, inv) => {
      return sum + (inv.baseImponible || 0);
    }, 0);
  }, [periodReceivedInvoices]);

  // Línea 3: Diferencia Ingresos y Gastos (Línea 1 - Línea 2)
  const diferenciaIngresosGastos = useMemo(() => {
    return totalIngresado - totalGastos;
  }, [totalIngresado, totalGastos]);

  // Línea 4: Total IVA Repercutido (IVA de Facturas Emitidas)
  const totalIvaRepercutido = useMemo(() => {
    return periodInvoices.reduce((sum, inv) => {
      const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
      const rate = inv.ivaRate ?? 21;
      return sum + (base * (rate / 100));
    }, 0);
  }, [periodInvoices]);

  // Línea 5: Total IVA Soportado (IVA de Facturas Recibidas)
  const totalIvaSoportado = useMemo(() => {
    return periodReceivedInvoices.reduce((sum, inv) => {
      return sum + (inv.ivaAmount || 0);
    }, 0);
  }, [periodReceivedInvoices]);

  // Línea 6: Diferencia de IVA (IVA Repercutido - IVA Soportado)
  const diferenciaIva = useMemo(() => {
    return totalIvaRepercutido - totalIvaSoportado;
  }, [totalIvaRepercutido, totalIvaSoportado]);

  // Línea 7: IRPF 20% (Sobre el valor de la 3ª línea)
  const irpf20 = useMemo(() => {
    return diferenciaIngresosGastos > 0 ? diferenciaIngresosGastos * 0.20 : 0;
  }, [diferenciaIngresosGastos]);

  // Línea 8: Total Impuestos (Diferencia de IVA + IRPF 20%)
  const totalImpuestos = useMemo(() => {
    return diferenciaIva + irpf20;
  }, [diferenciaIva, irpf20]);

  // Línea 9: Rendimiento Neto (Total Ingresado - Total Impuestos)
  const rendimientoNeto = useMemo(() => {
    return totalIngresado - totalImpuestos;
  }, [totalIngresado, totalImpuestos]);

  return (
    <div
      id="control-panel-screen-container"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-0 pb-12 text-neutral-100"
    >
      {/* 1. TÍTULO PANEL DE CONTROL A LA IZQUIERDA Y A LA DERECHA ICONO DE GRÁFICO (BAJADO 3PX) */}
      <div className="flex items-center justify-between gap-3 pt-[3px] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h1
            className="text-lg sm:text-xl font-extrabold text-white tracking-tight uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            PANEL DE CONTROL
          </h1>
        </div>

        {/* Botón de gráfico: Alterna entre mostrar gráfico y mostrar líneas de datos económicos */}
        <button
          type="button"
          id="btn-toggle-economic-chart"
          onClick={() => setShowChart((prev) => !prev)}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
            showChart
              ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-lg shadow-amber-400/20'
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/80 hover:border-amber-400/50'
          }`}
          title={showChart ? 'Mostrar líneas de datos económicos' : 'Mostrar gráfico económico'}
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-xs sm:text-sm hidden sm:inline font-bold">
            {showChart ? 'Ver Líneas' : 'Ver Gráfico'}
          </span>
        </button>
      </div>

      {/* SECCIÓN SUPERIOR ECONÓMICA: GRÁFICO O LÍNEAS DE DATOS SEGÚN EL BOTÓN DE GRÁFICO */}
      {showChart ? (
        <div id="control-panel-chart-view" className="w-full pt-1">
          <EconomicChart
            invoices={invoices}
            receivedInvoices={receivedInvoices}
            periodType={periodType}
            onPeriodTypeChange={onPeriodTypeChange}
          />
        </div>
      ) : (
        /* VISTA DE LAS LÍNEAS DE DATOS ECONÓMICOS */
        <div
          id="control-panel-seven-lines-economic"
          className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 backdrop-blur-md shadow-lg"
        >
          <div className="flex flex-col space-y-0.5 sm:space-y-1">
            {/* Línea 1: Total Facturado */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-neutral-200">
                Total Facturado
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-neutral-700/80 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-white text-right">
                {formatCurrency(totalIngresado)}
              </span>
            </div>

            {/* Línea 2: Total Gastos (en color rojo) */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-red-400">
                Total Gastos
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-red-500/40 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-red-400 text-right">
                {formatCurrency(totalGastos)}
              </span>
            </div>

            {/* Línea 3: Diferencia Ingresos y Gastos */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-amber-300">
                Diferencia Ingresos y Gastos
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-amber-400/40 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-amber-300 text-right">
                {formatCurrency(diferenciaIngresosGastos)}
              </span>
            </div>

            {/* Línea 4: Total IVA Repercutido */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-neutral-200">
                Total IVA Repercutido
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-neutral-700/80 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-white text-right">
                {formatCurrency(totalIvaRepercutido)}
              </span>
            </div>

            {/* Línea 5: Total IVA Soportado (en color rojo) */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-red-400">
                Total IVA Soportado
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-red-500/40 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-red-400 text-right">
                {formatCurrency(totalIvaSoportado)}
              </span>
            </div>

            {/* Línea 6: Diferencia de IVA */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-amber-300">
                Diferencia de IVA
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-amber-400/40 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-amber-300 text-right">
                {formatCurrency(diferenciaIva)}
              </span>
            </div>

            {/* Línea 7: IRPF 20% */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-amber-400">
                IRPF 20%
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-amber-400/50 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-amber-400 text-right">
                {formatCurrency(irpf20)}
              </span>
            </div>

            {/* Línea 8: Total Impuestos (en color rojo) */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span className="shrink-0 text-base sm:text-lg font-bold text-red-400">
                Total Impuestos
              </span>
              <span className="flex-1 mx-2 sm:mx-3 border-b-2 border-dotted border-red-500/40 mb-1" />
              <span className="shrink-0 text-base sm:text-lg font-mono font-black text-red-400 text-right">
                {formatCurrency(totalImpuestos)}
              </span>
            </div>

            {/* Línea 9: Rendimiento Neto (Total Facturado - Total Impuestos, puede ser negativo) */}
            <div className="flex items-baseline w-full py-0.5 leading-tight">
              <span
                className={`shrink-0 text-base sm:text-lg font-bold ${
                  rendimientoNeto >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                Rendimiento Neto
              </span>
              <span
                className={`flex-1 mx-2 sm:mx-3 border-b-2 border-dotted mb-1 ${
                  rendimientoNeto >= 0 ? 'border-emerald-400/50' : 'border-red-500/40'
                }`}
              />
              <span
                className={`shrink-0 text-base sm:text-lg font-mono font-black text-right ${
                  rendimientoNeto >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(rendimientoNeto)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SENDOS BOTONES DE FACTURAS: FACTURAS EMITIDAS Y FACTURAS RECIBIDAS */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-3">
        {/* Botón 1: Facturas Emitidas */}
        <button
          type="button"
          id="control-panel-tab-issued"
          onClick={() => setActiveSubView('emitidas')}
          className={`w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-black text-lg sm:text-2xl tracking-tight leading-none transition-all cursor-pointer active:scale-95 shadow-md border text-center flex items-center justify-center ${
            activeSubView === 'emitidas'
              ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-amber-400/25 shadow-lg'
              : 'bg-neutral-900/90 hover:bg-neutral-850 text-neutral-200 border-neutral-700/80 hover:border-amber-400/70 hover:text-white'
          }`}
        >
          <span className="leading-none py-0.5">Facturas Emitidas</span>
        </button>

        {/* Botón 2: Facturas Recibidas */}
        <button
          type="button"
          id="control-panel-tab-received"
          onClick={() => setActiveSubView('recibidas')}
          className={`w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-black text-lg sm:text-2xl tracking-tight leading-none transition-all cursor-pointer active:scale-95 shadow-md border text-center flex items-center justify-center ${
            activeSubView === 'recibidas'
              ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-amber-400/25 shadow-lg'
              : 'bg-neutral-900/90 hover:bg-neutral-850 text-neutral-200 border-neutral-700/80 hover:border-amber-400/70 hover:text-white'
          }`}
        >
          <span className="leading-none py-0.5">Facturas Recibidas</span>
        </button>
      </div>

      {/* 3. LISTADO DE TARJETAS DE FACTURAS DEBAJO DE LOS BOTONES SEGÚN ESTÉ ACTIVADO FACTURAS EMITIDAS O RECIBIDAS */}
      <div id="control-panel-invoices-subscreen-container" className="pt-2">
        {activeSubView === 'emitidas' ? (
          <IssuedInvoicesScreen
            invoices={invoices}
            onNewInvoice={onNewInvoice}
            onViewInvoice={onViewInvoice}
            onRectifyInvoice={onRectifyInvoice}
            onDeleteInvoice={onDeleteInvoice}
            onOpenWhatsApp={onOpenWhatsApp}
            onPrintInvoice={onPrintInvoice}
          />
        ) : (
          <ReceivedInvoicesScreen
            invoices={receivedInvoices}
            onSaveInvoice={onSaveReceivedInvoice}
            onDeleteInvoice={onDeleteReceivedInvoice}
            providers={providers}
          />
        )}
      </div>
    </div>
  );
};
