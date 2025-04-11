// utils/Queue.js
/**
 * Implementación de una estructura de datos tipo Cola (Queue)
 * Sigue el principio FIFO (First In, First Out)
 */
export class Queue {
    constructor() {
      this.items = []; // Array para almacenar elementos
    }
  
    // Agrega un elemento al final de la cola
    enqueue(item) {
      this.items.push(item);
    }
  
    // Remueve y retorna el elemento del frente de la cola
    dequeue() {
      if (this.isEmpty()) {
        return null;
      }
      return this.items.shift();
    }
  
    // Obtiene el elemento del frente sin removerlo
    front() {
      if (this.isEmpty()) {
        return null;
      }
      return this.items[0];
    }
  
    // Obtiene el número de elementos en la cola
    size() {
      return this.items.length;
    }
  
    // Verifica si la cola está vacía
    isEmpty() {
      return this.items.length === 0;
    }
  
    // Obtiene todos los elementos de la cola sin modificarla
    getAll() {
      return [...this.items];
    }
  }