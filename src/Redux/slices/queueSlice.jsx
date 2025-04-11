// Redux/slices/queueSlice.jsx
import { createSlice } from '@reduxjs/toolkit';
import { Queue } from '../../utils/Queue';

// Datos iniciales
const initialPeople = [
  {
    id: 1,
    name: "Ana",
    tickets: [
      { id: 101, movie: "Avengers", seat: "A1", time: "18:00", price: 10.0, type: "standard" },
      { id: 102, movie: "Avengers", seat: "A2", time: "18:00", price: 10.0, type: "standard" }
    ]
  },
  {
    id: 2,
    name: "Carlos",
    tickets: [
      { id: 103, movie: "Inception", seat: "B5", time: "20:30", price: 10.0, type: "standard" }
    ]
  },
  {
    id: 3,
    name: "Elena",
    tickets: [
      { id: 104, movie: "The Matrix", seat: "C3", time: "19:15", price: 15.0, type: "VIP" },
      { id: 105, movie: "The Matrix", seat: "C4", time: "19:15", price: 15.0, type: "VIP" },
      { id: 106, movie: "The Matrix", seat: "C5", time: "19:15", price: 15.0, type: "VIP" }
    ]
  }
];

// Crear una cola inicial con los datos
const initialQueue = new Queue();
initialPeople.forEach(person => initialQueue.enqueue(person));

const queueSlice = createSlice({
  name: 'queue',
  initialState: {
    people: initialQueue.getAll(),
  },
  reducers: {
    addPerson: (state, action) => {
      state.people.push(action.payload);
    },
    removePerson: (state) => {
      if (state.people.length > 0) {
        state.people.shift();
      }
    },
    moveToEnd: (state) => {
      if (state.people.length > 0) {
        const person = state.people.shift();
        state.people.push(person);
      }
    },
    // Añadir un reducer para actualizar una persona específica (para sincronizar tickets)
    updatePersonTickets: (state, action) => {
      const { personId, tickets } = action.payload;
      const personIndex = state.people.findIndex(person => person.id === personId);
      
      if (personIndex !== -1) {
        state.people[personIndex].tickets = tickets;
      }
    }
  }
});

export const { addPerson, removePerson, moveToEnd, updatePersonTickets } = queueSlice.actions;
export default queueSlice.reducer;