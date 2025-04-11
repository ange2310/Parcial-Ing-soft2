// components/Cinema.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Ticket from './Ticket';
import EventBus from '../utils/EventBus';
import CinemaManager from '../utils/CinemaAdapter';

const Cinema = () => {
  const { selectedPerson, selectedTickets } = useSelector(state => state.tickets);
  const [showStats, setShowStats] = useState(false);
  
  // Estado local para total a pagar y monto ingresado
  const [paymentData, setPaymentData] = useState({
    showPayment: false,
    amount: '',
    processingPayment: false,
    paymentResult: null
  });
  
  // Suscripción a eventos
  useEffect(() => {
    // Suscribirse al evento de compra completada
    const purchaseCompletedUnsubscribe = EventBus.subscribe('PURCHASE_COMPLETED', (receipt) => {
      setPaymentData({
        ...paymentData,
        showPayment: false,
        processingPayment: false,
        paymentResult: receipt
      });
      
      // Mostrar el recibo por unos segundos
      setTimeout(() => {
        setPaymentData(prev => ({
          ...prev,
          paymentResult: null
        }));
      }, 5000);
    });
    
    // Suscribirse al evento de ticket eliminado
    const ticketRemovedUnsubscribe = EventBus.subscribe('TICKET_REMOVED', ({ ticketId, ticket }) => {
      console.log(`Ticket eliminado: ${ticket.movie} - Asiento ${ticket.seat}`);
    });
    
    // Sincronizar tickets con CinemaManager
    if (selectedPerson && selectedTickets) {
      CinemaManager.currentPerson = selectedPerson;
      CinemaManager.selectedTickets = selectedTickets;
    }
    
    // Limpiar suscripciones al desmontar
    return () => {
      purchaseCompletedUnsubscribe();
      ticketRemovedUnsubscribe();
    };
  }, [paymentData, selectedPerson, selectedTickets]);
  
  // Manejador para procesar el pago
  const handleProcessPayment = () => {
    // Validar que se ingresó un monto
    if (!paymentData.amount || isNaN(parseFloat(paymentData.amount))) {
      alert('Por favor ingresa un monto válido');
      return;
    }
    
    // Sincronizar con CinemaManager nuevamente para asegurar datos actualizados
    if (selectedPerson && selectedTickets) {
      CinemaManager.currentPerson = selectedPerson;
      CinemaManager.selectedTickets = selectedTickets;
    }
    
    setPaymentData({
      ...paymentData,
      processingPayment: true
    });
    
    // Verificar en consola los datos antes de procesar
    console.log("Procesando pago para:", {
      currentPerson: CinemaManager.currentPerson,
      selectedTickets: CinemaManager.selectedTickets,
      amount: parseFloat(paymentData.amount)
    });
    
    try {
      // Implementación directa del procesamiento de pago en caso de que falte processPurchase
      if (typeof CinemaManager.processPurchase !== 'function') {
        console.log("Usando implementación alternativa de processPurchase");
        
        const total = selectedTickets.reduce((sum, ticket) => 
          sum + (ticket.price !== undefined ? ticket.price : 10.0), 0);
        
        if (parseFloat(paymentData.amount) < total) {
          alert('El monto ingresado es menor al total a pagar');
          setPaymentData({
            ...paymentData,
            processingPayment: false
          });
          return;
        }
        
        const change = parseFloat((parseFloat(paymentData.amount) - total).toFixed(2));
        const receipt = {
          person: selectedPerson.name,
          tickets: selectedTickets,
          total: total,
          paid: parseFloat(paymentData.amount),
          change: change,
          date: new Date().toISOString(),
          ticketCodes: selectedTickets.map(ticket => {
            const movieCode = ticket.movie.substring(0, 3).toUpperCase();
            const timeCode = ticket.time.replace(':', '');
            const seatCode = ticket.seat.replace('VIP-', '');
            const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `${movieCode}-${timeCode}-${seatCode}-${randomCode}`;
          })
        };
        
        // Publicar evento de compra completada
        EventBus.publish('PURCHASE_COMPLETED', receipt);
        
        setPaymentData({
          ...paymentData,
          showPayment: false,
          processingPayment: false,
          paymentResult: receipt
        });
        
        // Mostrar el recibo por unos segundos
        setTimeout(() => {
          setPaymentData(prev => ({
            ...prev,
            paymentResult: null
          }));
        }, 5000);
        
        return;
      }
      
      // Usar el método original si existe
      const result = CinemaManager.processPurchase(parseFloat(paymentData.amount));
      
      if (!result.success) {
        alert(result.message);
        setPaymentData({
          ...paymentData,
          processingPayment: false
        });
        return;
      }
      
      // El evento PURCHASE_COMPLETED ya fue publicado por CinemaManager
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert("Hubo un error al procesar el pago. Por favor intenta de nuevo.");
      setPaymentData({
        ...paymentData,
        processingPayment: false
      });
    }
  };
  
  // Función para imprimir tickets
  const handlePrintTickets = () => {
    // Sincronizar con CinemaManager nuevamente
    if (selectedPerson && selectedTickets) {
      CinemaManager.currentPerson = selectedPerson;
      CinemaManager.selectedTickets = selectedTickets;
    }
    
    const result = CinemaManager.printTickets();
    if (result.success) {
      alert(`Se imprimieron ${result.tickets.length} tickets.`);
    } else {
      alert(result.message);
    }
  };
  
  if (!selectedPerson || showStats) {
    return (
      <div className="cinema-container">
        <h2>Entradas de Cine</h2>
        {showStats && (
          <button 
            className="back-button"
            onClick={() => setShowStats(false)}
          >
            Volver a Entradas
          </button>
        )}
        <p className="select-message">
          {!showStats 
            ? "Selecciona una persona de la cola para ver sus entradas" 
            : "Mostrando estadísticas generales del cine"
          }
        </p>
        
        {/* Mostrar estadísticas generales */}
        <div className="cinema-stats">
          <h3>Estadísticas del Cine</h3>
          <p><strong>Total de ventas:</strong> ${(CinemaManager.totalSales || 0).toFixed(2)}</p>
          <p><strong>Tickets vendidos:</strong> {CinemaManager.totalTicketsSold || 0}</p>
          {CinemaManager.getMostPopularMovie() && (
            <p><strong>Película más popular:</strong> {CinemaManager.getMostPopularMovie()}</p>
          )}
        </div>
      </div>
    );
  }

  // Calcular el total a pagar, asegurando que todos los tickets tengan precio
  const totalToPay = selectedTickets.reduce((sum, ticket) => 
    sum + (ticket.price !== undefined ? ticket.price : 10.0), 0);

  return (
    <div className="cinema-container">
      <h2>Entradas de {selectedPerson.name}</h2>
      
      <div className="person-info">
        <p><strong>Total de entradas:</strong> {selectedTickets.length}</p>
        <p><strong>Total a pagar:</strong> ${totalToPay.toFixed(2)}</p>
        
        {selectedTickets.length > 0 && (
          <div className="movie-info">
            <p><strong>Película:</strong> {selectedTickets[0].movie}</p>
            <p><strong>Hora:</strong> {selectedTickets[0].time}</p>
          </div>
        )}
      </div>
      
      {/* Controles de acciones */}
      <div className="cinema-actions">
        <button onClick={handlePrintTickets}>Imprimir Tickets</button>
        <button 
          onClick={() => setPaymentData({ ...paymentData, showPayment: true })}
          disabled={selectedTickets.length === 0}
        >
          Procesar Pago
        </button>
        <button 
          onClick={() => setShowStats(true)}
          className="stats-button"
        >
          Ver Estadísticas
        </button>
      </div>
      
      {/* Formulario de pago */}
      {paymentData.showPayment && (
        <div className="payment-form">
          <h3>Procesar Pago</h3>
          <p><strong>Total a pagar:</strong> ${totalToPay.toFixed(2)}</p>
          
          <div className="form-group">
            <label>Monto recibido:</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              placeholder="Ingrese el monto"
              step="0.01"
              min={totalToPay}
              disabled={paymentData.processingPayment}
            />
          </div>
          
          <div className="form-actions">
            <button 
              onClick={handleProcessPayment}
              disabled={paymentData.processingPayment}
            >
              {paymentData.processingPayment ? 'Procesando...' : 'Completar Pago'}
            </button>
            <button 
              onClick={() => setPaymentData({ ...paymentData, showPayment: false })}
              disabled={paymentData.processingPayment}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Resultado del pago */}
      {paymentData.paymentResult && (
        <div className="payment-receipt">
          <h3>Recibo de Pago</h3>
          <p><strong>Cliente:</strong> {paymentData.paymentResult.person}</p>
          <p><strong>Total:</strong> ${paymentData.paymentResult.total.toFixed(2)}</p>
          <p><strong>Pagado:</strong> ${paymentData.paymentResult.paid.toFixed(2)}</p>
          <p><strong>Cambio:</strong> ${paymentData.paymentResult.change.toFixed(2)}</p>
          <p><strong>Fecha:</strong> {new Date(paymentData.paymentResult.date).toLocaleString()}</p>
        </div>
      )}
      
      <h3>Entradas</h3>
      <div className="tickets-container">
        {selectedTickets.length === 0 ? (
          <p className="empty-message">No hay entradas disponibles</p>
        ) : (
          // Mostramos los tickets en orden inverso (como una pila)
          [...selectedTickets].reverse().map(ticket => (
            <Ticket key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>
    </div>
  );
};

export default Cinema;