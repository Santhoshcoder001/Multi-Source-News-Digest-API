// Simple provider manager to track provider availability and states
const state = {
  openAIEnabled: true,
  openAIDisabledAt: null
};

export function isOpenAIEnabled() {
  return Boolean(state.openAIEnabled);
}

export function disableOpenAI(reason) {
  state.openAIEnabled = false;
  state.openAIDisabledAt = Date.now();
  console.warn('[OpenAI Disabled]', String(reason ?? 'disabled by provider manager'));
}

export function getOpenAIDisabledAt() {
  return state.openAIDisabledAt;
}

export default {
  isOpenAIEnabled,
  disableOpenAI,
  getOpenAIDisabledAt
};
