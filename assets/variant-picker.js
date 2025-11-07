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

    async _onChange (event){

    }
}

if(!customElements.get('variant-picker')){
    customElements.define('variant-picker', VariantPicker);
}