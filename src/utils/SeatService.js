// services/SeatService.js
/**
 * Servicio para la gestión de asientos del cine
 */
import EventBus from '../utils/EventBus';

class SeatService {
  constructor() {
    this.seatMap = {};
  }
  
  /**
   * Inicializa el mapa de asientos para todas las salas
   * @param {Array} movies - Lista de películas
   * @param {Array} times - Lista de horarios
   */
  initializeSeats(movies, times) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;
    
    // Para cada película y hora
    movies.forEach(movie => {
      if (!this.seatMap[movie]) this.seatMap[movie] = {};
      
      times.forEach(time => {
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
    
    // Publicar evento de inicialización de asientos
    EventBus.publish('SEATS_INITIALIZED', { movies, times });
  }
  
  /**
   * Reserva un asiento para una película y horario
   * @param {string} movie - Película
   * @param {string} time - Horario
   * @param {string} seat - Identificador del asiento
   * @returns {boolean} - Éxito de la operación
   */
  reserveSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      
      // Verificar disponibilidad antes de reservar
      if (this.seatMap[movie][time][cleanSeat] !== 'available') {
        return false;
      }
      
      this.seatMap[movie][time][cleanSeat] = 'occupied';
      
      // Publicar evento de asiento reservado
      EventBus.publish('SEAT_RESERVED', { movie, time, seat: cleanSeat });
      
      return true;
    } catch (error) {
      console.error('Error al reservar asiento:', error);
      return false;
    }
  }
  
  /**
   * Libera un asiento previamente reservado
   * @param {string} movie - Película
   * @param {string} time - Horario
   * @param {string} seat - Identificador del asiento
   * @returns {boolean} - Éxito de la operación
   */
  freeSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      
      // Solo liberar si está ocupado
      if (this.seatMap[movie][time][cleanSeat] !== 'occupied') {
        return false;
      }
      
      this.seatMap[movie][time][cleanSeat] = 'available';
      
      // Publicar evento de asiento liberado
      EventBus.publish('SEAT_FREED', { movie, time, seat: cleanSeat });
      
      return true;
    } catch (error) {
      console.error('Error al liberar asiento:', error);
      return false;
    }
  }
  
  /**
   * Valida si un asiento está disponible
   * @param {string} movie - Película
   * @param {string} time - Horario
   * @param {string} seat - Identificador del asiento
   * @returns {boolean} - true si está disponible, false si no
   */
  validateSeat(movie, time, seat) {
    try {
      const cleanSeat = seat.replace('VIP-', '');
      return this.seatMap[movie][time][cleanSeat] === 'available';
    } catch (error) {
      console.error('Error al validar asiento:', error);
      return false;
    }
  }
  
  /**
   * Obtiene el mapa de asientos para una película y horario
   * @param {string} movie - Película
   * @param {string} time - Horario
   * @returns {Object} - Mapa de asientos
   */
  getSeatMap(movie, time) {
    if (!movie || !time || !this.seatMap[movie] || !this.seatMap[movie][time]) {
      return {};
    }
    
    return { ...this.seatMap[movie][time] };
  }
  
  /**
   * Calcula el porcentaje de ocupación para una película y horario
   * @param {string} movie - Película
   * @param {string} time - Horario
   * @returns {number} - Porcentaje de ocupación (0-100)
   */
  getPercentageOccupancy(movie, time) {
    if (!movie || !time || !this.seatMap[movie] || !this.seatMap[movie][time]) {
      return 0;
    }
    
    let totalSeats = 0;
    let occupiedSeats = 0;
    
    Object.keys(this.seatMap[movie][time]).forEach(seat => {
      totalSeats++;
      if (this.seatMap[movie][time][seat] === 'occupied') {
        occupiedSeats++;
      }
    });
    
    return totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;
  }
}

// Exportamos una instancia única del servicio
export default new SeatService();