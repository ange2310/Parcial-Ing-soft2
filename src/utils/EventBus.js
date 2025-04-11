// utils/EventBus.js
/**
 * Implementación del patrón Singleton para un Event Bus
 * Permite la comunicación desacoplada entre componentes a través de eventos
 */
class EventBus {
    constructor() {
      // Singleton Pattern: Solo una instancia
      if (EventBus.instance) {
        return EventBus.instance;
      }
      
      this.listeners = {};
      EventBus.instance = this;
    }
  
    /**
     * Suscribe una función a un evento específico
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a ejecutar cuando ocurra el evento
     * @returns {Function} - Función para cancelar la suscripción
     */
    subscribe(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      
      this.listeners[event].push(callback);
      
      // Retorna una función para cancelar la suscripción
      return () => {
        this.listeners[event] = this.listeners[event].filter(
          listener => listener !== callback
        );
      };
    }
  
    /**
     * Emite un evento con datos opcionales
     * @param {string} event - Nombre del evento
     * @param {any} data - Datos a pasar a los suscriptores
     */
    publish(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          callback(data);
        });
      }
    }
  
    /**
     * Elimina todos los suscriptores para un evento específico o todos los eventos
     * @param {string} event - Nombre del evento (opcional)
     */
    clear(event) {
      if (event) {
        delete this.listeners[event];
      } else {
        this.listeners = {};
      }
    }
  }
  
  // Exportamos una instancia única (Singleton)
  export default new EventBus();