/**
 * Constantes canônicas compartilhadas entre módulos.
 * Fonte de verdade única para valores que antes eram duplicados em
 * WorldMap.svelte, Tooltip.svelte, FilterControls.svelte e dataUtils.js.
 */

// ─── Cores e rótulos por tipo de bubble ──────────────────────────────────────

export const TYPE_COLOR = {
  birth:     '#2563eb',
  death:     '#dc2626',
  education: '#16a34a',
  acervo:    '#d97706',
};

export const TYPE_LABEL = {
  birth:     'Nascimento',
  death:     'Morte',
  education: 'Estudo',
  acervo:    'Acervo',
};

// ─── Normalização de valores de confiança do CSV ──────────────────────────────

/**
 * Normaliza os valores inconsistentes do campo de confiança no CSV
 * (alto/alta/médio/baixa/baixo) para labels canônicos exibidos no ArtistCard.
 */
export const CONFIDENCE_LABEL = {
  alto:  'Alta',
  alta:  'Alta',
  médio: 'Médio',
  medio: 'Médio',
  baixa: 'Baixa',
  baixo: 'Baixa',
};

// ─── Mapeamento ISO 3166-1 numérico → continente (PT-BR) ─────────────────────

/**
 * Chave: código ISO 3166-1 numérico como string (ex: '76' para o Brasil).
 * Valor: nome do continente em PT-BR.
 * Usado por dataUtils para pré-computar o continente de cada bubble.
 */
export const ISO_CONTINENT = {
  // África
  '12': 'África', '24': 'África', '204': 'África', '72': 'África',
  '854': 'África', '108': 'África', '120': 'África', '140': 'África',
  '148': 'África', '174': 'África', '178': 'África', '180': 'África',
  '384': 'África', '262': 'África', '818': 'África', '226': 'África',
  '232': 'África', '231': 'África', '266': 'África', '270': 'África',
  '288': 'África', '324': 'África', '624': 'África', '404': 'África',
  '426': 'África', '430': 'África', '434': 'África', '450': 'África',
  '454': 'África', '466': 'África', '478': 'África', '480': 'África',
  '504': 'África', '508': 'África', '516': 'África', '562': 'África',
  '566': 'África', '646': 'África', '678': 'África', '686': 'África',
  '694': 'África', '706': 'África', '710': 'África', '728': 'África',
  '729': 'África', '748': 'África', '834': 'África', '768': 'África',
  '788': 'África', '800': 'África', '894': 'África', '716': 'África',

  // América do Norte
  '28': 'América do Norte', '44': 'América do Norte', '52': 'América do Norte',
  '84': 'América do Norte', '124': 'América do Norte', '188': 'América do Norte',
  '192': 'América do Norte', '212': 'América do Norte', '214': 'América do Norte',
  '222': 'América do Norte', '308': 'América do Norte', '320': 'América do Norte',
  '332': 'América do Norte', '340': 'América do Norte', '388': 'América do Norte',
  '484': 'América do Norte', '558': 'América do Norte', '591': 'América do Norte',
  '659': 'América do Norte', '662': 'América do Norte', '670': 'América do Norte',
  '780': 'América do Norte', '840': 'América do Norte',

  // América do Sul
  '32': 'América do Sul', '68': 'América do Sul', '76': 'América do Sul',
  '152': 'América do Sul', '170': 'América do Sul', '218': 'América do Sul',
  '328': 'América do Sul', '600': 'América do Sul', '604': 'América do Sul',
  '740': 'América do Sul', '858': 'América do Sul', '862': 'América do Sul',
  '254': 'América do Sul',

  // Ásia
  '4': 'Ásia', '51': 'Ásia', '31': 'Ásia', '50': 'Ásia', '64': 'Ásia',
  '96': 'Ásia', '116': 'Ásia', '156': 'Ásia', '626': 'Ásia', '268': 'Ásia',
  '356': 'Ásia', '360': 'Ásia', '364': 'Ásia', '368': 'Ásia', '376': 'Ásia',
  '392': 'Ásia', '400': 'Ásia', '398': 'Ásia', '408': 'Ásia', '410': 'Ásia',
  '414': 'Ásia', '417': 'Ásia', '418': 'Ásia', '422': 'Ásia', '458': 'Ásia',
  '462': 'Ásia', '496': 'Ásia', '104': 'Ásia', '524': 'Ásia', '512': 'Ásia',
  '586': 'Ásia', '275': 'Ásia', '608': 'Ásia', '634': 'Ásia', '682': 'Ásia',
  '702': 'Ásia', '144': 'Ásia', '760': 'Ásia', '158': 'Ásia', '762': 'Ásia',
  '764': 'Ásia', '795': 'Ásia', '784': 'Ásia', '860': 'Ásia', '704': 'Ásia',
  '887': 'Ásia',

  // Europa
  '8': 'Europa', '20': 'Europa', '40': 'Europa', '112': 'Europa',
  '56': 'Europa', '70': 'Europa', '100': 'Europa', '191': 'Europa',
  '196': 'Europa', '203': 'Europa', '208': 'Europa', '233': 'Europa',
  '246': 'Europa', '250': 'Europa', '276': 'Europa', '300': 'Europa',
  '348': 'Europa', '352': 'Europa', '372': 'Europa', '380': 'Europa',
  '428': 'Europa', '438': 'Europa', '440': 'Europa', '442': 'Europa',
  '470': 'Europa', '498': 'Europa', '492': 'Europa', '499': 'Europa',
  '528': 'Europa', '807': 'Europa', '578': 'Europa', '616': 'Europa',
  '620': 'Europa', '642': 'Europa', '643': 'Europa', '674': 'Europa',
  '688': 'Europa', '703': 'Europa', '705': 'Europa', '724': 'Europa',
  '752': 'Europa', '756': 'Europa', '804': 'Europa', '826': 'Europa',
  '336': 'Europa',

  // Oceania
  '36': 'Oceania', '242': 'Oceania', '296': 'Oceania', '584': 'Oceania',
  '583': 'Oceania', '520': 'Oceania', '554': 'Oceania', '585': 'Oceania',
  '598': 'Oceania', '882': 'Oceania', '90': 'Oceania', '776': 'Oceania',
  '798': 'Oceania', '548': 'Oceania',

  // Antártica
  '10': 'Antártica',
};

// ─── Parâmetros visuais do mapa ───────────────────────────────────────────────

/** Raio visual das bubbles (px). Usado em WorldMap e no cálculo de colisão em dataUtils. */
export const BUBBLE_RADIUS = 2.5;

// ─── Projeção de referência (compartilhada entre WorldMap e dataUtils) ────────

/**
 * Rotação central da projeção — Brasil no centro do mundo.
 * dataUtils usa este valor para pré-computar offsets de colisão na mesma
 * referência que WorldMap usa para renderizar.
 */
export const CENTRAL_ROTATION = [54, 0, 0];

/**
 * Dimensões da projeção de referência usada pelo forceCollide em dataUtils.
 * Devem ser compatíveis com a proporção típica do canvas em WorldMap.
 */
export const REF_W = 960;
export const REF_H = 500;
