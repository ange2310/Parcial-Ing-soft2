// components/Person.jsx
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { selectPerson } from '../Redux/slices/ticketSlice';
import EventBus from '../utils/EventBus';

const Person = ({ person }) => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Suscribirse a eventos específicos para esta persona
    const ticketAddedUnsubscribe = EventBus.subscribe('TICKET_ADDED', (data) => {
      if (data.personId === person.id) {
        console.log(`Se agregó un ticket a ${person.name}`);
      }
    });
    
    // Limpiar suscripción al desmontar
    return () => {
      ticketAddedUnsubscribe();
    };
  }, [person.id, person.name]);
  
  const handleSelect = () => {
    dispatch(selectPerson(person));
    
    // Publicar evento de selección de persona
    EventBus.publish('PERSON_SELECTED', person);
  };
  
  // Determinar el tipo de ticket dominante (si hay más de un tipo)
  const getTicketTypeLabel = () => {
    if (!person.tickets || person.tickets.length === 0) return '';
    
    const types = {};
    person.tickets.forEach(ticket => {
      types[ticket.type] = (types[ticket.type] || 0) + 1;
    });
    
    let dominantType = 'standard';
    let maxCount = 0;
    
    Object.keys(types).forEach(type => {
      if (types[type] > maxCount) {
        maxCount = types[type];
        dominantType = type;
      }
    });
    
    // Formatear nombre del tipo de ticket
    switch (dominantType) {
      case 'vip':
        return 'VIP';
      case 'child':
        return 'Niño';
      default:
        return 'Estándar';
    }
  };

  return (
    <div className="person-card" onClick={handleSelect}>
      <h3>{person.name}</h3>
      <div className="person-tickets-info">
        <p>Tickets: {person.tickets ? person.tickets.length : 0}</p>
        {person.tickets && person.tickets.length > 0 && (
          <>
            <p className="ticket-type">Tipo: {getTicketTypeLabel()}</p>
            <p className="ticket-movie">Película: {person.tickets[0].movie}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Person;