class VariantPicker extends HTMLElement {
    constructor() {
        super();
        this._onChange = this._onChange.bind(this);
    }

    connectedCallback(){
        this.addEventListener('change', this._onChange);
    }

    disconnectedCallback(){
        this.removeEventListener('change', this._onChange);
    }

    async _onChange(event) {
      const target = event.target;
      if(!target) return;

      const productElement = target.closest('#product');
      const sectionId = productElement.dataset.sectionId || '';
      const currentUrl = productElement.dataset.productUrl || '';

      const radios = Array.from(this.querySelectorAll('.variant-picker-values input[type="radio"]'));

      const selects = Array.from(this.querySelectorAll('.variant-picker-values select'));

      let selectedOptionValues = [];

      if(radios.length > 0){
        radios.forEach(input => {
          if (!input.checked) return;
          if(input.value) selectedOptionValues.push(String(input.value));
        });
      }else if (selects.length > 0){
        selects.forEach(select => {
          const opt = select.selectedOptions && select.selectedOptions[0];
          if(!opt) return;
          if(opt.value) selectedOptionValues.push(String(opt.value));
        });
      }

      const variantSelect = this.querySelector('select[name="id"]');

      let params = '';
      if(selectedOptionValues.length > 0){
        const unique = Array.from(new Set(selectedOptionValues));
        params = `&option_values=${encodeURIComponent(unique.join(','))}`;
      }else if (variantSelect && variantSelect.value) {
        params = `&variant=${encodeURIComponent(variantSelect.value)}`;
      }

      const fetchUrlBase = currentUrl;

      if(!fetchUrlBase) {
        console.warn('Product url not available');
      }

      const fethUrl = `${fetchUrlBase}?section_id=${encodeURIComponent(sectionId)}${params}`;
      
      try {
        const response = await fetch(fethUrl, { headers: {'X-Requested-With':'XMLHttpRequest'}});
        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
        const responseText = await response.text();
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const newVariantPicker = html.querySelector('variant-picker');
        const variantPrice = html.querySelector('.tf-product-info-price');
        const stickyAtc = html.querySelector('.tf-sticky-atc-variant-price select');
        const variantId = html.querySelector('select[name="id"]').value;

        const atcButton = html.querySelector('.tf-product-info-buy-button');
        const variantImage = html.querySelector('input#variant-image-store');

        if(newVariantPicker) {
          this.innerHTML = newVariantPicker.innerHTML;
          const clickedInput = document.getElementById(`${target.id}`);
          if (clickedInput) clickedInput.focus();
          this.dispatchEvent(new CustomEvent('variant-picker:updated', {bubbles: true}));
        }else{
          console.warn('Fetched HTML did not include a <variant-picker>');
        }

        this._updatePrice(variantPrice);
        this._updateAtc(stickyAtc);
        this._updateUrlVariant(variantId);
        this._updateAtcButton(atcButton);
        this._updateVariantImage(variantImage);

      } catch (error){
        console.error('Variant picker fetch error: ', error);
      }

    }

    _updatePrice(priceElement) {
      if(priceElement){
        const priceEl = document.querySelector('.tf-product-info-price');
        if(priceEl) priceEl.innerHTML = priceElement.innerHTML;
      }
    }

    _updateAtc(stickyAtc){
      if(stickyAtc){
        const atcEl = document.querySelector('.tf-sticky-atc-variant-price select');
        if(atcEl) atcEl.innerHTML = stickyAtc.innerHTML;
      }
    }

    _updateUrlVariant(variantId) {
      try {
        if (!variantId) return;

        // Normalize base URL to an absolute URL relative to current origin
        let absoluteUrl = new URL(window.location.href);

        // Keep existing params (if baseProductUrl included some) and set/replace variant
        const params = new URLSearchParams(absoluteUrl.search);
        params.set('variant', String(variantId));
        // If absoluteUrl contains origin same as current origin, use pathname + search only (keeps host unchanged)
        const newUrl = absoluteUrl.pathname + (params.toString() ? `?${params.toString()}` : '');

        // Replace history
        window.history.replaceState({}, '', newUrl);
      } catch (err) {
        console.warn('Failed to update URL variant param', err);
      }
    }

    _updateAtcButton(atcElement) {
      if(atcElement){
        const atcButton = document.querySelector('.tf-product-info-buy-button');
        if(atcButton) atcButton.innerHTML = atcElement.innerHTML;
      }
    }

    _updateVariantImage(variantImage){
      if(variantImage){
        const slideImg = variantImage.value;
        const slideZomming = variantImage.dataset.zoom;
        const slideThumb = variantImage.dataset.thumbs;
        const thumb = document.querySelector('.swiper-slide.swiper-slide-thumb-active img');
        const mainSlideImg = document.querySelector('#gallery-swiper-started .swiper-slide.swiper-slide-active img');
        const mainSlideHref = document.querySelector('#gallery-swiper-started .swiper-slide.swiper-slide-active a');
        if(slideThumb && thumb != null){
          console.log({slideThumb});
          thumb.srcset = slideThumb;
          thumb.src = slideThumb;
        }
        if(mainSlideImg && slideImg){
          mainSlideImg.srcset = slideImg;
          mainSlideImg.src = slideImg;
          mainSlideImg.dataset.zoom = slideZomming;
          mainSlideHref.href = slideZomming;
        }
      }
    }
}

if(!customElements.get('variant-picker')){
    customElements.define('variant-picker', VariantPicker);
}