// Single place to change the shop's details and services.
export const BUSINESS = {
  name: "ABC Barber",
  address: "123 Main St",
  image: "/brbr.jpg",
  phonePlaceholder: "+977 98XXXXXXXX",
};

export const SERVICES = [
  { id: "haircut", name: "Haircut", duration: 30, icon: "✂️" },
  { id: "beard-trim", name: "Beard Trim", duration: 15, icon: "🧔" },
  { id: "haircut-beard", name: "Haircut + Beard", duration: 45, icon: "💈" },
  { id: "clean-shave", name: "Clean Shave", duration: 20, icon: "🪒" },
];

export const DEFAULT_SERVICE = SERVICES[0].name;

export function getServiceDuration(serviceName) {
  return SERVICES.find((s) => s.name === serviceName)?.duration ?? 30;
}

export function getService(serviceName) {
  return SERVICES.find((s) => s.name === serviceName) ?? SERVICES[0];
}

// Accepts anything (router state, query param) and returns a valid service name.
export function resolveService(value) {
  return SERVICES.some((s) => s.name === value) ? value : DEFAULT_SERVICE;
}
