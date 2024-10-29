import { LitElement } from 'lit-element';

export class PokemonDm extends LitElement {
  

  async fetchPokemons() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=300');
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
            evolutionChainUrl: await this.fetchEvolutionChainUrl(detailData.species.url), // Aquí se obtiene la URL de la cadena de evolución
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

  async fetchEvolutionChainUrl(speciesUrl) {
    try {
      const response = await fetch(speciesUrl);
      const speciesData = await response.json();
      return speciesData.evolution_chain.url; // Retorna la URL de la cadena de evolución
    } catch (error) {
      console.error('Error fetching species data:', error);
      return null; // Devuelve null si hay un error
    }
  }

  async fetchEvolutionChain(evolutionChainUrl) {
    try {
      const response = await fetch(evolutionChainUrl);
      const evolutionData = await response.json();
      return this.processEvolutionChain(evolutionData);
    } catch (error) {
      console.error('Error fetching evolution chain:', error);
      return []; // Devuelve un arreglo vacío si hay un error
    }
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
        id: pokemonData.id,
        image: pokemonData.sprites.other.dream_world.front_default,
        type: pokemonData.types.map((type) => type.type.name).join(', '),
      });

      current = current.evolves_to[0];
    }

    this.dispatchEvent(new CustomEvent('evolution-data', { // Despacha el evento con las evoluciones
      detail: { evolutions }, 
      bubbles: true, 
      composed: true 
    }));

    return evolutions;
  }

  firstUpdated() {
    this.fetchPokemons();
  }
}

customElements.define('pokemon-dm', PokemonDm);
