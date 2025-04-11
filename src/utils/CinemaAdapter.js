// utils/CinemaAdapter.js
/**
 * Adaptador que permite alternar entre el CinemaManager original (God Object)
 * y la versión refactorizada CinemaService sin modificar los componentes existentes
 */

import CinemaManager from './CinemaManager';
import CinemaService from './CinemaService';

// Configuración: true para usar la versión refactorizada, false para la original
const USE_REFACTORED_VERSION = false;

// Exportar la implementación seleccionada
const CinemaInstance = USE_REFACTORED_VERSION ? CinemaService : CinemaManager;

// Para fines educativos, mostrar qué implementación se está utilizando
console.log(`Usando la implementación ${USE_REFACTORED_VERSION ? 'refactorizada (CinemaService)' : 'original (CinemaManager - God Object)'}`);

export default CinemaInstance;