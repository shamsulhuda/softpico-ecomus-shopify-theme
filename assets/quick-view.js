class quickView extends HTMLElement {
    constructor() {
        super();
        this.button = this.querySelector('button');
        this.productUrl = this.getAttribute('data-product-url');

        this.modalBox = document.querySelector('.popup-quickview');
        this.wrapper = this.modalBox.querySelector('product-info');
        this.media = this.modalBox.querySelector('.tf-product-media-wrap');
        this.info = this.modalBox.querySelector('.tf-product-info-list');

        if(this.button){
            this.button.addEventListener('click', this.getProductData.bind(this));
        }
        
    }

    getProductData(){
        this.classList.add('loading');
        this.button.setAttribute('disabled', true);

        fetch(`${this.productUrl}`)
            .then((response) => response.text())
            .then((responseText) => {
                const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
                const productElement = responseHTML.querySelector('product-info');
                const product_media = productElement.querySelector('.tf-product-media-main a.item');
                const product_info = productElement.querySelector('.tf-product-info-list');
                
                const mainSectionId = productElement.dataset.sectionId;

                this.media.innerHTML = product_media.innerHTML;
                this.info.innerHTML = product_info.innerHTML;
                this.wrapper.setAttribute('data-product-url', this.productUrl);
                this.wrapper.setAttribute('data-section-id', mainSectionId);
            })
            .then(()=>{
                
                if(this.modalBox){
                    const quickModal = new bootstrap.Modal(this.modalBox);
                    quickModal.show();
                }
            })
            .catch((error)=>{
                console.error("Error:", error);
            })
            .finally(()=>{
                this.classList.remove('loading');
                this.button.removeAttribute('disabled');
            })
    }
}

if(!customElements.get('quick-view')){
    customElements.define('quick-view', quickView);
}
