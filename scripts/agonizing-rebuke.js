// Hooks.once('init', () => {
//   console.log('Agonizing Rebuke | Initializing module');
//   // Register custom hooks or effects here
// });

// Hooks.on('ready', () => {
//   // Your code to run when Foundry is ready
// });

// // Example: Custom effect registration (pseudo-code)
// Hooks.on('createChatMessage', (message, options, userId) => {
//   // Your custom effect logic here
// }); 


// ID или имя эффекта "Мучительное осуждение"
const REBUKE_EFFECT_NAME = "Мучительное осуждение";

// Основной хук
Hooks.on("updateCombat", async (combat, updateData, options, userId) => {
  // Проверяем, начался ли новый ход
  if (!("turn" in updateData)) return;

  const combatant = combat.combatant;
  if (!combatant) return;
  const actor = combatant.actor;
  if (!actor) return;

  // Ищем эффект "Мучительное осуждение"
  const rebukeEffect = actor.items.find(i => i.name === REBUKE_EFFECT_NAME);
  if (!rebukeEffect) return;

  // Проверяем, есть ли frightened
  const hasFrightened = actor.items.some(i => i.name.toLowerCase().includes("frightened"));
  if (!hasFrightened) {
    await rebukeEffect.delete();
    ui.notifications.info(`"Мучительное осуждение" удалено с ${actor.name} (больше не напуган)`);
    return;
  }

  // Проверяем расстояние до кастера (casterId должен быть сохранён в effect)
  const casterId = rebukeEffect.getFlag("agonizing-rebuke", "casterId");
  const caster = game.actors.get(casterId);
  if (!caster) {
    await rebukeEffect.delete();
    return;
  }
  const tokenA = canvas.tokens.get(actor.token.id);
  const tokenB = canvas.tokens.placeables.find(t => t.actor?.id === casterId);
  if (!tokenA || !tokenB || canvas.grid.measureDistance(tokenA, tokenB) > 30) {
    await rebukeEffect.delete();
    ui.notifications.info(`"Мучительное осуждение" удалено с ${actor.name} (слишком далеко от кастера)`);
    return;
  }

  // Проверяем длительность (1 минута = 10 раундов)
  const appliedRound = rebukeEffect.getFlag("agonizing-rebuke", "appliedRound") ?? combat.round;
  if (combat.round - appliedRound >= 10) {
    await rebukeEffect.delete();
    ui.notifications.info(`"Мучительное осуждение" удалено с ${actor.name} (истёк срок)`);
    return;
  }
  
  // Определяем урон по мастерству кастера
  let dice = "1d4";
  const intimidation = caster.system.skills.itm;
  if (intimidation.rank >= 3) dice = "3d4";
  else if (intimidation.rank >= 2) dice = "2d4";

  // Наносим урон
  await new Roll(dice).toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `Мучительное осуждение (${dice} mental, кастер: ${caster.name})`
  });
});