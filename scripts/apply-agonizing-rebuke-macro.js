// Макрос для применения эффекта "Мучительное осуждение" ко всем выбранным целям
const EFFECT_NAME = "Мучительное осуждение";

const caster = canvas.tokens.controlled[0]?.actor;
if (!caster) return ui.notifications.warn("Выдели свой токен (кастера)!");

const targets = Array.from(game.user.targets);
if (!targets.length) return ui.notifications.warn("Выдели хотя бы одну цель!");

// Загружаем эффект из файла JSON (если есть)
async function getEffectData() {
  // Путь к json-файлу эффекта внутри модуля
  const url = `modules/agonizing-rebuke/effects/agonizing-rebuke-effect.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Не удалось загрузить JSON эффекта");
    return await response.json();
  } catch (e) {
    ui.notifications.error("Не удалось загрузить эффект из JSON: " + e.message);
    return null;
  }
}

(async () => {
  const effectData = await getEffectData();
  if (!effectData) return;
  const round = game.combat?.round ?? 0;

  for (let target of targets) {
    const targetActor = target.actor;
    if (!targetActor) continue;
    if (targetActor.items.find(i => i.name === EFFECT_NAME)) {
      ui.notifications.info(`${targetActor.name} уже под эффектом "${EFFECT_NAME}"`);
      continue;
    }
    // Клонируем и добавляем флаги
    let data = foundry.utils.deepClone(effectData);
    data.flags = data.flags || {};
    data.flags["agonizing-rebuke"] = {
      casterId: caster.id,
      appliedRound: round
    };
    await targetActor.createEmbeddedDocuments("Item", [data]);
    ui.notifications.info(`"${EFFECT_NAME}" наложен на ${targetActor.name}`);
  }
})(); 