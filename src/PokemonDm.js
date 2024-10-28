import { LitElement } from 'lit-element';

export class PokemonDm extends LitElement {
  constructor() {
    super();
    this.pokemons = [];
  }

  async fetchPokemons() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=90');
      const data = await response.json();

      this.pokemons = await Promise.all(
        data.results.map(async (pokemon) => {
          const detailResponse = await fetch(pokemon.url);
          const detailData = await detailResponse.json();
          return {
            name: detailData.name,
            id: detailData.id,
            image: detailData.sprites.other.dream_world.front_default,
            type: detailData.types.map((type) => type.type.name).join(', '),
            evolutionChain: await this.fetchEvolutionChain(detailData.species.url),
          };
        })
      );

      this.dispatchEvent(new CustomEvent('pokemon-data', { 
        detail: { pokemons: this.pokemons }, 
        bubbles: true, 
        composed: true 
      }));
    } catch (error) {
      console.error('Error fetching Pokémon data:', error);
    }
  }

  async fetchEvolutionChain(speciesUrl) {
    const response = await fetch(speciesUrl);
    const speciesData = await response.json();
    const evolutionResponse = await fetch(speciesData.evolution_chain.url);
    const evolutionData = await evolutionResponse.json();

    return this.processEvolutionChain(evolutionData);
  }

  processEvolutionChain(evolutionData) {
    const evolutions = [];
    let current = evolutionData.chain;

    while (current) {
      evolutions.push({
        name: current.species.name,
        // URL de la imagen basada en el nombre del Pokémon
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${current.species.name}.svg`,
        type: current.species.name,
      });
      current = current.evolves_to[0];
    }

    return evolutions;
  }

  firstUpdated() {
    this.fetchPokemons();
  }


async processEvolutionChain(evolutionData) {
  const evolutions = [];
  let current = evolutionData.chain;

  while (current) {
    const name = current.species.name;
    const pokemonDataResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    const pokemonData = await pokemonDataResponse.json();

    evolutions.push({
      name: name,
      image: pokemonData.sprites.other.dream_world.front_default,
      type: pokemonData.types.map((type) => type.type.name).join(', ')
    });

    current = current.evolves_to[0];
  }

  this.sendToDm(evolutions); // Enviar al componente dm
  return evolutions;
}

sendToDm(data) {
  const dmElement = this.shadowRoot.querySelector('pokemon-dm');
  if (dmElement) {
    dmElement.evolutions = data; // Asignación directa o con propiedad reactiva
  }
}



}

customElements.define('pokemon-dm', PokemonDm);
