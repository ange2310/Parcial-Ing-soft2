// utils/Stack.js
/**
 * Implementación de una estructura de datos tipo Pila (Stack)
 * Sigue el principio LIFO (Last In, First Out)
 */
export class Stack {
    constructor() {
      this.items = []; // Array para almacenar elementos
    }
  
    // Agrega un elemento al tope de la pila
    push(item) {
      this.items.push(item);
    }
  
    // Remueve y retorna el elemento del tope
    pop() {
      if (this.isEmpty()) {
        return null;
      }
      return this.items.pop();
    }
  
    // Obtiene el elemento del tope sin removerlo
    peek() {
      if (this.isEmpty()) {
        return null;
      }
      return this.items[this.items.length - 1];
    }
  
    // Obtiene el número de elementos en la pila
    size() {
      return this.items.length;
    }
  
    // Verifica si la pila está vacía
    isEmpty() {
      return this.items.length === 0;
    }
  
    // Obtiene todos los elementos sin modificar la pila
    getAll() {
      return [...this.items];
    }
  }