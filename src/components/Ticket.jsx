// components/Ticket.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { removeTicket } from '../Redux/slices/ticketSlice';
import CinemaManager from '../utils/CinemaAdapter'; // Cambiado a CinemaAdapter

const Ticket = ({ ticket }) => {
  const dispatch = useDispatch();
  
  const handleRemove = () => {
    // Eliminar el ticket usando Redux
    dispatch(removeTicket(ticket.id));
    
    // También eliminar usando el CinemaManager
    CinemaManager.removeTicket(ticket.id);
  };
  
  // Función para determinar la clase CSS según el tipo de ticket
  const getTicketClass = () => {
    if (!ticket.type) return 'ticket-card';
    
    switch (ticket.type.toLowerCase()) {
      case 'vip':
        return 'ticket-card ticket-vip';
      case 'child':
        return 'ticket-card ticket-child';
      default:
        return 'ticket-card';
    }
  };

  // Definir un precio por defecto para tickets sin precio
  const ticketPrice = ticket.price !== undefined ? ticket.price : 10.0;

  return (
    <div className={getTicketClass()}>
      <div className="ticket-header">
        <h4>{ticket.movie}</h4>
        {ticket.type && (
          <span className="ticket-type-badge">
            {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}
          </span>
        )}
      </div>
      
      <div className="ticket-details">
        <p>Asiento: {ticket.seat}</p>
        <p>Hora: {ticket.time}</p>
        <p>Precio: ${ticketPrice.toFixed(2)}</p>
        
        {/* Beneficios adicionales según el tipo de ticket */}
        {ticket.concessions && <p className="ticket-benefit">✓ Incluye concesiones</p>}
        {ticket.vipLounge && <p className="ticket-benefit">✓ Acceso a sala VIP</p>}
        {ticket.toyIncluded && <p className="ticket-benefit">✓ Incluye juguete</p>}
      </div>
      
      <button className="remove-ticket-button" onClick={handleRemove}>
        Eliminar
      </button>
    </div>
  );
};

export default Ticket;