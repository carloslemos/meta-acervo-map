/**
 * Constantes canônicas compartilhadas entre módulos.
 * Fonte de verdade única para valores que antes eram duplicados em
 * WorldMap.svelte, Tooltip.svelte, FilterControls.svelte e dataUtils.js.
 */

// ─── Cores e rótulos por tipo de bubble ──────────────────────────────────────

// Paleta canônica do tema escuro (referência Figma 65VY0RJh4omVZFM7FCBbAL, nó 1:7358).
// Espelha os tokens de cor em src/styles/global.scss (--birth/-death/-edu-color).
// Estas cores são usadas tanto nas bubbles do mapa quanto nas pills do header.
export const TYPE_COLOR = {
  birth:     '#f0e442',  // amarelo — Nascimento
  death:     '#009e74',  // verde — Morte
  education: '#cc79a7',  // rosa — Estudo
  acervo:    '#ffffff',  // branco — Acervo
};

// Tom mais brilhante/saturado por tipo — usado em estado hover das pills e
// nos botões do overlay. Sempre distinto (mais vivo) do tom base em TYPE_COLOR.
export const TYPE_COLOR_HOVER = {
  birth:     '#f5e51c',  // amarelo saturado — Nascimento hover
  death:     '#2ec09c',  // verde-água — Morte hover
  education: '#e89bd3',  // rosa claro — Estudo hover
  acervo:    '#bbbbbb',  // neutro-30 — Acervo hover
};

/** Cor da bubble de acervo no tema claro — carvão escuro para contraste sobre oceano claro. */
export const TYPE_COLOR_ACERVO_LIGHT = '#1a1a1a';

export const TYPE_LABEL = {
  birth:     'Nascimento',
  death:     'Morte',
  education: 'Formação',
  acervo:    'Museus',
};

// ─── Rótulos de gênero em PT-BR ──────────────────────────────────────────────
export const GENDER_LABEL = {
  male:       'Masculino',
  female:     'Feminino',
  'non-binary': 'Não-binário',
  unknown:    'Desconhecido',
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
  '124': 'América do Norte', '484': 'América do Norte', '840': 'América do Norte',

  // América Central e Caribe
  '28': 'América Central e Caribe', '44': 'América Central e Caribe',
  '52': 'América Central e Caribe', '84': 'América Central e Caribe',
  '188': 'América Central e Caribe', '192': 'América Central e Caribe',
  '212': 'América Central e Caribe', '214': 'América Central e Caribe',
  '222': 'América Central e Caribe', '308': 'América Central e Caribe',
  '320': 'América Central e Caribe', '332': 'América Central e Caribe',
  '340': 'América Central e Caribe', '388': 'América Central e Caribe',
  '558': 'América Central e Caribe', '591': 'América Central e Caribe',
  '659': 'América Central e Caribe', '662': 'América Central e Caribe',
  '670': 'América Central e Caribe', '780': 'América Central e Caribe',

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
  '887': 'Ásia', '792': 'Ásia',

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

/** Largura do anel de destaque (halo branco) ao redor de uma bubble selecionada (px). */
export const BUBBLE_HIGHLIGHT_RING_WIDTH = 1.5;

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

// ─── Trajetórias: animação de fluxo ──────────────────────────────────────────

/** Ativa/desativa animação de pontos fluindo nas trajetórias (pulso óptico). */
export const TRAJECTORY_FLOW_ENABLED = true;

/** Velocidade de fluxo em pixels por milissegundo (~60 px/s). */
export const TRAJECTORY_FLOW_SPEED_PX = 0.06;

/** Raio do ponto animado nas trajetórias (px). */
export const TRAJECTORY_FLOW_DOT_RADIUS = 1;

/** Cor do ponto de fluxo em repouso (branco-gelo). */
export const TRAJECTORY_FLOW_COLOR_NORMAL = '#f4f6f8';

/** Cor do ponto de fluxo destacado (amber/laranja). */
export const TRAJECTORY_FLOW_COLOR_HIGHLIGHT = '#ffffff';

/** Cor do ponto de fluxo em repouso no tema claro (cinza escuro — contraste sobre fundo claro). */
export const TRAJECTORY_FLOW_COLOR_NORMAL_LIGHT = '#4b4b4b';

/** Cor do fio/ponto de destaque de trajetória no tema claro (preto — contraste sobre fundo claro). */
export const TRAJECTORY_FLOW_COLOR_HIGHLIGHT_LIGHT = '#121212';

// ─── Morph entre projeções (2D ↔ 3D) ──────────────────────────────────────────

/** Ativa/desativa animação de morph entre projeções. False = troca instantânea. */
export const PROJECTION_MORPH_ENABLED = false;

/** Duração da animação de morph entre projeções (ms). */
export const PROJECTION_MORPH_DURATION = 700;

/** Fator de escala 3D do globo em relação ao tamanho do canvas (0.44 = 44%). */
export const PROJECTION_3D_SCALE_FACTOR = 0.44;

/** Fator de escala base 2D para o mapa (pixels). */
export const PROJECTION_2D_BASE_SCALE = 168;

// ─── Zoom e Controles do Mapa ─────────────────────────────────────────────────

/** Fator de incremento/decremento de zoom ao clicar botões +/− (multiplicativo). */
export const ZOOM_STEP_FACTOR = 1.3;

/** Escala mínima de zoom em projeção 2D (EqualEarth). */
export const ZOOM_MIN_2D = 1;

/** Escala máxima de zoom em projeção 2D (EqualEarth). */
export const ZOOM_MAX_2D = 8;

/** Escala mínima de zoom em projeção 3D (Ortográfica). */
export const ZOOM_MIN_3D = 0.5;

/** Escala máxima de zoom em projeção 3D (Ortográfica). */
export const ZOOM_MAX_3D = 5;

// ─── Artwork Strip: dimensões e timing ────────────────────────────────────────

/** Altura da faixa de obras quando expandida em tablet/desktop (px). */
export const ARTWORK_STRIP_HEIGHT_EXPANDED = 124;

/** Altura da faixa de obras quando colapsada (só header) em tablet/desktop (px). */
export const ARTWORK_STRIP_HEIGHT_COLLAPSED = 36;

/** Altura da faixa de obras quando expandida no mobile (overlay flutuante) (px). */
export const ARTWORK_STRIP_HEIGHT_MOBILE_EXPANDED = 65;

/** Altura da aba/botão de abertura da faixa de obras no mobile (px). */
export const ARTWORK_STRIP_HEIGHT_MOBILE_COLLAPSED = 31;

/** Duração da transição de altura ao expandir/colapsar (ms). */
export const ARTWORK_STRIP_TRANSITION_DURATION = 200;

/** Delay antes de exibir tooltip ao passar hover em obra (ms). */
export const ARTWORK_STRIP_HOVER_DELAY = 300;

/** Gradiente do fade-out na base da faixa de obras. */
export const ARTWORK_STRIP_FADE_GRADIENT = 'linear-gradient(180deg, rgba(0, 0, 0, 0) 38.46%, #000000 100%)';

// ─── Layout: dimensões e breakpoints ──────────────────────────────────────────

/**
 * Breakpoints de layout (referência Figma node 505-4840 "Tablet e Mobile").
 * Três faixas: mobile (< 760), tablet (760–1379), desktop (≥ 1380).
 * - Mobile: header simplificado + FilterAccordion sobreposto ao mapa.
 * - Tablet: layout similar ao desktop, sidebar mais estreita (302px).
 * - Desktop: sidebar 365px, header completo.
 */
export const BREAKPOINT_TABLET = 760;
export const BREAKPOINT_DESKTOP = 1380;

/**
 * @deprecated Mantido para compatibilidade. Use BREAKPOINT_TABLET para
 * separar mobile (< 760) de tablet/desktop.
 */
export const BREAKPOINT_MOBILE = 1023;

/**
 * Classifica uma largura de viewport em uma faixa de layout.
 * @param {number} width largura em px (ex: window.innerWidth)
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function getBreakpoint(width) {
  if (width < BREAKPOINT_TABLET) return 'mobile';
  if (width < BREAKPOINT_DESKTOP) return 'tablet';
  return 'desktop';
}

/** Largura da sidebar em desktop (≥ 1380px) (px). */
export const SIDEBAR_WIDTH_DESKTOP = 365;

/** Largura da sidebar em tablet (760–1379px) (px). */
export const SIDEBAR_WIDTH_TABLET = 302;

/** Altura do header simplificado em mobile (< 760px) (px). */
export const MOBILE_HEADER_HEIGHT = 90;

/** Altura de cada cabeçalho de nível do FilterAccordion em mobile (px). */
export const ACCORDION_ITEM_HEIGHT = 52;

/** Padding lateral (esquerda/direita) dos componentes em mobile (px). */
export const MOBILE_PADDING_X = 20;

/** Duração da animação de expand/collapse do FilterAccordion (ms). */
export const ACCORDION_ANIMATION_DURATION = 300;

/** Curva de easing da animação do FilterAccordion. */
export const ACCORDION_ANIMATION_EASING = 'ease-out';

/** Largura do card de artista em desktop (px). */
export const ARTIST_CARD_WIDTH = 360;

/** Opacidade do backdrop quando sidebar está aberta em mobile. */
export const SIDEBAR_BACKDROP_OPACITY = 0.8;

/** Cor e opacidade do backdrop (RGBA). */
export const SIDEBAR_BACKDROP_COLOR = 'rgba(0, 0, 0, 0.5)';

// ─── Dados: marcadores especiais ──────────────────────────────────────────────

/** Valor sentinela para ano não-datado (será oculto em visualizações). */
export const UNDATED_YEAR = 9999;

// ─── Animações e transições (SCSS shared) ────────────────────────────────────

/** Duração padrão de transições rápidas (ms). */
export const TRANSITION_FAST = '0.12s';

/** Duração padrão de transições médias (ms). */
export const TRANSITION_MEDIUM = '200ms';

/** Duração padrão de transições lentas (ms). */
export const TRANSITION_SLOW = '300ms';
// ─── URLs e caminhos de arquivos de dados ────────────────────────────────────

/**
 * CSV principal com criadores: lat/lon de nascimento, morte, estudo.
 * Versão fixa (v4). Se mudar, atualizar apenas aqui.
 */
export const CSV_CREATORS_PATH = 'atlas_ma_0610_v2.csv';

/**
 * CSV de acervos geolocalizados. Mapeia cada acervo a suas coordenadas.
 * Bubbles de tipo "acervo" são geradas daqui.
 */
export const CSV_ACERVOS_PATH = 'acervos_geolocated.csv';

/**
 * JSON de obras dos criadores. Estrutura: { wikidataId: { creator, museum, title, year, image, url } }.
 * Carregado via fetch com BASE_URL (para GitHub Pages).
 */
export const JSON_ARTWORKS_PATH = '20250705_processed.json';

/**
 * TopoJSON de fronteiras de países e continentes (Natural Earth 110m).
 * Usado para pré-computar country/continent de cada bubble.
 */
export const GEOJSON_COUNTRIES_PATH = 'countries-110m.json';

/** Delimitador do CSV de criadores (ponto-e-vírgula). */
export const CSV_CREATORS_DELIMITER = ';';

// ─── Tutorial / Onboarding ────────────────────────────────────────────────────

/** Chave localStorage para persistir o estado dismissed do tutorial. */
export const LS_TUTORIAL_KEY = 'meta-acervo:tutorial-dismissed';

/** Chave localStorage para persistir a preferência de tema (light|dark). */
export const LS_THEME_KEY = 'meta-acervo:theme';

/** Chave localStorage para persistir o estado colapsado do painel de perfil (true|false). */
export const LS_PROFILE_PANEL_KEY = 'meta-acervo:profile-panel-collapsed';

/** Texto da caixa de tutorial da sidebar (Box 1). */
export const TUTORIAL_SIDEBAR_TEXT = 'Explore os filtros e navegue pelas trajetórias dos artistas dos acervos';

/** Título da caixa de tutorial do centro do mapa (Box 2). */
export const TUTORIAL_MAP_TITLE = 'Como navegar';

/** Instrução de navegação desktop — Box 2 (texto após o label bold). */
export const TUTORIAL_MAP_TEXT_NAV = 'Para girar o globo, clique e segure o botão esquerdo do mouse e arraste.';

/** Instrução de zoom desktop — Box 2 (texto após o label bold). */
export const TUTORIAL_MAP_TEXT_ZOOM = 'Use o scroll do mouse ou clique nos botões + e − para aproximar ou afastar.';

/** Instrução de seleção mobile — Box 2. */
export const TUTORIAL_MAP_TEXT_MOBILE_SELECT = 'Escolha categorias e visualizações para ver as trajetórias dos artistas.';

/** Instrução de navegação mobile — Box 2. */
export const TUTORIAL_MAP_TEXT_MOBILE_NAV = 'Deslize um dedo pela tela para girar o globo.';

/** Instrução de zoom mobile — Box 2. */
export const TUTORIAL_MAP_TEXT_MOBILE_ZOOM = 'Toque nos botões + e − ou junte e afaste dois dedos para aproximar e afastar.';

/** Instrução de modo planisfério/2D — Box 2 (tutorial sobre como alternar para 2D). */
export const TUTORIAL_MAP_TEXT_2D = 'Para visualizar em modo planisfério (2D), clique no ícone do planisfério.';

/** Instruções de filtros — Box 1 no tutorial. */
export const TUTORIAL_FILTER_TEXT = 'Selecione um ou mais filtros na coluna à esquerda para localizar museus, artistas, locais de formação, nacionalidade e gênero.';

/** Instruções de combinação de filtros — Box 1 no tutorial. */
export const TUTORIAL_COMBINATION_TEXT = 'Combine os filtros com informações sobre um/uma artista (local de nascimento, morte, instituição de ensino e museus que possuem suas obras).';

/** Texto da caixa de tutorial do artwork strip (Box 3). */
export const TUTORIAL_STRIP_TEXT = 'Obras dos artistas nos acervos selecionados';

// ─── Textos de filtros, labels, buttons e seções (UI) ──────────────────────

/** Título da aplicação. */
export const APP_TITLE = 'Atlas dos Percursos Artísticos';

/** URL do site do projeto (para o link do logo). */
export const APP_WEBSITE_URL = 'https://www.acervosdigitais.fau.usp.br/meta-acervos-navegador-para-museus-em-rede/';

/** Rótulos de filtros na sidebar. */
export const FILTER_LABELS = {
  acervo: 'Museus',
  artista: 'Artistas',
  education: 'Formação',
  nacionalidade: 'Nacionalidade',
  gender: 'Gênero',
};

/** Placeholders para campos de autocomplete. */
export const AUTOCOMPLETE_PLACEHOLDERS = {
  artista: 'Selecionar artistas',
  education: 'Locais de estudo',
  nacionalidade: 'Selecionar',
  acervo: 'Selecionar museus',
};

/** Rótulos de botões em filtros. */
export const BUTTON_LABELS = {
  selectAll: 'Selecionar todos',
  clearSelection: 'Limpar seleção',
};

/** Títulos de seções na UI. */
export const SECTION_LABELS = {
  accordion: 'Museus e artistas',
  filterLocality: 'Filtrar por país ou região',
  trajectoryVisualization: 'Visualizar percursos',
  trajectories: 'Trajetos',
  trajectoryToggle: 'Exibir / Ocultar',
  sidebarDescription: 'Selecione os filtros e navegue pelos percursos dos artistas nos acervos dos museus',
};

/** Rótulos de estatísticas no mapa. */
export const STATS_LABELS = {
  acervosSelected: 'Museus Selecionados',
  artistas: 'Artistas',
  escolas: 'Instituições educacionais',
  obras: 'Obras em museus',
};

/** Mensagem padrão da faixa de obras (quando nenhuma obra está selecionada). */
export const ARTWORK_STRIP_DEFAULT_MESSAGE = 'Conheça as obras dos artistas nos museus selecionados';

/** Texto de instrução do filtro de localidade/país na sidebar. */
export const LOCALITY_FILTER_INSTRUCTION = 'Filtrar por país ou região';