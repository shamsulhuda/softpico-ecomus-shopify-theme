class CartItems extends HTMLElement {
    constructor() {
        super();
        this.cartDrawer = document.querySelector('cart-drawer');
        this.debounceTimer = null;
        this.setupCheckoutAgreement();
        this.setupGiftWrapForm();
    }
    connectedCallback(){
        this.bindEvents();
    }
    bindEvents(){
        this.addEventListener('change', (e) => {
            if(e.target.name == 'updates[]'){
                this.handleQuantityChange(e.target);
            }
        });

        this.addEventListener('click', (e)=> {
            const input = e.target.closest('.wg-quantity')?.querySelector('input[name="updates[]"]');
            if(e.target.classList.contains('plus-btn') && input){
                input.value = parseInt(input.value) + 1;
                input.dispatchEvent(new Event('change', { bubbles: true}));
            }else if(e.target.classList.contains('minus-btn') && input){
                const newValue = parseInt(input.value) - 1;
                input.value = Math.max(0, newValue);1
                input.dispatchEvent(new Event('change', { bubbles: true}));
            }else if(e.target.classList.contains('tf-mini-cart-remove')){
                this.handleRemoveItem(e.target.closest('.tf-mini-cart-item'));
            }
        })
    }

    setupCheckoutAgreement(){
        const agreeCheckbox = document.getElementById('CartDrawer-Form_agree');
        const checkoutButton = document.querySelector('button[name="checkout"]');

        if(agreeCheckbox && checkoutButton){
            const updateButton = () => {
                checkoutButton.disabled = !agreeCheckbox.checked;
                checkoutButton.style.opacity = agreeCheckbox.checked ? '1': '0.5';
            };
            agreeCheckbox.addEventListener('change', updateButton);

            updateButton();
        }
    }

    handleRemoveItem(itemElement){
        const input = itemElement.querySelector('input[name="updates[]"]');
        const lineIndex = input.dataset.index;        
        this.updateCartItem(lineIndex, 0, itemElement);
    }

    handleQuantityChange(input){
        const lineIndex = input.dataset.index;
        const newQuantity = parseInt(input.value);

        clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(()=>{
            this.updateCartItem(lineIndex, newQuantity, input);
        }, 300)

    }

    updateCartItem(lineIndex, quantity, targetElement = null){
        this.setLoadingState(true, targetElement);

        fetch('/cart/change.js',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                line: lineIndex,
                quantity: quantity
            })
        })
        .then(response => {
            if(!response.ok){
                throw new Error('Failed to update cart');                
            }
            return response.json();
        })
        .then(cart => {
            this.renderSections();
        })
        .catch(error =>{
            console.error('Error updating cart:', error);
            this.renderSections();
        })
        .finally(() => {
            this.setLoadingState(false, targetElement);
        });
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
            });

            this.reinitializeComponents();

            this.getCart().then(cart => {
                this.dispatchEvent(new CustomEvent('cart:updated',{
                    bubbles: true,
                    detail: { cart }
                }));
            });

          })
          .catch((err) => {
            console.error('Section rendering failed:', err);
          });
        
    }

    getCart(){
        return fetch('/cart.js')
                .then(response => response.json());
    }

    getSectionsToRender(){
        return [
            {
                id: 'CartDrawer',
                section: 'cart-drawer',
                selector: '#CartDrawer'
            },
            {
                id: 'cart-icon',
                section: 'cart-icon',
                selector: '#header-cart-icon'
            }
        ]
    }

    reinitializeComponents() {
        if (typeof Swiper !== 'undefined' && document.querySelector('.tf-cart-slide')) {
            new Swiper('.tf-cart-slide', {
                pagination: {
                    el: '.cart-slide-pagination',
                    clickable: true
                }
            });
        }

        this.bindEvents();
    }    

    setLoadingState(isLoading, targetElement = null) {
        if (targetElement) {
            const lineItem = targetElement.closest('.tf-mini-cart-item');
            if (lineItem) {
                if (isLoading) {
                    lineItem.classList.add('loading');
                    this.addLoaderToItem(lineItem);
                } else {
                    lineItem.classList.remove('loading');
                    this.removeLoaderFromItem(lineItem);
                }
            }
        } else {
            if (isLoading) {
                this.cartDrawer?.classList.add('loading');
            } else {
                this.cartDrawer?.classList.remove('loading');
            }
        }
    }

    addLoaderToItem(lineItem) {
        if (lineItem.querySelector('.line-item-loader')) return;

        const loader = document.createElement('div');
        loader.className = 'line-item-loader';
        loader.innerHTML = `
            <div class="line-item-loader-overlay"></div>
            <div class="line-item-loader-spinner"></div>
        `;
        
        lineItem.style.position = 'relative';
        lineItem.appendChild(loader);
    }

    removeLoaderFromItem(lineItem) {
        const loader = lineItem.querySelector('.line-item-loader');
        if (loader) {
            loader.remove();
        }
    }

    setupGiftWrapForm(){
        const giftWrapForm = document.getElementById('giftwarapitem');
        if(!giftWrapForm) return;
        const originalSubmit = giftWrapForm.onsubmit;
        giftWrapForm.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const submitButton = giftWrapForm.querySelector('button[type="submit"]');

            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span>Adding...</span>';
            submitButton.disabled = true;

            const config = fetchConfig('javascript');
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            delete config.headers['Content-Type'];

            const formData = new FormData(giftWrapForm);
            config.body = formData;

            fetch(`${routes.cart_add_url}`, config)
                .then((response) => {
                    if (!response.ok){
                        return response.text().then(msg => {
                            throw new Error(`Cart add failed (${response.status}):${msg}`);
                        });
                    }
                })
                .then(()=>{
                    this.renderSections();
                })
                .then(()=>{
                    this.reinitializeComponents();
                })
                .catch((error)=>{
                    console.error('Item not added:', error);
                })
                .finally(()=>{
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                })
        })
    }

}

customElements.define('cart-items', CartItems)