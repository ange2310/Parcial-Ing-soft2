// Redux/slices/ticketSlice.jsx
import { createSlice } from '@reduxjs/toolkit';

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    selectedPerson: null,
    selectedTickets: []
  },
  reducers: {
    selectPerson: (state, action) => {
      state.selectedPerson = action.payload;
      state.selectedTickets = action.payload.tickets || [];
    },
    addTicket: (state, action) => {
      // Añadir ticket a la lista de tickets seleccionados
      state.selectedTickets.push(action.payload);
      
      // Si hay una persona seleccionada, también actualizamos sus tickets
      if (state.selectedPerson) {
        if (!state.selectedPerson.tickets) {
          state.selectedPerson.tickets = [];
        }
        state.selectedPerson.tickets.push(action.payload);
      }
    },
    addMultipleTickets: (state, action) => {
      // action.payload debe ser un array de tickets
      if (Array.isArray(action.payload)) {
        state.selectedTickets = [...state.selectedTickets, ...action.payload];
        
        // Si hay una persona seleccionada, también actualizamos sus tickets
        if (state.selectedPerson) {
          if (!state.selectedPerson.tickets) {
            state.selectedPerson.tickets = [];
          }
          state.selectedPerson.tickets = [...state.selectedPerson.tickets, ...action.payload];
        }
      }
    },
    removeTicket: (state, action) => {
      // Eliminar ticket de la lista de tickets seleccionados
      state.selectedTickets = state.selectedTickets.filter(
        ticket => ticket.id !== action.payload
      );
      
      // Si hay una persona seleccionada, también actualizamos sus tickets
      if (state.selectedPerson && state.selectedPerson.tickets) {
        state.selectedPerson.tickets = state.selectedPerson.tickets.filter(
          ticket => ticket.id !== action.payload
        );
      }
    }
  }
});

export const { selectPerson, addTicket, addMultipleTickets, removeTicket } = ticketsSlice.actions;
export default ticketsSlice.reducer;