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

        const atcButton = html.querySelector('.tf-product-info-buy-button');

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
        this._updateAtcButton(atcButton);

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

    _updateAtcButton(atcElement) {
      if(atcElement){
        const atcButton = document.querySelector('.tf-product-info-buy-button');
        if(atcButton) atcButton.innerHTML = atcElement.innerHTML;
      }
    }
}

if(!customElements.get('variant-picker')){
    customElements.define('variant-picker', VariantPicker);
}