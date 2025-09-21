import Link from 'next/link'

const CATEGORY_META = [
  { key: 'phone', title: 'Mobile Phones' },
  { key: 'tv', title: 'Televisions' },
  { key: 'accessory', title: 'Accessories' },
  { key: 'fridge', title: 'Fridges' },
  { key: 'cooler', title: 'Gas Coolers' },
  { key: 'radio', title: 'Radios' },
]

export default function CategoryRows({ products }) {
  return (
    <section id="products" className="products-section">
      <header className="products-header">
        <h3>Browse by Category</h3>
        <p className="meta">Popular categories curated into rows. On small screens, swipe sideways; on larger screens, items lay out in a grid.</p>
      </header>

      <div className="category-rows">
        {CATEGORY_META.map(({ key, title }) => {
          const list = products.filter(p => p.category === key)
          if (!list.length) return null
          return (
            <div className="category-row" key={key}>
              <div className="row-head">
                <h4 className="row-title">{title}</h4>
                <Link className="btn btn-small" href={`/#products`}>See all</Link>
              </div>
              <ul className="category-grid" aria-label={`${title} products`}>
                {list.map(p => (
                  <li className="product-card" key={p.id} data-category={p.category} data-name={p.name} data-price={p.price}>
                    <Link className="product-link" href={`/product/${p.id}`} aria-label={p.name} title={p.name}>
                      <div className="media">
                        <img loading="lazy" src={p.img} alt={p.name} />
                        <span className="badge condition">{p.condition}</span>
                      </div>
                      <div className="info">
                        <h5 className="name">{p.name}</h5>
                        <p className="meta">{p.meta}</p>
                        <div className="price-row">
                          <span className="price">${p.price}</span>
                          <span className="btn btn-small" role="button">Details</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
