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
    background: var(--chrome-bg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-snug);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--chrome-txt);
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
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--chrome-txt-l);
    cursor: pointer;
    white-space: nowrap;

    &:hover { color: var(--chrome-txt); }
  }

  .mobile-header__lang {
    display: flex;
    gap: 6px;
  }

  .mobile-header__lang-btn {
    all: unset;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    letter-spacing: var(--letter-spacing-tight);
    color: var(--chrome-txt-l);
    cursor: pointer;

    &:hover { color: var(--chrome-txt); }
  }

  .mobile-header__lang-btn--active {
    color: var(--chrome-txt);
    font-weight: var(--font-weight-bold);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
