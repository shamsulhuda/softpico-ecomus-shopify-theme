class ProductRecommendations extends HTMLElement {
    observer = undefined;
    constructor(){
        super();
    }

    connectedCallback(){
        this.productsRecommendations(this.dataset.productId);
    }

    productsRecommendations(productId){
        this.observer?.unobserve(this);
        this.observer = new IntersectionObserver((entries, observer)=>{
            if(!entries[0].isIntersecting) return;
            observer.unobserve(this);
            this.loadRecommendations(productId);
        });
        this.observer.observe(this);
    }

    loadRecommendations(productId){
        fetch(`${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`)
            .then((response) => response.text())
            .then((text)=>{
                const html = document.createElement('div');
                html.innerHTML = text;
                const recommendations = html.querySelector('product-recommendations');
                
                if(recommendations?.innerHTML.trim().length){
                    this.innerHTML = recommendations.innerHTML;
                }

                this.reinitializeComponents(html);

                if (html.querySelector('.swiper-slide')) {
                this.classList.add('product-recommendations--loaded');
                }

            })
            .catch((error)=>{
                console.error(error);
            })
    }

    reinitializeComponents(doc) {
        const sliderEl = doc.querySelector('.tf-sw-product-sell');
        const deskView = parseInt(sliderEl.dataset.preview);
        const space = parseInt(sliderEl.dataset.spaceLg);
        if (typeof Swiper !== 'undefined' && sliderEl) {
            new Swiper('.tf-sw-product-sell', {
                slidesPerView: 2,
                spaceBetween: space,
                navigation: {
                    clickable: true,
                    nextEl: ".nav-prev-slider",
                    prevEl: ".nav-next-slider",
                },
                breakpoints: {
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 3,
                        spaceBetween: 40,
                    },
                    1024: {
                        slidesPerView: deskView,
                        spaceBetween: 50,
                    },
                },
            });
        }
    }
}

customElements.define('product-recommendations', ProductRecommendations);