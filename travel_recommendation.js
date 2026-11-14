const categories = new Map([
  ['beach', 'beaches'], ['beaches', 'beaches'],
  ['temple', 'temples'], ['temples', 'temples'],
  ['country', 'countries'], ['countries', 'countries'],
]);

function normalize(value) {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function findRecommendations(data, query) {
  const keyword = normalize(query);
  const cities = data.countries.flatMap(country => country.cities);
  const category = categories.get(keyword);

  if (category === 'countries') return cities;
  if (category) return data[category];

  return [...cities, ...data.beaches, ...data.temples].filter(place =>
    normalize(place.name).includes(keyword)
  );
}

function buildCard(place) {
  const card = document.createElement('article');
  const image = document.createElement('img');
  const title = document.createElement('h3');
  const description = document.createElement('p');
  image.src = place.imageUrl;
  image.alt = place.name;
  title.textContent = place.name;
  description.textContent = place.description;
  card.append(image, title, description);
  return card;
}

const search = document.querySelector('#search');
if (search) {
  const query = document.querySelector('#query');
  const results = document.querySelector('#recommendations');
  const status = document.querySelector('#status');
  const cards = document.querySelector('#cards');
  let dataPromise;
  let activeSearch = 0;

  search.addEventListener('submit', async event => {
    event.preventDefault();
    const term = query.value.trim();
    if (!term) return;
    const request = ++activeSearch;
    results.hidden = false;
    cards.replaceChildren();
    status.textContent = 'Finding destinations…';

    dataPromise ??= fetch('./travel_recommendation_api.json')
      .then(response => {
        if (!response.ok) throw new Error('Destination data unavailable');
        return response.json();
      })
      .catch(error => {
        dataPromise = undefined;
        throw error;
      });

    try {
      const matches = findRecommendations(await dataPromise, term);
      if (request !== activeSearch) return;
      status.textContent = matches.length
        ? `${matches.length} destinations found.`
        : 'No destinations found. Try beach, temple, or country.';
      cards.replaceChildren(...matches.map(buildCard));
    } catch {
      if (request === activeSearch) status.textContent = 'Destinations could not load. Try searching again.';
    }
  });

  document.querySelector('#clear').addEventListener('click', () => {
    activeSearch++;
    search.reset();
    cards.replaceChildren();
    status.textContent = '';
    results.hidden = true;
    query.focus();
  });

  document.querySelector('#book').addEventListener('click', () => query.focus());
}

const contact = document.querySelector('#contact');
if (contact) {
  contact.addEventListener('submit', event => {
    event.preventDefault();
    contact.reset();
    document.querySelector('#contact-status').textContent =
      'Demo form submitted. No message was sent.';
  });
}
