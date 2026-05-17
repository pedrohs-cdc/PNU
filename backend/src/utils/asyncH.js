// Envolve um handler async para que erros caiam no
// middleware de erro do Express (em vez de "pendurar" a resposta).
// No Express 5 isso é nativo; mantemos explícito por clareza
// didática e compatibilidade com Express 4.
function asyncH(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncH };
