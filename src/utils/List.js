// utils/List.js
/**
 * Implementación de una estructura de datos tipo Lista
 * Colección ordenada de elementos con acceso por índice
 */
export class List {
    constructor() {
      this.items = []; // Array para almacenar elementos
    }
  
    // Agrega un elemento al final de la lista
    add(item) {
      this.items.push(item);
    }
  
    // Elimina un elemento en la posición especificada
    remove(index) {
      if (index >= 0 && index < this.items.length) {
        return this.items.splice(index, 1)[0];
      }
      return null;
    }
  
    // Obtiene un elemento en la posición especificada sin eliminarlo
    get(index) {
      if (index >= 0 && index < this.items.length) {
        return this.items[index];
      }
      return null;
    }
  
    // Obtiene todos los elementos de la lista
    getAll() {
      return [...this.items];
    }
  
    // Obtiene el número de elementos en la lista
    size() {
      return this.items.length;
    }
  
    // Verifica si la lista está vacía
    isEmpty() {
      return this.items.length === 0;
    }
  }