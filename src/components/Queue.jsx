// components/Queue.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removePerson, moveToEnd, addPerson } from '../Redux/slices/queueSlice';
import Person from './Person';
import EventBus from '../utils/EventBus';
import CinemaManager from '../utils/CinemaAdapter';
import TicketFactory from '../utils/TicketFactory';

const Queue = () => {
  const { people } = useSelector(state => state.queue);
  const dispatch = useDispatch();
  
  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ticketCount: 1,
    ticketType: 'standard',
    movie: '',
    time: '',
    seats: ''
  });
  
  // Estado para almacenar películas y horarios disponibles
  const [availableMovies, setAvailableMovies] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Efecto para cargar los datos del CinemaManager
  useEffect(() => {
    setAvailableMovies(CinemaManager.availableMovies);
    setAvailableTimes(CinemaManager.availableTimes);
    
    // Suscribirse a eventos
    const personAddedUnsubscribe = EventBus.subscribe('PERSON_ADDED', (person) => {
      console.log(`Persona agregada: ${person.name}`);
    });
    
    const nextPersonUnsubscribe = EventBus.subscribe('NEXT_PERSON', (person) => {
      console.log(`Siguiente persona: ${person ? person.name : "ninguna"}`);
    });
    
    const personMovedUnsubscribe = EventBus.subscribe('PERSON_MOVED_TO_END', (person) => {
      console.log(`Persona movida al final: ${person.name}`);
    });
    
    // Limpiar suscripciones al desmontar
    return () => {
      personAddedUnsubscribe();
      nextPersonUnsubscribe();
      personMovedUnsubscribe();
    };
  }, []);
  
  const handleNext = () => {
    // Primero obtenemos la siguiente persona del CinemaManager
    const nextPerson = CinemaManager.getNextPerson();
    console.log("Siguiente persona:", nextPerson);
    
    // Luego actualizamos Redux
    dispatch(removePerson());
  };
  
  const handleMoveToEnd = () => {
    // Primero movemos la persona en CinemaManager
    CinemaManager.moveCurrentPersonToEnd();
    
    // Luego actualizamos Redux
    dispatch(moveToEnd());
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Actualiza la función handleSubmit en Queue.jsx con este código mejorado

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validación básica
  if (!formData.name || !formData.movie || !formData.time || !formData.seats) {
    alert('Por favor completa todos los campos');
    return;
  }
  
  // Convertir a array si es un solo asiento
  const seatsArray = formData.seats.includes(',') 
    ? formData.seats.split(',').map(seat => seat.trim()) 
    : [formData.seats.trim()];
  
  // Validar cantidad de tickets vs cantidad de asientos
  const ticketCount = parseInt(formData.ticketCount) || 1;
  if (ticketCount > seatsArray.length) {
    // Si hay más tickets que asientos especificados, generar asientos adicionales
    for (let i = seatsArray.length; i < ticketCount; i++) {
      seatsArray.push(`${seatsArray[0]}-${i+1}`);
    }
  }
  
  // Crear tickets
  const tickets = [];
  
  try {
    // Crear los tickets directamente (sin pre-validación)
    for (let i = 0; i < ticketCount && i < seatsArray.length; i++) {
      const seatNumber = seatsArray[i];
      
      // Crear ticket
      const ticketData = {
        movie: formData.movie,
        time: formData.time,
        seat: seatNumber
      };
      
      const ticket = TicketFactory.createTicket(formData.ticketType, ticketData);
      tickets.push(ticket);
      
      // Reservar asiento en CinemaManager (esto ya no debería fallar)
      CinemaManager.reserveSeat(formData.movie, formData.time, seatNumber);
    }
    
    // Crear persona
    const newPerson = {
      id: Date.now(),
      name: formData.name,
      tickets: tickets
    };
    
    // Agregar persona a Redux
    dispatch(addPerson(newPerson));
    
    // Agregar persona a CinemaManager
    CinemaManager.addPersonToQueue({
      name: formData.name,
      tickets: tickets.map(t => ({
        type: formData.ticketType,
        movie: t.movie,
        time: t.time,
        seat: t.seat
      }))
    });
    
    // Resetear formulario
    setFormData({
      name: '',
      ticketCount: 1,
      ticketType: 'standard',
      movie: '',
      time: '',
      seats: ''
    });
    
    // Ocultar formulario
    setShowForm(false);
  } catch (error) {
    console.error("Error al crear tickets:", error);
    alert("Hubo un error al crear los tickets. Por favor intenta de nuevo.");
  }
};

  return (
    <div className="queue-container">
      <h2>Cola de Cine</h2>
      
      {/* Estadísticas rápidas */}
      <div className="queue-stats">
        <p>Personas en cola: {people.length}</p>
        <p>Tickets vendidos hoy: {CinemaManager.totalTicketsSold}</p>
      </div>
      
      {!showForm ? (
        <button 
          className="add-person-button"
          onClick={() => setShowForm(true)}>
          Agregar Persona con Entradas
        </button>
      ) : (
        <div className="add-person-form">
          <h3>Agregar Persona con Entradas</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre de la persona"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Cantidad de Tickets:</label>
              <input
                type="number"
                name="ticketCount"
                value={formData.ticketCount}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Ticket:</label>
              <select
                name="ticketType"
                value={formData.ticketType}
                onChange={handleInputChange}
                required
              >
                <option value="standard">Estándar</option>
                <option value="vip">VIP</option>
                <option value="child">Niño</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Película:</label>
              <select
                name="movie"
                value={formData.movie}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una película</option>
                {availableMovies.map((movie, index) => (
                  <option key={index} value={movie}>{movie}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Hora:</label>
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un horario</option>
                {availableTimes.map((time, index) => (
                  <option key={index} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Asientos (separados por comas):</label>
              <input
                type="text"
                name="seats"
                value={formData.seats}
                onChange={handleInputChange}
                placeholder="Ej: A1,A2,A3 o sólo A1"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">Agregar</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="queue-controls">
        <button onClick={handleNext}>Atender siguiente</button>
        <button onClick={handleMoveToEnd}>Mover al final</button>
      </div>
      
      <div className="queue-people">
        {people.length === 0 ? (
          <p className="empty-message">No hay personas en la cola</p>
        ) : (
          people.map(person => (
            <Person key={person.id} person={person} />
          ))
        )}
      </div>
    </div>
  );
};

export default Queue;