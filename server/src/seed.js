require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

async function seed() {
  const db = await getDb();

  /* brands */
  const brands = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../autoverse-site/data/brands.json'), 'utf8'));
  for (const b of brands) {
    await db.run(
      `INSERT OR IGNORE INTO brands (slug,name,logo,country) VALUES (?,?,?,?)`,
      [b.slug, b.name, b.logo, b.country]
    );
  }
  console.log(`Seeded ${brands.length} brands`);

  /* cars */
  const cars = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../autoverse-site/data/cars.json'), 'utf8'));
  for (const c of cars) {
    await db.run(`
      INSERT OR IGNORE INTO cars
        (id,brand_slug,brand,model,type,year,km,price,currency,
         fuel,transmission,hp,acceleration,top_speed,colour,
         status,arrival_date,featured,images)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      c.id, c.brandSlug, c.brand, c.model, c.type,
      c.year, c.km, c.price, c.currency||'EUR',
      c.fuel, c.transmission, c.hp||null,
      c.acceleration||null, c.topSpeed||null, c.colour||null,
      c.status||'available', c.arrivalDate||null,
      c.featured?1:0, JSON.stringify(c.images||[])
    ]);
  }
  console.log(`Seeded ${cars.length} cars`);

  /* admin user */
  const email    = process.env.ADMIN_EMAIL    || 'admin@automk.com';
  const password = process.env.ADMIN_PASSWORD || 'AutoMk2024!';
  const hash     = bcrypt.hashSync(password, 12);
  await db.run(
    `INSERT OR IGNORE INTO admin_users (email,password_hash,name) VALUES (?,?,?)`,
    [email, hash, 'AutoMk Admin']
  );
  console.log(`Admin: ${email}`);

  /* model→brand map */
  const modelMap = [
    ['Golf','volkswagen','Volkswagen'],['Arteon','volkswagen','Volkswagen'],
    ['Touareg','volkswagen','Volkswagen'],['Passat','volkswagen','Volkswagen'],
    ['Polo','volkswagen','Volkswagen'],['Tiguan','volkswagen','Volkswagen'],
    ['ID.4','volkswagen','Volkswagen'],['ID.3','volkswagen','Volkswagen'],
    ['M2','bmw','BMW'],['M3','bmw','BMW'],['M4','bmw','BMW'],
    ['M5','bmw','BMW'],['M8','bmw','BMW'],
    ['X3','bmw','BMW'],['X4','bmw','BMW'],['X5','bmw','BMW'],
    ['X6','bmw','BMW'],['X7','bmw','BMW'],['XM','bmw','BMW'],
    ['i4','bmw','BMW'],['i5','bmw','BMW'],['i7','bmw','BMW'],['iX','bmw','BMW'],
    ['3 Series','bmw','BMW'],['5 Series','bmw','BMW'],['7 Series','bmw','BMW'],['8 Series','bmw','BMW'],
    ['Z4','bmw','BMW'],
    ['AMG GT','mercedes-benz','Mercedes-Benz'],
    ['C-Class','mercedes-benz','Mercedes-Benz'],['E-Class','mercedes-benz','Mercedes-Benz'],
    ['S-Class','mercedes-benz','Mercedes-Benz'],['G-Class','mercedes-benz','Mercedes-Benz'],
    ['GLE','mercedes-benz','Mercedes-Benz'],['GLS','mercedes-benz','Mercedes-Benz'],
    ['GLC','mercedes-benz','Mercedes-Benz'],['CLA','mercedes-benz','Mercedes-Benz'],
    ['CLS','mercedes-benz','Mercedes-Benz'],['SL','mercedes-benz','Mercedes-Benz'],
    ['EQS','mercedes-benz','Mercedes-Benz'],['EQE','mercedes-benz','Mercedes-Benz'],
    ['S 580','mercedes-benz','Mercedes-Benz'],
    ['R8','audi','Audi'],['A4','audi','Audi'],['A6','audi','Audi'],['A8','audi','Audi'],
    ['Q5','audi','Audi'],['Q7','audi','Audi'],['Q8','audi','Audi'],
    ['RS3','audi','Audi'],['RS4','audi','Audi'],['RS5','audi','Audi'],
    ['RS6','audi','Audi'],['RS Q8','audi','Audi'],['e-tron','audi','Audi'],['TT','audi','Audi'],
    ['Giulia','alfa-romeo','Alfa Romeo'],['Stelvio','alfa-romeo','Alfa Romeo'],
    ['Tonale','alfa-romeo','Alfa Romeo'],['4C','alfa-romeo','Alfa Romeo'],
    ['Huracan','lamborghini','Lamborghini'],['Huracán','lamborghini','Lamborghini'],
    ['Urus','lamborghini','Lamborghini'],['Revuelto','lamborghini','Lamborghini'],
    ['Aventador','lamborghini','Lamborghini'],
    ['Roma','ferrari','Ferrari'],['SF90','ferrari','Ferrari'],
    ['812','ferrari','Ferrari'],['Purosangue','ferrari','Ferrari'],
    ['F8','ferrari','Ferrari'],['296','ferrari','Ferrari'],
    ['Portofino','ferrari','Ferrari'],
    ['911','porsche','Porsche'],['918','porsche','Porsche'],
    ['Taycan','porsche','Porsche'],['Cayenne','porsche','Porsche'],
    ['Panamera','porsche','Porsche'],['Macan','porsche','Porsche'],['718','porsche','Porsche'],
    ['MC20','maserati','Maserati'],['Quattroporte','maserati','Maserati'],
    ['Ghibli','maserati','Maserati'],['Levante','maserati','Maserati'],
    ['GranTurismo','maserati','Maserati'],['Grecale','maserati','Maserati'],
    ['Continental GT','bentley','Bentley'],['Bentayga','bentley','Bentley'],
    ['Flying Spur','bentley','Bentley'],['Mulsanne','bentley','Bentley'],
    ['Ghost','rolls-royce','Rolls-Royce'],['Cullinan','rolls-royce','Rolls-Royce'],
    ['Phantom','rolls-royce','Rolls-Royce'],['Wraith','rolls-royce','Rolls-Royce'],
    ['Dawn','rolls-royce','Rolls-Royce'],['Spectre','rolls-royce','Rolls-Royce'],
    ['DB12','aston-martin','Aston Martin'],['DB11','aston-martin','Aston Martin'],
    ['Vantage','aston-martin','Aston Martin'],['DBX','aston-martin','Aston Martin'],
    ['DBS','aston-martin','Aston Martin'],['Valkyrie','aston-martin','Aston Martin'],
    ['720S','mclaren','McLaren'],['765LT','mclaren','McLaren'],
    ['Artura','mclaren','McLaren'],['600LT','mclaren','McLaren'],
    ['P1','mclaren','McLaren'],['Senna','mclaren','McLaren'],
    ['Range Rover','land-rover','Land Rover'],['Defender','land-rover','Land Rover'],
    ['Discovery','land-rover','Land Rover'],
    ['Model S','tesla','Tesla'],['Model 3','tesla','Tesla'],
    ['Model X','tesla','Tesla'],['Model Y','tesla','Tesla'],
    ['Roadster','tesla','Tesla'],['Cybertruck','tesla','Tesla'],
  ];
  for (const [pattern, slug, name] of modelMap) {
    await db.run(
      `INSERT OR IGNORE INTO model_brand_map (model_pattern,brand_slug,brand_name) VALUES (?,?,?)`,
      [pattern, slug, name]
    );
  }
  console.log(`Seeded ${modelMap.length} model→brand mappings`);
  console.log('Done.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
