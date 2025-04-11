// services/TicketService.js
/**
 * Servicio para la gestión de tickets
 */
import TicketFactory from '../utils/TicketFactory';
import EventBus from '../utils/EventBus';

class TicketService {
  constructor() {
    // Internamente usa el TicketFactory
    this.ticketFactory = TicketFactory;
  }
  
  /**
   * Crea un nuevo ticket utilizando el Factory
   * @param {string} type - Tipo de ticket (standard, vip, child)
   * @param {Object} data - Datos del ticket
   * @returns {Object} - Ticket creado
   */
  createTicket(type, data) {
    const ticket = this.ticketFactory.createTicket(type, data);
    
    // Emitir evento de ticket creado
    EventBus.publish('TICKET_CREATED', ticket);
    
    return ticket;
  }
  
  /**
   * Agrega un ticket a una persona específica
   * @param {Object} person - Persona que recibirá el ticket
   * @param {Object} ticketData - Datos del ticket
   * @param {Object} seatService - Servicio de asientos
   * @returns {Object|false} - El ticket creado o false si hay error
   */
  addTicketToPerson(person, ticketData, seatService) {
    if (!person) {
      console.error('Persona no encontrada');
      return false;
    }
    
    // Verificar disponibilidad del asiento
    if (!seatService.validateSeat(ticketData.movie, ticketData.time, ticketData.seat)) {
      console.error('Asiento no disponible');
      return false;
    }
    
    // Crear el ticket
    const ticket = this.createTicket(
      ticketData.type || 'standard',
      {
        movie: ticketData.movie,
        time: ticketData.time,
        seat: ticketData.seat
      }
    );
    
    // Agregar a la persona
    person.tickets.push(ticket);
    
    // Reservar el asiento
    seatService.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
    
    // Emitir evento de ticket agregado
    EventBus.publish('TICKET_ADDED', { personId: person.id, ticket });
    
    return ticket;
  }
  
  /**
   * Elimina un ticket de una persona
   * @param {Object} person - Persona dueña del ticket
   * @param {string|number} ticketId - ID del ticket a eliminar
   * @param {Object} seatService - Servicio de asientos
   * @returns {Object|false} - El ticket eliminado o false si hay error
   */
  removeTicketFromPerson(person, ticketId, seatService) {
    if (!person || !person.tickets) {
      console.error('Persona no encontrada o no tiene tickets');
      return false;
    }
    
    // Buscar el ticket
    const ticketIndex = person.tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) {
      console.error('Ticket no encontrado');
      return false;
    }
    
    // Obtener el ticket
    const ticket = person.tickets[ticketIndex];
    
    // Eliminar el ticket de la persona
    person.tickets.splice(ticketIndex, 1);
    
    // Liberar el asiento
    seatService.freeSeat(ticket.movie, ticket.time, ticket.seat.replace('VIP-', ''));
    
    // Emitir evento de ticket eliminado
    EventBus.publish('TICKET_REMOVED', { ticket, personId: person.id });
    
    return ticket;
  }
  
  /**
   * Genera un código único para un ticket
   * @param {Object} ticket - Ticket para generar código
   * @returns {string} - Código generado
   */
  generateTicketCode(ticket) {
    const movieCode = ticket.movie.substring(0, 3).toUpperCase();
    const timeCode = ticket.time.replace(':', '');
    const seatCode = ticket.seat.replace('VIP-', '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${movieCode}-${timeCode}-${seatCode}-${randomCode}`;
  }
  
  /**
   * Calcula el total de un conjunto de tickets
   * @param {Array} tickets - Lista de tickets
   * @returns {number} - Total a pagar
   */
  calculateTotal(tickets) {
    return tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  }
}

// Exportamos una instancia única del servicio
export default new TicketService();