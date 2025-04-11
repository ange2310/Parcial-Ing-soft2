// utils/CinemaService.js
/**
 * Versión refactorizada del CinemaManager (God Object)
 * Esta versión implementa una mejor separación de responsabilidades
 * manteniendo la misma API para que sea compatible con el código existente
 */

import { Queue } from './Queue';
import { Stack } from './Stack';
import { List } from './List';
import EventBus from './EventBus';
import TicketFactory from './TicketFactory';

// Clase base para gestión de tickets
class TicketService {
  constructor() {
    this.factory = TicketFactory;
  }
  
  createTicket(type, data) {
    return this.factory.createTicket(type, data);
  }
  
  generateTicketCode(ticket) {
    const movieCode = ticket.movie.substring(0, 3).toUpperCase();
    const timeCode = ticket.time.replace(':', '');
    const seatCode = ticket.seat.replace('VIP-', '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${movieCode}-${timeCode}-${seatCode}-${randomCode}`;
  }
  
  calculateTotal(tickets) {
    return tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  }
}

// Clase para gestión de asientos
class SeatService {
  constructor() {
    this.seatMap = {};
  }
  
  initializeSeats(movies, times) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;
    
    movies.forEach(movie => {
      if (!this.seatMap[movie]) this.seatMap[movie] = {};
      
      times.forEach(time => {
        if (!this.seatMap[movie][time]) this.seatMap[movie][time] = {};
        
        rows.forEach(row => {
          for (let i = 1; i <= seatsPerRow; i++) {
            const seatId = `${row}${i}`;
            this.seatMap[movie][time][seatId] = 'available';
          }
        });
      });
    });
    
    EventBus.publish('SEATS_INITIALIZED', { movies, times });
  }
  
  reserveSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      this.seatMap[movie][time][cleanSeat] = 'occupied';
      EventBus.publish('SEAT_RESERVED', { movie, time, seat: cleanSeat });
      return true;
    } catch (error) {
      console.error('Error al reservar asiento:', error);
      return false;
    }
  }
  
  freeSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      this.seatMap[movie][time][cleanSeat] = 'available';
      EventBus.publish('SEAT_FREED', { movie, time, seat: cleanSeat });
      return true;
    } catch (error) {
      console.error('Error al liberar asiento:', error);
      return false;
    }
  }
  
  validateSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      return this.seatMap[movie][time][cleanSeat] === 'available';
    } catch (error) {
      console.error('Error al validar asiento:', error);
      return false;
    }
  }
  
  getSeatMap(movie, time) {
    return this.seatMap[movie][time];
  }
  
  getPercentageOccupancy(movie, time) {
    let totalSeats = 0;
    let occupiedSeats = 0;
    
    Object.keys(this.seatMap[movie][time]).forEach(seat => {
      totalSeats++;
      if (this.seatMap[movie][time][seat] === 'occupied') {
        occupiedSeats++;
      }
    });
    
    return (occupiedSeats / totalSeats) * 100;
  }
}

// Clase para estadísticas
class StatisticsService {
  constructor() {
    this.totalSales = 0;
    this.totalTicketsSold = 0;
    this.salesByMovie = {};
    this.salesByTime = {};
  }
  
  updateStatistics(ticket) {
    this.totalTicketsSold++;
    this.totalSales += ticket.price;
    
    if (!this.salesByMovie[ticket.movie]) {
      this.salesByMovie[ticket.movie] = { count: 0, revenue: 0 };
    }
    this.salesByMovie[ticket.movie].count++;
    this.salesByMovie[ticket.movie].revenue += ticket.price;
    
    if (!this.salesByTime[ticket.time]) {
      this.salesByTime[ticket.time] = { count: 0, revenue: 0 };
    }
    this.salesByTime[ticket.time].count++;
    this.salesByTime[ticket.time].revenue += ticket.price;
  }
  
  removeFromStatistics(ticket) {
    this.totalTicketsSold--;
    this.totalSales -= ticket.price;
    
    if (this.salesByMovie[ticket.movie]) {
      this.salesByMovie[ticket.movie].count--;
      this.salesByMovie[ticket.movie].revenue -= ticket.price;
      
      if (this.salesByMovie[ticket.movie].count <= 0) {
        delete this.salesByMovie[ticket.movie];
      }
    }
    
    if (this.salesByTime[ticket.time]) {
      this.salesByTime[ticket.time].count--;
      this.salesByTime[ticket.time].revenue -= ticket.price;
      
      if (this.salesByTime[ticket.time].count <= 0) {
        delete this.salesByTime[ticket.time];
      }
    }
  }
  
  getStatistics() {
    return {
      totalSales: this.totalSales,
      totalTicketsSold: this.totalTicketsSold,
      salesByMovie: this.salesByMovie,
      salesByTime: this.salesByTime,
      dateGenerated: new Date().toISOString()
    };
  }
  
  getMostPopularMovie() {
    let mostPopular = null;
    let highestCount = 0;
    
    Object.keys(this.salesByMovie).forEach(movie => {
      if (this.salesByMovie[movie].count > highestCount) {
        highestCount = this.salesByMovie[movie].count;
        mostPopular = movie;
      }
    });
    
    return mostPopular;
  }
}

// Clase para gestión de personas y cola
class QueueService {
  constructor() {
    this.peopleQueue = new Queue();
    this.currentPerson = null;
    this.selectedTickets = [];
  }
  
  addPersonToQueue(person) {
    this.peopleQueue.enqueue(person);
    
    if (!this.currentPerson) {
      this.currentPerson = person;
    }
    
    EventBus.publish('PERSON_ADDED', person);
    return person;
  }
  
  getNextPerson() {
    if (this.peopleQueue.isEmpty()) {
      this.currentPerson = null;
      this.selectedTickets = [];
      return null;
    }
    
    const person = this.peopleQueue.dequeue();
    this.currentPerson = person;
    this.selectedTickets = person.tickets;
    
    EventBus.publish('NEXT_PERSON', person);
    return person;
  }
  
  moveCurrentPersonToEnd() {
    if (!this.currentPerson) {
      return false;
    }
    
    const personToMove = this.currentPerson;
    this.peopleQueue.enqueue(personToMove);
    
    const nextPerson = this.getNextPerson();
    
    EventBus.publish('PERSON_MOVED_TO_END', personToMove);
    return nextPerson;
  }
}

// Implementación del CinemaService principal que coordina los servicios
class CinemaService {
  constructor() {
    // Inicializar servicios
    this.ticketService = new TicketService();
    this.seatService = new SeatService();
    this.statisticsService = new StatisticsService();
    this.queueService = new QueueService();
    
    // Propiedades compartidas
    this.availableMovies = [
      'Avengers: Endgame',
      'Star Wars: El Ascenso de Skywalker',
      'Joker',
      'Toy Story 4',
      'El Rey León'
    ];
    
    this.availableTimes = [
      '10:00', '12:30', '15:00', '17:30', '20:00', '22:30'
    ];
    
    // Inicializar asientos
    this.seatService.initializeSeats(this.availableMovies, this.availableTimes);
  }
  
  // Métodos que mantienen la misma API que CinemaManager
  // para asegurar compatibilidad con el código existente
  
  // === Propiedades para compatibilidad ===
  get peopleQueue() {
    return this.queueService.peopleQueue;
  }
  
  get currentPerson() {
    return this.queueService.currentPerson;
  }
  
  get selectedTickets() {
    return this.queueService.selectedTickets;
  }
  
  get totalSales() {
    return this.statisticsService.totalSales;
  }
  
  get totalTicketsSold() {
    return this.statisticsService.totalTicketsSold;
  }
  
  get salesByMovie() {
    return this.statisticsService.salesByMovie;
  }
  
  get salesByTime() {
    return this.statisticsService.salesByTime;
  }
  
  // === Métodos de gestión de personas ===
  addPersonToQueue(personData) {
    const person = {
      id: Date.now(),
      name: personData.name,
      tickets: []
    };
    
    // Creación de tickets
    if (personData.tickets && personData.tickets.length > 0) {
      personData.tickets.forEach(ticketData => {
        // Validar disponibilidad del asiento
        if (this.seatService.validateSeat(ticketData.movie, ticketData.time, ticketData.seat)) {
          // Crear ticket con el factory
          const ticket = this.ticketService.createTicket(
            ticketData.type || 'standard',
            {
              movie: ticketData.movie,
              time: ticketData.time,
              seat: ticketData.seat
            }
          );
          
          person.tickets.push(ticket);
          this.seatService.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
          this.statisticsService.updateStatistics(ticket);
        }
      });
    }
    
    return this.queueService.addPersonToQueue(person);
  }
  
  getNextPerson() {
    return this.queueService.getNextPerson();
  }
  
  moveCurrentPersonToEnd() {
    return this.queueService.moveCurrentPersonToEnd();
  }
  
  // === Métodos de tickets ===
  addTicketToPerson(personId, ticketData) {
    let targetPerson = null;
    
    // Buscar a la persona en la cola
    const allPeople = this.queueService.peopleQueue.getAll();
    for (let i = 0; i < allPeople.length; i++) {
      if (allPeople[i].id === personId) {
        targetPerson = allPeople[i];
        break;
      }
    }
    
    if (!targetPerson) {
      console.error('Persona no encontrada');
      return false;
    }
    
    // Verificar disponibilidad del asiento
    if (!this.seatService.validateSeat(ticketData.movie, ticketData.time, ticketData.seat)) {
      console.error('Asiento no disponible');
      return false;
    }
    
    // Crear el ticket con el factory
    const ticket = this.ticketService.createTicket(
      ticketData.type || 'standard',
      {
        movie: ticketData.movie,
        time: ticketData.time,
        seat: ticketData.seat
      }
    );
    
    targetPerson.tickets.push(ticket);
    this.seatService.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
    this.statisticsService.updateStatistics(ticket);
    
    // Si es la persona actual, actualizar los tickets seleccionados
    if (this.queueService.currentPerson && this.queueService.currentPerson.id === personId) {
      this.queueService.selectedTickets = targetPerson.tickets;
    }
    
    EventBus.publish('TICKET_ADDED', { personId, ticket });
    return ticket;
  }
  
  removeTicket(ticketId) {
    // Buscar el ticket para liberarlo
    let ticketToRemove = null;
    let personWithTicket = null;
    
    const allPeople = this.queueService.peopleQueue.getAll();
    for (let i = 0; i < allPeople.length; i++) {
      const person = allPeople[i];
      for (let j = 0; j < person.tickets.length; j++) {
        if (person.tickets[j].id === ticketId) {
          ticketToRemove = person.tickets[j];
          personWithTicket = person;
          
          // Eliminar el ticket de la persona
          person.tickets.splice(j, 1);
          break;
        }
      }
      
      if (ticketToRemove) break;
    }
    
    if (!ticketToRemove) {
      console.error('Ticket no encontrado');
      return false;
    }
    
    // Liberar el asiento
    this.seatService.freeSeat(
      ticketToRemove.movie,
      ticketToRemove.time,
      ticketToRemove.seat.replace('VIP-', '')
    );
    
    // Actualizar estadísticas
    this.statisticsService.removeFromStatistics(ticketToRemove);
    
    // Si es de la persona actual, actualizar tickets seleccionados
    if (this.queueService.currentPerson && this.queueService.currentPerson.id === personWithTicket.id) {
      this.queueService.selectedTickets = personWithTicket.tickets;
    }
    
    EventBus.publish('TICKET_REMOVED', { ticketId, ticket: ticketToRemove, personId: personWithTicket.id });
    return ticketToRemove;
  }
  
  // === Métodos de asientos ===
  validateSeat(movie, time, seat) {
    return this.seatService.validateSeat(movie, time, seat);
  }
  
  reserveSeat(movie, time, seat) {
    return this.seatService.reserveSeat(movie, time, seat);
  }
  
  freeSeat(movie, time, seat) {
    return this.seatService.freeSeat(movie, time, seat);
  }
  
  getSeatMap(movie, time) {
    return this.seatService.getSeatMap(movie, time);
  }
  
  getPercentageOccupancy(movie, time) {
    return this.seatService.getPercentageOccupancy(movie, time);
  }
  
  // === Métodos de estadísticas ===
  updateStatistics(ticket) {
    this.statisticsService.updateStatistics(ticket);
  }
  
  getStatistics() {
    const stats = this.statisticsService.getStatistics();
    stats.queueLength = this.queueService.peopleQueue.size();
    return stats;
  }
  
  getMostPopularMovie() {
    return this.statisticsService.getMostPopularMovie();
  }
  
  // === Procesamiento de pagos ===
  processPurchase(amount) {
    if (!this.queueService.currentPerson || this.queueService.selectedTickets.length === 0) {
      return { success: false, message: 'No hay persona o tickets seleccionados' };
    }
    
    // Calcular total
    const total = this.ticketService.calculateTotal(this.queueService.selectedTickets);
    
    if (amount < total) {
      return { 
        success: false, 
        message: 'Monto insuficiente',
        required: total,
        provided: amount
      };
    }
    
    // Procesar la compra
    const change = parseFloat((amount - total).toFixed(2));
    const receipt = {
      person: this.queueService.currentPerson.name,
      tickets: this.queueService.selectedTickets,
      total: total,
      paid: amount,
      change: change,
      date: new Date().toISOString(),
      ticketCodes: this.queueService.selectedTickets.map(ticket => 
        this.ticketService.generateTicketCode(ticket)
      )
    };
    
    // Emitir evento de compra exitosa
    EventBus.publish('PURCHASE_COMPLETED', receipt);
    
    // Pasar a la siguiente persona
    this.getNextPerson();
    
    return {
      success: true,
      receipt
    };
  }
  
  // === Otras utilidades ===
  printTickets() {
    if (!this.queueService.currentPerson || this.queueService.selectedTickets.length === 0) {
      return { success: false, message: 'No hay tickets para imprimir' };
    }
    
    const ticketsPrinted = this.queueService.selectedTickets.map(ticket => {
      return {
        code: this.ticketService.generateTicketCode(ticket),
        movie: ticket.movie,
        time: ticket.time,
        seat: ticket.seat,
        type: ticket.type,
        personName: this.queueService.currentPerson.name
      };
    });
    
    EventBus.publish('TICKETS_PRINTED', ticketsPrinted);
    return {
      success: true,
      tickets: ticketsPrinted
    };
  }
  
  generateTicketCode(ticket) {
    return this.ticketService.generateTicketCode(ticket);
  }
}

// Exportamos una instancia única (Singleton) manteniendo compatibilidad
export default new CinemaService();