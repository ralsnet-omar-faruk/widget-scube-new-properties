/**
 * Rals Widget Slide - Swiper Carousel Integration
 * Creates a slide/carousel display similar to tenpos-ft.com
 * Uses the existing RalsWidget3 for data fetching
 */
(function () {
  'use strict';

  /**
   * Render the slide widget with Swiper
   * @param {HTMLElement} container - The widget container element
   */
  async function renderSlideWidget(container) {
    // Mark as slide widget to prevent regular widget from processing
    container.dataset.slideWidget = 'true';
    
    // Apply company config if available
    if (window.RalsWidgetRenderer && window.RalsWidgetRenderer.applyCompanyConfig) {
      window.RalsWidgetRenderer.applyCompanyConfig(container);
    }

    // Get the template before clearing
    const template = container.querySelector('.property-card');
    if (!template) {
      console.error('Template .property-card not found in HTML');
      return;
    }

    const templateHTML = template.outerHTML;

    // Show loading
    const loadingMessage = container.dataset.loadingMessage || '物件を読み込み中...';
    container.innerHTML = `<div class="loading-message">${loadingMessage}</div>`;

    // Fetch property data using RalsWidget3
    let properties;
    try {
      properties = await window.RalsWidget3.fetchPropertyData(container);
    } catch (error) {
      console.error('Error fetching property data:', error);
      const errorMessage = container.dataset.errorMessage || 
        '物件情報の読み込みに失敗しました。しばらくしてから再度お試しください。';
      container.innerHTML = `<div class="error-message">${errorMessage}</div>`;
      return;
    }

    if (!properties || properties.length === 0) {
      const noPropertiesMessage = container.dataset.noPropertiesMessage || '物件が見つかりません。';
      container.innerHTML = `<div class="no-properties-message">${noPropertiesMessage}</div>`;
      return;
    }

    // Build slide HTML
    const slidesHTML = properties.map((property, index) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = templateHTML;
      const card = tempDiv.firstElementChild;

      // Handle image
      const img = card.querySelector('.property-img');
      if (img) {
        if (property.thumbnailUrl && property.thumbnailUrl.trim() !== '') {
          img.src = property.thumbnailUrl;
          img.onerror = function () {
            this.src = container.dataset.fallbackImageUrl || '';
            this.onerror = null;
          };
        } else {
          img.src = container.dataset.fallbackImageUrl || '';
        }
        img.alt = property.title || 'Property Image';
      }

      // Handle condition badge (tenpos-ft style: 居抜き/スケルトン)
      // TODO: Update to use real API data when available (property.condition field)
      const conditionBadge = card.querySelector('.property-condition-badge');
      if (conditionBadge) {
        // Using static dummy value for now - all 居抜き
        // Will be updated later when API provides this field
        conditionBadge.textContent = '居抜き';
        conditionBadge.classList.add('inuki');
      }

      // Handle address (tenpos-ft style: includes building name)
      const addressEl = card.querySelector('.property-address');
      if (addressEl) {
        // Combine address with title/building name
        const addressText = [];
        if (property.address) addressText.push(property.address);
        if (property.title) addressText.push(property.title);
        
        if (addressText.length > 0) {
          addressEl.textContent = addressText.join(' ');
        } else {
          addressEl.style.display = 'none';
        }
      }

      // Handle property type (スナック, コンカフェ, etc.)
      // TODO: Update to use real API data when available (property.type field)
      const typeEl = card.querySelector('.property-type');
      if (typeEl) {
        // Using static dummy value for now - 店舗
        // Will be updated later when API provides this field
        typeEl.textContent = '店舗';
      }

      // Handle area size
      const areaEl = card.querySelector('.property-area');
      if (areaEl) {
        if (property.area && property.area.trim() !== '') {
          areaEl.textContent = property.area;
        } else {
          areaEl.style.display = 'none';
        }
      }

      // Handle comment
      const commentEl = card.querySelector('.property-comment');
      if (commentEl) {
        if (property.comment && property.comment.trim() !== '') {
          commentEl.textContent = property.comment;
        } else {
          // Fallback to title if no comment
          if (property.title && property.title.trim() !== '') {
            commentEl.textContent = property.title;
          } else {
            commentEl.style.display = 'none';
          }
        }
      }

      // Handle card link (wrapping anchor)
      const cardLink = card.querySelector('.property-link');
      if (cardLink) {
        if (property.detailUrl && property.detailUrl.trim() !== '') {
          cardLink.href = property.detailUrl;
        } else {
          // Remove href if no URL
          cardLink.removeAttribute('href');
        }
      }

      // Wrap in swiper-slide
      return `<div class="swiper-slide" role="group" aria-label="${index + 1} / ${properties.length}">${card.outerHTML}</div>`;
    }).join('');

    // Build the complete Swiper structure
    container.innerHTML = `
      <div class="swiper rals-swiper">
        <div class="swiper-wrapper">
          ${slidesHTML}
        </div>
        <div class="swiper-pagination"></div>
      </div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>
    `;

    // Initialize Swiper
    initSwiper(container);
  }

  /**
   * Initialize Swiper carousel
   * @param {HTMLElement} container - The widget container
   */
  function initSwiper(container) {
    const swiperEl = container.querySelector('.swiper');
    if (!swiperEl) return;

    // Get configuration from data attributes
    const spaceBetween = parseInt(container.dataset.spaceBetween || '36', 10);
    const loop = container.dataset.loop !== 'false';
    const autoplay = container.dataset.autoplay === 'true';
    const autoplayDelay = parseInt(container.dataset.autoplayDelay || '5000', 10);

    const swiperConfig = {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: loop,
      grabCursor: true,
      pagination: {
        el: container.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: container.querySelector('.swiper-button-next'),
        prevEl: container.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        // Mobile first approach
        // >= 769px
        769: {
          slidesPerView: 2,
          spaceBetween: spaceBetween,
        },
      },
    };

    // Add autoplay if enabled
    if (autoplay) {
      swiperConfig.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      };
    }

    // Create Swiper instance
    const swiper = new Swiper(swiperEl, swiperConfig);

    // Explicitly start autoplay if enabled
    if (autoplay && swiper.autoplay) {
      swiper.autoplay.start();
    }

    // Store reference for external access
    container._swiperInstance = swiper;
  }

  /**
   * Initialize all slide widgets on the page
   */
  function initAllSlideWidgets() {
    const containers = document.querySelectorAll('.rals-widget-slide');
    containers.forEach(container => {
      renderSlideWidget(container);
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSlideWidgets);
  } else {
    initAllSlideWidgets();
  }

  // Expose globally
  window.RalsWidgetSlide = {
    renderSlideWidget,
    initSwiper,
    initAllSlideWidgets,
  };

})();

