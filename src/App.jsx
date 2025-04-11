// App.jsx
import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from './Redux/store';
import Queue from './components/Queue';
import Cinema from './components/Cinema';
import CinemaManager from './utils/CinemaAdapter';
import EventBus from './utils/EventBus';

// Componente para inicializar CinemaManager
const CinemaInitializer = () => {
  const { people } = useSelector(state => state.queue);
  
  useEffect(() => {
    CinemaManager.initializeFromRedux(people);
    // Publicar evento de inicialización
    EventBus.publish('APP_INITIALIZED', { timestamp: new Date().toISOString() });
    
    console.log("Aplicación inicializada con datos de Redux");
  }, [people]); // Se ejecutará cada vez que people cambie
  
  return null; // Este componente no renderiza nada
};

function App() {
  return (
    <Provider store={store}>
      <div className="app-container">
        <h1>Sistema de Cine</h1>
        <CinemaInitializer />
        <div className="main-content">
          <Queue />
          <Cinema />
        </div>
      </div>
    </Provider>
  );
}

export default App;