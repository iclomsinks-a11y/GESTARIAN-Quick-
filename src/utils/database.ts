import { ClientData, ProviderData, Invoice, BillableProduct, DeletedInvoice } from '../types';
import { sortProductsByName } from '../services/catalogImporterService';

export const STORAGE_CLIENTS_KEY = 'gestarian_clients_db';
export const STORAGE_PROVIDERS_KEY = 'gestarian_providers_db';
export const STORAGE_INVOICES_KEY = 'gestarian_invoices_history';
export const STORAGE_PRODUCTS_KEY = 'gestarian_products_db';

// Default initial products (Catálogo de productos facturables)
export const DEFAULT_PRODUCTS: BillableProduct[] = [
  {
    id: 'prod-cortina-lino',
    name: 'Cortina confeccionada a medida en lino rústico lavado',
    description: 'Confección artesanal con cabezilla fruncida al 200%, bajo con plomo de 50g y ganchos graduables.',
    price: 185.0,
    category: 'Confección Textil',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%23262626"/><path d="M25 20 L95 20 L95 26 L25 26 Z" fill="%23A3A3A3"/><path d="M30 26 Q35 60 30 100 Q40 60 45 26 Q50 60 45 100 Q55 60 60 26 Q65 60 60 100 Q70 60 75 26 Q80 60 75 100 Q85 60 90 26" fill="none" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="92" r="14" fill="%23F59E0B" fill-opacity="0.2"/><text x="92" y="96" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23FCD34D" text-anchor="middle">m²</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'prod-motor-somfy',
    name: 'Motorización tubular vía radio para estor / cortina con emisor monocanal',
    description: 'Motor electrónico silencioso 230V con tecnología de parada suave y memoria de finales de carrera.',
    price: 245.0,
    category: 'Automatismos',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%231E293B"/><rect x="25" y="48" width="55" height="24" rx="4" fill="%230284C7"/><circle cx="90" cy="60" r="12" fill="%2338BDF8"/><path d="M85 60 L95 60 M90 55 L90 65" stroke="%230F172A" stroke-width="2.5" stroke-linecap="round"/><text x="52" y="64" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">RTS</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 'prod-riel-aluminio',
    name: 'Riel de aluminio extrusionado lacado blanco con correderas silenciosas (ml)',
    description: 'Perfil de alta resistencia para techos y paredes con soportes de fijación oculta clip.',
    price: 38.5,
    category: 'Herrajes',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%23171717"/><rect x="20" y="52" width="80" height="16" rx="3" fill="%23E5E5E5"/><circle cx="35" cy="60" r="3" fill="%23737373"/><circle cx="60" cy="60" r="3" fill="%23737373"/><circle cx="85" cy="60" r="3" fill="%23737373"/><text x="60" y="88" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23F59E0B" text-anchor="middle">ALU · ML</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'prod-estor-screen',
    name: 'Estor enrollable tejido técnico Screen 5% apertura ignífugo M1',
    description: 'Filtrado solar térmico, composición hilo de poliéster recubierto de PVC alta resistencia.',
    price: 135.0,
    category: 'Protección Solar',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%2327272A"/><rect x="25" y="24" width="70" height="8" rx="4" fill="%23A1A1AA"/><rect x="30" y="32" width="60" height="58" fill="%2352525B" fill-opacity="0.6"/><line x1="30" y1="90" x2="90" y2="90" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round"/><circle cx="85" cy="36" r="3" fill="%23FCD34D"/></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: 'prod-instalacion-mo',
    name: 'Mano de obra especializada en montaje, nivelado e instalación en obra',
    description: 'Servicio técnico cualificado, taladrado con aspiración limpia y verificación de funcionamiento.',
    price: 65.0,
    category: 'Servicios',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%231C1917"/><circle cx="60" cy="60" r="32" fill="%23F59E0B" fill-opacity="0.15" stroke="%23F59E0B" stroke-width="2"/><path d="M48 68 L60 56 L72 68 M60 56 L60 76" stroke="%23F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="44" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23FAFAF9" text-anchor="middle">INSTALACIÓN</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];

// Default initial providers (Proveedores y empresas de suministros externas)
export const DEFAULT_PROVIDERS: ProviderData[] = [
  {
    id: 'prov-textiles',
    name: 'Confecciones Textiles & Cortinajes San Juan S.L.',
    cif: 'B81239874',
    address: 'Calle Toledo 45, 28005 Madrid',
    phone: '+34 913 658 900',
    email: 'taller@cortinajessanjuan.es',
    logoUrl: '',
    iban: 'ES44 0182 1234 5602 0008 9911',
    bankName: 'BBVA',
    isDefault: false,
  },
  {
    id: 'prov-instalaciones',
    name: 'Instalaciones & Cerramientos Ibéricos S.L.',
    cif: 'B99443322',
    address: 'Polígono Industrial El Campillo 8, 41020 Sevilla',
    phone: '+34 954 112 233',
    email: 'info@instalacionesibericas.es',
    logoUrl: '',
    iban: 'ES12 0049 1500 0512 3456 7890',
    bankName: 'Banco Santander',
    isDefault: false,
  },
  {
    id: 'prov-mecanizados',
    name: 'Mecanizados & Estructuras Metálicas Sur S.L.',
    cif: 'B41987654',
    address: 'Av. de la Industria 14, 28823 Coslada (Madrid)',
    phone: '+34 916 789 012',
    email: 'pedidos@mecanizadosur.es',
    logoUrl: '',
    iban: 'ES88 2038 9876 5400 1234 5678',
    bankName: 'Bankinter',
    isDefault: false,
  },
];

// Default initial clients (Clientes habituales)
export const DEFAULT_CLIENTS: ClientData[] = [
  {
    id: 'cli-fit-flamc',
    name: 'FIT FLAMC',
    nif: 'B91028374',
    address: 'Av. de la Industria 88, 28013 Madrid',
    phone: '+34 912 345 678',
    email: 'compras@fitflamc.com',
    defaultSendWhatsApp: true,
    defaultSendEmail: true,
    preferredDispatchChannel: 'both',
    enableProductsCatalog: true,
    habitualProducts: [
      { id: 'fit-001', code: 'FFC02', name: 'FFC02 - CAMISETA LOLA FLECOS' },
      { id: 'fit-002', code: 'FFC02B', name: 'FFC02B - CAMISETA LOLA FLECOS TIRANTES' },
      { id: 'fit-003', code: 'FFC03', name: 'FFC03 - CAMISETA ROCIO' },
      { id: 'fit-004', code: 'FFC04', name: 'FFC04 - CAMISETA NAYMA' },
      { id: 'fit-005', code: 'FFC05', name: 'FFC05 - CAMISETA EVA' },
      { id: 'fit-006', code: 'FFC06', name: 'FFC06 - CAMISETA MANUELA' },
      { id: 'fit-007', code: 'FFC07', name: 'FFC07 - CAMISETA PILAR' },
      { id: 'fit-008', code: 'FFC08', name: 'FFC08 - CAMISETA BEATRIZ' },
      { id: 'fit-009', code: 'FFC09', name: 'FFC09 - CAMISETA INDIA' },
      { id: 'fit-010', code: 'FFC11', name: 'FFC11 - CAMISETA RAQUEL' },
      { id: 'fit-011', code: 'FFC11B', name: 'FFC11B - CAMISETA RAQUELITA' },
      { id: 'fit-012', code: 'FFC12', name: 'FFC12 - CAMISETA JULIA' },
      { id: 'fit-013', code: 'FFC13', name: 'FFC13 - CAMISETA MARIPAZ' },
      { id: 'fit-014', code: 'FFC13B', name: 'FFC13B - CAMISETA MARY' },
      { id: 'fit-015', code: 'FFC15', name: 'FFC15 - CAMISETA RAFAELA' },
      { id: 'fit-016', code: 'FFC17', name: 'FFC17 - CAMISETA PATRICIA' },
      { id: 'fit-017', code: 'FFC18', name: 'FFC18 - CAMISETA LUCIA' },
      { id: 'fit-018', code: 'FFC19', name: 'FFC19 - CAMISETA MARTA' },
      { id: 'fit-019', code: 'FFC20', name: 'FFC20 - CAMISETA MARTINA' },
      { id: 'fit-020', code: 'FFC24', name: 'FFC24 - CAMISETA ROSARIO' },
      { id: 'fit-021', code: 'FFC26', name: 'FFC26 - CAMISETA ROSALIA' },
      { id: 'fit-022', code: 'FFC27', name: 'FFC27 - CAMISETA ALICIA' },
      { id: 'fit-023', code: 'FFC28', name: 'FFC28 - CAMISETA ANITA' },
      { id: 'fit-024', code: 'FFC29', name: 'FFC29 - CAMISETA LARA' },
      { id: 'fit-025', code: 'FFC30', name: 'FFC30 - CAMISETA ANGELA' },
      { id: 'fit-026', code: 'FFC31', name: 'FFC31 - CAMISETA DANIELA' },
      { id: 'fit-027', code: 'FFC32', name: 'FFC32 - CAMISETA NOE' },
      { id: 'fit-028', code: 'FFC33', name: 'FFC33 - CAMISETA PAULA' },
      { id: 'fit-029', code: 'FFC34', name: 'FFC34 - CAMISETA CHELI' },
      { id: 'fit-030', code: 'FFC35', name: 'FFC35 - CAMISETA NAYIBE' },
      { id: 'fit-031', code: 'FFC36', name: 'FFC36 - CAMISETA ALEGRE' },
      { id: 'fit-032', code: 'FFC37', name: 'FFC37 - CAMISETA SORPRESA' },
      { id: 'fit-033', code: 'FFC38', name: 'FFC38 - CAMISETA PASION' },
      { id: 'fit-034', code: 'FFC39', name: 'FFC39 - CAMISETA FELICIDAD' },
      { id: 'fit-035', code: 'FFC40', name: 'FFC40 - CAMISETA SONRISA' },
      { id: 'fit-036', code: 'FFC41', name: 'FFC41 - CAMISETA FELIZ' },
      { id: 'fit-037', code: 'FFC42', name: 'FFC42 - CAMISETA GRACIAS' },
      { id: 'fit-038', code: 'FFC43', name: 'FFC43 - CAMISETA LINDA' },
      { id: 'fit-039', code: 'FFC44', name: 'FFC44 - CAMISETA PRECIOSA' },
      { id: 'fit-040', code: 'FFC45', name: 'FFC45 - CAMISETA BELLA' },
      { id: 'fit-041', code: 'FFC47', name: 'FFC47 - CAMISETA LIBERTAD' },
      { id: 'fit-042', code: 'FFC48', name: 'FFC48 - CAMISETA LIBRE' },
      { id: 'fit-043', code: 'FFC49', name: 'FFC49 - CAMISETA LEAL' },
      { id: 'fit-044', code: 'FFC50', name: 'FFC50 - CAMISETA POSITIVA' },
      { id: 'fit-045', code: 'FFC52', name: 'FFC52 - CAMISETA CAPAZ' },
      { id: 'fit-046', code: 'FFC53', name: 'FFC53 - LOLA FLORES' },
      { id: 'fit-047', code: 'FFC54', name: 'FFC54 - CAMISETA LOLA FLORES' },
      { id: 'fit-048', code: 'FFC56', name: 'FFC56 - ALEGRIA VIVIR FLECOS' },
      { id: 'fit-049', code: 'FFC59', name: 'FFC59 - ALEGRIA VIVIR BOLSILLO' },
      { id: 'fit-050', code: 'FFC62', name: 'FFC62 - CAMISETA INDIA' },
      { id: 'fit-051', code: 'FFC65', name: 'FFC65 - INDIA COLOR' },
      { id: 'fit-052', code: 'FFC68', name: 'FFC68 - CAMISETA FANDANGO' },
      { id: 'fit-053', code: 'FFC71', name: 'FFC71 - ALEGRIA VIVIR VOLANTE' },
      { id: 'fit-054', code: 'FFC80', name: 'FFC80 - CAMISETA LIPS' },
      { id: 'fit-055', code: 'FFC84', name: 'FFC84 - CAMISETA MOÑO' },
      { id: 'fit-056', code: 'FFC87', name: 'FFC87 - CAMISETA CUERDA' },
      { id: 'fit-057', code: 'FFC88', name: 'FFC88 - CAMISETA DUENDE' },
      { id: 'fit-058', code: 'FFC91', name: 'FFC91 - CAMISETA TORERA' },
      { id: 'fit-059', code: 'FFC94', name: 'FFC94 - CAMISETA TORERILLA' },
      { id: 'fit-060', code: 'FFC97', name: 'FFC97 - CAMISETA FARAONA' },
      { id: 'fit-061', code: 'FFC100', name: 'FFC100 - CAMISETA BOCA' },
      { id: 'fit-062', code: 'FFC101', name: 'FFC101 - CAMISETA CHARITO' },
      { id: 'fit-063', code: 'FFC102', name: 'FFC102 - CAMISETA ESTRELLA' },
      { id: 'fit-064', code: 'FFC103', name: 'FFC103 - CAMISETA ALEGRIAS' },
      { id: 'fit-065', code: 'FFC104', name: 'FFC104 - CAMISETA ESTRELLA FLECOS' },
      { id: 'fit-066', code: 'FFC106', name: 'FFC106 - CAMISETA ESTRELLITA' },
      { id: 'fit-067', code: 'FFC107', name: 'FFC107 - CAMISETA GITANA' },
      { id: 'fit-068', code: 'FFC108', name: 'FFC108 - CAMISETA GITANILLA' },
      { id: 'fit-069', code: 'FFC109', name: 'FFC109 - BULERIA OPCION LARGA' },
      { id: 'fit-070', code: 'FFC110', name: 'FFC110 - TANGUILLOS OPCION CORTA' },
      { id: 'fit-071', code: 'FFC111', name: 'FFC111 - CAMISETA SEXY' },
      { id: 'fit-072', code: 'FFC112', name: 'FFC112 - CAMISETA SEXYS' },
      { id: 'fit-073', code: 'FFC113', name: 'FFC113 - CAMISETA FLAMENCO' },
      { id: 'fit-074', code: 'FFC114', name: 'FFC114 - RUMBA' },
      { id: 'fit-075', code: 'FFC115', name: 'FFC115 - CAMISETA TANGOS' },
      { id: 'fit-076', code: 'FFC116', name: 'FFC116 - CAMISETA SOLEA' },
      { id: 'fit-077', code: 'FFC117', name: 'FFC117 - CAMISETA RUMBITA' },
      { id: 'fit-078', code: 'FFC118', name: 'FFC118 - CAMISETAS SEVILLANAS' },
      { id: 'fit-079', code: 'FFC119', name: 'FFC119 - INDIA CORTA' },
      { id: 'fit-080', code: 'FFC121', name: 'FFC121 - TOMA QUE TOMA' },
      { id: 'fit-081', code: 'FFC122', name: 'FFC122 - CAMISETA MESTIZA' },
      { id: 'fit-082', code: 'FFC123', name: 'FFC123 - OLE TU VOLANTE' },
      { id: 'fit-083', code: 'FFC124', name: 'FFC124 - FLOR BONITA' },
      { id: 'fit-084', code: 'FFC125', name: 'FFC125 - CAMISETA VOLANFLOR' },
      { id: 'fit-085', code: 'FFC128', name: 'FFC128 - CORDOBESA' },
      { id: 'fit-086', code: 'FFC129', name: 'FFC129 - CAMISETA HINDU' },
      { id: 'fit-087', code: 'FFC131', name: 'FFC131 - CAMISETA CLAVEL' },
      { id: 'fit-088', code: 'FFC132', name: 'FFC132 - CLAVELILLA' },
      { id: 'fit-089', code: 'FFC133', name: 'FFC133 - CAMISETA AMAPOLA' },
      { id: 'fit-090', code: 'FFC134', name: 'FFC134 - CLAVEL BOLSILLO' },
      { id: 'fit-091', code: 'FFC135', name: 'FFC135 - CAMISETA MADROÑOS' },
      { id: 'fit-092', code: 'FFC136', name: 'FFC136 - MANTONCILLO' },
      { id: 'fit-093', code: 'FFC137', name: 'FFC137 - CAMISETA DALIA CORTA' },
      { id: 'fit-094', code: 'FFC139', name: 'FFC139 - CAMISETA FLOR' },
      { id: 'fit-095', code: 'FFC140', name: 'FFC140 - FLORECILLA' },
      { id: 'fit-096', code: 'FFC141', name: 'FFC141 - ROSAE' },
      { id: 'fit-097', code: 'FFC142', name: 'FFC142 - CAMISETA LIRIO' },
      { id: 'fit-098', code: 'FFC144', name: 'FFC144 - FLOR BONITA' },
      { id: 'fit-099', code: 'FFC145', name: 'FFC145 - CAMISETA FLORES' },
      { id: 'fit-100', code: 'FFC147', name: 'FFC147 - CAMISETA OLE' },
      { id: 'fit-101', code: 'FFC148', name: 'FFC148 - CAMISETA LUNAR' },
      { id: 'fit-102', code: 'FFC149', name: 'FFC149 - CAMISETA MESTIZA' },
      { id: 'fit-103', code: 'FFC152', name: 'FFC152 - CAMISETA CLAVELLINA' },
      { id: 'fit-104', code: 'FFC153', name: 'FFC153 - CAMISETA FLOR GITANA' },
      { id: 'fit-105', code: 'FFC154', name: 'FFC154 - VOLANTES' },
      { id: 'fit-106', code: 'FFC156', name: 'FFC156 - CAMISETA LUNARITOS' },
      { id: 'fit-107', code: 'FFC160', name: 'FFC160 - PETUNIA' },
      { id: 'fit-108', code: 'FFC161', name: 'FFC161 - CAMISETA LIRIOS' },
      { id: 'fit-109', code: 'FFC163', name: 'FFC163 - CAMISETA AZUCENA' },
      { id: 'fit-110', code: 'FFC164', name: 'FFC164 - TOP CROP HINDU' },
      { id: 'fit-111', code: 'FFC165', name: 'FFC165 - CAMISETA BANDOLERA' },
      { id: 'fit-112', code: 'FFC166', name: 'FFC166 - CAMISETA PONCHOLE' },
      { id: 'fit-113', code: 'FFC167', name: 'FFC167 - PONCHOLE MANILA BORD.' },
      { id: 'fit-114', code: 'FFC168', name: 'FFC168 - CAMISETA CASANDRA' },
      { id: 'fit-115', code: 'FFC169', name: 'FFC169 - CAMISETA LUNARITOS' },
      { id: 'fit-116', code: 'FFC170', name: 'FFC170 - CHALECO MESTIZA' },
      { id: 'fit-117', code: 'FFC171', name: 'FFC171 - CAMISETA OLE TU FLECOS' },
      { id: 'fit-118', code: 'FFC172', name: 'FFC172 - FLORES MANGA LARGA' },
      { id: 'fit-119', code: 'FFC173', name: 'FFC173 - TOP MESTIZO' },
      { id: 'fit-120', code: 'FFC175', name: 'FFC175 - CAMISETA BARCELONA' },
      { id: 'fit-121', code: 'FFC176', name: 'FFC176 - CAMISETA VALENCIA' },
      { id: 'fit-122', code: 'FFC177', name: 'FFC177 - CAMISETA SEVILLA' },
      { id: 'fit-123', code: 'FFC180', name: 'FFC180 - CAMISETA CORDOBA' },
      { id: 'fit-124', code: 'FFC181', name: 'FFC181 - CAMISETA JAEN' },
      { id: 'fit-125', code: 'FFC182', name: 'FFC182 - CAMISETA CAROLINA' },
      { id: 'fit-126', code: 'FFC183', name: 'FFC183 - CAMISETA MARBELLA' },
      { id: 'fit-127', code: 'FFC184', name: 'FFC184 - CAMISETA MALAGA' },
      { id: 'fit-128', code: 'FFC185', name: 'FFC185 - CHALECO LUNARITOS' },
      { id: 'fit-129', code: 'FFC186', name: 'FFC186 - CAMISETA GRANADA' },
      { id: 'fit-130', code: 'FFC187', name: 'FFC187 - CAMISETA TOLEDO' },
      { id: 'fit-131', code: 'FFC188', name: 'FFC188 - CAMISETA MALLORCA ESP.' },
      { id: 'fit-132', code: 'FFC189', name: 'FFC189 - CAMISETA FLOR LUNARITOS' },
      { id: 'fit-133', code: 'FFL02', name: 'FFL02 - LEGGINGS LORENA' },
      { id: 'fit-134', code: 'FFL03', name: 'FFL03 - LEGGINGS ELISABETH' },
      { id: 'fit-135', code: 'FFL04', name: 'FFL04 - NANY' },
      { id: 'fit-136', code: 'FFL05', name: 'FFL05 - ISABEL' },
      { id: 'fit-137', code: 'FFL06', name: 'FFL06 - LEGGINGS JUANA' },
      { id: 'fit-138', code: 'FFL07', name: 'FFL07 - ALBA' },
      { id: 'fit-139', code: 'FFS05', name: 'FFS05 - ROSARILLO' },
      { id: 'fit-140', code: 'FFS06', name: 'FFS06 - ROSARIO' },
      { id: 'fit-141', code: 'FFS07', name: 'FFS07 - ROSA' },
      { id: 'fit-142', code: 'FFS16', name: 'FFS16 - SUDADERA INDIA' },
      { id: 'fit-143', code: 'FFCONJF', name: 'FFCONJF - CONJUNTO FLOR' },
      { id: 'fit-144', code: 'FFFL01', name: 'FFFL01 - FALDA DE LICRA' },
    ],
    lineasComplejas: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
  },
  {
    id: 'cli-arkedecor',
    name: 'ARKEDECOR Interiorismo & Proyectos S.L.',
    nif: 'B98765432',
    address: 'Calle Velázquez 42, 28001 Madrid',
    phone: '+34 914 312 800',
    email: 'proyectos@arkedecor.es',
    defaultSendWhatsApp: true,
    defaultSendEmail: true,
    preferredDispatchChannel: 'both',
    lineasComplejas: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: 'cli-reformas-iberica',
    name: 'Construcciones y Reformas Ibérica S.A.',
    nif: 'A28001122',
    address: 'Av. Diagonal 450, 08006 Barcelona',
    phone: '+34 932 110 099',
    email: 'compras@reformasiberica.es',
    defaultSendWhatsApp: true,
    defaultSendEmail: true,
    preferredDispatchChannel: 'both',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'cli-alulevante',
    name: 'Aluminios y Cristalería Levante S.L.',
    nif: 'B46123456',
    address: 'Pol. Ind. Vara de Quart 14, 46014 Valencia',
    phone: '+34 963 881 220',
    email: 'pedidos@alulevante.com',
    defaultSendWhatsApp: true,
    defaultSendEmail: false,
    preferredDispatchChannel: 'whatsapp',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
  },
  {
    id: 'cli-decoracion-habitat',
    name: 'Decoración Textil & Hábitat S.L.',
    nif: 'B87654321',
    address: 'Calle Serrano 88, 28006 Madrid',
    phone: '+34 915 442 331',
    email: 'contacto@textilhabitat.es',
    defaultSendWhatsApp: false,
    defaultSendEmail: true,
    preferredDispatchChannel: 'email',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: 'cli-garcia-asociados',
    name: 'García & Asociados Consultores S.C.P.',
    nif: 'J50987654',
    address: 'Gran Vía 32, 50005 Zaragoza',
    phone: '+34 976 223 344',
    email: 'info@garciaasociados.es',
    defaultSendWhatsApp: false,
    defaultSendEmail: true,
    preferredDispatchChannel: 'email',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: 'cli-hotel-maritimo',
    name: 'Hotel Boutique Marítimo S.L.',
    nif: 'B07654987',
    address: 'Paseo Marítimo 12, 07014 Palma de Mallorca',
    phone: '+34 971 778 899',
    email: 'direccion@hotelmaritimo.com',
    defaultSendWhatsApp: true,
    defaultSendEmail: false,
    preferredDispatchChannel: 'whatsapp',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
];

// --- CLIENTS DATABASE METHODS ---

export function getStoredClients(): ClientData[] {
  try {
    const raw = localStorage.getItem(STORAGE_CLIENTS_KEY);
    if (!raw) {
      // Seed initial clients without default complex lines
      localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
      return sortClientsAlphabetically(DEFAULT_CLIENTS);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let updated = false;
      const defaultIdsToRemove = new Set([
        'lc-ark-cortina',
        'lc-ark-estor',
        'lc-ark-tapiceria',
        'lc-ark-mural',
      ]);

      const cleaned = parsed.map((client: ClientData) => {
        if (client.lineasComplejas && client.lineasComplejas.length > 0) {
          const userOnly = client.lineasComplejas.filter(
            (lc) => !defaultIdsToRemove.has(lc.id)
          );
          if (userOnly.length !== client.lineasComplejas.length) {
            updated = true;
            return {
              ...client,
              lineasComplejas: userOnly,
            };
          }
        }
        return client;
      });

      // Ensure FIT FLAMC is present and updated with complete product catalog sorted by product name
      const defaultFit = DEFAULT_CLIENTS.find((c) => c.id === 'cli-fit-flamc') || DEFAULT_CLIENTS[0];
      const fitIdx = cleaned.findIndex(
        (c: ClientData) => c.name.toLowerCase().includes('fit flamc') || c.id === 'cli-fit-flamc'
      );
      if (fitIdx >= 0) {
        const currentFit = cleaned[fitIdx];
        const sortedFitProds = sortProductsByName(
          currentFit.habitualProducts && currentFit.habitualProducts.length >= (defaultFit.habitualProducts || []).length
            ? currentFit.habitualProducts
            : defaultFit.habitualProducts || []
        );
        cleaned[fitIdx] = {
          ...currentFit,
          habitualProducts: sortedFitProds,
          enableProductsCatalog: true,
        };
        updated = true;
      } else if (defaultFit) {
        cleaned.push({
          ...defaultFit,
          habitualProducts: sortProductsByName(defaultFit.habitualProducts || []),
        });
        updated = true;
      }

      // Sort all clients' habitualProducts by product name
      const finalClients = cleaned.map((c) => {
        if (c.habitualProducts && c.habitualProducts.length > 0) {
          return {
            ...c,
            habitualProducts: sortProductsByName(c.habitualProducts),
          };
        }
        return c;
      });

      if (updated) {
        localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(finalClients));
      }

      return sortClientsAlphabetically(finalClients);
    }
    const seeded = DEFAULT_CLIENTS.map((c) => ({
      ...c,
      habitualProducts: c.habitualProducts ? sortProductsByName(c.habitualProducts) : [],
    }));
    localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(seeded));
    return sortClientsAlphabetically(seeded);
  } catch (e) {
    console.error('Error loading clients db:', e);
    return sortClientsAlphabetically(DEFAULT_CLIENTS);
  }
}

export function sortClientsAlphabetically(clients: ClientData[]): ClientData[] {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export function saveClientToDb(client: ClientData): ClientData {
  const all = getStoredClients();
  const id = client.id || `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const clientToSave: ClientData = {
    ...client,
    id,
    createdAt: client.createdAt || Date.now(),
  };

  const normalizedNif = client.nif ? client.nif.trim().toUpperCase() : '';
  const normalizedName = client.name ? client.name.trim().toLowerCase() : '';

  const existingIdx = all.findIndex((c) => {
    if (c.id && id && c.id === id) return true;
    if (normalizedNif && c.nif && c.nif.trim().toUpperCase() === normalizedNif) return true;
    if (!normalizedNif && normalizedName && c.name && c.name.trim().toLowerCase() === normalizedName) return true;
    return false;
  });

  let updated: ClientData[];

  if (existingIdx >= 0) {
    updated = all.map((c, i) => (i === existingIdx ? clientToSave : c));
  } else {
    updated = [...all, clientToSave];
  }

  const sorted = sortClientsAlphabetically(updated);
  localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(sorted));
  return clientToSave;
}

export function deleteClientFromDb(id: string): ClientData[] {
  const all = getStoredClients();
  const filtered = all.filter((c) => c.id !== id && (c.nif ? c.nif !== id : true) && (c.name ? c.name !== id : true));
  localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(filtered));
  return filtered;
}

// --- PROVIDERS DATABASE METHODS ---

export function getStoredProviders(): ProviderData[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROVIDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(DEFAULT_PROVIDERS));
      return DEFAULT_PROVIDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean legacy mock SVG default logos and exclude application user company cards
      const cleaned = parsed
        .filter(
          (p: ProviderData) =>
            p.id !== 'prov-gestarian' &&
            p.cif !== 'B88994411' &&
            !p.name?.toLowerCase().includes('gestarian soluciones')
        )
        .map((p: ProviderData) => {
          if (p.logoUrl && p.logoUrl.startsWith('data:image/svg+xml')) {
            return { ...p, logoUrl: '', isDefault: false };
          }
          return { ...p, isDefault: false };
        });

      if (cleaned.length === 0) {
        localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(DEFAULT_PROVIDERS));
        return DEFAULT_PROVIDERS;
      }
      return cleaned;
    }
    return DEFAULT_PROVIDERS;
  } catch (e) {
    console.error('Error loading providers db:', e);
    return DEFAULT_PROVIDERS;
  }
}

export function saveProviderToDb(provider: ProviderData): ProviderData {
  const all = getStoredProviders();
  const id = provider.id || `prov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const toSave: ProviderData = {
    ...provider,
    id,
  };

  const normalizedCif = provider.cif ? provider.cif.trim().toUpperCase() : '';
  const normalizedName = provider.name ? provider.name.trim().toLowerCase() : '';

  const existingIdx = all.findIndex((p) => {
    if (p.id && id && p.id === id) return true;
    if (normalizedCif && p.cif && p.cif.trim().toUpperCase() === normalizedCif) return true;
    if (!normalizedCif && normalizedName && p.name && p.name.trim().toLowerCase() === normalizedName) return true;
    return false;
  });

  let updated: ProviderData[];

  if (existingIdx >= 0) {
    updated = all.map((p, i) => (i === existingIdx ? toSave : p));
  } else {
    updated = [...all, toSave];
  }

  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(updated));
  return toSave;
}

export function deleteProviderFromDb(id: string): ProviderData[] {
  const all = getStoredProviders();
  const filtered = all.filter((p) => p.id !== id && (p.cif ? p.cif !== id : true) && (p.name ? p.name !== id : true));
  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(filtered));
  return filtered;
}

export function setDefaultProviderInDb(id: string): ProviderData[] {
  const all = getStoredProviders();
  const updated = all.map((p) => ({
    ...p,
    isDefault: p.id === id,
  }));
  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(updated));
  return updated;
}

// --- INVOICES DATABASE METHODS ---

export function getStoredInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading invoices db:', e);
    return [];
  }
}

export function saveInvoiceToDb(invoice: Invoice): Invoice[] {
  const all = getStoredInvoices();
  const existingIdx = all.findIndex((inv) => inv.id === invoice.id || inv.number === invoice.number);
  let updated: Invoice[];

  if (existingIdx >= 0) {
    updated = all.map((inv, i) => (i === existingIdx ? invoice : inv));
  } else {
    updated = [invoice, ...all];
  }

  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(updated));
  return updated;
}

export const STORAGE_TRASH_KEY = 'gestarian_trash_db';

export function getStoredTrash(): DeletedInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRASH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Auto-empty items older than 1 year (365 days)
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    const valid = parsed.filter((item: any) => {
      const deletedAt = item.deletedAt || Date.now();
      return deletedAt >= oneYearAgo;
    });
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch (e) {
    console.error('Error loading trash db:', e);
    return [];
  }
}

export function addInvoiceToTrash(invoice: Invoice): DeletedInvoice[] {
  const allTrash = getStoredTrash();
  
  // Prevent duplicates in trash
  const exists = allTrash.some((item) => item.id === invoice.id);
  if (exists) return allTrash;

  const newItem: DeletedInvoice = {
    id: invoice.id || `deleted-${Date.now()}`,
    deletedAt: Date.now(),
    invoice,
  };

  const updated = [newItem, ...allTrash];
  localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(updated));
  return updated;
}

export function restoreInvoiceFromTrash(id: string): { trash: DeletedInvoice[], invoices: Invoice[] } {
  const allTrash = getStoredTrash();
  const found = allTrash.find((item) => item.id === id);
  const remainingTrash = allTrash.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(remainingTrash));

  let activeInvoices = getStoredInvoices();
  if (found) {
    if (!activeInvoices.some((inv) => inv.id === found.invoice.id)) {
      activeInvoices = [found.invoice, ...activeInvoices];
      localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(activeInvoices));
    }
  }
  return { trash: remainingTrash, invoices: activeInvoices };
}

export function deleteInvoicePermanentlyFromTrash(id: string): DeletedInvoice[] {
  const allTrash = getStoredTrash();
  const filtered = allTrash.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(filtered));
  return filtered;
}

export function deleteInvoiceFromDb(id: string): Invoice[] {
  const all = getStoredInvoices();
  const invoiceToDelete = all.find((inv) => inv.id === id || inv.number === id);
  if (invoiceToDelete) {
    addInvoiceToTrash(invoiceToDelete);
  }
  const filtered = all.filter((inv) => inv.id !== id && inv.number !== id);
  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(filtered));
  return filtered;
}

// --- BILLABLE PRODUCTS DATABASE METHODS ---

export function getStoredProducts(): BillableProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PRODUCTS;
  } catch (e) {
    console.error('Error loading products db:', e);
    return DEFAULT_PRODUCTS;
  }
}

export function saveProductToDb(product: BillableProduct): BillableProduct {
  const all = getStoredProducts();
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const toSave: BillableProduct = {
    ...product,
    id,
    createdAt: product.createdAt || Date.now(),
  };

  const existingIdx = all.findIndex((p) => p.id === id);
  let updated: BillableProduct[];

  if (existingIdx >= 0) {
    updated = all.map((p, i) => (i === existingIdx ? toSave : p));
  } else {
    updated = [toSave, ...all];
  }

  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
  return toSave;
}

export function deleteProductFromDb(id: string): BillableProduct[] {
  const all = getStoredProducts();
  const filtered = all.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
  return filtered;
}

