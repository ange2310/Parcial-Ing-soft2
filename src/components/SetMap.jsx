// components/SeatMap.jsx
import React, { useState, useEffect } from 'react';
import EventBus from '../utils/EventBus';
import CinemaManager from '../utils/CinemaManager';

const SeatMap = ({ movie, time }) => {
  const [seatMap, setSeatMap] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  useEffect(() => {
    if (movie && time) {
      // Obtener el mapa de asientos actual
      const currentSeatMap = CinemaManager.getSeatMap(movie, time);
      setSeatMap(currentSeatMap || {});
      
      // Suscribirse a eventos de cambios en asientos
      const seatReservedUnsubscribe = EventBus.subscribe('SEAT_RESERVED', (data) => {
        if (data.movie === movie && data.time === time) {
          setSeatMap(prevMap => ({
            ...prevMap,
            [data.seat]: 'occupied'
          }));
        }
      });
      
      const seatFreedUnsubscribe = EventBus.subscribe('SEAT_FREED', (data) => {
        if (data.movie === movie && data.time === time) {
          setSeatMap(prevMap => ({
            ...prevMap,
            [data.seat]: 'available'
          }));
        }
      });
      
      // Limpiar suscripciones al desmontar
      return () => {
        seatReservedUnsubscribe();
        seatFreedUnsubscribe();
      };
    }
  }, [movie, time]);
  
  const handleSeatClick = (seatId) => {
    // Verificar si el asiento está disponible
    if (seatMap[seatId] === 'occupied') {
      return; // No permitir seleccionar asientos ocupados
    }
    
    // Actualizar la selección
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
    
    // Publicar evento de selección de asiento
    EventBus.publish('SEAT_SELECTED', {
      seat: seatId,
      movie,
      time,
      selected: !selectedSeats.includes(seatId)
    });
  };
  
  // Renderizar el mapa de asientos
  const renderSeatMap = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;
    
    return (
      <div className="seat-map">
        <div className="screen">PANTALLA</div>
        
        {rows.map(row => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            
            <div className="seats">
              {Array.from({ length: seatsPerRow }, (_, i) => {
                const seatId = `${row}${i + 1}`;
                const isOccupied = seatMap[seatId] === 'occupied';
                const isSelected = selectedSeats.includes(seatId);
                
                return (
                  <div
                    key={seatId}
                    className={`seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSeatClick(seatId)}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="seat"></div>
            <span>Disponible</span>
          </div>
          <div className="legend-item">
            <div className="seat occupied"></div>
            <span>Ocupado</span>
          </div>
          <div className="legend-item">
            <div className="seat selected"></div>
            <span>Seleccionado</span>
          </div>
        </div>
      </div>
    );
  };

  if (!movie || !time) {
    return (
      <div className="seat-map-container">
        <p className="select-message">Selecciona una película y horario para ver los asientos</p>
      </div>
    );
  }

  return (
    <div className="seat-map-container">
      <h3>Mapa de Asientos</h3>
      <div className="seat-map-details">
        <p><strong>Película:</strong> {movie}</p>
        <p><strong>Horario:</strong> {time}</p>
        <p>
          <strong>Ocupación:</strong> {CinemaManager.getPercentageOccupancy(movie, time).toFixed(0)}%
        </p>
      </div>
      
      {renderSeatMap()}
      
      {selectedSeats.length > 0 && (
        <div className="selected-seats">
          <p><strong>Asientos seleccionados:</strong> {selectedSeats.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default SeatMap;