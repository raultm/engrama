export class CardStrategy {
  async renderQuestion(card) { throw new Error(`renderQuestion not implemented for ${this.constructor.name}`) }
  async renderAnswer(card)   { throw new Error(`renderAnswer not implemented for ${this.constructor.name}`) }
  getLabels() { return { question: 'Pregunta', answer: 'Respuesta' } }
  postRender(card, containerEl, onReveal) {}

  /**
   * Configura la visibilidad del footer de StudyView para esta tarjeta.
   * Se llama cada vez que se resetea el estado (nueva tarjeta o transición).
   * Por defecto: muestra "Mostrar respuesta", oculta calificación y Siguiente.
   */
  setupFooter(btnReveal, ratingButtons, btnNext) {
    btnReveal.removeAttribute('hidden')
    ratingButtons.setAttribute('hidden', '')
    btnNext.setAttribute('hidden', '')
  }
}
