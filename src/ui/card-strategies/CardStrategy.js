export class CardStrategy {
  async renderQuestion(card) { throw new Error(`renderQuestion not implemented for ${this.constructor.name}`) }
  async renderAnswer(card)   { throw new Error(`renderAnswer not implemented for ${this.constructor.name}`) }
  getLabels() { return { question: 'Pregunta', answer: 'Respuesta' } }
}
