// Redux/store.jsx
import { configureStore } from '@reduxjs/toolkit';
import queueReducer from './slices/queueSlice';
import ticketsReducer from './slices/ticketSlice';

export const store = configureStore({
  reducer: {
    queue: queueReducer,
    tickets: ticketsReducer,
  },
});