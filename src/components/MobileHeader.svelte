<script>
  /**
   * Header simplificado para mobile (< 760px) — referência Figma node 505-4840.
   * Contém apenas: marca (logo), título, botão "Sobre" e seletor de idioma PT|EN.
   * Os controles de filtro NÃO ficam aqui no mobile; vão para o FilterAccordion.
   */
</script>

<header class="mobile-header">
  <img
    class="mobile-header__logo"
    src="{import.meta.env.BASE_URL}logo_acervos-digitais_pt.svg"
    alt="Atlas dos Acervos Digitais"
  />
  <div class="mobile-header__brand-text">
    <span class="mobile-header__title">Atlas Geopolítico</span>
    <span class="mobile-header__subtitle">dos Acervos Digitais</span>
  </div>
  <div class="mobile-header__actions">
    <button class="mobile-header__action-btn">Sobre</button>
    <div class="mobile-header__lang">
      <button class="mobile-header__lang-btn mobile-header__lang-btn--active">PT</button>
      <button class="mobile-header__lang-btn">EN</button>
    </div>
  </div>
</header>

<style lang="scss">
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--menu-height); /* 90px em mobile */
    padding: 0 20px; /* MOBILE_PADDING_X */
    background: var(--bg);
    border-bottom: 1px solid var(--bg-hl);
    flex-shrink: 0;
  }

  .mobile-header__logo {
    height: 40px;
    width: auto;
    display: block;
    flex-shrink: 0;
  }

  .mobile-header__brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .mobile-header__title,
  .mobile-header__subtitle {
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #d2d2d2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-header__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }

  .mobile-header__action-btn {
    all: unset;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: #bbbbbb;
    cursor: pointer;
    white-space: nowrap;

    &:hover { color: var(--txt); }
  }

  .mobile-header__lang {
    display: flex;
    gap: 6px;
  }

  .mobile-header__lang-btn {
    all: unset;
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--txt-hl);
    cursor: pointer;

    &:hover { color: var(--txt); }
  }

  .mobile-header__lang-btn--active {
    color: var(--txt);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
