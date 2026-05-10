import React, { useState } from 'react';
import { Button, Modal, TextContainer, TextField, Spinner, Card } from '@shopify/polaris';

interface ExchangeButtonProps {
  orderId: string;
  orderName: string;
  customerEmail: string;
  lineItem: {
    title: string;
    variantId: string;
  };
}

/**
 * A customer-facing component (concept) that could be used in a custom storefront
 * or rendered via a headless implementation.
 */
export const ExchangeButton: React.FC<ExchangeButtonProps> = ({ 
  orderId, 
  orderName, 
  customerEmail, 
  lineItem 
}) => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const toggleModal = () => setActive(!active);

  const searchProducts = async () => {
    setLoading(true);
    // In a real app, this would call a Shopify search endpoint or our API
    // For this example, we'll simulate a search
    try {
      const response = await fetch(`/search/suggest.json?q=${searchQuery}&resources[type]=product`);
      const data = await response.json();
      setProducts(data.resources?.results?.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    const payload = {
      orderId,
      orderName,
      customerEmail,
      originalProductTitle: lineItem.title,
      originalVariantId: lineItem.variantId,
      newProductId: `gid://shopify/Product/${selectedProduct.id}`,
      newVariantId: `gid://shopify/ProductVariant/${selectedProduct.variants[0].id}`,
      newProductTitle: selectedProduct.title,
      newVariantTitle: selectedProduct.variants[0].title || 'Default Title'
    };

    try {
      const res = await fetch('/api/exchange-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Exchange request submitted!');
        toggleModal();
      }
    } catch (e) {
      alert('Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={toggleModal} size="slim" tone="subdued">Exchange</Button>
      
      <Modal
        open={active}
        onClose={toggleModal}
        title={`Exchange: ${lineItem.title}`}
        primaryAction={{
          content: 'Request Exchange',
          onAction: handleSubmit,
          disabled: !selectedProduct,
          loading: loading
        }}
        secondaryActions={[{ content: 'Cancel', onAction: toggleModal }]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Search for a replacement product in our catalog.</p>
            <TextField
              label="Search Products"
              value={searchQuery}
              onChange={setSearchQuery}
              autoComplete="off"
              connectedRight={<Button onClick={searchProducts}>Search</Button>}
            />
            
            <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {loading ? <Spinner size="small" /> : products.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProduct(p)}
                  style={{ 
                    padding: '10px', 
                    border: selectedProduct?.id === p.id ? '2px solid #6c63ff' : '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <p style={{ fontWeight: 'bold' }}>{p.title}</p>
                  <p style={{ fontSize: '12px' }}>{p.price}</p>
                </div>
              ))}
            </div>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </>
  );
};
