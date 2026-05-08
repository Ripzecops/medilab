window.Apollo = window.Apollo || {};

Apollo.Router = {
  routes: {},
  currentRoute: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  parseRoute(hash) {
    const path = hash.replace('#', '') || '/';
    const parts = path.split('/').filter(Boolean);
    for (const pattern in this.routes) {
      const patParts = pattern.split('/').filter(Boolean);
      if (patParts.length !== parts.length) continue;
      const params = {};
      let match = true;
      for (let i = 0; i < patParts.length; i++) {
        if (patParts[i].startsWith(':')) {
          params[patParts[i].slice(1)] = parts[i];
        } else if (patParts[i] !== parts[i]) {
          match = false; break;
        }
      }
      if (match) return { handler: this.routes[pattern], params };
    }
    return null;
  },

  async handleRoute() {
    const hash = window.location.hash || '#/';
    const route = this.parseRoute(hash);
    
    // Update sidebar active state for .NET layout
    document.querySelectorAll('.nav-item').forEach(n => {
      const routeAttr = n.dataset.route || '###';
      const isActive = routeAttr === '/' 
        ? hash === '#/' || hash === '' 
        : hash.startsWith(routeAttr);
      n.classList.toggle('active', isActive);
    });

    const main = document.getElementById('mainContent');
    if (route) {
      this.currentRoute = hash;
      main.classList.add('page-transition');
      setTimeout(async () => {
        try { await route.handler(route.params); }
        catch (err) { main.innerHTML = `<div class="error-page"><h2>Error</h2><p>${err.message}</p></div>`; console.error(err); }
        main.classList.remove('page-transition');
      }, 150);
    } else {
      main.innerHTML = '<div class="error-page"><h2>404</h2><p>Page not found</p></div>';
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
};
