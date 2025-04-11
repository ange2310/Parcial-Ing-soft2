// services/QueueService.js
/**
 * Servicio para gestionar la cola de personas en el cine
 */
import { Queue } from '../utils/Queue';
import EventBus from '../utils/EventBus';

class QueueService {
  constructor() {
    this.peopleQueue = new Queue();
    this.currentPerson = null;
  }
  
  /**
   * Agrega una persona a la cola con sus tickets
   * @param {Object} personData - Datos de la persona
   * @param {Object} ticketService - Servicio de tickets
   * @param {Object} seatService - Servicio de asientos
   * @returns {Object} - La persona agregada
   */
  addPersonToQueue(personData, ticketService, seatService) {
    const person = {
      id: Date.now(),
      name: personData.name,
      tickets: []
    };
    
    // Creación de tickets según los datos proporcionados
    if (personData.tickets && personData.tickets.length > 0) {
      personData.tickets.forEach(ticketData => {
        // Verificar disponibilidad del asiento
        if (seatService.validateSeat(ticketData.movie, ticketData.time, ticketData.seat)) {
          // Crear el ticket
          const ticket = ticketService.createTicket(
            ticketData.type || 'standard',
            {
              movie: ticketData.movie,
              time: ticketData.time,
              seat: ticketData.seat
            }
          );
          
          person.tickets.push(ticket);
          
          // Reservar el asiento
          seatService.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
          
          // Emitir evento de ticket creado
          EventBus.publish('TICKET_CREATED', ticket);
        } else {
          console.warn(`Asiento ${ticketData.seat} no disponible para ${ticketData.movie} a las ${ticketData.time}`);
        }
      });
    }
    
    // Agregar a la cola
    this.peopleQueue.enqueue(person);
    
    // Si no hay persona actual, establecer esta como la actual
    if (!this.currentPerson) {
      this.currentPerson = person;
    }
    
    // Emitir evento de persona agregada
    EventBus.publish('PERSON_ADDED', person);
    
    return person;
  }
  
  /**
   * Obtiene la siguiente persona de la cola
   * @returns {Object|null} - La siguiente persona o null si la cola está vacía
   */
  getNextPerson() {
    if (this.peopleQueue.isEmpty()) {
      this.currentPerson = null;
      return null;
    }
    
    const person = this.peopleQueue.dequeue();
    this.currentPerson = person;
    
    // Emitir evento de siguiente persona
    EventBus.publish('NEXT_PERSON', person);
    
    return person;
  }
  
  /**
   * Mueve la persona actual al final de la cola
   * @returns {Object|null} - La siguiente persona o null si no hay personas
   */
  moveCurrentPersonToEnd() {
    if (!this.currentPerson) {
      return null;
    }
    
    // Guardar referencia a la persona actual
    const personToMove = this.currentPerson;
    
    // Agregar al final de la cola
    this.peopleQueue.enqueue(personToMove);
    
    // Obtener la siguiente persona
    const nextPerson = this.getNextPerson();
    
    // Emitir evento de persona movida al final
    EventBus.publish('PERSON_MOVED_TO_END', personToMove);
    
    return nextPerson;
  }
  
  /**
   * Obtiene la persona actual
   * @returns {Object|null} - La persona actual o null si no hay
   */
  getCurrentPerson() {
    return this.currentPerson;
  }
  
  /**
   * Obtiene todas las personas en la cola
   * @returns {Array} - Array de personas
   */
  getAllPeople() {
    return this.peopleQueue.getAll();
  }
  
  /**
   * Obtiene el tamaño de la cola
   * @returns {number} - Número de personas en la cola
   */
  getQueueSize() {
    return this.peopleQueue.size();
  }
}

// Exportamos una instancia única del servicio
export default new QueueService();