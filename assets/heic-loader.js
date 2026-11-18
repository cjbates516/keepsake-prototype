/* Load the optional decoder on demand; HEIC conversion runs in the browser. */
window.KPHeic = (() => {
  let pending;
  function load() {
    if (typeof window.heic2any === 'function') return Promise.resolve();
    if (pending) return pending;
    pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const finish = error => {
        clearTimeout(timer);script.onload = script.onerror = null;
        if (error) {script.remove();reject(error);} else resolve();
      };
      const timer = setTimeout(() => finish(new Error('HEIC decoder timed out')), 20000);
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js';
      script.async = true;
      script.onload = () => finish(typeof window.heic2any === 'function' ? null : new Error('HEIC decoder unavailable'));
      script.onerror = () => finish(new Error('HEIC decoder failed to load'));
      document.head.append(script);
    }).catch(error => {pending = null;throw error;});
    return pending;
  }
  return {load};
})();
