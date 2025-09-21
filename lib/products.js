export function getProducts() {
  return [
    { id: 'tv-1', category: 'tv', name: 'Samsung 55" LED TV', price: 320, img: 'https://images.unsplash.com/photo-1587573089734-09cbf96b2108?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1587573089734-09cbf96b2108?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581905764498-c68a1d23906f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516542076529-1ea3854896e1?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Refurbished', meta: '1080p | HDMI | Smart' },
    { id: 'radio-1', category: 'radio', name: 'Sony Vintage Radio', price: 45, img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605882113364-bfbd0d162315?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Good', meta: 'AM/FM | Classic design' },
    { id: 'phone-1', category: 'phone', name: 'Apple iPhone 11', price: 220, img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35bf?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Refurbished', meta: '64GB | Unlocked' },
    { id: 'fridge-1', category: 'fridge', name: 'LG 300L Fridge', price: 270, img: 'https://images.unsplash.com/photo-1580910051074-3eb6948866d2?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1580910051074-3eb6948866d2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517433367423-c7e5b0f354ae?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Very Good', meta: 'Energy A+ | Low noise' },
    { id: 'cooler-1', category: 'cooler', name: 'Portable Gas Cooler', price: 95, img: 'https://images.unsplash.com/photo-1510442650500-532fd9166d41?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1510442650500-532fd9166d41?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Good', meta: '12V/Butane | 40L' },
    { id: 'acc-1', category: 'accessory', name: 'HDMI 2.0 Cable', price: 8, img: 'https://images.unsplash.com/photo-1581124836539-73c2026cc823?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1581124836539-73c2026cc823?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Like New', meta: '2m | 4K' },
    { id: 'phone-2', category: 'phone', name: 'Samsung Galaxy A52', price: 160, img: 'https://images.unsplash.com/photo-1610945415295-29e2e9cbe3c2?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1610945415295-29e2e9cbe3c2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35bf?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Refurbished', meta: '128GB | Dual SIM' },
    { id: 'tv-2', category: 'tv', name: 'LG 43" 4K TV', price: 290, img: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Very Good', meta: 'HDR | Smart' },
    { id: 'fridge-2', category: 'fridge', name: 'Hisense 200L Fridge', price: 210, img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Good', meta: 'Frost free | Silver' },
    { id: 'radio-2', category: 'radio', name: 'Portable DAB Radio', price: 35, img: 'https://images.unsplash.com/photo-1585664816782-21a4913f3c42?q=80&w=800&auto=format&fit=crop', images: [
      'https://images.unsplash.com/photo-1585664816782-21a4913f3c42?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526401281623-359f86d1f291?q=80&w=800&auto=format&fit=crop'
    ], condition: 'Used - Good', meta: 'Bluetooth | USB' },
  ]
}
