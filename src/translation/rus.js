
export default class Translation {
  static HOSPITAL_CAPACITY = 'Вместимость стационара, чел.';
  static INPUT_FATALITY_RATE = 'Смертность, %';
  static SELF_QUARANTINE_RATE = 'Количество людей на самоизоляции, %';
  static SELF_QUARANTINE_STRICTNESS = 'Соблюдение самоизоляции людьми, находящимися на самоизоляции, %';
  static ENCOUNTERS_PER_DAY = 'Количество взаимодействий человека с другими людьми в день';
  static TRAVEL_RADIUS = 'Ограничение передвижения';
  static TRANSMISSION_RATE = 'Вероятность заражения при взаимодействии, %';
  static DAYS_IN_INCUBATION = 'Длительность инкубационного периода, дн.';
  static DAYS_WITH_SYMPTOMS = 'Длительность болезни (после инкубационного периода), дн.';
  static BUTTON_CLEAR = 'Очистить';
  static BUTTON_RESET = 'Сброс';
  static BUTTON_STEP = 'Шаг';
  static AGENT_STATE_SUSCEPTIBLE = 'Восприимчив';
  static AGENT_STATE_INCUBATION = 'Инфицирован (инкубационный период, без симптомов)';
  static AGENT_STATE_INFECTED = 'Инфицирован (с симптомами)';
  static AGENT_STATE_RECOVERED = 'Выздоровел';
}