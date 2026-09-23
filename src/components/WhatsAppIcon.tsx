import React from 'react';

interface WhatsAppIconProps {
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  active?: boolean;
  strokeColor?: string;
  bgColor?: string;
  phoneColor?: string;
  strokeWidth?: number | string;
}

/**
 * Icono de WhatsApp rediseñado:
 * - ACTIVO: Línea exterior verde (#25D366) de 2px, relleno interior gris 30% real (#B3B3B3) y telefonito blanco (#FFFFFF).
 * - INACTIVO: Sin relleno (transparente), contorno exterior gris 30% (#B3B3B3) de 2px y telefonito en gris 30% (#B3B3B3).
 */
export const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({
  className = 'w-6 h-6',
  size,
  style,
  active = true,
  strokeColor,
  bgColor,
  phoneColor,
  strokeWidth = 2,
}) => {
  const GRAY_30 = '#B3B3B3'; // Gris al 30% real (luminoso y claro)
  const GREEN_WHATSAPP = '#25D366';

  const effectiveStroke = strokeColor || (active ? GREEN_WHATSAPP : GRAY_30);
  const effectiveBg = bgColor !== undefined ? bgColor : (active ? GRAY_30 : 'none');
  const effectivePhone = phoneColor || (active ? '#FFFFFF' : GRAY_30);

  return (
    <svg
      viewBox="-1 -1 26 26"
      width={size}
      height={size}
      className={`inline-block shrink-0 overflow-visible ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Burbuja exterior con línea verde de 2px y relleno gris 30% (o transparente si inactivo) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.61a.8.8 0 0 0 .99.99l4.52-1.385A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
        fill={effectiveBg}
        stroke={effectiveStroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Telefonito interior (blanco si activo, gris 30% si inactivo) */}
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.15-.172.199-.296.298-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"
        fill={effectivePhone}
      />
    </svg>
  );
};
