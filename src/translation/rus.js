
export default class Translation {
  static HOSPITAL_CAPACITY = 'Вместимость больниц';
  static INPUT_FATALITY_RATE = 'Летальность';
  static SELF_QUARANTINE_RATE = 'Уровень самоизоляции';
  static SELF_QUARANTINE_STRICTNESS = 'Уровень соблюдения самоизоляции(При 100% агенты не встречаются с другими агентами)';
  static ENCOUNTERS_PER_DAY = 'Контактов за день';
  static TRAVEL_RADIUS = 'Радиус перемещения(Чем выше, тем вероятнее встреча с малознакомыми людьми)';
  static TRANSMISSION_RATE = 'Вероятность заражения';
  static DAYS_IN_INCUBATION = 'Инкубационный период, дней';
  static DAYS_WITH_SYMPTOMS = 'Длительность симптомов, дней';
  static BUTTON_CLEAR = 'Очистить';
  static BUTTON_RESET = 'Сброс';
  static BUTTON_STEP = 'Шаг';
  static AGENT_STATE_SUSCEPTIBLE = 'Восприимчив';
  static AGENT_STATE_INCUBATION = 'Инфицирован (инкубационный период, без симптомов)';
  static AGENT_STATE_INFECTED = 'Инфицирован (с симптомами)';
  static AGENT_STATE_RECOVERED = 'Выздоровел';
}