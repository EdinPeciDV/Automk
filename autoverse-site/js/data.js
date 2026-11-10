/**
 * AutoMk Data Module
 *
 * Brand  { slug, name, logo, country, carCount }
 * Car    {
 *   id, brandSlug, brand, model,
 *   type ("sports"|"gt"|"suv"|"sedan"|"convertible"|"electric"|"luxury"),
 *   year, km, price, currency, fuel, transmission,
 *   hp, acceleration, topSpeed, colour,
 *   status ("available"|"reserved"|"arriving"), arrivalDate,
 *   images[], featured
 * }
 * Lead   { name, phone, whatsapp, brands[], types[], budgetMin, budgetMax,
 *           maxKm, yearFrom, yearTo, transmission, fuel, notes,
 *           financing, tradeIn, source }
 *
 * CONFIG.api.baseUrl: empty → fetch local JSON + filter client-side
 *                     set   → REST: GET /brands, GET /cars?…, GET /cars/:id, POST /leads
 */

(function () {
  'use strict';

  /* ── helpers ── */
  function cfg() { return (window.CONFIG && window.CONFIG.api) ? window.CONFIG.api : { baseUrl: '' }; }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
    return r.json();
  }

  /* ── brand cache ── */
  let _brands = null;

  async function getBrands() {
    if (_brands) return _brands;
    const base = cfg().baseUrl;
    if (base) {
      _brands = await fetchJSON(base + '/brands');
    } else {
      _brands = await fetchJSON('/data/brands.json');
    }
    return _brands;
  }

  /* ── car cache ── */
  let _cars = null;

  async function _loadCars() {
    if (_cars) return _cars;
    const base = cfg().baseUrl;
    if (base) return fetchJSON(base + '/cars');
    _cars = await fetchJSON('/data/cars.json');
    return _cars;
  }

  async function getCars(filters) {
    filters = filters || {};
    const base = cfg().baseUrl;
    if (base) {
      const params = new URLSearchParams();
      if (filters.brand)       params.set('brand',        filters.brand);
      if (filters.type)        params.set('type',         filters.type);
      if (filters.minPrice)    params.set('minPrice',     filters.minPrice);
      if (filters.maxPrice)    params.set('maxPrice',     filters.maxPrice);
      if (filters.maxKm != null) params.set('maxKm',      filters.maxKm);
      if (filters.yearFrom)    params.set('yearFrom',     filters.yearFrom);
      if (filters.yearTo)      params.set('yearTo',       filters.yearTo);
      if (filters.fuel)        params.set('fuel',         filters.fuel);
      if (filters.transmission)params.set('transmission', filters.transmission);
      if (filters.sort)        params.set('sort',         filters.sort);
      if (filters.page)        params.set('page',         filters.page);
      return fetchJSON(base + '/cars?' + params.toString());
    }

    /* client-side filtering */
    const all = await _loadCars();
    let res = all.slice();

    if (filters.brand && filters.brand !== 'all')
      res = res.filter(c => c.brandSlug === filters.brand);
    if (filters.type && filters.type !== 'all')
      res = res.filter(c => c.type === filters.type);
    if (filters.minPrice)
      res = res.filter(c => c.price >= Number(filters.minPrice));
    if (filters.maxPrice)
      res = res.filter(c => c.price <= Number(filters.maxPrice));
    if (filters.maxKm != null && filters.maxKm !== '')
      res = res.filter(c => c.km <= Number(filters.maxKm));
    if (filters.yearFrom)
      res = res.filter(c => c.year >= Number(filters.yearFrom));
    if (filters.yearTo)
      res = res.filter(c => c.year <= Number(filters.yearTo));
    if (filters.fuel && filters.fuel !== 'any')
      res = res.filter(c => c.fuel.toLowerCase() === filters.fuel.toLowerCase());
    if (filters.transmission && filters.transmission !== 'any')
      res = res.filter(c => c.transmission.toLowerCase() === filters.transmission.toLowerCase());

    /* sort */
    const sort = filters.sort || 'featured';
    if (sort === 'featured')   res.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (sort === 'price_asc')  res.sort((a,b) => a.price - b.price);
    else if (sort === 'price_desc') res.sort((a,b) => b.price - a.price);
    else if (sort === 'newest')     res.sort((a,b) => b.year - a.year);
    else if (sort === 'km_asc')     res.sort((a,b) => a.km - b.km);

    return res;
  }

  async function getCarById(id) {
    const base = cfg().baseUrl;
    if (base) return fetchJSON(base + '/cars/' + id);
    const all = await _loadCars();
    const car = all.find(c => c.id === id);
    if (!car) throw new Error('Car not found: ' + id);
    return car;
  }

  async function createLead(lead) {
    const base = cfg().baseUrl;
    if (base) {
      const r = await fetch(base + '/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      if (!r.ok) throw new Error('Lead submission failed: ' + r.status);
      return { ok: true };
    }
    /* mock: log and succeed */
    console.info('[AutoMk] Lead captured (mock):', lead);
    return { ok: true };
  }

  /* expose globally */
  window.AutoMkData = { getBrands, getCars, getCarById, createLead };
})();
