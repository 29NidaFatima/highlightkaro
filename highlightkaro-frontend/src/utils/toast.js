let listeners = [];
export const showToast = (message, type = "info") => {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, message, type }));
};
export const subscribeToast = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};
