import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { formatDate, getTodayIso } from '../utils/formatters';

interface CustomCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // ISO format 'YYYY-MM-DD'
  onSelectDate: (dateIso: string) => void;
  title?: string;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_HEADERS = [
  { label: 'LUN', isSaturday: false, isSunday: false },
  { label: 'MAR', isSaturday: false, isSunday: false },
  { label: 'MIÉ', isSaturday: false, isSunday: false },
  { label: 'JUE', isSaturday: false, isSunday: false },
  { label: 'VIE', isSaturday: false, isSunday: false },
  { label: 'SÁB', isSaturday: true, isSunday: false },
  { label: 'DOM', isSaturday: false, isSunday: true },
];

export const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Editar Fecha',
}) => {
  // Parse initial selected date
  const parseIso = (isoStr: string) => {
    if (!isoStr) return new Date();
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    const parsed = new Date(isoStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const [viewDate, setViewDate] = useState<Date>(() => parseIso(selectedDate));
  const [currentSelected, setCurrentSelected] = useState<string>(selectedDate || getTodayIso());

  useEffect(() => {
    if (isOpen) {
      const parsed = parseIso(selectedDate);
      setViewDate(parsed);
      setCurrentSelected(selectedDate || getTodayIso());
    }
  }, [isOpen, selectedDate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        onSelectDate(currentSelected);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSelected, onClose, onSelectDate]);

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayIso = getTodayIso();

  // Navigation handlers
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const iso = getTodayIso();
    setCurrentSelected(iso);
    onSelectDate(iso);
  };

  // Calendar calculations
  // First day of month
  const firstDay = new Date(year, month, 1);
  // Day of week: 0 = Sun, 1 = Mon ... 6 = Sat
  // Convert to Monday = 0, ..., Saturday = 5, Sunday = 6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Days from previous month for alignment
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const leadingDays: Array<{ day: number; isCurrentMonth: false; iso: string }> = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const iso = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    leadingDays.push({ day: d, isCurrentMonth: false, iso });
  }

  // Days in current month
  const currentMonthDays: Array<{
    day: number;
    isCurrentMonth: true;
    iso: string;
    isSaturday: boolean;
    isSunday: boolean;
  }> = [];

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dObj = new Date(year, month, d);
    const dow = dObj.getDay();
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    currentMonthDays.push({
      day: d,
      isCurrentMonth: true,
      iso,
      isSaturday: dow === 6,
      isSunday: dow === 0,
    });
  }

  const handleDayClick = (iso: string) => {
    setCurrentSelected(iso);
    onSelectDate(iso);
    onClose();
  };

  const handleConfirm = () => {
    onSelectDate(currentSelected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 portrait:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-full portrait:w-full portrait:max-w-full landscape:sm:max-w-xl landscape:md:max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col text-neutral-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-50/90 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">{title}</h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                Selecciona la fecha deseada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/70 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar calendario"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Month & Year Navigation with Big Typography */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-neutral-100">
          <button
            type="button"
            onClick={prevMonth}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer shadow-xs"
            title="Mes anterior"
          >
            <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          <div className="flex items-center gap-2 text-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-950 capitalize tracking-tight">
              {MONTH_NAMES[month]}
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-500 font-mono">
              {year}
            </span>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-800 transition-all cursor-pointer shadow-xs"
            title="Mes siguiente"
          >
            <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Calendar Body: Weekday headers & Days Grid */}
        <div className="p-3 sm:p-5 md:p-6 bg-white flex-1 overflow-y-auto">
          {/* Weekday headers: Sábados en azul y Domingos en rojo */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAY_HEADERS.map((col, idx) => {
              let headerClasses =
                'py-2.5 sm:py-3 text-center text-sm sm:text-base md:text-lg font-black tracking-wider uppercase rounded-xl transition-colors ';
              if (col.isSaturday) {
                // Sábados en azul
                headerClasses += 'text-blue-600 bg-blue-50/80 border border-blue-200/60';
              } else if (col.isSunday) {
                // Domingos en rojo
                headerClasses += 'text-red-600 bg-red-50/80 border border-red-200/60';
              } else {
                // Lunes a Viernes
                headerClasses += 'text-neutral-700 bg-neutral-100/70';
              }

              return (
                <div key={idx} className={headerClasses}>
                  {col.label}
                </div>
              );
            })}
          </div>

          {/* Days Grid: texto grande, sábados en azul, domingos en rojo */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Leading days from previous month */}
            {leadingDays.map((item, idx) => (
              <button
                key={`prev-${idx}`}
                type="button"
                onClick={() => handleDayClick(item.iso)}
                className="h-12 sm:h-16 md:h-18 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-bold text-neutral-300 hover:text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {item.day}
              </button>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((item) => {
              const isSelected = item.iso === currentSelected;
              const isToday = item.iso === todayIso;

              let btnClasses =
                'relative h-12 sm:h-16 md:h-18 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-black transition-all cursor-pointer select-none active:scale-95 ';

              if (isSelected) {
                if (item.isSaturday) {
                  // Sábado seleccionado: azul vibrante
                  btnClasses +=
                    'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-300 scale-105 z-10';
                } else if (item.isSunday) {
                  // Domingo seleccionado: rojo vibrante
                  btnClasses +=
                    'bg-red-600 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-300 scale-105 z-10';
                } else {
                  // Día entre semana seleccionado: neutro oscuro/negro
                  btnClasses +=
                    'bg-neutral-950 text-white shadow-lg shadow-neutral-900/30 ring-4 ring-neutral-300 scale-105 z-10';
                }
              } else {
                if (item.isSaturday) {
                  // Sábados en azul
                  btnClasses +=
                    'text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100/80';
                } else if (item.isSunday) {
                  // Domingos en rojo
                  btnClasses +=
                    'text-red-600 bg-red-50/50 hover:bg-red-100 hover:text-red-700 border border-red-100/80';
                } else {
                  // Lunes a Viernes
                  btnClasses +=
                    'text-neutral-900 hover:bg-neutral-100 border border-transparent';
                }
              }

              return (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => handleDayClick(item.iso)}
                  className={btnClasses}
                  title={`Seleccionar ${formatDate(item.iso)}`}
                >
                  <span>{item.day}</span>
                  {/* Today marker if not selected */}
                  {isToday && !isSelected && (
                    <span
                      className={`absolute bottom-1 sm:bottom-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        item.isSaturday
                          ? 'bg-blue-600'
                          : item.isSunday
                          ? 'bg-red-600'
                          : 'bg-amber-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Selected Date Display & Action Buttons */}
        <div className="px-4 sm:px-6 py-3.5 bg-neutral-50/90 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Fecha:
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-neutral-950 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-2xs">
              {formatDate(currentSelected) || currentSelected}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={jumpToToday}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-extrabold text-amber-950 bg-amber-100 hover:bg-amber-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-extrabold text-white bg-neutral-950 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>Aceptar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
