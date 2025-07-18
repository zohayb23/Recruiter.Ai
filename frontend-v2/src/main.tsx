import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Bootstrap and SB Admin 2 styles
import '../startbootstrap-sb-admin-2-gh-pages/vendor/fontawesome-free/css/all.min.css';
import '../startbootstrap-sb-admin-2-gh-pages/css/sb-admin-2.min.css';
import '../startbootstrap-sb-admin-2-gh-pages/vendor/datatables/dataTables.bootstrap4.min.css';

// Import Bootstrap and jQuery dependencies
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Make jQuery available globally
declare global {
  interface Window {
    $: typeof $;
    jQuery: typeof $;
  }
}

window.jQuery = window.$ = $;

// Bootstrap will automatically initialize tooltips and popovers
// We don't need to manually initialize them

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
