class ProductForm extends HTMLElement {
    constructor(){
        super();
        this.form = this.querySelector('form');

        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.submitButton = this.querySelector('[type="submit"]');
        this.cart = document.querySelector('cart-drawer');
        this.slider = document.querySelector('cart-drawer .tf-cart-slide');
    }

    onSubmitHandler(evt){
        evt.preventDefault();
        if(this.submitButton.getAttribute('aria-disabled') == 'true') return;
        this.submitButton.setAttribute('aria-disabled', true);

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
            .then((response)=>{
                if(!response.ok){
                    return response.text().then(msg => {
                        throw new Error(`Cart add failed (${response.status}):${msg}`);
                    });
                }
            })
            .then(()=>{
                if(this.cart){
                    this.renderSections();
                }else{
                    window.location.href = routes.cart_url
                }
            })
            .then(()=>{
                const myModal = document.getElementById('shoppingCart');
                const drawer = new bootstrap.Modal(myModal);
                drawer.show();
            })
            .then(()=>{
                setTimeout(() => {
                    const slider = document.querySelector('.tf-cart-slide');
                    this.initCartSlider(slider);
                }, 1500);
            })
            .catch((error)=>{
                console.error('Product not added: ', error);
            })
            .finally(()=>{
                this.submitButton.setAttribute('aria-disabled', false);
            });
    }

    initCartSlider(container) {
        if (!container) return null;

        // If already initialized, destroy it first
        if (container.swiper && typeof container.swiper.destroy === 'function') {
            container.swiper.destroy(true, true); // cleanup params: (deleteInstance, cleanStyles)
        }
        const swiper = new Swiper(container, {
            slidesPerView: 1,
            spaceBetween: 0,
            pagination: {
                el: '.cart-slide-pagination',
                clickable: true,
            },
        });

        return swiper;
    }

    renderSections(){
        const sections = this.getSectionsToRender();
        const sectionNames = sections.map(s => s.section).join(',');

        fetch(`${window.Shopify.routes.root}?sections=${sectionNames}`)
          .then((res) => res.json())
          .then((data) => {
            const parser = new DOMParser();

            sections.forEach(({ section, selector })=>{
                const html = data[section];
                if(!html) return;

                const container = document.querySelector(selector);
                if(!container) return;

                const doc = parser.parseFromString(html, 'text/html');

                const newContainer = doc.querySelector(selector);
                if(!newContainer) return;

                container.innerHTML = newContainer.innerHTML;
            })
          })
          .catch((err) => {
            console.error('Section rendering failed:', err);
          });
    }

    getSectionsToRender(){
        return [
            {
                id: 'CartDrawer',
                section: 'cart-drawer', // section name
                selector: '#CartDrawer', // target container to replace
            },
            {
                id: 'cart-icon',
                section: 'cart-icon',
                selector: '#header-cart-icon',
            }
        ]
    }
}

if(!customElements.get('product-form')){
    customElements.define('product-form', ProductForm);
}