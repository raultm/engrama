export class CardStrategy {
  async renderQuestion(card) { throw new Error(`renderQuestion not implemented for ${this.constructor.name}`) }
  async renderAnswer(card)   { throw new Error(`renderAnswer not implemented for ${this.constructor.name}`) }
  getLabels() { return { question: 'Pregunta', answer: 'Respuesta' } }
  // Hook opcional: se llama tras insertar el HTML en el DOM.
  // Permite añadir event listeners interactivos (ej: tablero de Go).
  // onReveal() dispara el mismo mecanismo que pulsar "Mostrar respuesta".
  postRender(card, containerEl, onReveal) {}
}
