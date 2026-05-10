(function() {
  const container = document.getElementById('swaply-exchange-container');
  if (!container) return;

  const orderId = container.dataset.orderId;
  const orderNumber = container.dataset.orderNumber;
  const customerEmail = container.dataset.customerEmail;
  const customerName = container.dataset.customerName;
  const shop = container.dataset.shop;

  const modal = document.getElementById('swaply-modal');
  const closeBtn = document.querySelector('.swaply-close');
  const productList = document.getElementById('swaply-product-list');
  const searchInput = document.getElementById('swaply-search-input');
  const selectionSummary = document.getElementById('swaply-selection-summary');
  const selectedItemDetails = document.getElementById('swaply-selected-item-details');
  const submitBtn = document.getElementById('swaply-submit-request');

  let currentExchangeSource = null;
  let selectedProduct = null;

  // Open modal
  document.querySelectorAll('.swaply-exchange-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentExchangeSource = {
        lineItemId: e.target.dataset.lineItemId,
        productTitle: e.target.dataset.productTitle,
        variantTitle: e.target.dataset.variantTitle
      };
      modal.style.display = 'block';
      loadProducts();
    });
  });

  // Close modal
  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

  // Search products
  searchInput.addEventListener('input', debounce(() => {
    loadProducts(searchInput.value);
  }, 300));

  async function loadProducts(query = '') {
    productList.innerHTML = '<p>Loading products...</p>';
    
    try {
      // In a real scenario, we might use Shopify's predictive search or a custom App Proxy endpoint
      // For MVP, we'll use the /search/suggest.json endpoint which is publicly available
      const response = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`);
      const data = await response.json();
      const products = data.resources.results.products;

      productList.innerHTML = '';
      if (products.length === 0) {
        productList.innerHTML = '<p>No products found.</p>';
        return;
      }

      products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'swaply-product-card';
        div.innerHTML = `
          <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.title}">
          <p style="font-size:12px; font-weight:600; margin:4px 0;">${product.title}</p>
          <p style="font-size:11px; color:#6b7280;">${product.price_min_as_string || ''}</p>
        `;
        div.onclick = () => selectProduct(product);
        productList.appendChild(div);
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      productList.innerHTML = '<p>Error loading products.</p>';
    }
  }

  function selectProduct(product) {
    selectedProduct = product;
    document.querySelectorAll('.swaply-product-card').forEach(c => c.classList.remove('selected'));
    // Note: Finding the exact card is tricky since we don't have IDs on them easily, 
    // but the user sees the summary below.
    
    selectionSummary.style.display = 'block';
    selectedItemDetails.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <img src="${product.image}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">
        <div>
          <p style="font-weight:700;">${product.title}</p>
          <p style="font-size:12px; color:#6b7280;">Price: ${product.price_min_as_string}</p>
        </div>
      </div>
    `;
    
    // Auto-scroll to bottom
    const content = document.querySelector('.swaply-modal-content');
    content.scrollTop = content.scrollHeight;
  }

  submitBtn.onclick = async () => {
    if (!selectedProduct || !currentExchangeSource) return;

    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    const payload = {
      shop: shop,
      shopifyOrderId: orderId,
      shopifyOrderNumber: orderNumber,
      originalLineItemId: currentExchangeSource.lineItemId,
      originalProductTitle: currentExchangeSource.productTitle,
      originalVariantTitle: currentExchangeSource.variantTitle,
      customerName: customerName,
      customerEmail: customerEmail,
      newProductId: `gid://shopify/Product/${selectedProduct.id}`,
      newVariantId: `gid://shopify/ProductVariant/${selectedProduct.variants[0].id}`, // Picking first variant for MVP
      newProductTitle: selectedProduct.title,
      newVariantTitle: selectedProduct.variants[0].title || 'Default Title',
      newVariantPrice: selectedProduct.price_min,
      newVariantImage: selectedProduct.image,
      customerNote: document.getElementById('swaply-customer-note').value
    };

    try {
      // Use the App Proxy URL to submit
      const response = await fetch('/apps/swaply/api/exchange-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert('Exchange request submitted successfully!');
        modal.style.display = 'none';
        location.reload(); // Refresh to show status or just clear
      } else {
        alert('Error: ' + (result.error || 'Failed to submit request'));
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit Exchange Request';
    }
  };

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
})();
