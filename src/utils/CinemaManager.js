// utils/CinemaManager.js
/**
 * ¡ANTIPATRÓN GOD OBJECT!
 * Esta clase hace demasiadas cosas y tiene demasiadas responsabilidades:
 * - Gestión de personas
 * - Gestión de tickets
 * - Gestión de asientos
 * - Gestión de películas y horarios
 * - Procesamiento de pagos
 * - Estadísticas
 * - Impresión de tickets
 * ¡Y mucho más!
 */
import { Queue } from './Queue';
import { Stack } from './Stack';
import { List } from './List';
import EventBus from './EventBus';
import TicketFactory from './TicketFactory';

class CinemaManager {
  constructor() {
    // Gestión de colecciones
    this.peopleQueue = new Queue();
    this.ticketsStack = new Stack();
    this.ticketsList = new List();
    
    // Estado general del cine
    this.currentPerson = null;
    this.selectedTickets = [];
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
    
    this.seatMap = {};
    this.initializeSeats();
    
    // Estadísticas del cine
    this.totalSales = 0;
    this.totalTicketsSold = 0;
    this.salesByMovie = {};
    this.salesByTime = {};
  }
  /**
 * Procesa el pago de los tickets para la persona actual
 * @param {number} amount - Cantidad de dinero recibida
 * @returns {Object} - Resultado de la operación con recibo si fue exitosa
 */
processPurchase(amount) {
    if (!this.currentPerson || !this.selectedTickets || this.selectedTickets.length === 0) {
      return { 
        success: false, 
        message: 'No hay persona o tickets seleccionados' 
      };
    }
    // Actualizar estadísticas de ventas (agregar esto)
  this.selectedTickets.forEach(ticket => {
    this.totalTicketsSold += 1;
    this.totalSales += (ticket.price || 10.0);
  });

    // Calcular total
    const total = this.selectedTickets.reduce(
      (sum, ticket) => sum + (ticket.price !== undefined ? ticket.price : 10.0), 
      0
    );
    
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
      person: this.currentPerson.name,
      tickets: this.selectedTickets,
      total: total,
      paid: amount,
      change: change,
      date: new Date().toISOString(),
      ticketCodes: this.selectedTickets.map(ticket => this.generateTicketCode(ticket))
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
// Modifica la función initializeFromRedux en CinemaManager.js con este código mejorado

initializeFromRedux(people) {
    // Limpia la cola actual
    this.peopleQueue = new Queue();
    
    // Asegurarse de que el mapa de asientos esté inicializado
    if (Object.keys(this.seatMap).length === 0) {
      this.initializeSeats();
    }
    
    // Contador de tickets
    let ticketCount = 0;
    
    // Agrega las personas de Redux a la cola
    people.forEach(person => {
      // Crea una copia de la persona para evitar referencias cruzadas
      const personCopy = {
        id: person.id,
        name: person.name,
        tickets: []
      };
      
      // Agrega los tickets con propiedades completas
      if (person.tickets && Array.isArray(person.tickets)) {
        person.tickets.forEach(ticket => {
          // Asegúrate de que el ticket tenga todas las propiedades necesarias
          const completedTicket = {
            id: ticket.id || Date.now() + Math.random() * 1000,
            movie: ticket.movie,
            time: ticket.time,
            seat: ticket.seat,
            // Añadir propiedades que pueden faltar
            price: ticket.price !== undefined ? ticket.price : 10.0,
            type: ticket.type || 'standard',
            concessions: ticket.concessions || false,
            vipLounge: ticket.vipLounge || false,
            toyIncluded: ticket.toyIncluded || false
          };
          
          personCopy.tickets.push(completedTicket);
          ticketCount++;
          
          try {
            // Asegurarse de que el asiento está reservado sin arrojar errores
            this.reserveSeat(ticket.movie, ticket.time, ticket.seat);
            
            // Actualizar estadísticas
            this.updateStatistics(completedTicket);
          } catch (error) {
            console.error("Error al inicializar ticket:", error);
          }
        });
      }
      
      // Agregar la persona a la cola
      this.peopleQueue.enqueue(personCopy);
    });
    
    // Actualizar totalTicketsSold con el número de tickets procesados
    this.totalTicketsSold = ticketCount;
    
    // Establecer la persona actual si hay personas en la cola
    if (!this.peopleQueue.isEmpty()) {
      this.currentPerson = this.peopleQueue.front();
      this.selectedTickets = this.currentPerson.tickets;
    }
    
    console.log("CinemaManager inicializado con datos de Redux:", {
      peopleCount: this.peopleQueue.size(),
      ticketsSold: this.totalTicketsSold,
      currentPerson: this.currentPerson ? this.currentPerson.name : "Ninguno"
    });
  }

  // Inicializa el mapa de asientos para todas las salas
  // En CinemaManager.js, asegúrate de que initializeSeats() está correctamente implementada:
initializeSeats() {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;
    
    // Para cada película y hora
    this.availableMovies.forEach(movie => {
      if (!this.seatMap[movie]) this.seatMap[movie] = {};
      
      this.availableTimes.forEach(time => {
        if (!this.seatMap[movie][time]) this.seatMap[movie][time] = {};
        
        // Inicializa todos los asientos como disponibles
        rows.forEach(row => {
          for (let i = 1; i <= seatsPerRow; i++) {
            const seatId = `${row}${i}`;
            this.seatMap[movie][time][seatId] = 'available';
          }
        });
      });
    });
    
    console.log("Mapa de asientos inicializado:", this.seatMap);
  }
  
  // Manejo de personas en la cola
  addPersonToQueue(personData) {
    const person = {
      id: Date.now(),
      name: personData.name,
      tickets: []
    };
    
    // Creación de tickets según el tipo y cantidad
    if (personData.tickets && personData.tickets.length > 0) {
      personData.tickets.forEach(ticketData => {
        const ticket = TicketFactory.createTicket(
          ticketData.type || 'standard',
          {
            movie: ticketData.movie,
            time: ticketData.time,
            seat: ticketData.seat
          }
        );
        
        person.tickets.push(ticket);
        this.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
        this.updateStatistics(ticket);
      });
    }
    
    this.peopleQueue.enqueue(person);
    
    // Si no hay persona actual, establecer esta como la actual
    if (!this.currentPerson) {
      this.currentPerson = person;
    }
    
    EventBus.publish('PERSON_ADDED', person);
    return person;
  }
  
  getNextPerson() {
    if (this.peopleQueue.isEmpty()) {
      this.currentPerson = null;
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
    
    // Guardar la persona actual
    const personToMove = this.currentPerson;
    
    // Agregarla al final de la cola
    this.peopleQueue.enqueue(personToMove);
    
    // Obtener la siguiente persona
    const nextPerson = this.getNextPerson();
    
    EventBus.publish('PERSON_MOVED_TO_END', personToMove);
    return nextPerson;
  }
  
  // Manejo de tickets
  addTicketToPerson(personId, ticketData) {
    let targetPerson = null;
    
    // Buscar a la persona en la cola
    const allPeople = this.peopleQueue.getAll();
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
    if (!this.validateSeat(ticketData.movie, ticketData.time, ticketData.seat)) {
      console.error('Asiento no disponible');
      return false;
    }
    
    // Crear el ticket con el factory
    const ticket = TicketFactory.createTicket(
      ticketData.type || 'standard',
      {
        movie: ticketData.movie,
        time: ticketData.time,
        seat: ticketData.seat
      }
    );
    
    targetPerson.tickets.push(ticket);
    this.reserveSeat(ticketData.movie, ticketData.time, ticketData.seat);
    this.updateStatistics(ticket);
    
    // Si es la persona actual, actualizar los tickets seleccionados
    if (this.currentPerson && this.currentPerson.id === personId) {
      this.selectedTickets = targetPerson.tickets;
    }
    
    EventBus.publish('TICKET_ADDED', { personId, ticket });
    return ticket;
  }
  
  removeTicket(ticketId) {
    // Buscar el ticket para liberarlo
    let ticketToRemove = null;
    let personWithTicket = null;
    
    const allPeople = this.peopleQueue.getAll();
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
    this.freeSeat(
      ticketToRemove.movie,
      ticketToRemove.time,
      ticketToRemove.seat.replace('VIP-', '')
    );
    
    // Actualizar estadísticas
    this.totalTicketsSold--;
    this.totalSales -= ticketToRemove.price;
    
    // Si es de la persona actual, actualizar tickets seleccionados
    if (this.currentPerson && this.currentPerson.id === personWithTicket.id) {
      this.selectedTickets = personWithTicket.tickets;
    }
    
    EventBus.publish('TICKET_REMOVED', { ticketId, ticket: ticketToRemove, personId: personWithTicket.id });
    return ticketToRemove;
  }
  
  // Gestión de asientos
  /**
 * Reserva un asiento para una película y horario
 * @param {string} movie - Película
 * @param {string} time - Horario
 * @param {string} seat - Identificador del asiento
 * @returns {boolean} - Éxito de la operación
 */
reserveSeat(movie, time, seat) {
    try {
      // Verificar si existe el mapa para esta película
      if (!this.seatMap[movie]) {
        // Si no existe, inicializar
        console.log(`Inicializando mapa para película: ${movie}`);
        this.seatMap[movie] = {};
      }
      
      // Verificar si existe el mapa para este horario
      if (!this.seatMap[movie][time]) {
        // Si no existe, inicializar
        console.log(`Inicializando mapa para horario: ${time} en ${movie}`);
        this.seatMap[movie][time] = {};
        
        // Inicializar asientos para este horario
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsPerRow = 12;
        
        rows.forEach(row => {
          for (let i = 1; i <= seatsPerRow; i++) {
            const seatId = `${row}${i}`;
            this.seatMap[movie][time][seatId] = 'available';
          }
        });
      }
      
      // Procesar el asiento (quitar prefijo VIP y cualquier sufijo)
      const cleanSeat = seat.replace('VIP-', '').split('-')[0].trim();
      
      // Verificar si el asiento existe
      if (this.seatMap[movie][time][cleanSeat] === undefined) {
        // Si no existe, añadirlo
        console.log(`Añadiendo asiento ${cleanSeat} para ${movie} a las ${time}`);
        this.seatMap[movie][time][cleanSeat] = 'available';
      }
      
      // Marcar como ocupado
      this.seatMap[movie][time][cleanSeat] = 'occupied';
      console.log(`Asiento ${cleanSeat} reservado para ${movie} a las ${time}`);
      
      // Publicar evento
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
  
  // Actualización para CinemaManager.js - Agrega este método mejorado

/**
 * Valida si un asiento está disponible
 * @param {string} movie - Película
 * @param {string} time - Horario
 * @param {string} seat - Identificador del asiento
 * @returns {boolean} - true si está disponible, false si no
 */
validateSeat(movie, time, seat) {
    try {
      // Eliminar prefijos de VIP o numeración adicional
      const cleanSeat = seat.replace('VIP-', '').split('-')[0].trim();
      
      // Debugging
      console.log(`Validando asiento: ${movie}, ${time}, ${cleanSeat}`);
      console.log(`Mapa de asientos de ${movie} a las ${time}:`, this.seatMap[movie][time]);
      
      // Verificar si existe el mapa para esta película y horario
      if (!this.seatMap[movie] || !this.seatMap[movie][time]) {
        console.error(`No hay mapa de asientos para ${movie} a las ${time}`);
        return false;
      }
      
      // Verificar si existe el asiento
      if (this.seatMap[movie][time][cleanSeat] === undefined) {
        console.error(`El asiento ${cleanSeat} no existe en el mapa`);
        return false;
      }
      
      // Verificar disponibilidad
      const isAvailable = this.seatMap[movie][time][cleanSeat] === 'available';
      console.log(`Estado del asiento ${cleanSeat}: ${isAvailable ? 'disponible' : 'ocupado'}`);
      
      return isAvailable;
    } catch (error) {
      console.error('Error al validar asiento:', error);
      return false;
    }
  }
  
  generateTicketCode(ticket) {
    const movieCode = ticket.movie.substring(0, 3).toUpperCase();
    const timeCode = ticket.time.replace(':', '');
    const seatCode = ticket.seat.replace('VIP-', '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${movieCode}-${timeCode}-${seatCode}-${randomCode}`;
  }
  
  // Estadísticas
  updateStatistics(ticket) {
    this.totalTicketsSold++;
    this.totalSales += ticket.price;
    
    // Actualizar estadísticas por película
    if (!this.salesByMovie[ticket.movie]) {
      this.salesByMovie[ticket.movie] = {
        count: 0,
        revenue: 0
      };
    }
    this.salesByMovie[ticket.movie].count++;
    this.salesByMovie[ticket.movie].revenue += ticket.price;
    
    // Actualizar estadísticas por hora
    if (!this.salesByTime[ticket.time]) {
      this.salesByTime[ticket.time] = {
        count: 0,
        revenue: 0
      };
    }
    this.salesByTime[ticket.time].count++;
    this.salesByTime[ticket.time].revenue += ticket.price;
  }
  
  getStatistics() {
    return {
      totalSales: this.totalSales,
      totalTicketsSold: this.totalTicketsSold,
      salesByMovie: this.salesByMovie,
      salesByTime: this.salesByTime,
      queueLength: this.peopleQueue.size(),
      dateGenerated: new Date().toISOString()
    };
  }
  
  // Utilidades
  printTickets() {
    if (!this.currentPerson || this.selectedTickets.length === 0) {
      return { success: false, message: 'No hay tickets para imprimir' };
    }
    
    const ticketsPrinted = this.selectedTickets.map(ticket => {
      return {
        code: this.generateTicketCode(ticket),
        movie: ticket.movie,
        time: ticket.time,
        seat: ticket.seat,
        type: ticket.type,
        personName: this.currentPerson.name
      };
    });
    
    EventBus.publish('TICKETS_PRINTED', ticketsPrinted);
    return {
      success: true,
      tickets: ticketsPrinted
    };
  }
  
  // Acceso a datos
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

// Exportamos una instancia única del gestor (Singleton)
export default new CinemaManager();