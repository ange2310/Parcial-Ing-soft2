// utils/TicketFactory.js
/**
 * Implementación del patrón Factory Method para la creación de tickets
 * Permite crear diferentes tipos de tickets con propiedades específicas
 */
import EventBus from './EventBus';

class TicketFactory {
  /**
   * Crea un ticket estándar
   * @param {Object} data - Datos del ticket
   * @returns {Object} - Ticket estándar
   */
  createStandardTicket(data) {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'standard',
      movie: data.movie,
      time: data.time,
      seat: data.seat,
      price: 10.0,
      concessions: false
    };
  }

  /**
   * Crea un ticket VIP
   * @param {Object} data - Datos del ticket
   * @returns {Object} - Ticket VIP
   */
  createVIPTicket(data) {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'vip',
      movie: data.movie,
      time: data.time,
      seat: `VIP-${data.seat}`,
      price: 15.0,
      concessions: true,
      vipLounge: true
    };
  }

  /**
   * Crea un ticket para niños
   * @param {Object} data - Datos del ticket
   * @returns {Object} - Ticket para niños
   */
  createChildTicket(data) {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'child',
      movie: data.movie,
      time: data.time,
      seat: data.seat,
      price: 7.5,
      concessions: false,
      toyIncluded: true
    };
  }

  /**
   * Método factory que determina qué tipo de ticket crear
   * @param {string} type - Tipo de ticket a crear
   * @param {Object} data - Datos del ticket
   * @returns {Object} - Ticket creado
   */
  createTicket(type, data) {
    let ticket;
    
    switch (type.toLowerCase()) {
      case 'vip':
        ticket = this.createVIPTicket(data);
        break;
      case 'child':
        ticket = this.createChildTicket(data);
        break;
      case 'standard':
      default:
        ticket = this.createStandardTicket(data);
        break;
    }
    
    // Publicar evento de ticket creado
    EventBus.publish('TICKET_CREATED', ticket);
    
    return ticket;
  }
}

// Exportamos una instancia única del factory
export default new TicketFactory();